import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { SpecWorkflowSetup } from '../src/setup';
import { getPackageMetadata, getCommandCount, clearPackageMetadataCache } from '../src/utils';

describe('CLI Output Synchronization Integration', () => {
  let tempDir: string;
  let setup: SpecWorkflowSetup;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(join(tmpdir(), 'cli-integration-test-'));
    setup = new SpecWorkflowSetup(tempDir);
    clearPackageMetadataCache(); // Ensure clean cache state for each test
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    clearPackageMetadataCache(); // Clean up cache after each test
  });

  describe('config creation version synchronization', () => {
    test('should create config file with correct version from package.json', async () => {
      await setup.setupDirectories();
      await setup.createConfigFile();

      const configPath = join(tempDir, '.claude', 'spec-config.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      const packageMeta = getPackageMetadata();

      expect(config.spec_workflow.version).toBe(packageMeta.version);
      expect(config.spec_workflow.version).toBe('1.2.5');
    });

    test('should not use hardcoded version in config creation', async () => {
      await setup.setupDirectories();
      await setup.createConfigFile();

      const configPath = join(tempDir, '.claude', 'spec-config.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      // Should not contain hardcoded "1.0.0" version
      expect(config.spec_workflow.version).not.toBe('1.0.0');

      // Should match actual package.json version
      const packageMeta = getPackageMetadata();
      expect(config.spec_workflow.version).toBe(packageMeta.version);
    });
  });

  describe('command count synchronization', () => {
    test('should return accurate command count from setup', () => {
      const setupCommandCount = setup.getCommandCount();
      const utilsCommandCount = getCommandCount();

      // Both should return the same count
      expect(setupCommandCount).toBe(utilsCommandCount);
      expect(setupCommandCount).toBe(8);
    });

    test('should not return hardcoded command count', () => {
      const commandCount = setup.getCommandCount();

      // Should not be the old hardcoded value
      expect(commandCount).not.toBe(7);

      // Should be the correct current count
      expect(commandCount).toBe(8);
    });
  });

  describe('CLI metadata consistency', () => {
    test('should use package.json description throughout CLI', () => {
      const packageMeta = getPackageMetadata();

      expect(packageMeta.description).toContain('Automated spec-driven workflow');
      expect(packageMeta.description).toContain('Requirements → Design → Tasks → Implementation');

      // Description should not be hardcoded but come from package.json
      expect(typeof packageMeta.description).toBe('string');
      expect(packageMeta.description.length).toBeGreaterThan(50);
    });

    test('should maintain version consistency between utilities and package.json', () => {
      const packageMeta = getPackageMetadata();

      // Version should match expected current version
      expect(packageMeta.version).toBe('1.2.5');

      // Should not be any of the old hardcoded versions
      expect(packageMeta.version).not.toBe('1.1.2');
      expect(packageMeta.version).not.toBe('1.0.0');
    });

    test('should use correct package name for NPX commands', () => {
      const packageMeta = getPackageMetadata();

      expect(packageMeta.name).toBe('@pimzino/claude-code-spec-workflow');

      // Package name should be scoped and properly formatted
      expect(packageMeta.name).toMatch(/^@[\w-]+\/[\w-]+$/);
    });
  });

  describe('integration with actual file operations', () => {
    test('should create complete directory structure with synchronized metadata', async () => {
      await setup.setupDirectories();
      await setup.createSlashCommands();
      await setup.createTemplates();
      await setup.createConfigFile();

      // Verify directories exist
      const claudeDir = join(tempDir, '.claude');
      const commandsDir = join(claudeDir, 'commands');
      const templatesDir = join(claudeDir, 'templates');

      expect(
        await fs
          .access(claudeDir)
          .then(() => true)
          .catch(() => false)
      ).toBe(true);
      expect(
        await fs
          .access(commandsDir)
          .then(() => true)
          .catch(() => false)
      ).toBe(true);
      expect(
        await fs
          .access(templatesDir)
          .then(() => true)
          .catch(() => false)
      ).toBe(true);

      // Verify config contains correct version
      const configPath = join(claudeDir, 'spec-config.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      const packageMeta = getPackageMetadata();
      expect(config.spec_workflow.version).toBe(packageMeta.version);
    });

    test('should create command files matching command count', async () => {
      await setup.setupDirectories();
      await setup.createSlashCommands();

      const commandsDir = join(tempDir, '.claude', 'commands');
      const commandFiles = await fs.readdir(commandsDir);
      const specCommandFiles = commandFiles.filter(
        (file) => file.startsWith('spec-') && file.endsWith('.md')
      );

      const expectedCount = getCommandCount();
      expect(specCommandFiles.length).toBe(expectedCount);
      expect(specCommandFiles.length).toBe(8);
    });
  });

  describe('error handling and edge cases', () => {
    test('should handle missing directories gracefully', async () => {
      // Don't create directories first
      const commandCount = setup.getCommandCount();

      // Should still return correct count even without setup
      expect(commandCount).toBe(8);
      expect(typeof commandCount).toBe('number');
    });

    test('should maintain consistent metadata across multiple calls', async () => {
      // Call setup methods multiple times
      for (let i = 0; i < 3; i++) {
        const commandCount = setup.getCommandCount();
        const packageMeta = getPackageMetadata();

        expect(commandCount).toBe(8);
        expect(packageMeta.version).toBe('1.2.5');
        expect(packageMeta.name).toBe('@pimzino/claude-code-spec-workflow');
      }
    });

    test('should handle concurrent operations', async () => {
      // Create multiple operations simultaneously
      const operations = [
        setup.setupDirectories(),
        getPackageMetadata(),
        getCommandCount(),
        setup.getCommandCount(),
      ];

      const results = await Promise.all(operations);

      // Metadata calls should return consistent values
      const [, , count1, count2] = results;
      expect(count1).toBe(count2);
      expect(count1).toBe(8);
    });

    test('should handle caching properly across integration operations', async () => {
      // First operation should cache metadata
      const meta1 = getPackageMetadata();
      expect(meta1.version).toBe('1.2.5');

      // Subsequent operations should use cached data
      await setup.setupDirectories();
      await setup.createConfigFile();

      const configPath = join(tempDir, '.claude', 'spec-config.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);

      // Config should use the same cached metadata
      expect(config.spec_workflow.version).toBe(meta1.version);
      expect(config.spec_workflow.version).toBe('1.2.5');
    });

    test('should provide meaningful error context when metadata fails', () => {
      // Clear cache to ensure fresh read attempt
      clearPackageMetadataCache();

      // Mock file system to simulate failure
      const originalReadFileSync = require('fs').readFileSync;
      const mockReadFileSync = jest.fn().mockImplementation(() => {
        throw new Error('Disk full');
      });

      require('fs').readFileSync = mockReadFileSync;

      try {
        expect(() => getPackageMetadata()).toThrow('Failed to read package metadata: Disk full');
      } finally {
        require('fs').readFileSync = originalReadFileSync;
      }
    });
  });
});
