import type { McpConfig } from '../types/mcpConfig';
import mcpClient from './mcpClient';

// Define types for Node.js modules that may not be available in browser
type ChildProcess = any;

// Try to import Node.js modules if available
let spawn: any;
let path: any;
let fs: any;
let isNodeEnvironment = false;

try {
  // These imports will only work in a Node.js environment
  const childProcess = require('child_process');
  spawn = childProcess.spawn;
  path = require('path');
  fs = require('fs');
  isNodeEnvironment = true;
} catch (error) {
  // In browser environment, these modules won't be available
  console.log('Running in browser environment, server management will be simulated');
}

/**
 * Manager for the GitHub Action Wrapper MCP server process
 */
export class McpServerManager {
  private serverProcess: ChildProcess | null = null;
  private config: McpConfig | null = null;
  private isStarting: boolean = false;
  private mcpPath: string = isNodeEnvironment ? path.resolve(process.cwd(), '../github-action-wrapper-mcp') : '../github-action-wrapper-mcp';

  /**
   * Sets the configuration for the MCP server
   * @param config - The MCP configuration
   */
  public setConfig(config: McpConfig): void {
    this.config = config;
    mcpClient.setPort(config.mcpServer.port);
  }

  /**
   * Starts the MCP server
   * @returns A promise that resolves when the server is started
   */
  public async startServer(): Promise<void> {
    if (!this.config) {
      throw new Error('MCP configuration not set');
    }

    if (this.serverProcess) {
      console.log('MCP server is already running');
      return;
    }

    if (this.isStarting) {
      console.log('MCP server is already starting');
      return;
    }

    this.isStarting = true;

    try {
      // Check if the MCP server is already running
      const isRunning = await mcpClient.isServerRunning();
      if (isRunning) {
        console.log('MCP server is already running externally');
        this.isStarting = false;
        return;
      }

      // Handle differently based on environment
      if (isNodeEnvironment) {
        // Node.js environment - use real server process
        
        // Check if the MCP server exists
        if (!fs.existsSync(this.mcpPath)) {
          throw new Error(`MCP server not found at ${this.mcpPath}`);
        }

        // Start the MCP server
        console.log('Starting MCP server...');
        
        // Set environment variables for the MCP server
        const env = {
          ...process.env,
          PORT: String(this.config.mcpServer.port),
          AI_PROVIDER: this.config.aiProvider.name,
          AI_API_KEY: this.config.aiProvider.apiKey,
          AI_MODEL: this.config.aiProvider.model,
          OUTPUT_DIRECTORY: this.config.codeGeneration.outputDirectory,
        };

        // Start the server process
        this.serverProcess = spawn('npm', ['start'], {
          cwd: this.mcpPath,
          env,
          stdio: 'pipe',
        });

        // Handle server output
        this.serverProcess.stdout?.on('data', (data) => {
          console.log(`MCP server: ${data}`);
        });

        this.serverProcess.stderr?.on('data', (data) => {
          console.error(`MCP server error: ${data}`);
        });

        // Handle server exit
        this.serverProcess.on('exit', (code) => {
          console.log(`MCP server exited with code ${code}`);
          this.serverProcess = null;
        });
      } else {
        // Browser environment - simulate server process
        console.log('Simulating MCP server start in browser environment');
        
        // Create a mock server process object
        this.serverProcess = {
          kill: () => {
            console.log('Simulated MCP server stopped');
            this.serverProcess = null;
          }
        };
        
        // Simulate server startup delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock the server as running
        mcpClient.mockServerRunning(true);
      }

      // Wait for the server to start
      await this.waitForServer();
      console.log('MCP server started successfully');
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      throw new Error(
        `Failed to start MCP server: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * Stops the MCP server
   */
  public stopServer(): void {
    if (!this.serverProcess) {
      console.log('MCP server is not running');
      return;
    }

    console.log('Stopping MCP server...');
    this.serverProcess.kill();
    this.serverProcess = null;
    
    // If in browser environment, update the mock state
    if (!isNodeEnvironment) {
      mcpClient.mockServerRunning(false);
    }
  }

  /**
   * Waits for the MCP server to start
   * @param maxAttempts - Maximum number of attempts to check if the server is running
   * @param interval - Interval between attempts in milliseconds
   * @returns A promise that resolves when the server is running
   */
  private async waitForServer(maxAttempts: number = 30, interval: number = 500): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const isRunning = await mcpClient.isServerRunning();
      if (isRunning) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error('Timed out waiting for MCP server to start');
  }

  /**
   * Checks if the MCP server is installed
   * @returns True if the server is installed, false otherwise
   */
  public isServerInstalled(): boolean {
    if (isNodeEnvironment) {
      return fs.existsSync(this.mcpPath);
    } else {
      // In browser environment, assume the server is installed
      return true;
    }
  }

  /**
   * Gets the path to the MCP server
   * @returns The path to the MCP server
   */
  public getMcpPath(): string {
    return this.mcpPath;
  }

  /**
   * Sets the path to the MCP server
   * @param path - The path to the MCP server
   */
  public setMcpPath(path: string): void {
    this.mcpPath = path;
  }
}

// Create a singleton instance
const mcpServerManager = new McpServerManager();
export default mcpServerManager;