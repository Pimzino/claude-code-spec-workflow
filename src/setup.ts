import { promises as fs } from 'fs';
import { join } from 'path';
import {
  getSpecCreateCommand,
  getSpecRequirementsCommand,
  getSpecDesignCommand,
  getSpecTasksCommand,
  getSpecExecuteCommand,
  getSpecStatusCommand,
  getSpecListCommand,
  getSpecSteeringSetupCommand,
} from './commands';
import { getPackageMetadata, getCommandCount } from './utils';
import {
  getRequirementsTemplate,
  getDesignTemplate,
  getTasksTemplate,
} from './templates';
import { getClaudeMdContent } from './claude-md';
// Script imports removed in v1.2.5 - task command generation now uses NPX command

export class SpecWorkflowSetup {
  private projectRoot: string;
  private claudeDir: string;
  private commandsDir: string;
  private specsDir: string;
  private templatesDir: string;
  // scriptsDir removed in v1.2.5 - no longer creating scripts
  private steeringDir: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.claudeDir = join(projectRoot, '.claude');
    this.commandsDir = join(this.claudeDir, 'commands');
    this.specsDir = join(this.claudeDir, 'specs');
    this.templatesDir = join(this.claudeDir, 'templates');
    // scriptsDir initialization removed in v1.2.5
    this.steeringDir = join(this.claudeDir, 'steering');
  }

  async claudeDirectoryExists(): Promise<boolean> {
    try {
      await fs.access(this.claudeDir);
      return true;
    } catch {
      return false;
    }
  }

  async setupDirectories(): Promise<void> {
    const directories = [
      this.claudeDir,
      this.commandsDir,
      this.specsDir,
      this.templatesDir,
      // scriptsDir removed from directory creation
      this.steeringDir,
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private getCommands() {
    return {
      'spec-create': getSpecCreateCommand(),
      'spec-requirements': getSpecRequirementsCommand(),
      'spec-design': getSpecDesignCommand(),
      'spec-tasks': getSpecTasksCommand(),
      'spec-execute': getSpecExecuteCommand(),
      'spec-status': getSpecStatusCommand(),
      'spec-list': getSpecListCommand(),
      'spec-steering-setup': getSpecSteeringSetupCommand(),
    };
  }

  getCommandCount(): number {
    return getCommandCount();
  }

  async createSlashCommands(): Promise<void> {
    const commands = this.getCommands();

    for (const [commandName, commandContent] of Object.entries(commands)) {
      const commandFile = join(this.commandsDir, `${commandName}.md`);
      await fs.writeFile(commandFile, commandContent, 'utf-8');
    }
  }

  async createTemplates(): Promise<void> {
    const templates = {
      'requirements-template.md': getRequirementsTemplate(),
      'design-template.md': getDesignTemplate(),
      'tasks-template.md': getTasksTemplate(),
    };

    for (const [templateName, templateContent] of Object.entries(templates)) {
      const templateFile = join(this.templatesDir, templateName);
      await fs.writeFile(templateFile, templateContent, 'utf-8');
    }
  }

  // NOTE: Script creation removed in v1.2.5 - task command generation now uses NPX command

  async createConfigFile(): Promise<void> {
    const packageMeta = getPackageMetadata();
    const config = {
      spec_workflow: {
        version: packageMeta.version,
        auto_create_directories: true,
        auto_reference_requirements: true,
        enforce_approval_workflow: true,
        default_feature_prefix: 'feature-',
        supported_formats: ['markdown', 'mermaid'],
      },
    };

    const configFile = join(this.claudeDir, 'spec-config.json');
    await fs.writeFile(configFile, JSON.stringify(config, null, 2), 'utf-8');
  }

  async createClaudeMd(): Promise<void> {
    const claudeMdContent = getClaudeMdContent();
    const claudeMdFile = join(this.projectRoot, 'CLAUDE.md');

    // Check if CLAUDE.md exists
    try {
      const existingContent = await fs.readFile(claudeMdFile, 'utf-8');

      if (!existingContent.includes('# Spec Workflow')) {
        // Append to existing file - preserve all existing content
        const separator = existingContent.trim().length > 0 ? '\n\n---\n\n' : '';
        const updatedContent = existingContent.trim() + separator + claudeMdContent;
        await fs.writeFile(claudeMdFile, updatedContent, 'utf-8');
      } else {
        // Replace existing spec workflow section while preserving everything else
        const lines = existingContent.split('\n');
        const startIndex = lines.findIndex((line) => line.trim() === '# Spec Workflow');

        if (startIndex !== -1) {
          // Find the end of the spec workflow section (next # header or end of file)
          let endIndex = lines.length;
          for (let i = startIndex + 1; i < lines.length; i++) {
            if (lines[i].startsWith('# ') && !lines[i].includes('Spec Workflow')) {
              endIndex = i;
              break;
            }
          }

          // Preserve content before and after the spec workflow section
          const beforeSection = lines.slice(0, startIndex).join('\n').trim();
          const afterSection = lines.slice(endIndex).join('\n').trim();

          // Reconstruct the file with preserved content
          let updatedContent = '';
          if (beforeSection) {
            updatedContent += beforeSection + '\n\n';
          }
          updatedContent += claudeMdContent;
          if (afterSection) {
            updatedContent += '\n\n' + afterSection;
          }

          await fs.writeFile(claudeMdFile, updatedContent, 'utf-8');
        }
      }
    } catch {
      // File doesn't exist, create it
      await fs.writeFile(claudeMdFile, claudeMdContent, 'utf-8');
    }
  }

  async runSetup(): Promise<void> {
    await this.setupDirectories();
    await this.createSlashCommands();
    await this.createTemplates();
    // Script creation removed in v1.2.5 - using NPX command instead
    await this.createConfigFile();
    await this.createClaudeMd();
  }
}
