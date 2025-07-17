import axios from 'axios';
import type { ActionAnalysisResult, WrapperConfiguration } from '../types/mcpConfig';

/**
 * Client for communicating with the GitHub Action Wrapper MCP server
 */
export class McpClient {
  private baseUrl: string;

  /**
   * Creates a new MCP client
   * @param port - The port the MCP server is running on
   */
  constructor(port: number = 3100) {
    this.baseUrl = `http://localhost:${port}`;
  }

  /**
   * Checks if the MCP server is running
   * @returns True if the server is running, false otherwise
   */
  public async isServerRunning(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/health`, { timeout: 1000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Analyzes a GitHub Action
   * @param actionUrl - The URL of the GitHub Action to analyze
   * @param version - The version of the GitHub Action to analyze
   * @returns The analysis result
   */
  public async analyzeGitHubAction(
    actionUrl: string,
    version: string = 'main'
  ): Promise<ActionAnalysisResult> {
    try {
      const response = await axios.post(`${this.baseUrl}/tools/analyze_github_action`, {
        actionUrl,
        version,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to analyze GitHub Action:', error);
      throw new Error(
        `Failed to analyze GitHub Action: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Generates wrapper code for a GitHub Action
   * @param actionUrl - The URL of the GitHub Action
   * @param actionAnalysis - The analysis result from analyzeGitHubAction
   * @param configuration - The configuration for the wrapper
   * @returns The generated wrapper code
   */
  public async generateWrapperCode(
    actionUrl: string,
    actionAnalysis: ActionAnalysisResult,
    configuration: WrapperConfiguration
  ): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/tools/generate_wrapper_code`, {
        actionUrl,
        actionAnalysis,
        configuration,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to generate wrapper code:', error);
      throw new Error(
        `Failed to generate wrapper code: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Sets the port for the MCP server
   * @param port - The port to use
   */
  public setPort(port: number): void {
    this.baseUrl = `http://localhost:${port}`;
  }
}

// Create a singleton instance
const mcpClient = new McpClient();
export default mcpClient;