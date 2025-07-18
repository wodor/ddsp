/**
 * Workflow execution button component
 */
import { useState } from 'react';
import styled from 'styled-components';
import { GitHubApiClient } from '../services/github';
import { WorkflowExecutor, WorkflowExecutionError, WorkflowExecutionStatus } from '../services/workflowExecutor';
import type { CatalogAction } from '../types/catalog';
import ConfirmationDialog from './ConfirmationDialog';

const Button = styled.button`
  background-color: #2ea44f;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background-color: #2c974b;
  }

  &:disabled {
    background-color: #94d3a2;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #d73a49;
  background-color: #ffebe9;
  border: 1px solid #f9d0d0;
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 1rem;
  font-size: 0.875rem;
`;

const SuccessMessage = styled.div`
  color: #22863a;
  background-color: #e6ffed;
  border: 1px solid #c0e6cc;
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 1rem;
  font-size: 0.875rem;
`;

export interface WorkflowExecutionButtonProps {
  /** The action to execute */
  action: CatalogAction;
  /** Form data to use as inputs */
  formData: Record<string, any>;
  /** GitHub API client */
  githubClient: GitHubApiClient;
  /** Git reference (branch, tag, or SHA) */
  ref: string;
  /** Button text */
  buttonText?: string;
  /** Whether to show confirmation dialog */
  showConfirmation?: boolean;
  /** Function called when execution starts */
  onExecutionStart?: (executionId: string) => void;
  /** Function called when execution completes */
  onExecutionComplete?: (executionId: string, status: WorkflowExecutionStatus) => void;
  /** Function called when execution fails */
  onExecutionError?: (error: WorkflowExecutionError) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * Button component for executing workflows with confirmation dialog and loading states
 */
const WorkflowExecutionButton: React.FC<WorkflowExecutionButtonProps> = ({
  action,
  formData,
  githubClient,
  ref,
  buttonText = 'Run Workflow',
  showConfirmation = true,
  onExecutionStart,
  onExecutionComplete,
  onExecutionError,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create workflow executor
  const workflowExecutor = new WorkflowExecutor(githubClient);

  // Handle button click
  const handleClick = () => {
    // Reset state
    setError(null);
    setSuccess(null);

    // Show confirmation dialog if enabled
    if (showConfirmation) {
      setShowDialog(true);
    } else {
      executeWorkflow();
    }
  };

  // Execute the workflow
  const executeWorkflow = async () => {
    setIsLoading(true);
    setShowDialog(false);

    try {
      // Execute the workflow
      const result = await workflowExecutor.executeWorkflow(action, formData, ref);

      // Show success message
      setSuccess(`Workflow "${action.name}" triggered successfully.`);

      // Call onExecutionStart callback
      if (onExecutionStart) {
        onExecutionStart(result.id);
      }

      // Call onExecutionComplete callback
      if (onExecutionComplete) {
        onExecutionComplete(result.id, result.status);
      }
    } catch (err) {
      // Handle errors
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger workflow';
      setError(errorMessage);

      // Call onExecutionError callback
      if (onExecutionError && err instanceof WorkflowExecutionError) {
        onExecutionError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle dialog cancel
  const handleCancel = () => {
    setShowDialog(false);
  };

  // Generate confirmation message
  const confirmationMessage = (
    <div>
      <p>
        Are you sure you want to run the workflow "{action.name}" with the provided inputs?
      </p>
      <p>
        This will trigger a GitHub Actions workflow in the repository {action.repository}.
      </p>
    </div>
  );

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled || isLoading}
      >
        {isLoading ? 'Running...' : buttonText}
        {isLoading && (
          <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.25" />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ animation: 'spin 1s linear infinite' }}
            />
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </svg>
        )}
      </Button>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <ConfirmationDialog
        title="Confirm Workflow Execution"
        message={confirmationMessage}
        isOpen={showDialog}
        onConfirm={executeWorkflow}
        onCancel={handleCancel}
        confirmText="Run Workflow"
        cancelText="Cancel"
      />
    </>
  );
};

export default WorkflowExecutionButton;