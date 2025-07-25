import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import packageJson from '../package.json';

describe('CLI Functionality', () => {
  const projectRoot = join(__dirname, '..');

  test('development CLI version should match package.json', async () => {
    try {
      const output = execSync('npm run dev -- --version', {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      const versionLines = output.trim().split('\n');
      const versionLine = versionLines[versionLines.length - 1];

      expect(versionLine).toBe(packageJson.version);
    } catch (error) {
      throw new Error(`Development CLI test failed: ${error}`);
    }
  });

  test('built CLI version should match package.json', async () => {
    try {
      execSync('npm run build', {
        cwd: projectRoot,
        stdio: 'pipe',
      });

      const output = execSync('node dist/cli.js --version', {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      expect(output.trim()).toBe(packageJson.version);
    } catch (error) {
      throw new Error(`Built CLI test failed: ${error}`);
    }
  });

  test('CLI should use dynamic version reference', () => {
    const cliContent = readFileSync(join(projectRoot, 'src/cli.ts'), 'utf8');

    // Verify it uses dynamic version reference (proves the fix works)
    expect(cliContent).toContain('.version(packageJson.version)');
  });
});

