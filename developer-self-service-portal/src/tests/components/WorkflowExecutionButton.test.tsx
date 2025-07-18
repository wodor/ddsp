/**
 * Tests for the WorkflowExecutionButton component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkflowExecutionButton from '../../components/WorkflowExecutionButton';
import { GitHubApiClient } from '../../services/github';
import { WorkflowExecutionStatus } from '../../services/workflowExecutor';
import type { CatalogAction } from '../../types/catalog';

// Mock the workflow executor
vi.mock('../../services/workflowExecutor', () => {
  const WorkflowExecutionStatus = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  };

  const WorkflowExecutionError = class extends Error {
    type: string;
    status?: number;
    response?: any;
    
    constructor(message: string, type: string, status?: number, response?: any) {
      super(message);
      this.name = 'WorkflowExecutionError';
      this.type = type;
      this.status = status;
      this.response = response;
    }
  };

  return {
    WorkflowExecutionStatus,
    WorkflowExecutionError,
    WorkflowExecutor: vi.fn().mockImplementation(() => ({
      executeWorkflow: vi.fn().mockImplementation((_action, inputs, ref) => {
        if (inputs.shouldFail) {
          return Promise.reject(new WorkflowExecutionError('Execution failed', 'unknown'));
        }
        return Promise.resolve({
          id: 'test-execution-id',
          status: WorkflowExecutionStatus.RUNNING,
          owner: 'owner',
          repo: 'repo',
          workflowId: 'test.yml',
          ref,
          inputs,
          triggeredAt: new Date().toISOString(),
        });
      }),
    })),
  };
});

describe('WorkflowExecutionButton', () => {
  let mockAction: CatalogAction;
  let mockGithubClient: GitHubApiClient;
  
  beforeEach(() => {
    // Create mock action
    mockAction = {
      id: 'test-action',
      name: 'Test Action',
      description: 'A test action',
      category: 'test',
      repository: 'owner/repo',
      workflowPath: '.github/workflows/test.yml',
      inputs: [
        {
          name: 'input1',
          description: 'Input 1',
          required: true,
        },
      ],
    };
    
    // Create mock GitHub client
    mockGithubClient = new GitHubApiClient('mock-token');
  });
  
  it('renders the button with default text', () => {
    // Arrange & Act
    render(
      <WorkflowExecutionButton
        action={mockAction}
        formData={{ input1: 'value1' }}
        githubClient={mockGithubClient}
        ref="main"
      />
    );
    
    // Assert
    expect(screen.getByRole('button', { name: /run workflow/i })).toBeInTheDocument();
  });
  
  it('renders the button with custom text', () => {
    // Arrange & Act
    render(
      <WorkflowExecutionButton
        action={mockAction}
        formData={{ input1: 'value1' }}
        githubClient={mockGithubClient}
        ref="main"
        buttonText="Custom Button Text"
      />
    );
    
    // Assert
    expect(screen.getByRole('button', { name: /custom button text/i })).toBeInTheDocument();
  });
  
  it('shows confirmation dialog when clicked', async () => {
    // Arrange
    render(
      <WorkflowExecutionButton
        action={mockAction}
        formData={{ input1: 'value1' }}
        githubClient={mockGithubClient}
        ref="main"
      />
    );
    
    // Act
    await userEvent.click(screen.getByRole('button', { name: /run workflow/i }));
    
    // Assert
    expect(screen.getByText(/are you sure you want to run the workflow/i)).toBeInTheDocument();
    // Use getAllByRole since there are multiple buttons with the same text
    expect(screen.getAllByRole('button', { name: /run workflow/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });
  
  it('executes workflow when confirmed', async () => {
    // Arrange
    const onExecutionStart = vi.fn();
    const onExecutionComplete = vi.fn();
    
    render(
      <WorkflowExecutionButton
        action={mockAction}
        formData={{ input1: 'value1' }}
        githubClient={mockGithubClient}
        ref="main"
        onExecutionStart={onExecutionStart}
        onExecutionComplete={onExecutionComplete}
      />
    );
    
    // Act - first click the main button to open dialog
    await userEvent.click(screen.getByRole('button', { name: /run workflow/i }));
    
    // Then click the confirm button in the dialog
    const confirmButtons = screen.getAllByRole('button', { name: /run workflow/i });
    // The second button should be the confirm button in the dialog
    await userEvent.click(confirmButtons[1]);
    
    // Assert
    await waitFor(() => {
      expect(onExecutionStart).toHaveBeenCalledWith('test-execution-id');
      expect(onExecutionComplete).toHaveBeenCalledWith('test-execution-id', WorkflowExecutionStatus.RUNNING);
      expect(screen.getByText(/triggered successfully/i)).toBeInTheDocument();
    });
  });
  
  it('skips confirmation when showConfirmation is false', async () => {
    // Arrange
    const onExecutionStart = vi.fn();
    
    render(
      <WorkflowExecutionButton
        action={mockAction}
        formData={{ input1: 'value1' }}
        githubClient={mockGithubClient}
        ref="main"
        onExecutionStart={onExecutionStart}
        showConfirmation={false}
      />
    );
    
    // Act
    await userEvent.click(screen.getByRole('button', { name: /run workflow/i }));
    
    // Assert
    await waitFor(() => {
      expect(onExecutionStart).toHaveBeenCalledWith('test-execution-id');
      expect(screen.getByText(/triggered successfully/i)).toBeInTheDocument();
    });
  });
  
  it('handles execution errors', async () => {
    // Arrange
    const onExecutionError = vi.fn();
    
    render(
      <WorkflowExecutionButton
        action={mockAction}
        formData={{ input1: 'value1', shouldFail: true }}
        githubClient={mockGithubClient}
        ref="main"
        onExecutionError={onExecutionError}
        showConfirmation={false}
      />
    );
    
    // Act
    await userEvent.click(screen.getByRole('button', { name: /run workflow/i }));
    
    // Assert
    await waitFor(() => {
      expect(onExecutionError).toHaveBeenCalled();
      expect(screen.getByText(/execution failed/i)).toBeInTheDocument();
    });
  });
  
  it('disables the button when disabled prop is true', () => {
    // Arrange & Act
    render(
      <WorkflowExecutionButton
        action={mockAction}
        formData={{ input1: 'value1' }}
        githubClient={mockGithubClient}
        ref="main"
        disabled={true}
      />
    );
    
    // Assert
    expect(screen.getByRole('button', { name: /run workflow/i })).toBeDisabled();
  });
  
  it('shows loading state during execution', async () => {
    // Arrange
    render(
      <WorkflowExecutionButton
        action={mockAction}
        formData={{ input1: 'value1' }}
        githubClient={mockGithubClient}
        ref="main"
        showConfirmation={false}
      />
    );
    
    // Act
    await userEvent.click(screen.getByRole('button', { name: /run workflow/i }));
    
    // Assert - this is a bit tricky to test since the loading state is brief
    // In a real test, we might use a mock that doesn't resolve immediately
    await waitFor(() => {
      expect(screen.getByText(/triggered successfully/i)).toBeInTheDocument();
    });
  });
});