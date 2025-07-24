import { promises as fs } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

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
    if ((error as any).code !== 'EEXIST') {
      throw error;
    }
  }
}
