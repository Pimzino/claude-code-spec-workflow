import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DiscoveredProject {
  path: string;
  name: string;
  hasActiveSession: boolean;
  lastActivity?: Date;
  specCount?: number;
}

export class ProjectDiscovery {
  private searchPaths: string[] = [];
  
  constructor() {
    // Common project directories
    this.searchPaths = [
      join(homedir(), 'Projects'),
      join(homedir(), 'Documents'),
      join(homedir(), 'Development'),
      join(homedir(), 'Code'),
      join(homedir(), 'repos'),
      join(homedir(), 'workspace'),
      join(homedir(), 'src'),
    ];
  }

  async discoverProjects(): Promise<DiscoveredProject[]> {
    const projects: DiscoveredProject[] = [];
    const activeClaudes = await this.getActiveClaudeSessions();
    
    // Search for .claude directories
    for (const searchPath of this.searchPaths) {
      try {
        await fs.access(searchPath);
        const found = await this.searchDirectory(searchPath, activeClaudes);
        projects.push(...found);
      } catch {
        // Directory doesn't exist, skip it
      }
    }
    
    // Sort by last activity
    projects.sort((a, b) => {
      const dateA = a.lastActivity?.getTime() || 0;
      const dateB = b.lastActivity?.getTime() || 0;
      return dateB - dateA;
    });
    
    return projects;
  }

  private async searchDirectory(dir: string, activeSessions: string[], depth = 0): Promise<DiscoveredProject[]> {
    if (depth > 3) return []; // Don't go too deep
    
    const projects: DiscoveredProject[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith('.') && entry.name !== '.claude') continue;
        if (entry.name === 'node_modules' || entry.name === 'venv' || entry.name === '__pycache__') continue;
        
        const fullPath = join(dir, entry.name);
        
        // Check if this directory has a .claude folder
        const claudePath = join(fullPath, '.claude');
        try {
          const claudeStat = await fs.stat(claudePath);
          if (claudeStat.isDirectory()) {
            const project = await this.analyzeProject(fullPath, claudePath, activeSessions);
            projects.push(project);
          }
        } catch {
          // No .claude directory, check subdirectories
          if (depth < 3) {
            const subProjects = await this.searchDirectory(fullPath, activeSessions, depth + 1);
            projects.push(...subProjects);
          }
        }
      }
    } catch (error) {
      console.error(`Error searching directory ${dir}:`, error);
    }
    
    return projects;
  }

  private async analyzeProject(projectPath: string, claudePath: string, activeSessions: string[]): Promise<DiscoveredProject> {
    const name = projectPath.split('/').pop() || 'Unknown';
    
    // Check if any active Claude session is in this project directory
    const hasActiveSession = activeSessions.some(session => session.includes(projectPath));
    
    // Get last activity by checking file modification times
    let lastActivity: Date | undefined;
    try {
      const specsPath = join(claudePath, 'specs');
      const specDirs = await fs.readdir(specsPath);
      
      let mostRecent = 0;
      for (const specDir of specDirs) {
        if (specDir.startsWith('.')) continue;
        const specPath = join(specsPath, specDir);
        const stat = await fs.stat(specPath);
        if (stat.mtime.getTime() > mostRecent) {
          mostRecent = stat.mtime.getTime();
        }
      }
      
      if (mostRecent > 0) {
        lastActivity = new Date(mostRecent);
      }
      
      return {
        path: projectPath,
        name,
        hasActiveSession,
        lastActivity,
        specCount: specDirs.filter(d => !d.startsWith('.')).length
      };
    } catch {
      return {
        path: projectPath,
        name,
        hasActiveSession,
        lastActivity: undefined,
        specCount: 0
      };
    }
  }

  private async getActiveClaudeSessions(): Promise<string[]> {
    try {
      // Get Claude processes with their working directories
      const { stdout } = await execAsync('ps aux | grep "claude" | grep -v grep | grep -v claude-code-spec');
      const lines = stdout.trim().split('\n').filter(line => line.length > 0);
      
      // Try to get working directories for each Claude process
      const sessions: string[] = [];
      for (const line of lines) {
        const parts = line.split(/\s+/);
        const pid = parts[1];
        
        try {
          // On macOS, we can try to get the current working directory
          const { stdout: cwd } = await execAsync(`lsof -p ${pid} | grep cwd | awk '{print $NF}'`);
          if (cwd.trim()) {
            sessions.push(cwd.trim());
          }
        } catch {
          // Can't get CWD, that's okay
        }
      }
      
      return sessions;
    } catch {
      return [];
    }
  }
}