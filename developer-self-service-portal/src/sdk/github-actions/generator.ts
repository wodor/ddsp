/**
 * Utilities for generating action definitions and form components
 */
import type { ActionInput, CatalogAction } from '../../types/catalog';
import type { ActionGenerationOptions, ActionGenerationResult, ParsedWorkflowUrl, WorkflowMetadata } from './types';
import { EnhancedInputType, InputDataSource } from '../../services/actionCreator';
import { generateActionIdFromUrl } from './parser';

/**
 * Convert a string to PascalCase
 * @param str - The string to convert
 * @returns The PascalCase string
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[-_./]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert a string to kebab-case
 * @param str - The string to convert
 * @returns The kebab-case string
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_./]+/g, '-')
    .toLowerCase();
}

/**
 * Get a default value for an input based on its type
 * @param input - The input to get a default value for
 * @returns A string representation of the default value
 */
export function getDefaultValueForInput(input: ActionInput): string {
  if (input.default !== undefined) {
    if (input.type === 'boolean') {
      return input.default === 'true' ? 'true' : 'false';
    }
    return `"${input.default}"`;
  }
  
  if (input.type === 'boolean') return 'false';
  if (input.type === 'choice' && input.options && input.options.length > 0) {
    return `"${input.options[0]}"`;
  }
  return '""';
}

/**
 * Enhance inputs with UI components based on their type and name
 * @param inputs - The inputs to enhance
 * @returns The enhanced inputs
 */
export function enhanceInputs(inputs: ActionInput[]): ActionInput[] {
  return inputs.map(input => {
    const enhanced = { ...input };
    
    // Add enhanced UI based on input type and name
    if (input.type === 'choice' && input.options) {
      enhanced.enhanced = {
        type: EnhancedInputType.MULTI_SELECT,
        dataSource: InputDataSource.MANUAL
      };
    } else if (input.name.toLowerCase().includes('branch')) {
      enhanced.enhanced = {
        type: EnhancedInputType.BRANCH_SELECTOR,
        dataSource: InputDataSource.GITHUB_API,
        apiMethod: 'getBranches'
      };
    } else if (input.type === 'boolean') {
      enhanced.enhanced = {
        type: EnhancedInputType.CONDITIONAL,
        dataSource: InputDataSource.MANUAL
      };
    } else if (input.name.toLowerCase().includes('date')) {
      enhanced.enhanced = {
        type: EnhancedInputType.DATE_PICKER,
        dataSource: InputDataSource.MANUAL
      };
    } else if (input.name.toLowerCase().includes('duration')) {
      enhanced.enhanced = {
        type: EnhancedInputType.DURATION_SELECTOR,
        dataSource: InputDataSource.MANUAL
      };
    } else if (input.name.toLowerCase().includes('repo')) {
      enhanced.enhanced = {
        type: EnhancedInputType.REPOSITORY_SELECTOR,
        dataSource: InputDataSource.GITHUB_API,
        apiMethod: 'searchRepositories'
      };
    } else if (input.name.toLowerCase().includes('user')) {
      enhanced.enhanced = {
        type: EnhancedInputType.USER_SELECTOR,
        dataSource: InputDataSource.GITHUB_API,
        apiMethod: 'searchUsers'
      };
    }
    
    return enhanced;
  });
}

/**
 * Generate tags for an action based on its metadata
 * @param metadata - The workflow metadata
 * @returns An array of tags
 */
export function generateTags(metadata: WorkflowMetadata): string[] {
  const tags: string[] = ['github-action'];
  
  // Add tags based on the workflow name and description
  const nameWords = metadata.name.toLowerCase().split(/\s+/);
  const descWords = metadata.description.toLowerCase().split(/\s+/);
  
  // Common categories to look for
  const categories = [
    'deploy', 'build', 'test', 'release', 'publish', 'docker',
    'kubernetes', 'aws', 'azure', 'gcp', 'database', 'security'
  ];
  
  // Add matching categories as tags
  categories.forEach(category => {
    if (
      nameWords.includes(category) || 
      descWords.includes(category) ||
      metadata.name.toLowerCase().includes(category) ||
      metadata.description.toLowerCase().includes(category)
    ) {
      tags.push(category);
    }
  });
  
  // Add tags based on input names
  metadata.inputs.forEach(input => {
    const inputName = input.name.toLowerCase();
    if (inputName.includes('branch')) tags.push('branch');
    if (inputName.includes('version')) tags.push('version');
    if (inputName.includes('environment')) tags.push('environment');
    if (inputName.includes('deploy')) tags.push('deployment');
  });
  
  // Remove duplicates and return
  return [...new Set(tags)];
}

/**
 * Generate documentation for an action
 * @param metadata - The workflow metadata
 * @param urlComponents - The parsed workflow URL components
 * @returns Markdown documentation for the action
 */
export function generateDocumentation(
  metadata: WorkflowMetadata,
  urlComponents: ParsedWorkflowUrl
): string {
  const { owner, repo, path } = urlComponents;
  
  return `# ${metadata.name}

## Description
${metadata.description}

## Inputs

${metadata.inputs.map(input => `
### ${input.name}
- **Description**: ${input.description}
- **Required**: ${input.required ? 'Yes' : 'No'}
${input.default !== undefined ? `- **Default**: \`${input.default}\`` : ''}
${input.type ? `- **Type**: ${input.type}` : ''}
${input.options ? `- **Options**: ${input.options.join(', ')}` : ''}
`).join('\n')}

## Usage

This action is available in the Developer Self-Service Portal. To use it:

1. Navigate to the Actions page
2. Find "${metadata.name}" in the list
3. Fill in the required inputs
4. Click "Run Action"

## Source

This action is based on the GitHub workflow at:
\`${owner}/${repo}/${path}\`
`;
}

/**
 * Generate an action definition from workflow metadata
 * @param metadata - The workflow metadata
 * @param urlComponents - The parsed workflow URL components
 * @param options - Options for generating the action
 * @returns The generated action
 */
export function generateAction(
  metadata: WorkflowMetadata,
  urlComponents: ParsedWorkflowUrl,
  options: ActionGenerationOptions = {}
): CatalogAction {
  const { owner, repo, path } = urlComponents;
  
  // Generate a unique ID if not provided
  const id = options.id || generateActionIdFromUrl(`https://github.com/${owner}/${repo}/actions/workflows/${path.split('/').pop()}`) || '';
  
  // Enhance inputs with UI components
  const enhancedInputs = enhanceInputs(metadata.inputs);
  
  // Generate tags if not provided
  const tags = options.tags || generateTags(metadata);
  
  // Generate documentation if not provided
  const documentation = options.documentation || generateDocumentation(metadata, urlComponents);
  
  return {
    id,
    name: options.name || metadata.name,
    description: options.description || metadata.description,
    category: options.category || 'github-actions',
    repository: `${owner}/${repo}`,
    workflowPath: path,
    inputs: enhancedInputs,
    documentation,
    documentationUrl: options.documentationUrl,
    tags,
    featured: options.featured || false,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Generate TypeScript code for an action definition
 * @param action - The action to generate code for
 * @returns TypeScript code for the action definition
 */
export function generateActionDefinitionCode(action: CatalogAction): string {
  const actionName = toPascalCase(action.id);
  
  return `/**
 * ${action.name} action definition
 */
import type { CatalogAction } from '../types/catalog';
import { EnhancedInputType, InputDataSource } from '../services/actionCreator';

/**
 * ${action.description}
 */
export const ${actionName}Action: CatalogAction = ${JSON.stringify(action, null, 2)
    .replace(/"EnhancedInputType\.([A-Z_]+)"/g, 'EnhancedInputType.$1')
    .replace(/"InputDataSource\.([A-Z_]+)"/g, 'InputDataSource.$1')
    .replace(/"type":/g, 'type:')
    .replace(/"dataSource":/g, 'dataSource:')
    .replace(/"apiMethod":/g, 'apiMethod:')
    .replace(/"apiParams":/g, 'apiParams:')
    .replace(/"dependsOn":/g, 'dependsOn:')
    .replace(/"condition":/g, 'condition:')};
`;
}

/**
 * Generate TypeScript code for a form component
 * @param action - The action to generate a form component for
 * @param defaultBranch - The default branch to use when triggering the workflow
 * @returns TypeScript code for the form component
 */
export function generateFormComponentCode(action: CatalogAction, defaultBranch: string = 'main'): string {
  const componentName = `${toPascalCase(action.id)}Form`;
  const [owner, repo] = action.repository.split('/');
  
  return `import React, { useState } from 'react';
import { GitHubApiClient } from '../services/github';
import type { ActionInput } from '../types/catalog';
import BranchSelector from '../components/BranchSelector';
import RepositorySelector from '../components/RepositorySelector';
import UserSelector from '../components/UserSelector';
import DatePicker from '../components/DatePicker';
import DurationSelector from '../components/DurationSelector';
import { EnhancedInputType } from '../services/actionCreator';

interface ${componentName}Props {
  githubClient: GitHubApiClient;
  onSubmit?: (result: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Form component for the ${action.name} action
 */
const ${componentName}: React.FC<${componentName}Props> = ({
  githubClient,
  onSubmit,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ${action.inputs.map(input => `${input.name}: ${getDefaultValueForInput(input)}`).join(',\n    ')}
  });
  
  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await githubClient.triggerWorkflow(
        '${owner}',
        '${repo}',
        '${action.workflowPath}',
        '${defaultBranch}',
        formData
      );
      
      if (onSubmit) {
        onSubmit(result);
      }
    } catch (error) {
      console.error('Error triggering workflow:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const renderFormField = (input: ActionInput) => {
    const { name, description, required, type, options } = input;
    const enhanced = (input as any).enhanced;
    
    if (enhanced?.type === EnhancedInputType.BRANCH_SELECTOR) {
      return (
        <div className="form-field" key={name}>
          <label htmlFor={name}>{description}</label>
          <BranchSelector
            id={name}
            value={formData[name]}
            onChange={(value) => handleChange(name, value)}
            githubClient={githubClient}
            repository="${action.repository}"
            required={required}
          />
        </div>
      );
    }
    
    if (enhanced?.type === EnhancedInputType.REPOSITORY_SELECTOR) {
      return (
        <div className="form-field" key={name}>
          <label htmlFor={name}>{description}</label>
          <RepositorySelector
            id={name}
            value={formData[name]}
            onChange={(value) => handleChange(name, value)}
            githubClient={githubClient}
            required={required}
          />
        </div>
      );
    }
    
    if (enhanced?.type === EnhancedInputType.USER_SELECTOR) {
      return (
        <div className="form-field" key={name}>
          <label htmlFor={name}>{description}</label>
          <UserSelector
            id={name}
            value={formData[name]}
            onChange={(value) => handleChange(name, value)}
            githubClient={githubClient}
            required={required}
          />
        </div>
      );
    }
    
    if (enhanced?.type === EnhancedInputType.DATE_PICKER) {
      return (
        <div className="form-field" key={name}>
          <label htmlFor={name}>{description}</label>
          <DatePicker
            id={name}
            value={formData[name]}
            onChange={(value) => handleChange(name, value)}
            required={required}
          />
        </div>
      );
    }
    
    if (enhanced?.type === EnhancedInputType.DURATION_SELECTOR) {
      return (
        <div className="form-field" key={name}>
          <label htmlFor={name}>{description}</label>
          <DurationSelector
            id={name}
            value={formData[name]}
            onChange={(value) => handleChange(name, value)}
            options={options}
            required={required}
          />
        </div>
      );
    }
    
    if (type === 'boolean') {
      return (
        <div className="form-field checkbox-field" key={name}>
          <input
            type="checkbox"
            id={name}
            checked={formData[name] === 'true' || formData[name] === true}
            onChange={(e) => handleChange(name, e.target.checked)}
          />
          <label htmlFor={name}>{description}</label>
        </div>
      );
    }
    
    if (type === 'choice' && options) {
      return (
        <div className="form-field" key={name}>
          <label htmlFor={name}>{description}</label>
          <select
            id={name}
            value={formData[name]}
            onChange={(e) => handleChange(name, e.target.value)}
            required={required}
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }
    
    // Default to text input
    return (
      <div className="form-field" key={name}>
        <label htmlFor={name}>{description}</label>
        <input
          type="text"
          id={name}
          value={formData[name]}
          onChange={(e) => handleChange(name, e.target.value)}
          placeholder={description}
          required={required}
        />
      </div>
    );
  };
  
  return (
    <form onSubmit={handleSubmit} className="action-form">
      <h2>${action.name}</h2>
      <p>${action.description}</p>
      
      {${action.inputs.length > 0 ? 'action.inputs.map(renderFormField)' : '/* No inputs */'}}
      
      <div className="form-actions">
        <button type="submit" disabled={loading}>
          {loading ? 'Running...' : 'Run Action'}
        </button>
      </div>
    </form>
  );
};

export default ${componentName};
`;
}

/**
 * Generate TypeScript code for registering an action
 * @param action - The action to register
 * @returns TypeScript code for registering the action
 */
export function generateRegistrationCode(action: CatalogAction): string {
  const actionName = toPascalCase(action.id);
  const fileName = toKebabCase(action.id);
  
  return `// Import the action definition
import { ${actionName}Action } from './actions/${fileName}';

// Import the form component
import ${actionName}Form from './components/forms/${actionName}Form';

// Register the action in the catalog
catalogService.registerAction({
  ...${actionName}Action,
  formComponent: ${actionName}Form
});
`;
}

/**
 * Generate all code for an action
 * @param action - The action to generate code for
 * @param defaultBranch - The default branch to use when triggering the workflow
 * @returns All generated code for the action
 */
export function generateActionCode(
  action: CatalogAction,
  defaultBranch: string = 'main'
): ActionGenerationResult {
  return {
    action,
    actionDefinitionCode: generateActionDefinitionCode(action),
    formComponentCode: generateFormComponentCode(action, defaultBranch),
    registrationCode: generateRegistrationCode(action)
  };
}