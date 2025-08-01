#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { SpecWorkflowSetup } from './setup';
import { detectProjectType, validateClaudeCode } from './utils';
import { parseTasksFromMarkdown, generateTaskCommand } from './task-generator';
import { inspectEnvironment, loadSpec, loadBug, SpecLoadResult } from './utils';
import { isValidTaskId, TaskInfo, TaskSummary, TaskContext } from './task-parser';
import { readFileSync } from 'fs';
import * as path from 'path';

// Read version from package.json
// Use require.resolve to find package.json in both dev and production
let packageJson: { version: string };
try {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
} catch {
  // Fallback for edge cases
  packageJson = { version: '1.3.0' };
}

const program = new Command();

program
  .name('claude-spec-setup')
  .description('Set up Claude Code Spec Workflow with automated orchestration in your project')
  .version(packageJson.version);

program
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .option('-f, --force', 'Force overwrite existing files')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (options) => {
    console.log(chalk.cyan.bold('🚀 Claude Code Spec Workflow Setup'));
    console.log(chalk.gray('Automated spec-driven development with intelligent orchestration'));
    console.log();

    const projectPath = options.project;
    const spinner = ora('Analyzing project...').start();

    try {
      // Detect project type
      const projectTypes = await detectProjectType(projectPath);
      spinner.succeed(`Project analyzed: ${projectPath}`);

      if (projectTypes.length > 0) {
        console.log(chalk.blue(`📊 Detected project type(s): ${projectTypes.join(', ')}`));
      }

      // Check Claude Code availability
      const claudeAvailable = await validateClaudeCode();
      if (claudeAvailable) {
        console.log(chalk.green('✓ Claude Code is available'));
      } else {
        console.log(chalk.yellow('⚠️  Claude Code not found. Please install Claude Code first.'));
        console.log(chalk.gray('   Visit: https://docs.anthropic.com/claude-code'));
      }

      // Check for existing .claude directory
      let setup = new SpecWorkflowSetup(projectPath);
      const claudeExists = await setup.claudeDirectoryExists();

      if (claudeExists && !options.force) {
        if (!options.yes) {
          const { proceed } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'proceed',
              message: '.claude directory already exists. Update with latest commands?',
              default: true
            }
          ]);

          if (!proceed) {
            console.log(chalk.yellow('Setup cancelled.'));
            process.exit(0);
          }
        }
      }

      // Confirm setup
      if (!options.yes) {
        console.log();
        console.log(chalk.cyan('This will create:'));
        console.log(chalk.gray('  📁 .claude/ directory structure'));
        console.log(chalk.gray('  📝 14 slash commands (9 spec workflow + 5 bug fix workflow)'));
        console.log(chalk.gray('  🤖 Auto-generated task commands'));
        console.log(chalk.gray('  🎯 Intelligent orchestrator for automated execution'));
        console.log(chalk.gray('  📋 Document templates'));
        console.log(chalk.gray('  🔧 NPX-based task command generation'));
        console.log(chalk.gray('  ⚙️  Configuration files'));
        console.log(chalk.gray('  📖 Complete workflow instructions embedded in each command'));
        console.log();

        const { useAgents } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'useAgents',
            message: 'Enable Claude Code sub-agents for enhanced task execution?',
            default: true
          }
        ]);

        // Create setup instance with agent preference
        setup = new SpecWorkflowSetup(process.cwd(), useAgents);
      }

      // Run setup
      const setupSpinner = ora('Setting up spec workflow...').start();
      await setup.runSetup();
      setupSpinner.succeed('Setup complete!');

      // Success message
      console.log();
      console.log(chalk.green.bold('✅ Spec Workflow installed successfully!'));
      console.log();
      console.log(chalk.cyan('Available commands:'));
      console.log(chalk.white.bold('📊 Spec Workflow (for new features):'));
      console.log(chalk.gray('  /spec-create <feature-name>  - Create a new spec'));
      console.log(chalk.gray('  /spec-orchestrate <spec>     - 🎯 NEW! Automated execution'));
      console.log(chalk.gray('  /spec-execute <task-id>      - Execute tasks manually'));
      console.log(chalk.gray('  /{spec-name}-task-{id}       - Auto-generated task commands'));
      console.log(chalk.gray('  /spec-status                 - Show status'));
      console.log(chalk.gray('  /spec-completion-review      - Final review when all tasks complete'));
      console.log(chalk.gray('  /spec-list                   - List all specs'));
      console.log();
      
      // Show agents section if enabled
      if (setup && setup['createAgents']) {
        console.log(chalk.white.bold('🤖 Sub-Agents (automatic):'));
        console.log(chalk.gray('  spec-task-executor                - Specialized task implementation agent'));
        console.log(chalk.gray('  spec-requirements-validator       - Requirements quality validation agent'));
        console.log(chalk.gray('  spec-design-validator             - Design quality validation agent'));
        console.log(chalk.gray('  spec-task-validator               - Task atomicity validation agent'));
        console.log(chalk.gray('  spec-task-implementation-reviewer - Post-implementation review agent'));
        console.log(chalk.gray('  spec-integration-tester           - Integration testing and validation agent'));
        console.log(chalk.gray('  spec-completion-reviewer          - End-to-end feature completion agent'));
        console.log(chalk.gray('  bug-root-cause-analyzer           - Enhanced bug analysis with git history'));
        console.log(chalk.gray('  steering-document-updater         - Analyzes codebase and suggests doc updates'));
        console.log(chalk.gray('  spec-dependency-analyzer          - Optimizes task execution order'));
        console.log(chalk.gray('  spec-test-generator               - Generates tests from requirements'));
        console.log(chalk.gray('  spec-documentation-generator      - Maintains project documentation'));
        console.log(chalk.gray('  spec-performance-analyzer         - Analyzes performance implications'));
        console.log(chalk.gray('  spec-duplication-detector         - Identifies code reuse opportunities'));
        console.log(chalk.gray('  spec-breaking-change-detector     - Detects API compatibility issues'));
        console.log();
      }
      
      console.log(chalk.white.bold('🐛 Bug Fix Workflow (for bug fixes):'));
      console.log(chalk.gray('  /bug-create <bug-name>       - Start bug fix'));
      console.log(chalk.gray('  /bug-analyze                 - Analyze root cause'));
      console.log(chalk.gray('  /bug-fix                     - Implement fix'));
      console.log(chalk.gray('  /bug-verify                  - Verify fix'));
      console.log(chalk.gray('  /bug-status                  - Show bug status'));
      console.log();
      console.log(chalk.yellow('Next steps:'));
      console.log(chalk.gray('1. Run: claude'));
      console.log(chalk.gray('2. For new features: /spec-create my-feature'));
      console.log(chalk.gray('3. For bug fixes: /bug-create my-bug'));
      console.log();
      console.log(chalk.blue('📖 For help, see the README or run /spec-list'));

    } catch (error) {
      spinner.fail('Setup failed');
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add test command
program
  .command('test')
  .description('Test the setup in a temporary directory')
  .action(async () => {
    console.log(chalk.cyan('🧪 Testing setup...'));

    const os = await import('os');
    const path = await import('path');
    const fs = await import('fs/promises');

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-spec-test-'));

    try {
      const setup = new SpecWorkflowSetup(tempDir);
      await setup.runSetup();

      console.log(chalk.green('✅ Test completed successfully!'));
      console.log(chalk.gray(`Test directory: ${tempDir}`));

    } catch (error) {
      console.error(chalk.red('❌ Test failed:'), error);
      process.exit(1);
    }
  });

// Add generate-task-commands command
program
  .command('generate-task-commands')
  .description('Generate individual task commands for a spec')
  .argument('<spec-name>', 'Name of the spec to generate commands for')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .action(async (specName, options) => {
    console.log(chalk.cyan('🔧 Generating task commands...'));
    
    const path = await import('path');
    const fs = await import('fs/promises');
    
    const projectPath = options.project;
    const specDir = path.join(projectPath, '.claude', 'specs', specName);
    const tasksFile = path.join(specDir, 'tasks.md');
    const commandsSpecDir = path.join(projectPath, '.claude', 'commands', specName);
    
    const spinner = ora(`Generating commands for spec: ${specName}`).start();
    
    try {
      // Check if tasks.md exists
      try {
        await fs.access(tasksFile);
      } catch {
        spinner.fail(`tasks.md not found at ${tasksFile}`);
        process.exit(1);
      }
      
      // Read tasks.md
      const tasksContent = await fs.readFile(tasksFile, 'utf8');
      
      // Create spec commands directory
      await fs.mkdir(commandsSpecDir, { recursive: true });
      
      // Parse tasks and generate commands
      const tasks = parseTasksFromMarkdown(tasksContent);
      
      let taskCount = 0;
      for (const task of tasks) {
        await generateTaskCommand(commandsSpecDir, specName, task);
        taskCount++;
      }
      
      spinner.succeed(`Generated ${taskCount} task commands for spec: ${specName}`);
      
      console.log();
      console.log(chalk.green('Generated commands:'));
      for (const task of tasks) {
        console.log(chalk.gray(`  /${specName}-task-${task.id} - ${task.description}`));
      }
      
      console.log();
      console.log(chalk.yellow.bold('RESTART REQUIRED: You must restart Claude Code for the new commands to be visible'));
      console.log();
      console.log(chalk.cyan.bold('Instructions for the agent:'));
      console.log(chalk.gray('Tell the user they must exit Claude Code and restart it using:'));
      console.log(chalk.white('- Run "claude --continue" to continue this conversation with new commands'));
      console.log(chalk.white('- Or run "claude" to start a fresh session'));
      console.log(chalk.gray('The restart is absolutely necessary for the new task commands to appear.'));
      console.log();
      console.log(chalk.blue('After restart, you can use commands like:'));
      if (tasks.length > 0) {
        console.log(chalk.gray(`  /${specName}-task-${tasks[0].id}`));
        if (tasks.length > 1) {
          console.log(chalk.gray(`  /${specName}-task-${tasks[1].id}`));
        }
        console.log(chalk.gray('  etc.'));
      }
      
    } catch (error) {
      spinner.fail('Command generation failed');
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add inspect-setup command
program
  .command('inspect-setup')
  .description('Inspect project environment and load context for Claude Code workflows')
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .option('-s, --spec <spec-name>', 'Load specific spec')
  .option('-b, --bug <bug-name>', 'Load specific bug')
  .option('-t, --task <task-id>', 'Load specific task (requires --spec)')
  .option('--task-summary', 'Load task summary only (requires --spec)')
  .option('--full-tasks', 'Load full tasks document (requires --spec)')
  .option('--next-task', 'Get recommended next task only (requires --spec)')
  .option('--with-templates', 'Load relevant template documents into context')
  .option('--no-content', 'Skip loading file contents (metadata only)')
  .option('--json', 'Output as JSON')
  .option('--compact', 'Compact JSON output')
  .action(async (options) => {
    const projectPath = options.project;
    const includeContent = options.content !== false;
    
    console.log(chalk.cyan('🔍 Inspecting project environment...'));
    const spinner = ora('Loading environment').start();

    try {
      let result: SpecLoadResult;

      if (options.spec) {
        // Load specific spec
        const taskMode = options.taskSummary ? 'task_summary' 
          : options.fullTasks ? 'full_tasks'
          : options.nextTask ? 'task_summary'  // Use task_summary to get next task info
          : options.task ? 'single_task'
          : 'full_tasks';

        if (options.task && !isValidTaskId(options.task)) {
          spinner.fail(`Invalid task ID format: ${options.task}`);
          console.log(chalk.gray('Task ID should be in format: 1, 2.1, 3.2.1, etc.'));
          process.exit(1);
        }

        result = await loadSpec(projectPath, options.spec, {
          taskMode,
          taskId: options.task,
          includeContent,
          loadTemplates: options.withTemplates
        });

        if (!result.current_spec) {
          spinner.fail(`Spec not found: ${options.spec}`);
          process.exit(1);
        }

      } else if (options.bug) {
        // Load specific bug
        result = await loadBug(projectPath, options.bug, includeContent);

        if (!result.current_bug) {
          spinner.fail(`Bug not found: ${options.bug}`);
          process.exit(1);
        }

      } else {
        // Just environment inspection
        const environment = await inspectEnvironment(projectPath);
        result = { environment };
      }

      spinner.succeed('Environment loaded');

      if (options.nextTask && result.current_spec?.tasks) {
        // Special handling for --next-task: show only next task info
        const summary = result.current_spec.tasks.content as TaskSummary;
        if (options.json) {
          const nextTaskResult = {
            spec: result.current_spec.name,
            execution_ready: summary.execution_ready,
            recommended_next_task: summary.recommended_next_task,
            next_pending_task: summary.next_pending_task,
            progress: {
              completed: summary.completed_tasks,
              total: summary.total_tasks,
              percentage: summary.completion_percentage
            }
          };
          console.log(options.compact ? JSON.stringify(nextTaskResult) : JSON.stringify(nextTaskResult, null, 2));
        } else {
          console.log(chalk.cyan.bold(`📋 Next Task for ${result.current_spec.name}`));
          console.log();
          if (summary.execution_ready && summary.recommended_next_task) {
            const task = summary.recommended_next_task;
            console.log(chalk.green(`🎯 Ready to Execute: Task ${task.id}`));
            console.log(chalk.white(`   ${task.description}`));
            if (task.requirements_ref) {
              console.log(chalk.gray(`   Requirements: ${task.requirements_ref}`));
            }
            if (task.leverage) {
              console.log(chalk.gray(`   Leverage: ${task.leverage}`));
            }
            console.log();
            console.log(chalk.cyan(`Execute with:`));
            console.log(chalk.white(`   npx @pimzino/claude-code-spec-workflow inspect-setup --spec ${result.current_spec.name} --task ${task.id}`));
            console.log(chalk.white(`   /${result.current_spec.name}-task-${task.id}`));
          } else if (summary.next_pending_task) {
            console.log(chalk.yellow(`⚠️  Next task may have dependencies:`));
            console.log(chalk.white(`   Task ${summary.next_pending_task.id}: ${summary.next_pending_task.description}`));
          } else {
            console.log(chalk.green(`🎉 All tasks completed!`));
          }
          console.log();
          console.log(chalk.gray(`Progress: ${summary.completed_tasks}/${summary.total_tasks} tasks complete (${summary.completion_percentage}%)`));
        }
      } else if (options.json) {
        // JSON output
        const jsonOutput = options.compact ? 
          JSON.stringify(result) : 
          JSON.stringify(result, null, 2);
        console.log(jsonOutput);
      } else {
        // Formatted output
        displayEnvironmentReport(result);
      }

    } catch (error) {
      spinner.fail('Environment inspection failed');
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Display formatted environment report
 */
function displayEnvironmentReport(result: SpecLoadResult): void {
  const { environment, current_spec, current_bug, templates } = result;

  console.log();
  console.log(chalk.cyan.bold('📊 Environment Report'));
  console.log();

  // Configuration
  console.log(chalk.white.bold('⚙️  Configuration'));
  if (environment.config.exists) {
    console.log(chalk.green(`  ✓ Config found: ${environment.config.path}`));
    console.log(chalk.gray(`    Version: ${environment.config.version || 'unknown'}`));
    console.log(chalk.gray(`    Agents enabled: ${environment.config.agents_enabled}`));
  } else {
    console.log(chalk.yellow('  ⚠️  No configuration found'));
  }
  console.log();

  // Agents
  console.log(chalk.white.bold('🤖 Agents'));
  if (environment.agents.enabled) {
    console.log(chalk.green(`  ✓ Agents enabled (${environment.agents.available.length} available)`));
    if (environment.agents.available.length > 0) {
      environment.agents.available.forEach(agent => {
        console.log(chalk.gray(`    • ${agent.name}`));
      });
    }
    if (environment.agents.missing.length > 0) {
      console.log(chalk.yellow(`  Missing: ${environment.agents.missing.length} agents`));
      environment.agents.missing.slice(0, 3).forEach(agent => {
        console.log(chalk.gray(`    - ${agent}`));
      });
      if (environment.agents.missing.length > 3) {
        console.log(chalk.gray(`    ... and ${environment.agents.missing.length - 3} more`));
      }
    }
  } else {
    console.log(chalk.gray('  • Agents disabled'));
  }
  console.log();

  // Steering Documents
  console.log(chalk.white.bold('📋 Steering Documents'));
  const steeringDocs = [
    { name: 'product.md', info: environment.steering.product },
    { name: 'tech.md', info: environment.steering.tech },
    { name: 'structure.md', info: environment.steering.structure }
  ];
  
  steeringDocs.forEach(({ name, info }) => {
    if (info.exists) {
      console.log(chalk.green(`  ✓ ${name} (${info.size} bytes)`));
    } else {
      console.log(chalk.gray(`  • ${name} (not found)`));
    }
  });
  console.log();

  // Specs
  console.log(chalk.white.bold('📝 Specifications'));
  if (environment.specs.length > 0) {
    environment.specs.forEach(spec => {
      const status = `${spec.requirements.exists ? '✓' : '•'} req | ${spec.design.exists ? '✓' : '•'} design | ${spec.tasks.exists ? '✓' : '•'} tasks`;
      console.log(chalk.green(`  • ${spec.name}`));
      console.log(chalk.gray(`    ${status}${spec.hasTaskCommands ? ' | ✓ commands' : ''}`));
    });
  } else {
    console.log(chalk.gray('  No specs found'));
  }
  console.log();

  // Bugs
  if (environment.bugs.length > 0) {
    console.log(chalk.white.bold('🐛 Bugs'));
    environment.bugs.forEach(bug => {
      console.log(chalk.yellow(`  • ${bug}`));
    });
    console.log();
  }

  // Current Context
  if (current_spec) {
    console.log(chalk.cyan.bold(`📖 Loaded Spec: ${current_spec.name}`));
    
    if (current_spec.requirements) {
      console.log(chalk.green(`  ✓ Requirements loaded (${current_spec.requirements.size} bytes)`));
    }
    
    if (current_spec.design) {
      console.log(chalk.green(`  ✓ Design loaded (${current_spec.design.size} bytes)`));
    }
    
    if (current_spec.tasks) {
      const { mode, content } = current_spec.tasks;
      
      if (mode === 'single_task') {
        const { task, context } = content as { task: TaskInfo; context: TaskContext };
        if (task) {
          console.log(chalk.green(`  ✓ Task ${task.id}: ${task.description}`));
          console.log(chalk.gray(`    Status: ${task.status}`));
          if (task.requirements_ref) {
            console.log(chalk.gray(`    Requirements: ${task.requirements_ref}`));
          }
          if (context) {
            console.log(chalk.gray(`    Progress: ${context.completed_tasks}/${context.total_tasks} tasks complete`));
          }
        }
      } else if (mode === 'task_summary') {
        const summary = content as TaskSummary;
        console.log(chalk.green(`  ✓ Task Summary: ${summary.completed_tasks}/${summary.total_tasks} complete (${summary.completion_percentage}%)`));
        
        if (summary.execution_ready && summary.recommended_next_task) {
          console.log(chalk.cyan(`    🎯 Recommended Next: ${summary.recommended_next_task.id} - ${summary.recommended_next_task.description}`));
          if (summary.recommended_next_task.requirements_ref) {
            console.log(chalk.gray(`    Requirements: ${summary.recommended_next_task.requirements_ref}`));
          }
        } else if (summary.next_pending_task) {
          console.log(chalk.yellow(`    ⚠️  Next Pending: ${summary.next_pending_task.id} - ${summary.next_pending_task.description}`));
          console.log(chalk.gray(`    (May have unmet dependencies)`));
        } else {
          console.log(chalk.green(`    🎉 All tasks completed!`));
        }
      } else {
        // full_tasks
        const { summary } = content as { summary: TaskSummary };
        console.log(chalk.green(`  ✓ All Tasks loaded: ${summary.completed_tasks}/${summary.total_tasks} complete`));
        
        if (summary.execution_ready && summary.recommended_next_task) {
          console.log(chalk.cyan(`    🎯 Next Ready: ${summary.recommended_next_task.id} - ${summary.recommended_next_task.description}`));
        }
      }
    }
    console.log();
  }

  if (current_bug) {
    console.log(chalk.cyan.bold(`🐛 Loaded Bug: ${current_bug.name}`));
    
    if (current_bug.report) {
      console.log(chalk.green(`  ✓ Report loaded (${current_bug.report.size} bytes)`));
    }
    
    if (current_bug.analysis) {
      console.log(chalk.green(`  ✓ Analysis loaded (${current_bug.analysis.size} bytes)`));
    }
    
    if (current_bug.verification) {
      console.log(chalk.green(`  ✓ Verification loaded (${current_bug.verification.size} bytes)`));
    }
    console.log();
  }

  // Templates (if loaded)
  if (templates && Object.keys(templates).length > 0) {
    console.log(chalk.white.bold('📄 Loaded Templates'));
    if (templates.requirements) {
      console.log(chalk.green(`  ✓ requirements-template.md (${templates.requirements.size} bytes)`));
    }
    if (templates.design) {
      console.log(chalk.green(`  ✓ design-template.md (${templates.design.size} bytes)`));
    }
    if (templates.tasks) {
      console.log(chalk.green(`  ✓ tasks-template.md (${templates.tasks.size} bytes)`));
    }
    console.log();
  }

  // Usage Examples
  console.log(chalk.white.bold('💡 Usage Examples'));
  console.log(chalk.gray('  inspect-setup                          # Environment only'));
  console.log(chalk.gray('  inspect-setup --spec my-feature        # Load spec with all tasks'));
  console.log(chalk.gray('  inspect-setup --spec my-feature --task 2.1  # Load specific task'));
  console.log(chalk.gray('  inspect-setup --spec my-feature --task-summary  # Task summary only'));
  console.log(chalk.gray('  inspect-setup --spec my-feature --next-task     # Get next recommended task'));
  console.log(chalk.gray('  inspect-setup --spec my-feature --with-templates # Load with template documents'));
  console.log(chalk.gray('  inspect-setup --bug login-issue        # Load bug workflow'));
  console.log(chalk.gray('  inspect-setup --json                   # JSON output'));
}

program.parse();