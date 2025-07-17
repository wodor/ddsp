/**
 * Types for MCP configuration and communication
 */

/**
 * MCP server configuration
 */
export interface McpServerConfig {
  enabled: boolean;
  autoStart: boolean;
  port: number;
}

/**
 * AI provider configuration
 */
export interface AiProviderConfig {
  name: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
}

/**
 * Code generation configuration
 */
export interface CodeGenerationConfig {
  outputDirectory: string;
  defaultErrorHandling: 'throw' | 'return';
  defaultInputValidation: boolean;
  defaultLogging: boolean;
}

/**
 * Complete MCP configuration
 */
export interface McpConfig {
  mcpServer: McpServerConfig;
  aiProvider: AiProviderConfig;
  codeGeneration: CodeGenerationConfig;
}

/**
 * Default MCP configuration
 */
export const DEFAULT_MCP_CONFIG: McpConfig = {
  mcpServer: {
    enabled: true,
    autoStart: true,
    port: 3100,
  },
  aiProvider: {
    name: 'openai',
    apiKey: '',
    model: 'gpt-4',
  },
  codeGeneration: {
    outputDirectory: './src/actions',
    defaultErrorHandling: 'throw',
    defaultInputValidation: true,
    defaultLogging: false,
  },
};

/**
 * GitHub Action analysis result
 */
export interface ActionAnalysisResult {
  name: string;
  description: string;
  inputs: Record<string, {
    description?: string;
    required?: boolean;
    default?: string;
    type?: string;
  }>;
  outputs: Record<string, {
    description?: string;
    value?: string;
  }>;
  questions: Array<{
    id: string;
    question: string;
    type: 'text' | 'boolean' | 'select' | 'multiselect';
    options?: string[];
    required: boolean;
    context?: string;
  }>;
  metadata: {
    actionUrl: string;
    version: string;
    runs: {
      using: string;
      main?: string;
      pre?: string;
      post?: string;
      args?: string[];
      entrypoint?: string;
      image?: string;
    };
  };
}

/**
 * Configuration for code generation
 */
export interface WrapperConfiguration {
  wrapperName: string;
  description: string;
  inputMappings?: Record<string, any>;
  outputMappings?: Record<string, any>;
  additionalOptions?: Record<string, any>;
}