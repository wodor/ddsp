# GitHub Action Integration Guide for LLMs

This guide explains how to create wrappers around GitHub Actions for the Developer Self-Service Portal. As an LLM, you'll be given a GitHub Action URL and need to generate the necessary code to integrate it into the system.

## Overview

When a developer provides a GitHub Action URL, your task is to:
1. Parse the workflow file to extract inputs and metadata
2. Create a properly formatted action definition
3. Generate a user-friendly form component for the action
4. Provide integration code to connect the form with the GitHub API

## Step-by-Step Process

### Step 1: Parse the GitHub Workflow URL

```typescript
// Input: GitHub workflow URL (e.g., https://github.com/owner/repo/actions/workflows/workflow.yml)
const url = "https://github.com/owner/repo/actions/workflows/workflow.yml";

// Use our utility to extract components from the URL
const urlComponents = parseGitHubWorkflowUrl(url);
if (!urlComponents) {
  throw new Error("Invalid GitHub workflow URL");
}

const { owner, repo, path } = urlComponents;
```

### Step 2: Fetch and Parse the Workflow File

```typescript
// Fetch the workflow file content using the GitHub API
const workflowContent = await githubClient.getFileContent(owner, repo, path);

// Extract metadata from the workflow file
const metadata = extractWorkflowMetadata(workflowContent);
if (!metadata) {
  throw new Error("Failed to extract metadata from workflow file");
}

// Check if the workflow has a workflow_dispatch trigger
if (!metadata.hasDispatchTrigger) {
  throw new Error("This workflow does not have a workflow_dispatch trigger and cannot be used as an action");
}
```

### Step 3: Generate an Action Definition

```typescript
// Generate an action from the metadata
const action = generateAction(metadata, urlComponents, {
  category: "github-actions", // Categorize appropriately
  featured: false
});

// Generate code for the action
const { actionDefinitionCode, formComponentCode, registrationCode } = generateActionCode(action);
```

## Code Generation Templates

### Action Definition Template

```typescript
/**
 * ${action.name} action definition
 */
import type { CatalogAction } from '../types/catalog';
import { EnhancedInputType, InputDataSource } from '../services/actionCreator';

/**
 * ${action.description}
 */
export const ${pascalCase(action.id)}Action: CatalogAction = {
  id: "${action.id}",
  name: "${action.name}",
  description: "${action.description}",
  category: "${action.category}",
  repository: "${action.repository}",
  workflowPath: "${action.workflowPath}",
  inputs: [
    ${action.inputs.map(input => generateInputCode(input)).join(',\n    ')}
  ],
  documentation: `${action.documentation}`,
  tags: [${action.tags.map(tag => `"${tag}"`).join(', ')}],
  featured: ${action.featured},
  lastUpdated: "${action.lastUpdated}"
};
```

### Form Component Template

```typescript
import React, { useState } from 'react';
import { GitHubApiClient } from '../services/github';
import type { ActionInput } from '../types/catalog';
import BranchSelector from '../components/BranchSelector';
import RepositorySelector from '../components/RepositorySelector';
import UserSelector from '../components/UserSelector';
import DatePicker from '../components/DatePicker';
import DurationSelector from '../components/DurationSelector';
import { EnhancedInputType } from '../services/actionCreator';

interface ${pascalCase(action.id)}FormProps {
  githubClient: GitHubApiClient;
  onSubmit?: (result: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Form component for the ${action.name} action
 */
const ${pascalCase(action.id)}Form: React.FC<${pascalCase(action.id)}FormProps> = ({
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
        'main', // You might want to make this configurable
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
  
  return (
    <form onSubmit={handleSubmit} className="action-form">
      <h2>${action.name}</h2>
      <p>${action.description}</p>
      
      {action.inputs.map(input => renderFormField(input))}
      
      <div className="form-actions">
        <button type="submit" disabled={loading}>
          {loading ? 'Running...' : 'Run Action'}
        </button>
      </div>
    </form>
  );
};

export default ${pascalCase(action.id)}Form;
```

### Registration Code Template

```typescript
// Import the action definition
import { ${pascalCase(action.id)}Action } from './actions/${kebabCase(action.id)}';

// Import the form component
import ${pascalCase(action.id)}Form from './components/forms/${pascalCase(action.id)}Form';

// Register the action in the catalog
catalogService.registerAction({
  ...${pascalCase(action.id)}Action,
  formComponent: ${pascalCase(action.id)}Form
});
```

## Helper Functions

### Input Type Detection

Automatically enhance inputs based on their name and type:

```typescript
function enhanceInput(input) {
  const name = input.name.toLowerCase();
  const enhanced = { ...input };
  
  if (input.type === 'choice' && input.options) {
    enhanced.enhanced = {
      type: EnhancedInputType.MULTI_SELECT,
      dataSource: InputDataSource.MANUAL
    };
  } else if (name.includes('branch')) {
    enhanced.enhanced = {
      type: EnhancedInputType.BRANCH_SELECTOR,
      dataSource: InputDataSource.GITHUB_API,
      apiMethod: 'getBranches'
    };
  } else if (name.includes('repo')) {
    enhanced.enhanced = {
      type: EnhancedInputType.REPOSITORY_SELECTOR,
      dataSource: InputDataSource.GITHUB_API,
      apiMethod: 'searchRepositories'
    };
  } else if (name.includes('user')) {
    enhanced.enhanced = {
      type: EnhancedInputType.USER_SELECTOR,
      dataSource: InputDataSource.GITHUB_API,
      apiMethod: 'searchUsers'
    };
  } else if (name.includes('date')) {
    enhanced.enhanced = {
      type: EnhancedInputType.DATE_PICKER,
      dataSource: InputDataSource.MANUAL
    };
  } else if (name.includes('duration')) {
    enhanced.enhanced = {
      type: EnhancedInputType.DURATION_SELECTOR,
      dataSource: InputDataSource.MANUAL
    };
  } else if (input.type === 'boolean') {
    enhanced.enhanced = {
      type: EnhancedInputType.CONDITIONAL,
      dataSource: InputDataSource.MANUAL
    };
  }
  
  return enhanced;
}
```

### Form Field Rendering

Generate appropriate form fields based on input type:

```typescript
function renderFormField(input) {
  const { name, description, required, type, options } = input;
  const enhanced = input.enhanced;
  
  if (enhanced?.type === EnhancedInputType.BRANCH_SELECTOR) {
    return `
      <BranchSelector
        id="${name}"
        label="${description}"
        value={formData.${name}}
        onChange={(value) => handleChange('${name}', value)}
        githubClient={githubClient}
        repository="${repository}"
        required={${required}}
      />
    `;
  }
  
  if (enhanced?.type === EnhancedInputType.REPOSITORY_SELECTOR) {
    return `
      <RepositorySelector
        id="${name}"
        label="${description}"
        value={formData.${name}}
        onChange={(value) => handleChange('${name}', value)}
        githubClient={githubClient}
        required={${required}}
      />
    `;
  }
  
  if (type === 'boolean') {
    return `
      <Checkbox
        id="${name}"
        label="${description}"
        checked={formData.${name}}
        onChange={(e) => handleChange('${name}', e.target.checked)}
      />
    `;
  }
  
  if (type === 'choice' && options) {
    return `
      <Select
        id="${name}"
        label="${description}"
        value={formData.${name}}
        onChange={(e) => handleChange('${name}', e.target.value)}
        required={${required}}
        options={[${options.map(opt => `{ value: "${opt}", label: "${opt}" }`).join(', ')}]}
      />
    `;
  }
  
  // Default to text input
  return `
    <TextInput
      id="${name}"
      label="${description}"
      value={formData.${name}}
      onChange={(e) => handleChange('${name}', e.target.value)}
      placeholder="${description}"
      required={${required}}
    />
  `;
}
```

### Documentation Generation

Generate documentation for the action:

```typescript
function generateDocumentation(metadata, urlComponents) {
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
```

## Response Format

When a developer provides a GitHub workflow URL, respond with:

```
I've generated the integration code for the GitHub Action at [URL].

## Action Definition
Save this to `src/actions/[action-id].ts`:

```typescript
// Action definition code
```

## Form Component
Save this to `src/components/forms/[ActionId]Form.tsx`:

```typescript
// Form component code
```

## Registration
Add this to your catalog registration file:

```typescript
// Registration code
```

## Next Steps
1. Make sure you have the required UI components (BranchSelector, etc.)
2. Add the registration code to your catalog
3. Test the action in the Developer Self-Service Portal
```

## Error Handling

Handle these common error scenarios:

1. **Invalid URL**: "The provided URL is not a valid GitHub workflow URL. Please provide a URL in the format `https://github.com/{owner}/{repo}/actions/workflows/{filename}` or `https://github.com/{owner}/{repo}/blob/{branch}/{path}`."

2. **No workflow_dispatch trigger**: "The workflow at the provided URL does not have a `workflow_dispatch` trigger, which is required for integration with the Developer Self-Service Portal. Only workflows that can be manually triggered can be integrated."

3. **API access error**: "Unable to access the workflow file. Please ensure that the GitHub token has the necessary permissions to access this repository."

4. **Parsing error**: "Failed to parse the workflow file. Please ensure that it is a valid GitHub Actions workflow YAML file."

## Example

### Input
```
Please create a wrapper for this GitHub Action: https://github.com/owner/repo/actions/workflows/deploy.yml
```

### Output
```
I've generated the integration code for the GitHub Action at https://github.com/owner/repo/actions/workflows/deploy.yml.

## Action Definition
Save this to `src/actions/owner-repo-deploy.ts`:

```typescript
/**
 * Deploy to Production action definition
 */
import type { CatalogAction } from '../types/catalog';
import { EnhancedInputType, InputDataSource } from '../services/actionCreator';

/**
 * Deploys the application to the production environment
 */
export const OwnerRepoDeployAction: CatalogAction = {
  id: "owner-repo-deploy",
  name: "Deploy to Production",
  description: "Deploys the application to the production environment",
  category: "deployment",
  repository: "owner/repo",
  workflowPath: ".github/workflows/deploy.yml",
  inputs: [
    {
      name: "branch",
      description: "Branch to deploy",
      required: true,
      default: "main",
      enhanced: {
        type: EnhancedInputType.BRANCH_SELECTOR,
        dataSource: InputDataSource.GITHUB_API,
        apiMethod: "getBranches"
      }
    },
    {
      name: "environment",
      description: "Environment to deploy to",
      required: true,
      type: "choice",
      options: ["staging", "production"],
      default: "staging",
      enhanced: {
        type: EnhancedInputType.MULTI_SELECT,
        dataSource: InputDataSource.MANUAL
      }
    }
  ],
  documentation: `# Deploy to Production

## Description
Deploys the application to the production environment

## Inputs

### branch
- **Description**: Branch to deploy
- **Required**: Yes
- **Default**: \`main\`

### environment
- **Description**: Environment to deploy to
- **Required**: Yes
- **Type**: choice
- **Options**: staging, production
- **Default**: \`staging\`

## Usage

This action is available in the Developer Self-Service Portal. To use it:

1. Navigate to the Actions page
2. Find "Deploy to Production" in the list
3. Fill in the required inputs
4. Click "Run Action"

## Source

This action is based on the GitHub workflow at:
\`owner/repo/.github/workflows/deploy.yml\`
`,
  tags: ["deployment", "production", "branch"],
  featured: false,
  lastUpdated: "2025-07-16T21:15:00.000Z"
};
```

## Form Component
Save this to `src/components/forms/OwnerRepoDeployForm.tsx`:

```typescript
import React, { useState } from 'react';
import { GitHubApiClient } from '../services/github';
import type { ActionInput } from '../types/catalog';
import BranchSelector from '../components/BranchSelector';
import { EnhancedInputType } from '../services/actionCreator';

interface OwnerRepoDeployFormProps {
  githubClient: GitHubApiClient;
  onSubmit?: (result: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Form component for the Deploy to Production action
 */
const OwnerRepoDeployForm: React.FC<OwnerRepoDeployFormProps> = ({
  githubClient,
  onSubmit,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    branch: "main",
    environment: "staging"
  });
  
  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await githubClient.triggerWorkflow(
        'owner',
        'repo',
        '.github/workflows/deploy.yml',
        'main',
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
  
  return (
    <form onSubmit={handleSubmit} className="action-form">
      <h2>Deploy to Production</h2>
      <p>Deploys the application to the production environment</p>
      
      <div className="form-field">
        <label htmlFor="branch">Branch to deploy</label>
        <BranchSelector
          id="branch"
          value={formData.branch}
          onChange={(value) => handleChange('branch', value)}
          githubClient={githubClient}
          repository="owner/repo"
          required={true}
        />
      </div>
      
      <div className="form-field">
        <label htmlFor="environment">Environment to deploy to</label>
        <select
          id="environment"
          value={formData.environment}
          onChange={(e) => handleChange('environment', e.target.value)}
          required={true}
        >
          <option value="staging">staging</option>
          <option value="production">production</option>
        </select>
      </div>
      
      <div className="form-actions">
        <button type="submit" disabled={loading}>
          {loading ? 'Running...' : 'Run Action'}
        </button>
      </div>
    </form>
  );
};

export default OwnerRepoDeployForm;
```

## Registration
Add this to your catalog registration file:

```typescript
// Import the action definition
import { OwnerRepoDeployAction } from './actions/owner-repo-deploy';

// Import the form component
import OwnerRepoDeployForm from './components/forms/OwnerRepoDeployForm';

// Register the action in the catalog
catalogService.registerAction({
  ...OwnerRepoDeployAction,
  formComponent: OwnerRepoDeployForm
});
```

## Next Steps
1. Make sure you have the required UI components (BranchSelector, etc.)
2. Add the registration code to your catalog
3. Test the action in the Developer Self-Service Portal
```

Remember to adapt the generated code to the specific requirements of the GitHub Action and the Developer Self-Service Portal.