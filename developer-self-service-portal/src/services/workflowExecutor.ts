/**
 * Workflow Executor Service
 * Handles workflow submissions and execution tracking
 */
import { GitHubApiClient, GitHubErrorType } from './github';
import type { CatalogAction } from '../types/catalog';

/**
 * Workflow execution status
 */
export enum WorkflowExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  /** Unique identifier for the execution */
  id: string;
  /** Repository owner */
  owner: string;
  /** Repository name */
  repo: string;
  /** Workflow ID */
  workflowId: string;
  /** Reference (branch, tag, or SHA) */
  ref: string;
  /** Inputs provided to the workflow */
  inputs: Record<string, string>;
  /** Current status of the execution */
  status: WorkflowExecutionStatus;
  /** Timestamp when the execution was triggered */
  triggeredAt: string;
  /** Error message if execution failed */
  error?: string;
  /** Run ID from GitHub (if available) */
  runId?: number;
}

/**
 * Workflow execution options
 */
export interface WorkflowExecutionOptions {
  /** Whether to skip confirmation dialog */
  skipConfirmation?: boolean;
  /** Callback function when execution status changes */
  onStatusChange?: (result: WorkflowExecutionResult) => void;
}

/**
 * Error thrown when workflow execution fails
 */
export class WorkflowExecutionError extends Error {
  /** Type of error */
  type: GitHubErrorType;
  /** HTTP status code (if applicable) */
  status?: number;
  /** Raw response data (if available) */
  response?: any;

  constructor(message: string, type: GitHubErrorType, status?: number, response?: any) {
    super(message);
    this.name = 'WorkflowExecutionError';
    this.type = type;
    this.status = status;
    this.response = response;
  }
}

/**
 * Service for executing GitHub workflows
 */
export class WorkflowExecutor {
  private githubClient: GitHubApiClient;
  private executionHistory: Map<string, WorkflowExecutionResult> = new Map();

  /**
   * Create a new workflow executor
   * @param githubClient GitHub API client
   */
  constructor(githubClient: GitHubApiClient) {
    this.githubClient = githubClient;
  }

  /**
   * Execute a workflow
   * @param action The catalog action to execute
   * @param inputs Input values for the workflow
   * @param ref Git reference (branch, tag, or SHA)
   * @param options Execution options
   * @returns Promise that resolves with the execution result
   */
  async executeWorkflow(
    action: CatalogAction,
    inputs: Record<string, any>,
    ref: string,
    options: WorkflowExecutionOptions = {}
  ): Promise<WorkflowExecutionResult> {
    // Extract repository owner and name from the repository string
    const [owner, repo] = action.repository.split('/');
    if (!owner || !repo) {
      throw new WorkflowExecutionError(
        `Invalid repository format: ${action.repository}`,
        GitHubErrorType.VALIDATION
      );
    }

    // Extract workflow ID from the workflow path
    const workflowId = action.workflowPath.split('/').pop() || '';
    if (!workflowId) {
      throw new WorkflowExecutionError(
        `Invalid workflow path: ${action.workflowPath}`,
        GitHubErrorType.VALIDATION
      );
    }

    // Check if the user has permission to trigger workflows in this repository
    const hasPermission = await this.githubClient.checkPermission(owner, repo, 'write');
    if (!hasPermission) {
      throw new WorkflowExecutionError(
        `You don't have permission to trigger workflows in ${owner}/${repo}`,
        GitHubErrorType.PERMISSION
      );
    }

    // Convert all input values to strings as required by the GitHub API
    const stringInputs: Record<string, string> = {};
    for (const [key, value] of Object.entries(inputs)) {
      if (value === null || value === undefined) {
        continue;
      }
      
      if (typeof value === 'boolean') {
        stringInputs[key] = value.toString();
      } else if (Array.isArray(value)) {
        stringInputs[key] = value.join(',');
      } else {
        stringInputs[key] = String(value);
      }
    }

    // Create an execution result object
    const executionId = `${owner}_${repo}_${workflowId}_${Date.now()}`;
    const executionResult: WorkflowExecutionResult = {
      id: executionId,
      owner,
      repo,
      workflowId,
      ref,
      inputs: stringInputs,
      status: WorkflowExecutionStatus.PENDING,
      triggeredAt: new Date().toISOString(),
    };

    // Store the execution result
    this.executionHistory.set(executionId, executionResult);

    try {
      // Trigger the workflow
      await this.githubClient.triggerWorkflow(owner, repo, workflowId, ref, stringInputs);

      // Update the execution status
      executionResult.status = WorkflowExecutionStatus.RUNNING;
      this.executionHistory.set(executionId, { ...executionResult });

      // Notify status change if callback is provided
      if (options.onStatusChange) {
        options.onStatusChange(executionResult);
      }

      return executionResult;
    } catch (error) {
      // Handle errors
      let errorMessage = 'Failed to trigger workflow';
      let errorType = GitHubErrorType.UNKNOWN;
      let status: number | undefined;
      let response: any;

      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Extract additional information if it's a GitHub error
        if ('type' in error) {
          errorType = (error as any).type;
          status = (error as any).status;
          response = (error as any).response;
        }
      }

      // Update the execution status
      executionResult.status = WorkflowExecutionStatus.FAILED;
      executionResult.error = errorMessage;
      this.executionHistory.set(executionId, { ...executionResult });

      // Notify status change if callback is provided
      if (options.onStatusChange) {
        options.onStatusChange(executionResult);
      }

      throw new WorkflowExecutionError(errorMessage, errorType, status, response);
    }
  }

  /**
   * Get an execution result by ID
   * @param executionId Execution ID
   * @returns Execution result or undefined if not found
   */
  getExecution(executionId: string): WorkflowExecutionResult | undefined {
    return this.executionHistory.get(executionId);
  }

  /**
   * Get all execution results
   * @returns Array of execution results
   */
  getAllExecutions(): WorkflowExecutionResult[] {
    return Array.from(this.executionHistory.values());
  }

  /**
   * Get recent executions
   * @param limit Maximum number of executions to return
   * @returns Array of recent execution results
   */
  getRecentExecutions(limit: number = 10): WorkflowExecutionResult[] {
    return Array.from(this.executionHistory.values())
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
      .slice(0, limit);
  }

  /**
   * Update the status of an execution
   * @param executionId Execution ID
   * @param status New status
   * @param runId GitHub run ID (if available)
   * @param error Error message (if failed)
   * @returns Updated execution result or undefined if not found
   */
  updateExecutionStatus(
    executionId: string,
    status: WorkflowExecutionStatus,
    runId?: number,
    error?: string
  ): WorkflowExecutionResult | undefined {
    const execution = this.executionHistory.get(executionId);
    if (!execution) {
      return undefined;
    }

    const updatedExecution = {
      ...execution,
      status,
      runId: runId || execution.runId,
      error: error || execution.error,
    };

    this.executionHistory.set(executionId, updatedExecution);
    return updatedExecution;
  }

  /**
   * Clear all execution history
   */
  clearExecutionHistory(): void {
    this.executionHistory.clear();
  }
}

// Create a singleton instance
let workflowExecutorInstance: WorkflowExecutor | null = null;

/**
 * Get the workflow executor instance
 * @param githubClient GitHub API client
 * @returns Workflow executor instance
 */
export const getWorkflowExecutor = (githubClient: GitHubApiClient): WorkflowExecutor => {
  if (!workflowExecutorInstance) {
    workflowExecutorInstance = new WorkflowExecutor(githubClient);
  }
  return workflowExecutorInstance;
};