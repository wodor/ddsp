/**
 * Utility for parsing GitHub workflow YAML files
 */
import { parse } from 'yaml';
import type { ActionInput } from '../types/catalog';

/**
 * Represents the structure of a GitHub workflow file
 */
export interface WorkflowFile {
  name: string;
  on: {
    workflow_dispatch?: {
      inputs?: Record<string, WorkflowInput>;
    };
    [key: string]: any;
  };
  jobs: Record<string, any>;
  [key: string]: any;
}

/**
 * Represents an input parameter in a GitHub workflow file
 */
export interface WorkflowInput {
  description?: string;
  required?: boolean;
  default?: string | boolean | number;
  type?: string;
  options?: string[];
}

/**
 * Parse a GitHub workflow YAML file
 * @param yamlContent - The content of the workflow YAML file
 * @returns The parsed workflow file
 */
export function parseWorkflowYaml(yamlContent: string): WorkflowFile | null {
  try {
    const parsedYaml = parse(yamlContent) as WorkflowFile;
    return parsedYaml;
  } catch (error) {
    console.error('Failed to parse workflow YAML:', error);
    return null;
  }
}

/**
 * Extract workflow dispatch inputs from a workflow file
 * @param workflow - The parsed workflow file
 * @returns Array of action inputs
 */
export function extractWorkflowInputs(workflow: WorkflowFile): ActionInput[] {
  if (!workflow.on?.workflow_dispatch?.inputs) {
    return [];
  }

  const inputs = workflow.on.workflow_dispatch.inputs;
  return Object.entries(inputs).map(([name, input]) => {
    // Convert GitHub workflow input to our ActionInput format
    const actionInput: ActionInput = {
      name,
      description: input.description || '',
      required: input.required || false,
      type: input.type || 'string',
    };

    // Add default value if present
    if (input.default !== undefined) {
      actionInput.default = String(input.default);
    }

    // Add options if present
    if (input.options) {
      actionInput.options = input.options;
    }

    return actionInput;
  });
}

/**
 * Extract workflow name from a workflow file
 * @param workflow - The parsed workflow file
 * @returns The workflow name
 */
export function extractWorkflowName(workflow: WorkflowFile): string {
  return workflow.name || 'Unnamed Workflow';
}

/**
 * Extract workflow description from a workflow file
 * This is a heuristic since GitHub workflows don't have a dedicated description field
 * @param workflow - The parsed workflow file
 * @returns The workflow description
 */
export function extractWorkflowDescription(workflow: WorkflowFile): string {
  // Look for comments at the top of the file or use the name as a fallback
  // This is a simplified approach - in a real implementation, you might
  // parse the original YAML to extract comments
  return workflow.name || 'No description available';
}

/**
 * Parse a GitHub workflow YAML file and extract inputs
 * @param yamlContent - The content of the workflow YAML file
 * @returns The extracted inputs or null if parsing failed
 */
export function extractInputsFromYaml(yamlContent: string): ActionInput[] | null {
  const workflow = parseWorkflowYaml(yamlContent);
  if (!workflow) {
    return null;
  }
  
  return extractWorkflowInputs(workflow);
}

/**
 * Check if a workflow file has workflow_dispatch trigger
 * @param workflow - The parsed workflow file
 * @returns Whether the workflow has workflow_dispatch trigger
 */
export function hasWorkflowDispatchTrigger(workflow: WorkflowFile): boolean {
  return !!workflow.on?.workflow_dispatch;
}

/**
 * Extract metadata from a workflow file
 * @param yamlContent - The content of the workflow YAML file
 * @returns Workflow metadata or null if parsing failed
 */
export function extractWorkflowMetadata(yamlContent: string): {
  name: string;
  description: string;
  hasDispatchTrigger: boolean;
  inputs: ActionInput[];
} | null {
  const workflow = parseWorkflowYaml(yamlContent);
  if (!workflow) {
    return null;
  }
  
  return {
    name: extractWorkflowName(workflow),
    description: extractWorkflowDescription(workflow),
    hasDispatchTrigger: hasWorkflowDispatchTrigger(workflow),
    inputs: extractWorkflowInputs(workflow)
  };
}