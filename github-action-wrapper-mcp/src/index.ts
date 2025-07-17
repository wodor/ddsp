#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { analyzeGitHubAction } from './github-action-analyzer';
import { generateWrapperCode } from './code-generator';
import { AnalysisSchema, CodeGenerationSchema } from './schemas';

const server = new Server(
  {
    name: 'github-action-wrapper-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'analyze_github_action',
        description: 'Analyzes a GitHub Action and generates questions for wrapper configuration',
        inputSchema: {
          type: 'object',
          properties: {
            actionUrl: {
              type: 'string',
              description: 'GitHub Action URL (e.g., https://github.com/actions/checkout)',
            },
            version: {
              type: 'string',
              description: 'Action version/tag (e.g., v4, main)',
              default: 'main',
            },
          },
          required: ['actionUrl'],
        },
      },
      {
        name: 'generate_wrapper_code',
        description: 'Generates JavaScript wrapper code for a GitHub Action based on analysis and configuration',
        inputSchema: {
          type: 'object',
          properties: {
            actionUrl: {
              type: 'string',
              description: 'GitHub Action URL',
            },
            actionAnalysis: {
              type: 'object',
              description: 'Analysis result from analyze_github_action',
            },
            configuration: {
              type: 'object',
              description: 'Configuration answers based on the analysis questions',
              properties: {
                wrapperName: {
                  type: 'string',
                  description: 'Name for the wrapper function',
                },
                description: {
                  type: 'string',
                  description: 'Description of what the wrapper does',
                },
                inputMappings: {
                  type: 'object',
                  description: 'Mapping of action inputs to wrapper parameters',
                },
                outputMappings: {
                  type: 'object',
                  description: 'Mapping of action outputs to wrapper return values',
                },
                additionalOptions: {
                  type: 'object',
                  description: 'Additional configuration options',
                },
              },
              required: ['wrapperName', 'description'],
            },
          },
          required: ['actionUrl', 'actionAnalysis', 'configuration'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'analyze_github_action': {
        const validated = AnalysisSchema.parse(args);
        const result = await analyzeGitHubAction(validated.actionUrl, validated.version);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'generate_wrapper_code': {
        const validated = CodeGenerationSchema.parse(args);
        const result = await generateWrapperCode(
          validated.actionUrl,
          validated.actionAnalysis,
          validated.configuration
        );
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GitHub Action Wrapper MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
}); 