# GitHub Action Wrapper MCP

A Model Context Protocol (MCP) server that analyzes GitHub Actions and generates JavaScript wrapper code for them.

## Overview

This MCP server provides tools to:

1. **Analyze GitHub Actions** - Parse action.yml/action.yaml files and generate configuration questions
2. **Generate Wrapper Code** - Create JavaScript wrapper functions based on analysis and configuration

## Features

- 🔍 **Smart Analysis** - Automatically extracts inputs, outputs, and metadata from GitHub Actions
- ❓ **Interactive Configuration** - Generates relevant questions based on action structure
- 🛠️ **Code Generation** - Creates production-ready JavaScript wrapper functions
- 📚 **Rich Documentation** - Generates JSDoc comments and usage examples
- 🎯 **Flexible Options** - Supports various input/output mapping strategies

## Installation

```bash
npm install
npm run build
```

## Development

```bash
npm run dev  # Watch mode for development
npm run lint # Run linting
```

## Usage

This is an MCP server that should be integrated with MCP-compatible clients. The server exposes two main tools:

### 1. analyze_github_action

Analyzes a GitHub Action and generates configuration questions.

**Parameters:**
- `actionUrl` (required): GitHub Action URL (e.g., "https://github.com/actions/checkout")
- `version` (optional): Action version/tag (default: "main")

**Example:**
```json
{
  "actionUrl": "https://github.com/actions/checkout",
  "version": "v4"
}
```

### 2. generate_wrapper_code

Generates JavaScript wrapper code based on analysis and configuration.

**Parameters:**
- `actionUrl` (required): GitHub Action URL
- `actionAnalysis` (required): Result from analyze_github_action
- `configuration` (required): Configuration object with answers to analysis questions

**Example:**
```json
{
  "actionUrl": "https://github.com/actions/checkout",
  "actionAnalysis": { /* result from analysis */ },
  "configuration": {
    "wrapperName": "checkout_wrapper",
    "description": "Checkout repository code",
    "inputMappings": {},
    "outputMappings": {},
    "additionalOptions": {
      "input_handling": "Map all inputs as function parameters",
      "error_handling": "Throw errors on action failure"
    }
  }
}
```

## Configuration Questions

The analyzer generates intelligent questions based on the GitHub Action structure:

- **Wrapper Function Name** - Suggested name for the wrapper function
- **Description** - Human-readable description
- **Input Handling Strategy** - How to map action inputs to function parameters
- **Output Handling** - How to process and return action outputs
- **Error Handling** - Strategy for handling action failures
- **Execution Context** - Expected runtime environment
- **Additional Features** - Optional enhancements like validation, logging, etc.

## Generated Code Features

The generated JavaScript wrappers include:

- ✅ **Type-safe parameters** based on action inputs
- ✅ **JSDoc documentation** with parameter and return type information
- ✅ **Environment variable mapping** for GitHub Actions compatibility
- ✅ **Error handling** based on configuration
- ✅ **Usage examples** showing how to call the wrapper
- ✅ **Optional features** like input validation, logging, and retry logic

## Example Generated Output

```javascript
/**
 * Checkout repository code
 * 
 * Wraps the GitHub Action: Checkout
 * Original description: Checkout a Git repository at a particular version
 * 
 * @param {string} repository - Repository name with owner. For example, actions/checkout (optional)
 * @param {string} ref - The branch, tag or SHA to checkout (optional)
 * @param {string} path - Relative path under $GITHUB_WORKSPACE to place the repository (optional)
 * @returns {Promise<Object>} Action result
 */
export async function checkout_wrapper(repository = undefined, ref = undefined, path = undefined) {
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
// const result = await checkout_wrapper('my-org/my-repo', 'main', './src');
```

## Architecture

```
src/
├── index.ts              # Main MCP server entry point
├── schemas.ts            # Zod schemas and TypeScript types
├── github-action-analyzer.ts  # GitHub Action analysis logic
└── code-generator.ts     # JavaScript code generation logic
```

## Future Enhancements

- 🤖 **LLM Integration** - Use Large Language Models for more sophisticated code generation
- 📝 **Template System** - Support for custom wrapper templates
- 🔄 **Multiple SDKs** - Generate wrappers for different platforms/languages
- 🧪 **Testing Support** - Generate test cases for wrapper functions
- 📊 **Analytics** - Track usage and wrapper effectiveness

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 