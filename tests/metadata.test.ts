import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  getPackageMetadata,
  getCommandInfo,
  getCommandCount,
  clearPackageMetadataCache,
  CommandInfo,
} from '../src/utils';

describe('Metadata Utilities', () => {
  let tempDir: string;
  let expectedVersion: string;

  beforeAll(() => {
    const packageJson = JSON.parse(require('fs').readFileSync('package.json', 'utf8'));
    expectedVersion = packageJson.version;
  });

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(join(tmpdir(), 'metadata-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('getPackageMetadata', () => {
    test('should return current package metadata', () => {
      const meta = getPackageMetadata();

      // Validate interface structure
      expect(meta).toHaveProperty('version');
      expect(meta).toHaveProperty('name');
      expect(meta).toHaveProperty('description');

      // Validate specific values from actual package.json
      expect(meta.version).toBe(expectedVersion);
      expect(meta.name).toBe('@pimzino/claude-code-spec-workflow');
      expect(meta.description).toContain('Automated spec-driven workflow');

      // Validate types
      expect(typeof meta.version).toBe('string');
      expect(typeof meta.name).toBe('string');
      expect(typeof meta.description).toBe('string');
    });

    test('should return valid semver format for version', () => {
      const meta = getPackageMetadata();

      // Test semver pattern (x.y.z)
      expect(meta.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('should return scoped package name format', () => {
      const meta = getPackageMetadata();

      // Test scoped package format (@scope/package)
      expect(meta.name).toMatch(/^@[\w-]+\/[\w-]+$/);
    });

    test('should return non-empty description', () => {
      const meta = getPackageMetadata();

      expect(meta.description).toBeTruthy();
      expect(meta.description.length).toBeGreaterThan(0);
    });
  });

  describe('getCommandInfo', () => {
    test('should return array of command info objects', () => {
      const commands = getCommandInfo();

      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBeGreaterThan(0);
    });

    test('should return 8 spec commands', () => {
      const commands = getCommandInfo();

      // Should return exactly 8 commands (fixing the hardcoded "7" issue)
      expect(commands.length).toBe(8);
    });

    test('should include all expected spec commands', () => {
      const commands = getCommandInfo();
      const commandNames = commands.map((cmd) => cmd.name);

      const expectedCommands = [
        '/spec-create',
        '/spec-design',
        '/spec-execute',
        '/spec-list',
        '/spec-requirements',
        '/spec-status',
        '/spec-steering-setup',
        '/spec-tasks',
      ];

      expectedCommands.forEach((expectedCmd) => {
        expect(commandNames).toContain(expectedCmd);
      });
    });

    test('should return commands with proper structure', () => {
      const commands = getCommandInfo();

      commands.forEach((cmd: CommandInfo) => {
        expect(cmd).toHaveProperty('name');
        expect(cmd).toHaveProperty('description');
        expect(cmd).toHaveProperty('usage');

        expect(typeof cmd.name).toBe('string');
        expect(typeof cmd.description).toBe('string');
        expect(typeof cmd.usage).toBe('string');

        expect(cmd.name).toBeTruthy();
        expect(cmd.description).toBeTruthy();
        expect(cmd.usage).toBeTruthy();
      });
    });

    test('should return commands sorted alphabetically by name', () => {
      const commands = getCommandInfo();
      const commandNames = commands.map((cmd) => cmd.name);
      const sortedNames = [...commandNames].sort();

      expect(commandNames).toEqual(sortedNames);
    });

    test('should have consistent command name format', () => {
      const commands = getCommandInfo();

      commands.forEach((cmd: CommandInfo) => {
        // All spec commands should start with "/spec-"
        expect(cmd.name).toMatch(/^\/spec-[\w-]+$/);
      });
    });

    test('should have consistent usage format', () => {
      const commands = getCommandInfo();

      commands.forEach((cmd: CommandInfo) => {
        // Usage should start with the command name
        expect(cmd.usage.startsWith(cmd.name)).toBe(true);
      });
    });
  });

  describe('getCommandCount', () => {
    test('should return correct command count', () => {
      const count = getCommandCount();

      expect(count).toBe(8);
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    test('should match getCommandInfo array length', () => {
      const count = getCommandCount();
      const commands = getCommandInfo();

      expect(count).toBe(commands.length);
    });
  });

  describe('metadata consistency', () => {
    test('should maintain consistency between functions', () => {
      const meta = getPackageMetadata();
      const commands = getCommandInfo();
      const count = getCommandCount();

      // Metadata should be stable across calls
      const meta2 = getPackageMetadata();
      expect(meta).toEqual(meta2);

      // Command count should match command array length
      expect(count).toBe(commands.length);

      // Commands should be stable across calls
      const commands2 = getCommandInfo();
      expect(commands).toEqual(commands2);
    });

    test('should handle multiple calls efficiently', () => {
      // Test that multiple calls don't cause issues
      for (let i = 0; i < 5; i++) {
        const meta = getPackageMetadata();
        const commands = getCommandInfo();
        const count = getCommandCount();

        expect(meta.version).toBe(expectedVersion);
        expect(commands.length).toBe(8);
        expect(count).toBe(8);
      }
    });
  });

  describe('caching and error handling', () => {
    beforeEach(() => {
      // Clear cache before each test
      clearPackageMetadataCache();
    });

    afterEach(() => {
      // Clear cache after each test to avoid test pollution
      clearPackageMetadataCache();
    });

    test('should cache package metadata between calls', () => {
      // First call should read from file and cache
      const meta1 = getPackageMetadata();

      // Second call should return cached data (same object reference)
      const meta2 = getPackageMetadata();

      expect(meta1).toEqual(meta2);
      expect(meta1.version).toBe(expectedVersion);
      expect(meta1.name).toBe('@pimzino/claude-code-spec-workflow');
    });

    test('should clear cache when clearPackageMetadataCache is called', () => {
      // Get initial metadata (should cache it)
      const meta1 = getPackageMetadata();
      expect(meta1.version).toBe(expectedVersion);

      // Clear cache
      clearPackageMetadataCache();

      // Get metadata again (should re-read from file)
      const meta2 = getPackageMetadata();
      expect(meta2.version).toBe(expectedVersion);
      expect(meta2).toEqual(meta1);
    });

    test('should handle missing package.json gracefully', () => {
      // Mock file reading to simulate missing file
      const originalReadFileSync = require('fs').readFileSync;
      const mockReadFileSync = jest.fn().mockImplementation(() => {
        const error: NodeJS.ErrnoException = new Error('ENOENT: no such file or directory');
        error.code = 'ENOENT';
        throw error;
      });

      require('fs').readFileSync = mockReadFileSync;

      try {
        expect(() => getPackageMetadata()).toThrow(
          'Failed to read package metadata: package.json not found'
        );
      } finally {
        // Restore original function
        require('fs').readFileSync = originalReadFileSync;
      }
    });

    test('should handle malformed JSON in package.json', () => {
      const originalReadFileSync = require('fs').readFileSync;
      const mockInvalidJsonFile = jest.fn().mockReturnValue('{ invalid json }');

      require('fs').readFileSync = mockInvalidJsonFile;

      try {
        expect(() => getPackageMetadata()).toThrow(
          'Failed to parse package.json: Invalid JSON format'
        );
      } finally {
        // Restore original function
        require('fs').readFileSync = originalReadFileSync;
      }
    });

    test('should handle missing required fields in package.json', () => {
      const originalReadFileSync = require('fs').readFileSync;
      const mockIncompletePackageJson = jest.fn().mockReturnValue(
        JSON.stringify({
          name: '@test/package',
        })
      );

      require('fs').readFileSync = mockIncompletePackageJson;

      try {
        expect(() => getPackageMetadata()).toThrow(
          'Missing required fields (version, name, description) in package.json'
        );
      } finally {
        // Restore original function
        require('fs').readFileSync = originalReadFileSync;
      }
    });

    test('should handle partial missing fields in package.json', () => {
      const originalReadFileSync = require('fs').readFileSync;
      const mockPackageJsonMissingDescription = jest.fn().mockReturnValue(
        JSON.stringify({
          name: '@test/package',
          version: '1.0.0',
        })
      );

      require('fs').readFileSync = mockPackageJsonMissingDescription;

      try {
        expect(() => getPackageMetadata()).toThrow(
          'Missing required fields (version, name, description) in package.json'
        );
      } finally {
        // Restore original function
        require('fs').readFileSync = originalReadFileSync;
      }
    });

    test('should handle empty string fields in package.json', () => {
      const originalReadFileSync = require('fs').readFileSync;
      const mockPackageJsonWithEmptyName = jest.fn().mockReturnValue(
        JSON.stringify({
          name: '',
          version: '1.0.0',
          description: 'Valid description',
        })
      );

      require('fs').readFileSync = mockPackageJsonWithEmptyName;

      try {
        expect(() => getPackageMetadata()).toThrow(
          'Missing required fields (version, name, description) in package.json'
        );
      } finally {
        // Restore original function
        require('fs').readFileSync = originalReadFileSync;
      }
    });

    test('should handle unknown errors gracefully', () => {
      // Mock file reading to throw unknown error
      const originalReadFileSync = require('fs').readFileSync;
      const mockReadFileSync = jest.fn().mockImplementation(() => {
        throw 'Unknown string error';
      });

      require('fs').readFileSync = mockReadFileSync;

      try {
        expect(() => getPackageMetadata()).toThrow(
          'Failed to read package metadata: Unknown error'
        );
      } finally {
        require('fs').readFileSync = originalReadFileSync;
      }
    });

    test('should maintain cache across multiple calls even after errors', () => {
      // First successful call should cache
      const meta1 = getPackageMetadata();
      expect(meta1.version).toBe(expectedVersion);

      // Mock to throw error for subsequent file reads
      const originalReadFileSync = require('fs').readFileSync;
      const mockReadFileSync = jest.fn().mockImplementation(() => {
        throw new Error('File system error');
      });

      require('fs').readFileSync = mockReadFileSync;

      try {
        // Should still return cached data, not try to re-read
        const meta2 = getPackageMetadata();
        expect(meta2).toEqual(meta1);
        expect(meta2.version).toBe(expectedVersion);
      } finally {
        require('fs').readFileSync = originalReadFileSync;
      }
    });
  });
});
