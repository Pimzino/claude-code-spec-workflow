import { promises as fs } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createServer } from 'net';

const execAsync = promisify(exec);

export async function detectProjectType(projectPath: string): Promise<string[]> {
  const indicators = {
    'Node.js': ['package.json', 'node_modules'],
    Python: ['requirements.txt', 'setup.py', 'pyproject.toml', '__pycache__'],
    Java: ['pom.xml', 'build.gradle'],
    'C#': ['*.csproj', '*.sln'],
    Go: ['go.mod', 'go.sum'],
    Rust: ['Cargo.toml', 'Cargo.lock'],
    PHP: ['composer.json', 'vendor'],
    Ruby: ['Gemfile', 'Gemfile.lock'],
  };

  const detected: string[] = [];

  for (const [projectType, files] of Object.entries(indicators)) {
    for (const file of files) {
      try {
        if (file.includes('*')) {
          // Handle glob patterns - simplified check
          const dirContents = await fs.readdir(projectPath);
          const extension = file.replace('*', '');
          if (dirContents.some((f) => f.endsWith(extension))) {
            detected.push(projectType);
            break;
          }
        } else {
          await fs.access(join(projectPath, file));
          detected.push(projectType);
          break;
        }
      } catch {
        // File doesn't exist, continue
      }
    }
  }

  return detected;
}

export async function validateClaudeCode(): Promise<boolean> {
  try {
    await execAsync('claude --version');
    return true;
  } catch {
    return false;
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code !== 'EEXIST'
    ) {
      throw error;
    }
  }
}

/**
 * Check if a port is available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Find an available port starting from a given port number
 */
export async function findAvailablePort(startPort: number = 3000, maxAttempts: number = 100): Promise<number> {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`Could not find an available port after checking ${maxAttempts} ports starting from ${startPort}`);
}

/**
 * Get the best available port from a list of preferred ports, with fallback
 */
export async function getBestAvailablePort(preferredPorts: number[] = [3000, 3001, 3002, 8080, 8000, 4000]): Promise<number> {
  // First try the preferred ports
  for (const port of preferredPorts) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  
  // Fall back to finding any available port starting from 3000
  return findAvailablePort(3000);
}

/**
 * Environment inspection types and utilities
 */

export interface DocumentInfo {
  exists: boolean;
  path?: string;
  content?: string;
  size?: number;
  lastModified?: Date;
}

export interface AgentInfo {
  name: string;
  exists: boolean;
  path?: string;
}

export interface SpecInfo {
  name: string;
  path: string;
  requirements: DocumentInfo;
  design: DocumentInfo;
  tasks: DocumentInfo;
  hasTaskCommands?: boolean;
}

export interface EnvironmentInspection {
  config: {
    exists: boolean;
    agents_enabled: boolean;
    version?: string;
    path?: string;
  };
  agents: {
    enabled: boolean;
    available: AgentInfo[];
    missing: string[];
    directory_exists: boolean;
    path?: string;
  };
  steering: {
    product: DocumentInfo;
    tech: DocumentInfo;
    structure: DocumentInfo;
    directory_exists: boolean;
    path?: string;
  };
  specs: SpecInfo[];
  bugs: string[];
  commands: {
    available: string[];
    path?: string;
  };
}

export interface SpecLoadResult {
  environment: EnvironmentInspection;
  current_spec?: {
    name: string;
    requirements?: DocumentInfo;
    design?: DocumentInfo;
    tasks?: {
      mode: 'single_task' | 'full_tasks' | 'task_summary';
      content?: unknown; // Will be typed based on mode
    };
  };
  current_bug?: {
    name: string;
    report?: DocumentInfo;
    analysis?: DocumentInfo;
    verification?: DocumentInfo;
  };
  templates?: {
    requirements?: DocumentInfo;
    design?: DocumentInfo;
    tasks?: DocumentInfo;
  };
}

/**
 * Read file content safely with metadata
 */
async function readDocumentInfo(filePath: string, includeContent: boolean = true): Promise<DocumentInfo> {
  try {
    const stats = await fs.stat(filePath);
    const result: DocumentInfo = {
      exists: true,
      path: filePath,
      size: stats.size,
      lastModified: stats.mtime
    };

    if (includeContent && stats.size < 50000) { // Limit to 50KB files
      result.content = await fs.readFile(filePath, 'utf-8');
    }

    return result;
  } catch {
    return { exists: false };
  }
}

/**
 * Check if directory exists and list its contents
 */
async function checkDirectory(dirPath: string): Promise<{ exists: boolean; files?: string[] }> {
  try {
    const files = await fs.readdir(dirPath);
    return { exists: true, files };
  } catch {
    return { exists: false };
  }
}

/**
 * Load configuration file
 */
async function loadConfig(projectPath: string): Promise<EnvironmentInspection['config']> {
  const configPath = join(projectPath, '.claude', 'spec-config.json');
  
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    
    return {
      exists: true,
      agents_enabled: config.spec_workflow?.agents_enabled || false,
      version: config.spec_workflow?.version,
      path: configPath
    };
  } catch {
    return {
      exists: false,
      agents_enabled: false
    };
  }
}

/**
 * Check available agents
 */
async function checkAgents(projectPath: string, agentsEnabled: boolean): Promise<EnvironmentInspection['agents']> {
  const agentsDir = join(projectPath, '.claude', 'agents');
  const { exists: directoryExists, files } = await checkDirectory(agentsDir);

  const expectedAgents = [
    'spec-task-executor',
    'spec-requirements-validator',
    'spec-design-validator',
    'spec-task-validator',
    'spec-task-implementation-reviewer',
    'spec-integration-tester',
    'spec-completion-reviewer',
    'bug-root-cause-analyzer',
    'steering-document-updater',
    'spec-dependency-analyzer',
    'spec-test-generator',
    'spec-documentation-generator',
    'spec-performance-analyzer',
    'spec-duplication-detector',
    'spec-breaking-change-detector'
  ];

  const available: AgentInfo[] = [];
  const missing: string[] = [];

  for (const agentName of expectedAgents) {
    const agentFile = `${agentName}.md`;
    const exists = files?.includes(agentFile) || false;
    
    if (exists) {
      available.push({
        name: agentName,
        exists: true,
        path: join(agentsDir, agentFile)
      });
    } else {
      missing.push(agentName);
    }
  }

  return {
    enabled: agentsEnabled,
    available,
    missing,
    directory_exists: directoryExists,
    path: directoryExists ? agentsDir : undefined
  };
}

/**
 * Check steering documents
 */
async function checkSteering(projectPath: string): Promise<EnvironmentInspection['steering']> {
  const steeringDir = join(projectPath, '.claude', 'steering');
  const { exists: directoryExists } = await checkDirectory(steeringDir);

  const product = await readDocumentInfo(join(steeringDir, 'product.md'));
  const tech = await readDocumentInfo(join(steeringDir, 'tech.md'));
  const structure = await readDocumentInfo(join(steeringDir, 'structure.md'));

  return {
    product,
    tech,
    structure,
    directory_exists: directoryExists,
    path: directoryExists ? steeringDir : undefined
  };
}

/**
 * Check available specs
 */
async function checkSpecs(projectPath: string): Promise<SpecInfo[]> {
  const specsDir = join(projectPath, '.claude', 'specs');
  const { exists: directoryExists, files } = await checkDirectory(specsDir);

  if (!directoryExists || !files) {
    return [];
  }

  const specs: SpecInfo[] = [];

  for (const specName of files) {
    const specPath = join(specsDir, specName);
    const { exists: isDirectory } = await checkDirectory(specPath);
    
    if (isDirectory) {
      const requirements = await readDocumentInfo(join(specPath, 'requirements.md'), false);
      const design = await readDocumentInfo(join(specPath, 'design.md'), false);
      const tasks = await readDocumentInfo(join(specPath, 'tasks.md'), false);
      
      // Check for task commands
      const taskCommandsDir = join(projectPath, '.claude', 'commands', specName);
      const { exists: hasTaskCommands } = await checkDirectory(taskCommandsDir);

      specs.push({
        name: specName,
        path: specPath,
        requirements,
        design,
        tasks,
        hasTaskCommands
      });
    }
  }

  return specs;
}

/**
 * Check available bugs
 */
async function checkBugs(projectPath: string): Promise<string[]> {
  const bugsDir = join(projectPath, '.claude', 'bugs');
  const { exists: directoryExists, files } = await checkDirectory(bugsDir);

  if (!directoryExists || !files) {
    return [];
  }

  const bugs: string[] = [];
  for (const bugName of files) {
    const bugPath = join(bugsDir, bugName);
    const { exists: isDirectory } = await checkDirectory(bugPath);
    if (isDirectory) {
      bugs.push(bugName);
    }
  }

  return bugs;
}

/**
 * Check available commands
 */
async function checkCommands(projectPath: string): Promise<EnvironmentInspection['commands']> {
  const commandsDir = join(projectPath, '.claude', 'commands');
  const { exists: directoryExists, files } = await checkDirectory(commandsDir);

  if (!directoryExists || !files) {
    return { available: [] };
  }

  const available = files
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));

  return {
    available,
    path: commandsDir
  };
}

/**
 * Perform complete environment inspection
 */
export async function inspectEnvironment(projectPath: string): Promise<EnvironmentInspection> {
  const config = await loadConfig(projectPath);
  const agents = await checkAgents(projectPath, config.agents_enabled);
  const steering = await checkSteering(projectPath);
  const specs = await checkSpecs(projectPath);
  const bugs = await checkBugs(projectPath);
  const commands = await checkCommands(projectPath);

  return {
    config,
    agents,
    steering,
    specs,
    bugs,
    commands
  };
}

/**
 * Load specific spec with task parsing options
 */
export async function loadSpec(
  projectPath: string,
  specName: string,
  options: {
    taskMode?: 'single_task' | 'full_tasks' | 'task_summary';
    taskId?: string;
    includeContent?: boolean;
    loadTemplates?: boolean;
  } = {}
): Promise<SpecLoadResult> {
  const { taskMode = 'full_tasks', taskId, includeContent = true, loadTemplates = false } = options;
  
  // Get base environment
  const environment = await inspectEnvironment(projectPath);
  
  // Check if spec exists
  const spec = environment.specs.find(s => s.name === specName);
  if (!spec) {
    return { environment };
  }

  const specPath = spec.path;
  
  // Load requirements and design with content
  const requirements = await readDocumentInfo(join(specPath, 'requirements.md'), includeContent);
  const design = await readDocumentInfo(join(specPath, 'design.md'), includeContent);
  
  // Handle tasks based on mode
  let tasksResult: { mode: 'single_task' | 'full_tasks' | 'task_summary'; content: unknown } | undefined;
  const tasksPath = join(specPath, 'tasks.md');
  
  if (await fileExists(tasksPath)) {
    const tasksContent = await fs.readFile(tasksPath, 'utf-8');
    
    if (taskMode === 'single_task' && taskId) {
      const { parseSpecificTask, getTaskContext } = await import('./task-parser');
      const taskInfo = parseSpecificTask(tasksContent, taskId);
      const context = getTaskContext(tasksContent, taskId);
      
      tasksResult = {
        mode: 'single_task',
        content: {
          task: taskInfo,
          context
        }
      };
    } else if (taskMode === 'task_summary') {
      const { parseTaskSummary } = await import('./task-parser');
      const summary = parseTaskSummary(tasksContent);
      
      tasksResult = {
        mode: 'task_summary',
        content: summary
      };
    } else {
      // full_tasks mode
      const { parseAllTasks, parseTaskSummary } = await import('./task-parser');
      const allTasks = parseAllTasks(tasksContent);
      const summary = parseTaskSummary(tasksContent);
      
      tasksResult = {
        mode: 'full_tasks',
        content: {
          tasks: allTasks,
          summary,
          raw_content: includeContent ? tasksContent : undefined
        }
      };
    }
  }

  // Load templates if requested
  let templates: { requirements?: DocumentInfo; design?: DocumentInfo; tasks?: DocumentInfo } | undefined;
  if (loadTemplates) {
    const templatesPath = join(projectPath, '.claude', 'templates');
    templates = {
      requirements: await readDocumentInfo(join(templatesPath, 'requirements-template.md'), includeContent),
      design: await readDocumentInfo(join(templatesPath, 'design-template.md'), includeContent),
      tasks: await readDocumentInfo(join(templatesPath, 'tasks-template.md'), includeContent)
    };
    // Only include templates that exist
    if (!templates.requirements?.exists) delete templates.requirements;
    if (!templates.design?.exists) delete templates.design;
    if (!templates.tasks?.exists) delete templates.tasks;
  }

  return {
    environment,
    current_spec: {
      name: specName,
      requirements: requirements.exists ? requirements : undefined,
      design: design.exists ? design : undefined,
      tasks: tasksResult
    },
    templates
  };
}

/**
 * Load specific bug workflow
 */
export async function loadBug(
  projectPath: string,
  bugName: string,
  includeContent: boolean = true
): Promise<SpecLoadResult> {
  const environment = await inspectEnvironment(projectPath);
  
  // Check if bug exists
  if (!environment.bugs.includes(bugName)) {
    return { environment };
  }

  const bugPath = join(projectPath, '.claude', 'bugs', bugName);
  
  const report = await readDocumentInfo(join(bugPath, 'report.md'), includeContent);
  const analysis = await readDocumentInfo(join(bugPath, 'analysis.md'), includeContent);
  const verification = await readDocumentInfo(join(bugPath, 'verification.md'), includeContent);

  return {
    environment,
    current_bug: {
      name: bugName,
      report: report.exists ? report : undefined,
      analysis: analysis.exists ? analysis : undefined,
      verification: verification.exists ? verification : undefined
    }
  };
}
