import { readFile, readdir, access } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';
import { debug } from './logger';
import { SteeringLoader } from '../steering';

export interface Task {
  id: string;
  description: string;
  completed: boolean;
  requirements: string[];
  leverage?: string;
  subtasks?: Task[];
}

export interface RequirementDetail {
  id: string;
  title: string;
  userStory?: string;
  acceptanceCriteria: string[];
}

export interface CodeReuseCategory {
  title: string;
  items: string[];
}

export interface SteeringStatus {
  exists: boolean;
  hasProduct: boolean;
  hasTech: boolean;
  hasStructure: boolean;
}

export interface Spec {
  name: string;
  displayName: string;
  status: 'not-started' | 'requirements' | 'design' | 'tasks' | 'in-progress' | 'completed';
  requirements?: {
    exists: boolean;
    userStories: number;
    approved: boolean;
    content?: RequirementDetail[];
  };
  design?: {
    exists: boolean;
    approved: boolean;
    hasCodeReuseAnalysis: boolean;
    codeReuseContent?: CodeReuseCategory[];
  };
  tasks?: {
    exists: boolean;
    approved: boolean;
    total: number;
    completed: number;
    inProgress?: string;
    taskList: Task[];
  };
  lastModified?: Date;
}

export class SpecParser {
  private projectPath: string;
  private specsPath: string;
  private steeringLoader: SteeringLoader;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.specsPath = join(projectPath, '.claude', 'specs');
    this.steeringLoader = new SteeringLoader(projectPath);
  }

  async getProjectSteeringStatus(): Promise<SteeringStatus> {
    return this.getSteeringStatus();
  }

  async getAllSpecs(): Promise<Spec[]> {
    try {
      // Check if specs directory exists first
      try {
        await access(this.specsPath, constants.F_OK);
      } catch {
        // Specs directory doesn't exist, return empty array
        return [];
      }

      debug('Reading specs from:', this.specsPath);
      const dirs = await readdir(this.specsPath);
      debug('Found directories:', dirs);
      const specs = await Promise.all(
        dirs.filter((dir) => !dir.startsWith('.')).map((dir) => this.getSpec(dir))
      );
      const validSpecs = specs.filter((spec) => spec !== null) as Spec[];
      debug('Parsed specs:', validSpecs.length);
      // Sort by last modified date, newest first
      validSpecs.sort((a, b) => {
        const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
        const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
        return dateB - dateA;
      });
      return validSpecs;
    } catch (error) {
      console.error('Error reading specs from', this.specsPath, ':', error);
      return [];
    }
  }

  async getSpec(name: string): Promise<Spec | null> {
    const specPath = join(this.specsPath, name);

    try {
      await access(specPath, constants.F_OK);
    } catch {
      return null;
    }

    const spec: Spec = {
      name,
      displayName: this.formatDisplayName(name),
      status: 'not-started',
    };

    // Check requirements
    const requirementsPath = join(specPath, 'requirements.md');
    if (await this.fileExists(requirementsPath)) {
      const content = await readFile(requirementsPath, 'utf-8');

      // Try to extract title from the first heading
      const titleMatch = content.match(/^# (.+?)(?:\s+Requirements)?$/m);
      if (titleMatch && titleMatch[1].trim() && titleMatch[1].trim().toLowerCase() !== 'requirements') {
        spec.displayName = titleMatch[1].trim();
      }

      spec.requirements = {
        exists: true,
        userStories: (content.match(/(\*\*User Story:\*\*|## User Story \d+)/g) || []).length,
        approved: content.includes('✅ APPROVED') || content.includes('**Approved:** ✓'),
        content: this.extractRequirements(content),
      };
      // Set initial status
      spec.status = 'requirements';

      // If requirements are approved, we move to design phase
      if (spec.requirements.approved) {
        spec.status = 'design';
      }
    }

    // Check design
    const designPath = join(specPath, 'design.md');
    if (await this.fileExists(designPath)) {
      const content = await readFile(designPath, 'utf-8');
      
      // If we haven't found a display name yet, try to extract from design
      if (spec.displayName === this.formatDisplayName(name)) {
        const titleMatch = content.match(/^# (.+?)(?:\s+Design(?:\s+Document)?)?$/m);
        if (titleMatch && titleMatch[1].trim() && titleMatch[1].trim().toLowerCase() !== 'design') {
          spec.displayName = titleMatch[1].trim();
        }
      }
      
      spec.design = {
        exists: true,
        approved: content.includes('✅ APPROVED'),
        hasCodeReuseAnalysis: content.includes('## Code Reuse Analysis'),
        codeReuseContent: this.extractCodeReuseAnalysis(content),
      };
      // If design is approved, we move to tasks phase
      if (spec.design.approved) {
        spec.status = 'tasks';
      }
    }

    // Check tasks
    const tasksPath = join(specPath, 'tasks.md');
    if (await this.fileExists(tasksPath)) {
      debug(`Reading tasks from: ${tasksPath}`);
      const content = await readFile(tasksPath, 'utf-8');
      debug('Tasks file content length:', content.length);
      debug('Tasks file includes APPROVED:', content.includes('✅ APPROVED'));
      
      // If we still haven't found a display name, try to extract from tasks
      if (spec.displayName === this.formatDisplayName(name)) {
        const titleMatch = content.match(/^# (.+?)(?:\s+Tasks(?:\s+Plan)?)?$/m);
        if (titleMatch && titleMatch[1].trim() && titleMatch[1].trim().toLowerCase() !== 'tasks') {
          spec.displayName = titleMatch[1].trim();
        }
      }

      const taskList = this.parseTasks(content);
      const completed = this.countCompletedTasks(taskList);
      const total = this.countTotalTasks(taskList);

      debug('Parsed task counts - Total:', total, 'Completed:', completed);

      spec.tasks = {
        exists: true,
        approved: content.includes('✅ APPROVED'),
        total,
        completed,
        taskList,
      };

      if (spec.tasks.approved) {
        if (completed === 0) {
          spec.status = 'tasks';
        } else if (completed < total) {
          spec.status = 'in-progress';
          // Find current task
          spec.tasks.inProgress = this.findInProgressTask(taskList);
        } else {
          spec.status = 'completed';
        }
      }
    }

    // Get last modified time
    const files = ['requirements.md', 'design.md', 'tasks.md'];
    let lastModified = new Date(0);
    for (const file of files) {
      const filePath = join(specPath, file);
      if (await this.fileExists(filePath)) {
        const stats = await import('fs').then((fs) => fs.promises.stat(filePath));
        if (stats.mtime > lastModified) {
          lastModified = stats.mtime;
        }
      }
    }
    spec.lastModified = lastModified;

    return spec;
  }

  private parseTasks(content: string): Task[] {
    debug('Parsing tasks from content...');
    const tasks: Task[] = [];
    const lines = content.split('\n');
    debug('Total lines:', lines.length);

    // Let's test what the actual lines look like
    lines.slice(0, 20).forEach((line, i) => {
      if (line.includes('[') && line.includes(']')) {
        debug(`Line ${i}: "${line}"`);
      }
    });

    // Match the actual format: "- [x] 1. Create GraphQL queries..." or "- [ ] **1. Task description**"
    const taskRegex = /^(\s*)- \[([ x])\] (?:\*\*)?(\d+(?:\.\d+)*)\. (.+?)(?:\*\*)?$/;
    const requirementsRegex = /_Requirements: ([\d., ]+)/;
    const leverageRegex = /_Leverage: (.+)$/;

    let currentTask: Task | null = null;
    let parentStack: { level: number; task: Task }[] = [];

    for (const line of lines) {
      const match = line.match(taskRegex);
      if (match) {
        const [, indent, checked, id, description] = match;
        const level = indent.length / 2;

        currentTask = {
          id,
          description: description.trim(),
          completed: checked === 'x',
          requirements: [],
        };

        // Find parent based on level
        while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= level) {
          parentStack.pop();
        }

        if (parentStack.length > 0) {
          const parent = parentStack[parentStack.length - 1].task;
          if (!parent.subtasks) parent.subtasks = [];
          parent.subtasks.push(currentTask);
        } else {
          tasks.push(currentTask);
        }

        parentStack.push({ level, task: currentTask });
      } else if (currentTask) {
        // Check for requirements
        const reqMatch = line.match(requirementsRegex);
        if (reqMatch) {
          currentTask.requirements = reqMatch[1].split(',').map((r) => r.trim());
        }

        // Check for leverage
        const levMatch = line.match(leverageRegex);
        if (levMatch) {
          currentTask.leverage = levMatch[1].trim();
        }
      }
    }

    return tasks;
  }

  private countCompletedTasks(tasks: Task[]): number {
    let count = 0;
    for (const task of tasks) {
      if (task.completed) count++;
      if (task.subtasks) {
        count += this.countCompletedTasks(task.subtasks);
      }
    }
    return count;
  }

  private countTotalTasks(tasks: Task[]): number {
    let count = tasks.length;
    for (const task of tasks) {
      if (task.subtasks) {
        count += this.countTotalTasks(task.subtasks);
      }
    }
    return count;
  }

  private findInProgressTask(tasks: Task[]): string | undefined {
    for (const task of tasks) {
      if (!task.completed) {
        return task.id;
      }
      if (task.subtasks) {
        const subTaskId = this.findInProgressTask(task.subtasks);
        if (subTaskId) return subTaskId;
      }
    }
    return undefined;
  }

  private formatDisplayName(name: string): string {
    return name
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private extractRequirements(content: string): RequirementDetail[] {
    const requirements: RequirementDetail[] = [];
    const lines = content.split('\n');
    let currentRequirement: RequirementDetail | null = null;
    let inAcceptanceCriteria = false;

    debug('Extracting requirements from content...');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if line contains a numbered requirement - try multiple patterns
      const requirementPatterns = [
        /^### Requirement (\d+): (.+)$/,           // ### Requirement 1: Title
        /^## Requirement (\d+): (.+)$/,            // ## Requirement 1: Title
        /^### (\d+)\. (.+)$/,                      // ### 1. Title
        /^## (\d+)\. (.+)$/,                       // ## 1. Title
      ];

      let matchFound = false;
      for (const pattern of requirementPatterns) {
        const match = line.match(pattern);
        if (match) {
          // Save previous requirement
          if (currentRequirement) {
            requirements.push(currentRequirement);
          }

          currentRequirement = {
            id: match[1],
            title: match[2].trim(),
            acceptanceCriteria: [],
          };
          debug(`Found requirement ${match[1]}: ${match[2].trim()}`);
          inAcceptanceCriteria = false;
          matchFound = true;
          break;
        }
      }

      if (!matchFound) {
        // Look for user story
        if (currentRequirement && line.includes('**User Story:**')) {
          currentRequirement.userStory = line.replace('**User Story:**', '').trim();
        }
        // Look for acceptance criteria section
        else if (currentRequirement && line.includes('#### Acceptance Criteria')) {
          inAcceptanceCriteria = true;
        }
        // Collect acceptance criteria items
        else if (currentRequirement && inAcceptanceCriteria && line.match(/^\d+\. /)) {
          currentRequirement.acceptanceCriteria.push(line.replace(/^\d+\. /, '').trim());
        }
        // Stop at next major section
        else if (line.startsWith('### Requirement') || line.startsWith('### ') || line.startsWith('## ')) {
          inAcceptanceCriteria = false;
        }
      }
    }

    // Don't forget the last requirement
    if (currentRequirement) {
      requirements.push(currentRequirement);
    }

    debug(`Extracted ${requirements.length} requirements:`, requirements.map(r => `${r.id}: ${r.title}`));
    return requirements;
  }

  private extractUserStories(content: string): string[] {
    const stories: string[] = [];
    const lines = content.split('\n');
    let currentStory = '';
    let inStorySection = false;

    for (const line of lines) {
      // Check if line contains a user story
      if (line.includes('**User Story:**')) {
        if (currentStory) {
          stories.push(currentStory.trim());
        }
        // Extract the story content after "**User Story:**"
        currentStory = line.replace('**User Story:**', '').trim();
        inStorySection = true;
      } else if (inStorySection && line.trim()) {
        // Stop at next major section (### or ##) or next user story
        if (line.startsWith('###') || line.startsWith('##') || line.includes('**User Story:**')) {
          if (currentStory) {
            stories.push(currentStory.trim());
            currentStory = '';
          }
          // If this line is another user story, process it
          if (line.includes('**User Story:**')) {
            currentStory = line.replace('**User Story:**', '').trim();
          } else {
            inStorySection = false;
          }
        } else if (!line.startsWith('#') && line.trim()) {
          // Continue building the story if it's not a heading
          currentStory += ' ' + line.trim();
        }
      }
    }

    // Don't forget the last story
    if (currentStory) {
      stories.push(currentStory.trim());
    }

    return stories; // Return all stories
  }

  private extractCodeReuseAnalysis(content: string): CodeReuseCategory[] {
    const categories: CodeReuseCategory[] = [];
    const lines = content.split('\n');
    let inCodeReuseSection = false;
    let currentCategory: CodeReuseCategory | null = null;

    for (const line of lines) {
      if (line.includes('## Code Reuse Analysis')) {
        inCodeReuseSection = true;
        continue;
      }

      if (inCodeReuseSection) {
        // Stop at next major section
        if (line.startsWith('## ') && !line.includes('Code Reuse')) {
          break;
        }

        // Look for numbered categories like "1. **Configuration Infrastructure**"
        const categoryMatch = line.match(/^\d+\.\s*\*\*(.+?)\*\*/);
        if (categoryMatch) {
          // Save previous category
          if (currentCategory) {
            categories.push(currentCategory);
          }
          // Start new category
          currentCategory = {
            title: categoryMatch[1].trim(),
            items: [],
          };
        }
        // Look for bullet points under categories
        else if (currentCategory && (line.startsWith('   - ') || line.startsWith('  - '))) {
          const item = line.replace(/^\s*-\s*/, '').trim();
          if (item) {
            // Clean up markdown formatting
            const cleanItem = item
              .replace(/`([^`]+)`/g, '$1') // Remove backticks
              .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold formatting
              .trim();
            currentCategory.items.push(cleanItem);
          }
        }
      }
    }

    // Don't forget the last category
    if (currentCategory) {
      categories.push(currentCategory);
    }

    return categories;
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private async getSteeringStatus(): Promise<SteeringStatus> {
    const steeringPath = join(this.projectPath, '.claude', 'steering');
    
    try {
      await access(steeringPath, constants.F_OK);
      
      const status: SteeringStatus = {
        exists: true,
        hasProduct: await this.fileExists(join(steeringPath, 'product.md')),
        hasTech: await this.fileExists(join(steeringPath, 'tech.md')),
        hasStructure: await this.fileExists(join(steeringPath, 'structure.md'))
      };
      
      return status;
    } catch {
      return {
        exists: false,
        hasProduct: false,
        hasTech: false,
        hasStructure: false
      };
    }
  }
}
