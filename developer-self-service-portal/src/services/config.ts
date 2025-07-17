import type { AppConfig } from '../types/config';
import { DEFAULT_CONFIG } from '../types/config';

/**
 * Configuration storage service for the Developer Self-Service Portal
 * Handles saving and loading configuration from local storage
 * Includes encryption for sensitive data like GitHub tokens
 */
class ConfigService {
  private readonly STORAGE_KEY = 'dssp_config';
  private readonly TOKEN_KEY = 'github_token';
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from local storage
   * @returns The loaded configuration or default if none exists
   */
  private loadConfig(): AppConfig {
    try {
      const storedConfig = localStorage.getItem(this.STORAGE_KEY);
      if (!storedConfig) {
        return { ...DEFAULT_CONFIG };
      }

      const parsedConfig = JSON.parse(storedConfig) as Partial<AppConfig>;
      
      // Merge with default config to ensure all fields exist
      const config: AppConfig = {
        ...DEFAULT_CONFIG,
        ...parsedConfig,
        preferences: {
          ...DEFAULT_CONFIG.preferences,
          ...(parsedConfig.preferences || {}),
        },
      };

      // Load encrypted token if it exists
      const encryptedToken = localStorage.getItem(this.TOKEN_KEY);
      if (encryptedToken) {
        config.githubToken = this.decryptToken(encryptedToken);
      }

      return config;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      return { ...DEFAULT_CONFIG };
    }
  }

  /**
   * Save configuration to local storage
   * Sensitive data like GitHub token is stored separately with encryption
   */
  private saveConfig(): void {
    try {
      // Create a copy of the config without the token
      const configToSave = { 
        ...this.config,
        githubToken: undefined 
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configToSave));
      
      // Save token separately with encryption if it exists
      if (this.config.githubToken) {
        const encryptedToken = this.encryptToken(this.config.githubToken);
        localStorage.setItem(this.TOKEN_KEY, encryptedToken);
      } else {
        localStorage.removeItem(this.TOKEN_KEY);
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }

  /**
   * Get the current configuration
   * @returns The current configuration
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Update the configuration
   * @param config New configuration to merge with existing
   */
  updateConfig(config: Partial<AppConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      preferences: {
        ...this.config.preferences,
        ...(config.preferences || {}),
      },
    };
    this.saveConfig();
  }

  /**
   * Get the GitHub token
   * @returns The GitHub token or undefined if not set
   */
  getGitHubToken(): string | undefined {
    return this.config.githubToken;
  }

  /**
   * Set the GitHub token
   * @param token The GitHub token to store
   */
  setGitHubToken(token: string | undefined): void {
    this.config.githubToken = token;
    this.saveConfig();
  }

  /**
   * Clear all configuration and reset to defaults
   */
  clearConfig(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * Encrypt a token for secure storage
   * @param token The token to encrypt
   * @returns The encrypted token
   */
  private encryptToken(token: string): string {
    // Simple XOR encryption with a random key
    // In a production environment, consider using the Web Crypto API for stronger encryption
    const key = this.generateEncryptionKey();
    const encrypted = this.xorEncrypt(token, key);
    
    // Store the key and encrypted data together
    // Format: base64(key):base64(encrypted)
    return `${btoa(key)}:${btoa(encrypted)}`;
  }

  /**
   * Decrypt a token from secure storage
   * @param encryptedData The encrypted token
   * @returns The decrypted token
   */
  private decryptToken(encryptedData: string): string {
    try {
      // Split the key and encrypted data
      const [keyBase64, dataBase64] = encryptedData.split(':');
      if (!keyBase64 || !dataBase64) {
        throw new Error('Invalid encrypted data format');
      }

      const key = atob(keyBase64);
      const data = atob(dataBase64);
      
      // Decrypt using the same XOR function (it's symmetric)
      return this.xorEncrypt(data, key);
    } catch (error) {
      console.error('Failed to decrypt token:', error);
      return '';
    }
  }

  /**
   * Generate a random encryption key
   * @returns A random encryption key
   */
  private generateEncryptionKey(): string {
    // Generate a random string to use as the encryption key
    const length = 32;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * XOR encrypt/decrypt a string with a key
   * @param text The text to encrypt/decrypt
   * @param key The encryption key
   * @returns The encrypted/decrypted text
   */
  private xorEncrypt(text: string, key: string): string {
    let result = '';
    
    for (let i = 0; i < text.length; i++) {
      // XOR each character with the corresponding character in the key
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    
    return result;
  }
}

// Export a singleton instance
export const configService = new ConfigService();