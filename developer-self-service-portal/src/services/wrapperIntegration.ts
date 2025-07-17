import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { ActionAnalysisResult, WrapperConfiguration } from '../types/mcpConfig';
import mcpConfigService from './mcpConfig';
import catalogService from './catalog';
import type { ActionDefinition } from '../types/catalog';

/**
 * Service for integrating generated wrappers into the application
 */
export class WrapperIntegrationService {
  /**
   * Saves a generated wrapper to the file system
   * @param code - The generated wrapper code
   * @param actionUrl - The URL of the GitHub Action
   * @param actionAnalysis - The analysis result
   * @param configuration - The wrapper configuration
   * @returns The path to the saved file
   */
  public async saveWrapperCode(
    code: string,
    actionUrl: string,
    actionAnalysis: ActionAnalysisResult,
    configuration: WrapperConfiguration
  ): Promise<string> {
    const config = mcpConfigService.getConfig();
    const outputDir = config.codeGeneration.outputDirectory;
    
    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate a filename based on the wrapper name
    const filename = this.generateFilename(configuration.wrapperName);
    const filePath = path.join(outputDir, filename);
    
    // Write the code to the file
    fs.writeFileSync(filePath, code, 'utf-8');
    
    console.log(`Saved wrapper code to ${filePath}`);
    return filePath;
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
    // Create an action definition for the catalog
    const actionDefinition: ActionDefinition = {
      id: uuidv4(),
      name: configuration.wrapperName,
      description: configuration.description,
      category: 'Generated',
      repository: this.extractRepositoryFromUrl(actionUrl),
      workflowPath: filePath,
      inputs: this.convertInputs(actionAnalysis.inputs),
      documentation: this.generateDocumentation(actionAnalysis, configuration),
      generatedBy: 'mcp',
      generationMetadata: {
        timestamp: new Date().toISOString(),
        mcpVersion: '1.0.0',
        actionUrl,
        actionVersion: actionAnalysis.metadata.version,
      },
    };
    
    // Add the action to the catalog
    await catalogService.addAction(actionDefinition);
    
    console.log(`Registered wrapper with catalog: ${actionDefinition.id}`);
    return actionDefinition.id;
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
  
  /**
   * Converts action inputs to catalog input format
   * @param inputs - The action inputs
   * @returns The converted inputs
   */
  private convertInputs(inputs: ActionAnalysisResult['inputs']): any[] {
    return Object.entries(inputs).map(([name, input]) => ({
      name,
      description: input.description || '',
      required: input.required || false,
      default: input.default || '',
      type: input.type || 'string',
    }));
  }
  
  /**
   * Generates documentation for a wrapper
   * @param actionAnalysis - The analysis result
   * @param configuration - The wrapper configuration
   * @returns The generated documentation
   */
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
}

// Create a singleton instance
const wrapperIntegrationService = new WrapperIntegrationService();
export default wrapperIntegrationService;