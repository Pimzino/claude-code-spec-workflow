#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { SpecWorkflowSetup } from './setup';
import { detectProjectType, validateClaudeCode, getPackageMetadata, getCommandInfo } from './utils';
import { parseTasksFromMarkdown, generateTaskCommand } from './task-generator';

const program = new Command();
const packageMeta = getPackageMetadata();

const COMMAND_USAGE_PADDING = 32;

program.name('claude-spec-setup').description(packageMeta.description).version(packageMeta.version);

program
  .option('-p, --project <path>', 'Project directory', process.cwd())
  .option('-f, --force', 'Force overwrite existing files')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (options) => {
    console.log(chalk.cyan.bold('🚀 Claude Code Spec Workflow Setup'));
    console.log(chalk.gray('Claude Code Automated spec-driven development workflow'));
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
      const setup = new SpecWorkflowSetup(projectPath);
      const claudeExists = await setup.claudeDirectoryExists();

      if (claudeExists && !options.force) {
        if (!options.yes) {
          const { proceed } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'proceed',
              message: '.claude directory already exists. Overwrite?',
              default: false,
            },
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

        let commandCountText = 'slash commands for spec workflow';
        try {
          const setup = new SpecWorkflowSetup(projectPath);
          const commandCount = setup.getCommandCount();
          commandCountText = `${commandCount} slash commands for spec workflow`;
        } catch (error) {
          console.warn(
            chalk.yellow('Warning: Could not determine command count'),
            error instanceof Error ? error.message : 'Unknown error'
          );
          commandCountText = 'slash commands for spec workflow';
        }

        console.log(chalk.gray(`  📝 ${commandCountText}`));
        console.log(chalk.gray('  🤖 Auto-generated task commands'));
        console.log(chalk.gray('  📋 Document templates'));
        console.log(chalk.gray('  🔧 NPX-based task command generation'));
        console.log(chalk.gray('  ⚙️  Configuration files'));
        console.log(chalk.gray('  📖 CLAUDE.md with workflow instructions'));
        console.log();

        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Proceed with setup?',
            default: true,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('Setup cancelled.'));
          process.exit(0);
        }
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

      const commands = getCommandInfo();
      for (const command of commands) {
        const paddedUsage = command.usage.padEnd(COMMAND_USAGE_PADDING);
        console.log(chalk.gray(`  ${paddedUsage} - ${command.description}`));
      }
      console.log(chalk.gray('  /{spec-name}-task-{id}       - Auto-generated task commands'));
      console.log();
      console.log(chalk.yellow('Next steps:'));
      console.log(chalk.gray('1. Run: claude'));
      console.log(chalk.gray('2. Try: /spec-create my-feature'));
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
    // Validate spec name
    if (!/^[a-zA-Z0-9-_]+$/.test(specName)) {
      console.error(
        chalk.red('Error: Invalid spec name. Use only letters, numbers, hyphens, and underscores.')
      );
      process.exit(1);
    }

    if (specName.length > 50) {
      console.error(chalk.red('Error: Spec name must be 50 characters or less.'));
      process.exit(1);
    }

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
      console.log(
        chalk.yellow.bold(
          'RESTART REQUIRED: You must restart Claude Code for the new commands to be visible'
        )
      );
      console.log();
      console.log(chalk.cyan.bold('Instructions for the agent:'));
      console.log(chalk.gray('Tell the user they must exit Claude Code and restart it using:'));
      console.log(
        chalk.white('- Run "claude --continue" to continue this conversation with new commands')
      );
      console.log(chalk.white('- Or run "claude" to start a fresh session'));
      console.log(
        chalk.gray('The restart is absolutely necessary for the new task commands to appear.')
      );
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

program.parse();
