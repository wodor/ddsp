# GitHub Actions SDK

This SDK provides utilities for integrating GitHub Actions into the Developer Self-Service Portal. It simplifies the process of creating action definitions, form components, and registration code.

## Overview

The SDK consists of three main modules:

1. **Types**: Type definitions for the SDK
2. **Parser**: Utilities for parsing GitHub workflow URLs and files
3. **Generator**: Utilities for generating action definitions and form components

## Quick Start

Here's how to use the SDK to integrate a GitHub Action:

```typescript
import { GitHubApiClient } from '../../services/github';
import { fetchWorkflowMetadataFromUrl, parseGitHubWorkflowUrl } from './parser';
import { generateAction, generateActionCode } from './generator';

async function integrateGitHubAction(url: string, githubToken: string) {
  // Create a GitHub API client
  const githubClient = new GitHubApiClient(githubToken);
  
  // Fetch workflow metadata from the URL
  const metadata = await fetchWorkflowMetadataFromUrl(url, githubClient);
  if (!metadata) {
    throw new Error('Failed to fetch workflow metadata');
  }
  
  // Parse the URL to get owner, repo, and path
  const urlComponents = parseGitHubWorkflowUrl(url);
  if (!urlComponents) {
    throw new Error('Invalid GitHub workflow URL');
  }
  
  // Generate an action from the metadata
  const action = generateAction(metadata, urlComponents, {
    category: 'deployment',
    featured: true,
    defaultBranch: 'main'
  });
  
  // Generate code for the action
  const { actionDefinitionCode, formComponentCode, registrationCode } = generateActionCode(action);
  
  // Now you can save these files to your project
  console.log('Action Definition:', actionDefinitionCode);
  console.log('Form Component:', formComponentCode);
  console.log('Registration Code:', registrationCode);
  
  return {
    action,
    actionDefinitionCode,
    formComponentCode,
    registrationCode
  };
}
```

## API Reference

### Parser Module

#### `parseGitHubWorkflowUrl(url: string): ParsedWorkflowUrl | null`

Parses a GitHub workflow URL and extracts the owner, repo, and path.

```typescript
const urlComponents = parseGitHubWorkflowUrl('https://github.com/owner/repo/actions/workflows/workflow.yml');
// { owner: 'owner', repo: 'repo', path: '.github/workflows/workflow.yml' }
```

#### `fetchWorkflowMetadataFromUrl(url: string, githubClient: GitHubApiClient): Promise<WorkflowMetadata | null>`

Fetches workflow metadata from a GitHub URL.

```typescript
const metadata = await fetchWorkflowMetadataFromUrl(
  'https://github.com/owner/repo/actions/workflows/workflow.yml',
  githubClient
);
```

#### `generateActionIdFromUrl(url: string): string | null`

Generates a unique ID from a GitHub workflow URL.

```typescript
const id = generateActionIdFromUrl('https://github.com/owner/repo/actions/workflows/workflow.yml');
// 'owner-repo-workflow'
```

### Generator Module

#### `generateAction(metadata: WorkflowMetadata, urlComponents: ParsedWorkflowUrl, options?: ActionGenerationOptions): CatalogAction`

Generates an action definition from workflow metadata.

```typescript
const action = generateAction(metadata, urlComponents, {
  category: 'deployment',
  featured: true
});
```

#### `generateActionCode(action: CatalogAction, defaultBranch?: string): ActionGenerationResult`

Generates all code for an action.

```typescript
const { actionDefinitionCode, formComponentCode, registrationCode } = generateActionCode(action, 'main');
```

#### Helper Functions

- `toPascalCase(str: string): string`: Converts a string to PascalCase
- `toKebabCase(str: string): string`: Converts a string to kebab-case
- `getDefaultValueForInput(input: ActionInput): string`: Gets a default value for an input
- `enhanceInputs(inputs: ActionInput[]): ActionInput[]`: Enhances inputs with UI components
- `generateTags(metadata: WorkflowMetadata): string[]`: Generates tags for an action
- `generateDocumentation(metadata: WorkflowMetadata, urlComponents: ParsedWorkflowUrl): string`: Generates documentation for an action
- `generateActionDefinitionCode(action: CatalogAction): string`: Generates TypeScript code for an action definition
- `generateFormComponentCode(action: CatalogAction, defaultBranch?: string): string`: Generates TypeScript code for a form component
- `generateRegistrationCode(action: CatalogAction): string`: Generates TypeScript code for registering an action

## Example: Integrating a GitHub Action

Here's a complete example of how to integrate a GitHub Action:

```typescript
import { GitHubApiClient } from '../../services/github';
import { fetchWorkflowMetadataFromUrl, parseGitHubWorkflowUrl } from '../sdk/github-actions/parser';
import { generateAction, generateActionCode } from '../sdk/github-actions/generator';
import fs from 'fs';
import path from 'path';

async function integrateGitHubAction(url: string, githubToken: string) {
  // Create a GitHub API client
  const githubClient = new GitHubApiClient(githubToken);
  
  // Fetch workflow metadata from the URL
  const metadata = await fetchWorkflowMetadataFromUrl(url, githubClient);
  if (!metadata) {
    throw new Error('Failed to fetch workflow metadata');
  }
  
  // Parse the URL to get owner, repo, and path
  const urlComponents = parseGitHubWorkflowUrl(url);
  if (!urlComponents) {
    throw new Error('Invalid GitHub workflow URL');
  }
  
  // Generate an action from the metadata
  const action = generateAction(metadata, urlComponents, {
    category: 'deployment',
    featured: true
  });
  
  // Generate code for the action
  const { actionDefinitionCode, formComponentCode, registrationCode } = generateActionCode(action);
  
  // Create directories if they don't exist
  const actionsDir = path.join(__dirname, '../../actions');
  const formsDir = path.join(__dirname, '../../components/forms');
  
  if (!fs.existsSync(actionsDir)) {
    fs.mkdirSync(actionsDir, { recursive: true });
  }
  
  if (!fs.existsSync(formsDir)) {
    fs.mkdirSync(formsDir, { recursive: true });
  }
  
  // Write files
  fs.writeFileSync(
    path.join(actionsDir, `${action.id}.ts`),
    actionDefinitionCode
  );
  
  fs.writeFileSync(
    path.join(formsDir, `${action.id}Form.tsx`),
    formComponentCode
  );
  
  console.log('Action integrated successfully!');
  console.log('Action Definition:', path.join(actionsDir, `${action.id}.ts`));
  console.log('Form Component:', path.join(formsDir, `${action.id}Form.tsx`));
  console.log('Registration Code:');
  console.log(registrationCode);
  
  return {
    action,
    actionDefinitionCode,
    formComponentCode,
    registrationCode
  };
}

// Example usage
integrateGitHubAction(
  'https://github.com/arbor-education/sis/actions/workflows/deploy_test_branch.yaml',
  'your-github-token'
);
```

## For LLMs: How to Generate GitHub Action Integration Code

When a developer provides a GitHub Action URL, follow these steps:

1. **Parse the URL** to extract owner, repo, and path
2. **Fetch the workflow metadata** using the GitHub API
3. **Generate an action definition** using the metadata
4. **Generate form component code** for the action
5. **Generate registration code** for the action
6. **Provide instructions** on where to place the generated files

Here's a template for responding to a developer's request:

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

Remember to handle errors gracefully and provide helpful error messages if the workflow cannot be parsed or doesn't have a workflow_dispatch trigger.