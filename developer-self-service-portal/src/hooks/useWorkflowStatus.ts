/**
 * Hook for monitoring workflow execution status
 */
import { useState, useEffect, useCallback } from 'react';
import { GitHubApiClient } from '../services/github';
import { WorkflowExecutor, WorkflowExecutionStatus } from '../services/workflowExecutor';

/**
 * Workflow status information
 */
export interface WorkflowStatus {
  /** Current status of the workflow */
  status: WorkflowExecutionStatus;
  /** Workflow run ID (if available) */
  runId?: number;
  /** Workflow run URL (if available) */
  runUrl?: string;
  /** Error message (if failed) */
  error?: string;
  /** Timestamp when the workflow was triggered */
  triggeredAt: string;
  /** Timestamp when the workflow completed (if completed) */
  completedAt?: string;
  /** Whether the status is being polled */
  isPolling: boolean;
}

/**
 * Options for the useWorkflowStatus hook
 */
export interface UseWorkflowStatusOptions {
  /** Polling interval in milliseconds */
  pollingInterval?: number;
  /** Whether to start polling immediately */
  startPollingImmediately?: boolean;
  /** Maximum number of polling attempts */
  maxPollingAttempts?: number;
}

/**
 * Hook for monitoring workflow execution status
 * @param githubClient GitHub API client
 * @param executionId Workflow execution ID
 * @param options Hook options
 * @returns Workflow status and control functions
 */
export const useWorkflowStatus = (
  githubClient: GitHubApiClient,
  executionId: string | null,
  options: UseWorkflowStatusOptions = {}
) => {
  // Default options
  const {
    pollingInterval = 5000,
    startPollingImmediately = true,
    maxPollingAttempts = 60, // 5 minutes with 5-second interval
  } = options;

  // Create workflow executor
  const workflowExecutor = new WorkflowExecutor(githubClient);

  // State
  const [status, setStatus] = useState<WorkflowStatus | null>(null);
  const [isPolling, setIsPolling] = useState(startPollingImmediately);
  const [pollingAttempts, setPollingAttempts] = useState(0);

  // Get the initial status
  useEffect(() => {
    if (!executionId) {
      setStatus(null);
      return;
    }

    const execution = workflowExecutor.getExecution(executionId);
    if (execution) {
      setStatus({
        status: execution.status,
        runId: execution.runId,
        error: execution.error,
        triggeredAt: execution.triggeredAt,
        isPolling: startPollingImmediately,
      });
    } else {
      setStatus(null);
    }
  }, [executionId, workflowExecutor, startPollingImmediately]);

  // Function to fetch the latest status
  const fetchStatus = useCallback(async () => {
    if (!executionId || !status) {
      return;
    }

    try {
      // Get the execution from the workflow executor
      const execution = workflowExecutor.getExecution(executionId);
      if (!execution) {
        return;
      }

      // If we have a run ID, fetch the latest status from GitHub
      if (execution.runId) {
        const runDetails = await githubClient.getWorkflowRunDetails(
          execution.owner,
          execution.repo,
          execution.runId
        );

        // Map GitHub status to our status enum
        let newStatus = execution.status;
        switch (runDetails.status) {
          case 'completed':
            newStatus = runDetails.conclusion === 'success'
              ? WorkflowExecutionStatus.COMPLETED
              : WorkflowExecutionStatus.FAILED;
            break;
          case 'in_progress':
          case 'queued':
            newStatus = WorkflowExecutionStatus.RUNNING;
            break;
          case 'cancelled':
            newStatus = WorkflowExecutionStatus.CANCELLED;
            break;
        }

        // Update the execution in the workflow executor
        workflowExecutor.updateExecutionStatus(
          executionId,
          newStatus,
          execution.runId,
          runDetails.conclusion === 'failure' ? 'Workflow failed' : undefined
        );

        // Update the status state
        setStatus({
          status: newStatus,
          runId: execution.runId,
          runUrl: runDetails.html_url,
          error: runDetails.conclusion === 'failure' ? 'Workflow failed' : undefined,
          triggeredAt: execution.triggeredAt,
          completedAt: runDetails.completed_at || undefined,
          isPolling: isPolling,
        });

        // Stop polling if the workflow is complete
        if (
          newStatus === WorkflowExecutionStatus.COMPLETED ||
          newStatus === WorkflowExecutionStatus.FAILED ||
          newStatus === WorkflowExecutionStatus.CANCELLED
        ) {
          setIsPolling(false);
        }
      } else {
        // If we don't have a run ID yet, try to find it
        const runs = await githubClient.getWorkflowRuns(
          execution.owner,
          execution.repo,
          execution.workflowId
        );

        // Find a run that was created around the same time as our execution
        const executionTime = new Date(execution.triggeredAt).getTime();
        const matchingRun = runs.find((run: any) => {
          const runTime = new Date(run.created_at).getTime();
          // Allow for a 30-second window to account for API delays
          return Math.abs(runTime - executionTime) < 30000;
        });

        if (matchingRun) {
          // Update the execution with the run ID
          workflowExecutor.updateExecutionStatus(
            executionId,
            WorkflowExecutionStatus.RUNNING,
            matchingRun.id
          );

          // Update the status state
          setStatus({
            status: WorkflowExecutionStatus.RUNNING,
            runId: matchingRun.id,
            runUrl: matchingRun.html_url,
            triggeredAt: execution.triggeredAt,
            isPolling: isPolling,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching workflow status:', error);
    }
  }, [executionId, status, workflowExecutor, githubClient, isPolling]);

  // Set up polling
  useEffect(() => {
    if (!isPolling || !executionId || pollingAttempts >= maxPollingAttempts) {
      return;
    }

    // Fetch status immediately
    fetchStatus();

    // Set up polling interval
    const intervalId = setInterval(() => {
      fetchStatus();
      setPollingAttempts(prev => prev + 1);
    }, pollingInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [
    isPolling,
    executionId,
    fetchStatus,
    pollingInterval,
    pollingAttempts,
    maxPollingAttempts,
  ]);

  // Function to start polling
  const startPolling = useCallback(() => {
    setIsPolling(true);
    setPollingAttempts(0);
  }, []);

  // Function to stop polling
  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  // Function to refresh status once
  const refreshStatus = useCallback(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    isPolling,
    startPolling,
    stopPolling,
    refreshStatus,
  };
};