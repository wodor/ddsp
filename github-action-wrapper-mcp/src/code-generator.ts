import type { AnalysisResult } from './schemas';

/**
 * Configuration for code generation
 */
interface CodeGenerationConfig {
  wrapperName: string;
  description: string;
  inputMappings?: Record<string, any>;
  outputMappings?: Record<string, any>;
  additionalOptions?: Record<string, any>;
}

/**
 * Generates JavaScript wrapper code for a GitHub Action
 */
export async function generateWrapperCode(
  actionUrl: string,
  actionAnalysis: AnalysisResult,
  configuration: CodeGenerationConfig
): Promise<string> {
  try {
    // Extract repository information
    const { owner, repo } = parseGitHubUrl(actionUrl);
    const actionRef = `${owner}/${repo}@${actionAnalysis.metadata.version}`;
    
    // Generate the wrapper code based on configuration
    const code = await generateJavaScriptWrapper({
      actionRef,
      actionAnalysis,
      configuration,
    });
    
    return code;
  } catch (error) {
    throw new Error(`Failed to generate wrapper code: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parses a GitHub URL to extract owner and repository name
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub URL format');
  }
  
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''), // Remove .git suffix if present
  };
}

/**
 * Generates JavaScript wrapper code
 */
async function generateJavaScriptWrapper({
  actionRef,
  actionAnalysis,
  configuration,
}: {
  actionRef: string;
  actionAnalysis: AnalysisResult;
  configuration: CodeGenerationConfig;
}): Promise<string> {
  const { wrapperName, description } = configuration;
  
  // Generate function parameters based on inputs
  const parameters = generateParameters(actionAnalysis, configuration);
  
  // Generate function body
  const functionBody = generateFunctionBody(actionRef, actionAnalysis, configuration);
  
  // Generate JSDoc documentation
  const jsDoc = generateJSDoc(actionAnalysis, configuration);
  
  // Combine everything into the final wrapper
  const wrapperCode = `${jsDoc}
export async function ${wrapperName}(${parameters.join(', ')}) {
${functionBody}
}

// Usage example:
// ${generateUsageExample(wrapperName, actionAnalysis, configuration)}
`;

  return wrapperCode;
}

/**
 * Generates function parameters
 */
function generateParameters(actionAnalysis: AnalysisResult, configuration: CodeGenerationConfig): string[] {
  const params: string[] = [];
  
  // Check if we should group inputs into a configuration object
  const inputHandling = configuration.additionalOptions?.input_handling || 'Map all inputs as function parameters';
  
  if (inputHandling === 'Group inputs into a configuration object') {
    params.push('options = {}');
  } else {
    // Map inputs as individual parameters
    Object.entries(actionAnalysis.inputs).forEach(([inputName, inputConfig]) => {
      const isRequired = inputConfig.required || false;
      const hasDefault = inputConfig.default !== undefined;
      
      if (isRequired && !hasDefault) {
        params.push(inputName);
      } else {
        const defaultValue = inputConfig.default ? JSON.stringify(inputConfig.default) : 'undefined';
        params.push(`${inputName} = ${defaultValue}`);
      }
    });
  }
  
  // Add additional options parameter if needed
  if (configuration.additionalOptions?.additional_features?.includes('Custom environment setup')) {
    params.push('environment = {}');
  }
  
  return params;
}

/**
 * Generates the function body
 */
function generateFunctionBody(
  actionRef: string,
  actionAnalysis: AnalysisResult,
  configuration: CodeGenerationConfig
): string {
  const lines: string[] = [];
  
  // Add input validation if requested
  if (configuration.additionalOptions?.additional_features?.includes('Input validation')) {
    lines.push('  // Input validation');
    lines.push('  validateInputs(arguments[0]);');
    lines.push('');
  }
  
  // Add logging if requested
  if (configuration.additionalOptions?.additional_features?.includes('Logging/debugging')) {
    lines.push('  // Debug logging');
    lines.push(`  console.log('Executing ${actionRef} with inputs:', arguments[0]);`);
    lines.push('');
  }
  
  // Setup environment variables for action inputs
  lines.push('  // Setup environment variables for GitHub Action');
  lines.push('  const actionInputs = {};');
  
  Object.keys(actionAnalysis.inputs).forEach((inputName) => {
    const envVarName = `INPUT_${inputName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    lines.push(`  actionInputs['${envVarName}'] = ${inputName} || '';`);
  });
  
  lines.push('');
  lines.push('  // Set environment variables');
  lines.push('  Object.assign(process.env, actionInputs);');
  lines.push('');
  
  // Execute the action
  if (actionAnalysis.metadata.runs.using === 'docker') {
    lines.push('  // Execute Docker-based action');
    lines.push(`  return await executeDockerAction('${actionRef}', actionInputs);`);
  } else if (actionAnalysis.metadata.runs.using === 'node20' || actionAnalysis.metadata.runs.using === 'node16') {
    lines.push('  // Execute Node.js-based action');
    lines.push(`  return await executeNodeAction('${actionRef}', actionInputs);`);
  } else {
    lines.push('  // Execute composite action');
    lines.push(`  return await executeCompositeAction('${actionRef}', actionInputs);`);
  }
  
  return lines.join('\n');
}

/**
 * Generates JSDoc documentation
 */
function generateJSDoc(actionAnalysis: AnalysisResult, configuration: CodeGenerationConfig): string {
  const lines: string[] = [];
  
  lines.push('/**');
  lines.push(` * ${configuration.description}`);
  lines.push(` * `);
  lines.push(` * Wraps the GitHub Action: ${actionAnalysis.name}`);
  
  if (actionAnalysis.description) {
    lines.push(` * Original description: ${actionAnalysis.description}`);
  }
  
  lines.push(` * `);
  
  // Document parameters
  Object.entries(actionAnalysis.inputs).forEach(([inputName, inputConfig]) => {
    const type = inputConfig.type || 'string';
    const description = inputConfig.description || 'No description available';
    const required = inputConfig.required ? '' : ' (optional)';
    lines.push(` * @param {${type}} ${inputName} - ${description}${required}`);
  });
  
  // Document return value
  if (Object.keys(actionAnalysis.outputs).length > 0) {
    lines.push(` * @returns {Promise<Object>} Action outputs:`);
    Object.entries(actionAnalysis.outputs).forEach(([outputName, outputConfig]) => {
      const description = outputConfig.description || 'No description available';
      lines.push(` *   - ${outputName}: ${description}`);
    });
  } else {
    lines.push(` * @returns {Promise<Object>} Action result`);
  }
  
  lines.push(` */`);
  
  return lines.join('\n');
}

/**
 * Generates a usage example
 */
function generateUsageExample(
  wrapperName: string,
  actionAnalysis: AnalysisResult,
  configuration: CodeGenerationConfig
): string {
  const exampleInputs: string[] = [];
  
  Object.entries(actionAnalysis.inputs).forEach(([inputName, inputConfig]) => {
    const exampleValue = inputConfig.default || (inputConfig.type === 'boolean' ? 'true' : "'example-value'");
    exampleInputs.push(`${inputName}: ${exampleValue}`);
  });
  
  if (exampleInputs.length === 0) {
    return `const result = await ${wrapperName}();`;
  }
  
  const inputHandling = configuration.additionalOptions?.input_handling || 'Map all inputs as function parameters';
  
  if (inputHandling === 'Group inputs into a configuration object') {
    return `const result = await ${wrapperName}({ ${exampleInputs.join(', ')} });`;
  } else {
    return `const result = await ${wrapperName}(${exampleInputs.map(input => input.split(':')[1].trim()).join(', ')});`;
  }
}

/**
 * Placeholder for LLM-based code generation
 * This will be implemented later to use an actual LLM for more sophisticated code generation
 */
async function generateLLMEnhancedWrapper(
  actionRef: string,
  actionAnalysis: AnalysisResult,
  configuration: CodeGenerationConfig,
  examples: string[]
): Promise<string> {
  // TODO: Implement LLM-based code generation
  // This will use the examples provided by the user and generate more sophisticated wrapper code
  
  const prompt = `
Generate a JavaScript wrapper function for the GitHub Action "${actionRef}".

Action Details:
- Name: ${actionAnalysis.name}
- Description: ${actionAnalysis.description}
- Inputs: ${JSON.stringify(actionAnalysis.inputs, null, 2)}
- Outputs: ${JSON.stringify(actionAnalysis.outputs, null, 2)}

Configuration:
${JSON.stringify(configuration, null, 2)}

Examples to follow:
${examples.join('\n\n')}

Generate a complete, production-ready JavaScript wrapper function that follows the patterns shown in the examples.
`;

  // For now, return a placeholder - this will be replaced with actual LLM integration
  return `// TODO: LLM-generated code will be placed here\n// Prompt: ${prompt}`;
} 