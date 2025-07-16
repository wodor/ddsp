/**
 * Configuration types for the Developer Self-Service Portal
 */

/**
 * Application configuration
 */
export interface AppConfig {
  /** GitHub personal access token */
  githubToken?: string;
  /** User preferences */
  preferences: UserPreferences;
}

/**
 * User preferences
 */
export interface UserPreferences {
  /** UI theme (light or dark) */
  theme: 'light' | 'dark';
  /** Refresh interval for workflow status updates (in milliseconds) */
  refreshInterval: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: AppConfig = {
  preferences: {
    theme: 'light',
    refreshInterval: 5000,
  },
};