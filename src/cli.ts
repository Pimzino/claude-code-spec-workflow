#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { SpecWorkflowSetup } from './setup';
import { detectProjectType, validateClaudeCode } from './utils';

const program = new Command();

program
  .name('claude-spec-setup')
  .description('Set up Claude Code Spec Workflow in your project')
  .version('1.1.2');

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
        console.log(chalk.gray('  📝 7 slash commands for spec workflow'));
        console.log(chalk.gray('  🤖 Auto-generated task commands'));
        console.log(chalk.gray('  📋 Document templates'));
        console.log(chalk.gray('  🔧 Platform-specific command generation scripts'));
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
      console.log(chalk.gray('  /spec-create <feature-name>  - Create a new spec'));
      console.log(chalk.gray('  /spec-requirements           - Generate requirements'));
      console.log(chalk.gray('  /spec-design                 - Generate design'));
      console.log(chalk.gray('  /spec-tasks                  - Generate tasks'));
      console.log(chalk.gray('  /spec-execute <task-id>      - Execute tasks'));
      console.log(chalk.gray('  /{spec-name}-task-{id}       - Auto-generated task commands'));
      console.log(chalk.gray('  /spec-status                 - Show status'));
      console.log(chalk.gray('  /spec-list                   - List all specs'));
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

program.parse();
