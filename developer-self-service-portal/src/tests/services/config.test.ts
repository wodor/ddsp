import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { configService } from '../../services/config';
import { DEFAULT_CONFIG } from '../../types/config';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Replace the global localStorage with our mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ConfigService', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clear configuration after each test
    configService.clearConfig();
  });

  it('should return default config when no config exists', () => {
    // Reset the configService to ensure it loads from scratch
    // @ts-ignore - Accessing private method for testing
    configService.config = configService.loadConfig();
    
    const config = configService.getConfig();
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it('should save and load config correctly', () => {
    const newPreferences = {
      theme: 'dark' as const,
      refreshInterval: 10000,
    };

    configService.updateConfig({
      preferences: newPreferences,
    });

    // Verify localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalled();

    // Reset the configService to ensure it loads from scratch
    // @ts-ignore - Accessing private method for testing
    configService.config = configService.loadConfig();
    
    const loadedConfig = configService.getConfig();
    expect(loadedConfig.preferences).toEqual(newPreferences);
  });

  it('should handle GitHub token securely', () => {
    const token = 'test-github-token';
    configService.setGitHubToken(token);

    // Verify localStorage was called twice (once for config, once for token)
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);

    // The token should not be stored in plain text
    const configJson = localStorageMock.getItem('dssp_config');
    const parsedConfig = JSON.parse(configJson as string);
    expect(parsedConfig.githubToken).toBeUndefined();

    // The token should be stored separately
    expect(localStorageMock.getItem('github_token')).toBeTruthy();

    // Reset the configService to ensure it loads from scratch
    // @ts-ignore - Accessing private method for testing
    configService.config = configService.loadConfig();
    
    // Should be able to retrieve the token
    const retrievedToken = configService.getGitHubToken();
    expect(retrievedToken).toEqual(token);
  });

  it('should clear configuration correctly', () => {
    // Set some configuration
    configService.setGitHubToken('test-token');
    configService.updateConfig({
      preferences: {
        theme: 'dark' as const,
        refreshInterval: 15000,
      },
    });

    // Clear the configuration
    configService.clearConfig();

    // Verify localStorage removeItem was called
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('dssp_config');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('github_token');

    // Config should be reset to defaults
    const config = configService.getConfig();
    expect(config).toEqual(DEFAULT_CONFIG);
    expect(configService.getGitHubToken()).toBeUndefined();
  });
});