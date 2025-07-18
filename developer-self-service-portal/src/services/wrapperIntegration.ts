import { v4 as uuidv4 } from 'uuid';
import type { ActionAnalysisResult, WrapperConfiguration } from '../types/mcpConfig';
import mcpConfigService from './mcpConfig';
import catalogService from './catalog';
import type { ActionDefinition } from '../types/catalog';

// Use dynamic imports for Node.js modules to handle browser environment
let fs: any;
let path: any;

// Try to import Node.js modules if available
try {
  // These imports will only work in a Node.js environment
  fs = require('fs');
  path = require('path');
} catch (error) {
  // In browser environment, these modules won't be available
  console.log('Running in browser environment, file system operations will be simulated');
}

/**
 * Service for integrating generated wrappers into the application
 */
export class WrapperIntegrationService {
  /**
   * Saves a generated wrapper to the file system
   * @param code - The generated wrapper code
   * @param configuration - The wrapper configuration
   * @returns The path to the saved file
   */
  public async saveWrapperCode(
    code: string,
    configuration: WrapperConfiguration
  ): Promise<string> {
    const config = mcpConfigService.getConfig();
    const outputDir = config.codeGeneration.outputDirectory;
    
    // Generate a filename based on the wrapper name
    const filename = this.generateFilename(configuration.wrapperName);
    
    // Handle file system operations differently based on environment
    if (fs && path) {
      // Node.js environment - use real file system
      try {
        // Create the output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const filePath = path.join(outputDir, filename);
        
        // Write the code to the file
        fs.writeFileSync(filePath, code, 'utf-8');
        
        console.log(`Saved wrapper code to ${filePath}`);
        return filePath;
      } catch (error) {
        console.error('Error saving wrapper code to file system:', error);
        // Fall back to browser storage if file system operations fail
        return this.saveWrapperCodeInBrowser(code, filename);
      }
    } else {
      // Browser environment - use localStorage or other browser storage
      return this.saveWrapperCodeInBrowser(code, filename);
    }
  }
  
  /**
   * Saves wrapper code in browser environment
   * @param code - The generated wrapper code
   * @param filename - The filename for the wrapper
   * @returns The virtual path to the saved file
   */
  private saveWrapperCodeInBrowser(code: string, filename: string): string {
    const config = mcpConfigService.getConfig();
    const outputDir = config.codeGeneration.outputDirectory;
    
    // Create a virtual path - ensure it starts with './'
    const virtualPath = outputDir.startsWith('./') 
      ? `${outputDir}/${filename}`
      : `./${outputDir}/${filename}`;
    
    // Store the code in localStorage with the virtual path as the key
    try {
      // Use a prefix to avoid collisions with other localStorage items
      const storageKey = `dssp_wrapper_${virtualPath}`;
      localStorage.setItem(storageKey, code);
      
      // Also store a list of all wrappers for easier retrieval
      const wrappersList = JSON.parse(localStorage.getItem('dssp_wrappers_list') || '[]');
      if (!wrappersList.includes(virtualPath)) {
        wrappersList.push(virtualPath);
        localStorage.setItem('dssp_wrappers_list', JSON.stringify(wrappersList));
      }
      
      console.log(`Saved wrapper code to ${virtualPath}`);
      return virtualPath;
    } catch (error) {
      console.error('Error saving wrapper code to browser storage:', error);
      // If localStorage fails (e.g., quota exceeded), return a temporary path
      return outputDir.startsWith('./') 
        ? `${outputDir}/${filename}`
        : `./${outputDir}/${filename}`;
    }
  }
  
  /**
   * Retrieves wrapper code from storage
   * @param filePath - The path to the wrapper file
   * @returns The wrapper code or null if not found
   */
  public getWrapperCode(filePath: string): string | null {
    // First try to get from browser storage
    try {
      const storageKey = `dssp_wrapper_${filePath}`;
      const code = localStorage.getItem(storageKey);
      if (code) {
        return code;
      }
    } catch (error) {
      console.error('Error retrieving wrapper code from browser storage:', error);
    }
    
    // If not found in browser storage and fs is available, try file system
    if (fs && path) {
      try {
        if (fs.existsSync(filePath)) {
          return fs.readFileSync(filePath, 'utf-8');
        }
      } catch (error) {
        console.error('Error retrieving wrapper code from file system:', error);
      }
    }
    
    return null;
  }
  
  /**
   * Lists all saved wrappers
   * @returns Array of wrapper file paths
   */
  public listWrappers(): string[] {
    // First try to get from browser storage
    try {
      const wrappersList = JSON.parse(localStorage.getItem('dssp_wrappers_list') || '[]');
      return wrappersList;
    } catch (error) {
      console.error('Error retrieving wrappers list from browser storage:', error);
    }
    
    // If not found in browser storage and fs is available, try file system
    if (fs && path) {
      try {
        const config = mcpConfigService.getConfig();
        const outputDir = config.codeGeneration.outputDirectory;
        
        if (fs.existsSync(outputDir)) {
          return fs.readdirSync(outputDir)
            .filter((file: string) => file.endsWith('.js'))
            .map((file: string) => path.join(outputDir, file));
        }
      } catch (error) {
        console.error('Error listing wrappers from file system:', error);
      }
    }
    
    return [];
  }
  
  /**
   * Creates an ActionDefinition from analysis result and configuration
   * @param actionUrl - The URL of the GitHub Action
   * @param actionAnalysis - The analysis result
   * @param configuration - The wrapper configuration
   * @param filePath - The path to the saved wrapper file
   * @returns The ActionDefinition object
   */
  public createActionDefinition(
    actionUrl: string,
    actionAnalysis: ActionAnalysisResult,
    configuration: WrapperConfiguration,
    filePath: string
  ): ActionDefinition {
    return {
      id: uuidv4(),
      name: configuration.wrapperName,
      description: configuration.description,
      repository: this.extractRepositoryFromUrl(actionUrl),
      wrapperPath: filePath,
      originalActionUrl: actionAnalysis.metadata.actionUrl,
      inputs: actionAnalysis.inputs,
      outputs: actionAnalysis.outputs,
      generationMetadata: {
        timestamp: new Date().toISOString(),
        mcpVersion: '1.0.0', // This should be dynamically determined in a real implementation
        actionVersion: actionAnalysis.metadata.version
      }
    };
  }

  /**
   * Registers a wrapper with the action catalog
   * @param actionUrl - The URL of the GitHub Action
   * @param actionAnalysis - The analysis result
   * @param configuration - The wrapper configuration
   * @param filePath - The path to the saved wrapper file
   * @returns The ID of the registered action
   */
  public async registerWithCatalog(
    actionUrl: string,
    actionAnalysis: ActionAnalysisResult,
    configuration: WrapperConfiguration,
    filePath: string
  ): Promise<string> {
    try {
      // Create an action definition
      const actionDefinition = this.createActionDefinition(
        actionUrl,
        actionAnalysis,
        configuration,
        filePath
      );
      
      // Add the action definition to the catalog
      const actionId = await catalogService.addActionDefinition(actionDefinition);
      
      console.log(`Successfully registered wrapper with catalog: ${actionId}`);
      return actionId;
    } catch (error) {
      console.error('Failed to register wrapper with catalog:', error);
      throw new Error(`Failed to register wrapper with catalog: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Generates a filename for a wrapper
   * @param wrapperName - The name of the wrapper
   * @returns A filename for the wrapper
   */
  private generateFilename(wrapperName: string): string {
    const sanitized = wrapperName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${sanitized}.js`;
  }
  
  /**
   * Extracts the repository name from a GitHub URL
   * @param url - The GitHub URL
   * @returns The repository name
   */
  private extractRepositoryFromUrl(url: string): string {
    const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
    return match ? match[1] : 'unknown';
  }
  
  // Note: These methods are kept for future use but marked as commented to avoid unused warnings
  /*
  private convertInputs(inputs: ActionAnalysisResult['inputs']): any[] {
    return Object.entries(inputs).map(([name, input]) => ({
      name,
      description: input.description || '',
      required: input.required || false,
      default: input.default || '',
      type: input.type || 'string',
    }));
  }
  
  private generateDocumentation(
    actionAnalysis: ActionAnalysisResult,
    configuration: WrapperConfiguration
  ): string {
    return `# ${configuration.wrapperName}

${configuration.description}

## Original Action

This wrapper is based on the GitHub Action: [${actionAnalysis.name}](${actionAnalysis.metadata.actionUrl})

${actionAnalysis.description}

## Inputs

${Object.entries(actionAnalysis.inputs)
  .map(([name, input]) => {
    const required = input.required ? '(Required)' : '(Optional)';
    const defaultValue = input.default ? `Default: \`${input.default}\`` : '';
    return `- **${name}** ${required}: ${input.description || 'No description'} ${defaultValue}`;
  })
  .join('\n')}

## Outputs

${
  Object.keys(actionAnalysis.outputs).length > 0
    ? Object.entries(actionAnalysis.outputs)
        .map(([name, output]) => `- **${name}**: ${output.description || 'No description'}`)
        .join('\n')
    : 'This action does not define any outputs.'
}

## Generated by MCP

This wrapper was automatically generated by the GitHub Action Wrapper MCP.
`;
  }
  */
  
  /**
   * Handles the complete integration workflow
   * @param actionUrl - The URL of the GitHub Action
   * @param actionAnalysis - The analysis result
   * @param wrapperConfig - The wrapper configuration
   * @param generatedCode - The generated wrapper code
   * @returns The ID of the registered action
   */
  public async integrateWrapper(
    actionUrl: string,
    actionAnalysis: ActionAnalysisResult,
    wrapperConfig: WrapperConfiguration,
    generatedCode: string
  ): Promise<string> {
    try {
      // Step 1: Save the wrapper code to the file system
      const filePath = await this.saveWrapperCode(generatedCode, wrapperConfig);
      
      // Step 2: Register the wrapper with the action catalog
      const actionId = await this.registerWithCatalog(
        actionUrl,
        actionAnalysis,
        wrapperConfig,
        filePath
      );
      
      return actionId;
    } catch (error) {
      console.error('Failed to integrate wrapper:', error);
      throw new Error(`Failed to integrate wrapper: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Create a singleton instance
const wrapperIntegrationService = new WrapperIntegrationService();
export default wrapperIntegrationService;