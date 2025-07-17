import { DEFAULT_MCP_CONFIG, type McpConfig } from '../types/mcpConfig';

/**
 * Service for managing MCP configuration
 */
export class McpConfigService {
  private static readonly CONFIG_KEY = 'dssp_mcp_config';
  private config: McpConfig;

  /**
   * Creates a new MCP configuration service
   */
  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Loads the MCP configuration from local storage
   * @returns The loaded configuration or the default configuration if none exists
   */
  private loadConfig(): McpConfig {
    try {
      const storedConfig = localStorage.getItem(McpConfigService.CONFIG_KEY);
      if (storedConfig) {
        return JSON.parse(storedConfig) as McpConfig;
      }
    } catch (error) {
      console.error('Failed to load MCP configuration:', error);
    }
    return { ...DEFAULT_MCP_CONFIG };
  }

  /**
   * Saves the MCP configuration to local storage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(McpConfigService.CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save MCP configuration:', error);
    }
  }

  /**
   * Gets the current MCP configuration
   * @returns The current configuration
   */
  public getConfig(): McpConfig {
    return { ...this.config };
  }

  /**
   * Updates the MCP configuration
   * @param config - The new configuration
   */
  public updateConfig(config: Partial<McpConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      mcpServer: {
        ...this.config.mcpServer,
        ...(config.mcpServer || {}),
      },
      aiProvider: {
        ...this.config.aiProvider,
        ...(config.aiProvider || {}),
      },
      codeGeneration: {
        ...this.config.codeGeneration,
        ...(config.codeGeneration || {}),
      },
    };
    this.saveConfig();
  }

  /**
   * Updates the AI provider configuration
   * @param provider - The provider name
   * @param apiKey - The API key
   * @param model - The model name
   */
  public updateAiProvider(
    provider: 'openai' | 'anthropic',
    apiKey: string,
    model: string
  ): void {
    this.config.aiProvider = {
      name: provider,
      apiKey,
      model,
    };
    this.saveConfig();
  }

  /**
   * Updates the MCP server configuration
   * @param enabled - Whether the server is enabled
   * @param autoStart - Whether to automatically start the server
   * @param port - The port to run the server on
   */
  public updateServerConfig(enabled: boolean, autoStart: boolean, port: number): void {
    this.config.mcpServer = {
      enabled,
      autoStart,
      port,
    };
    this.saveConfig();
  }

  /**
   * Updates the code generation configuration
   * @param outputDirectory - The directory to output generated code to
   * @param errorHandling - The error handling strategy
   * @param inputValidation - Whether to validate inputs
   * @param logging - Whether to include logging
   */
  public updateCodeGenConfig(
    outputDirectory: string,
    errorHandling: 'throw' | 'return',
    inputValidation: boolean,
    logging: boolean
  ): void {
    this.config.codeGeneration = {
      outputDirectory,
      defaultErrorHandling: errorHandling,
      defaultInputValidation: inputValidation,
      defaultLogging: logging,
    };
    this.saveConfig();
  }

  /**
   * Resets the configuration to default values
   */
  public resetConfig(): void {
    this.config = { ...DEFAULT_MCP_CONFIG };
    this.saveConfig();
  }
}

// Create a singleton instance
const mcpConfigService = new McpConfigService();
export default mcpConfigService;