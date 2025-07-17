# Usage Example

This document shows how to use the GitHub Action Wrapper MCP server.

## Step 1: Analyze a GitHub Action

First, analyze a GitHub Action to understand its structure and generate configuration questions.

**Input:**
```json
{
  "tool": "analyze_github_action",
  "arguments": {
    "actionUrl": "https://github.com/actions/checkout",
    "version": "v4"
  }
}
```

**Expected Output:**
```json
{
  "name": "Checkout",
  "description": "Checkout a Git repository at a particular version",
  "inputs": {
    "repository": {
      "description": "Repository name with owner. For example, actions/checkout",
      "default": "${{ github.repository }}"
    },
    "ref": {
      "description": "The branch, tag or SHA to checkout. When checking out the repository that triggered a workflow, this defaults to the reference or SHA for that event.",
      "default": ""
    },
    "path": {
      "description": "Relative path under $GITHUB_WORKSPACE to place the repository",
      "default": ""
    }
  },
  "outputs": {},
  "questions": [
    {
      "id": "wrapper_name",
      "question": "What should be the name of the wrapper function?",
      "type": "text",
      "required": true,
      "context": "Suggested name: checkout_wrapper"
    },
    {
      "id": "wrapper_description",
      "question": "Provide a description for the wrapper function",
      "type": "text",
      "required": true,
      "context": "Original description: Checkout a Git repository at a particular version"
    },
    {
      "id": "input_handling",
      "question": "How should action inputs be handled?",
      "type": "select",
      "options": [
        "Map all inputs as function parameters",
        "Group inputs into a configuration object",
        "Custom mapping (will be configured separately)"
      ],
      "required": true
    },
    {
      "id": "error_handling",
      "question": "What error handling strategy should be used?",
      "type": "select",
      "options": [
        "Throw errors on action failure",
        "Return error information in response",
        "Custom error handling"
      ],
      "required": true
    }
  ],
  "metadata": {
    "actionUrl": "https://github.com/actions/checkout",
    "version": "v4",
    "runs": {
      "using": "node20",
      "main": "dist/index.js"
    }
  }
}
```

## Step 2: Configure and Generate Wrapper Code

Based on the analysis questions, provide configuration and generate the wrapper code.

**Input:**
```json
{
  "tool": "generate_wrapper_code",
  "arguments": {
    "actionUrl": "https://github.com/actions/checkout",
    "actionAnalysis": {
      // ... (result from step 1)
    },
    "configuration": {
      "wrapperName": "checkoutRepository",
      "description": "Checkout a Git repository at a particular version with enhanced error handling",
      "inputMappings": {
        "repository": "repo",
        "ref": "branch",
        "path": "outputPath"
      },
      "outputMappings": {},
      "additionalOptions": {
        "input_handling": "Map all inputs as function parameters",
        "error_handling": "Throw errors on action failure",
        "execution_context": "GitHub Actions workflow only",
        "additional_features": ["Input validation", "Logging/debugging"]
      }
    }
  }
}
```

**Expected Output:**
```javascript
/**
 * Checkout a Git repository at a particular version with enhanced error handling
 * 
 * Wraps the GitHub Action: Checkout
 * Original description: Checkout a Git repository at a particular version
 * 
 * @param {string} repository - Repository name with owner. For example, actions/checkout (optional)
 * @param {string} ref - The branch, tag or SHA to checkout (optional)
 * @param {string} path - Relative path under $GITHUB_WORKSPACE to place the repository (optional)
 * @returns {Promise<Object>} Action result
 */
export async function checkoutRepository(repository = "${{ github.repository }}", ref = undefined, path = undefined) {
  // Input validation
  validateInputs(arguments[0]);

  // Debug logging
  console.log('Executing actions/checkout@v4 with inputs:', arguments[0]);

  // Setup environment variables for GitHub Action
  const actionInputs = {};
  actionInputs['INPUT_REPOSITORY'] = repository || '';
  actionInputs['INPUT_REF'] = ref || '';
  actionInputs['INPUT_PATH'] = path || '';

  // Set environment variables
  Object.assign(process.env, actionInputs);

  // Execute Node.js-based action
  return await executeNodeAction('actions/checkout@v4', actionInputs);
}

// Usage example:
// const result = await checkoutRepository('my-org/my-repo', 'main', './source');
```

## Integration with MCP Client

To use this MCP server with an MCP client:

1. Build the server: `npm run build`
2. Start the server: `npm start`
3. Connect your MCP client to the server
4. Use the exposed tools to analyze and generate wrapper code

## Example Workflow

1. **Analyze** a GitHub Action to understand its inputs/outputs
2. **Review** the generated questions and determine configuration
3. **Generate** the wrapper code with your preferred settings
4. **Copy** the generated JavaScript code to your project
5. **Customize** the execution functions (`executeNodeAction`, etc.) for your environment

## Next Steps

- Implement the execution functions (`executeNodeAction`, `executeDockerAction`, etc.)
- Add LLM integration for more sophisticated code generation
- Create templates for different wrapper patterns
- Add testing utilities for generated wrappers 