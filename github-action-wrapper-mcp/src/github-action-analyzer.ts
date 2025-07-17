import axios from 'axios';
import * as yaml from 'yaml';
import type { GitHubActionMetadata, AnalysisResult, AnalysisQuestion } from './schemas';

/**
 * Fetches and analyzes a GitHub Action from its repository
 */
export async function analyzeGitHubAction(actionUrl: string, version: string = 'main'): Promise<AnalysisResult> {
  try {
    // Parse GitHub URL to extract owner/repo
    const { owner, repo } = parseGitHubUrl(actionUrl);
    
    // Fetch action.yml or action.yaml
    const actionMetadata = await fetchActionMetadata(owner, repo, version);
    
    // Generate analysis questions based on the action
    const questions = generateAnalysisQuestions(actionMetadata);
    
    return {
      name: actionMetadata.name,
      description: actionMetadata.description,
      inputs: actionMetadata.inputs || {},
      outputs: actionMetadata.outputs || {},
      questions,
      metadata: {
        actionUrl,
        version,
        runs: actionMetadata.runs,
      },
    };
  } catch (error) {
    throw new Error(`Failed to analyze GitHub Action: ${error instanceof Error ? error.message : String(error)}`);
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
 * Fetches action metadata from GitHub repository
 */
async function fetchActionMetadata(owner: string, repo: string, version: string): Promise<GitHubActionMetadata> {
  const possibleFiles = ['action.yml', 'action.yaml'];
  
  for (const filename of possibleFiles) {
    try {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${version}/${filename}`;
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'github-action-wrapper-mcp',
        },
      });
      
      const metadata = yaml.parse(response.data) as GitHubActionMetadata;
      
      // Validate required fields
      if (!metadata.name) {
        throw new Error('Action metadata missing required "name" field');
      }
      
      return metadata;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        continue; // Try next filename
      }
      throw error;
    }
  }
  
  throw new Error(`No action.yml or action.yaml found in ${owner}/${repo} at version ${version}`);
}

/**
 * Generates analysis questions based on action metadata
 */
function generateAnalysisQuestions(metadata: GitHubActionMetadata): AnalysisQuestion[] {
  const questions: AnalysisQuestion[] = [
    {
      id: 'wrapper_name',
      question: 'What should be the name of the wrapper function?',
      type: 'text',
      required: true,
      context: `Suggested name: ${generateSuggestedWrapperName(metadata.name)}`,
    },
    {
      id: 'wrapper_description',
      question: 'Provide a description for the wrapper function',
      type: 'text',
      required: true,
      context: `Original description: ${metadata.description || 'No description provided'}`,
    },
  ];

  // Add questions for inputs
  if (metadata.inputs && Object.keys(metadata.inputs).length > 0) {
    questions.push({
      id: 'input_handling',
      question: 'How should action inputs be handled?',
      type: 'select',
      options: [
        'Map all inputs as function parameters',
        'Group inputs into a configuration object',
        'Custom mapping (will be configured separately)',
      ],
      required: true,
    });

    // Ask about required vs optional inputs
    const requiredInputs = Object.entries(metadata.inputs)
      .filter(([_, input]) => input.required)
      .map(([name]) => name);
    
    if (requiredInputs.length > 0) {
      questions.push({
        id: 'required_inputs',
        question: 'Which required inputs should be mandatory in the wrapper?',
        type: 'multiselect',
        options: requiredInputs,
        required: false,
        context: 'These inputs are marked as required in the original action',
      });
    }
  }

  // Add questions for outputs
  if (metadata.outputs && Object.keys(metadata.outputs).length > 0) {
    questions.push({
      id: 'output_handling',
      question: 'How should action outputs be handled?',
      type: 'select',
      options: [
        'Return all outputs as an object',
        'Return specific outputs only',
        'Custom output processing',
      ],
      required: true,
    });
  }

  // Add questions about error handling
  questions.push({
    id: 'error_handling',
    question: 'What error handling strategy should be used?',
    type: 'select',
    options: [
      'Throw errors on action failure',
      'Return error information in response',
      'Custom error handling',
    ],
    required: true,
  });

  // Add questions about execution context
  questions.push({
    id: 'execution_context',
    question: 'What execution context is expected?',
    type: 'select',
    options: [
      'GitHub Actions workflow only',
      'Local development with act',
      'Both GitHub Actions and local',
      'Custom environment',
    ],
    required: true,
  });

  // Add questions about additional features
  questions.push({
    id: 'additional_features',
    question: 'What additional features should be included?',
    type: 'multiselect',
    options: [
      'Input validation',
      'Logging/debugging',
      'Retry logic',
      'Timeout handling',
      'Progress reporting',
      'Custom environment setup',
    ],
    required: false,
  });

  return questions;
}

/**
 * Generates a suggested wrapper function name from action name
 */
function generateSuggestedWrapperName(actionName: string): string {
  return actionName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_') + '_wrapper';
} 