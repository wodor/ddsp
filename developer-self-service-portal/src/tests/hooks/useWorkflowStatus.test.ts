/**
 * Tests for the useWorkflowStatus hook
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkflowStatus } from '../../hooks/useWorkflowStatus';
import { GitHubApiClient } from '../../services/github';
import { WorkflowExecutionStatus } from '../../services/workflowExecutor';

// Mock the GitHub API client
vi.mock('../../services/github', () => {
  return {
    GitHubApiClient: vi.fn().mockImplementation(() => ({
      getWorkflowRunDetails: vi.fn().mockResolvedValue({
        status: 'completed',
        conclusion: 'success',
        html_url: 'https://github.com/owner/repo/actions/runs/123',
        completed_at: '2023-01-01T00:00:00Z',
      }),
      getWorkflowRuns: vi.fn().mockResolvedValue([
        {
          id: 123,
          created_at: '2023-01-01T00:00:00Z',
          html_url: 'https://github.com/owner/repo/actions/runs/123',
        },
      ]),
    })),
  };
});

// Mock the WorkflowExecutor
vi.mock('../../services/workflowExecutor', () => {
  const WorkflowExecutionStatus = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  };
  
  return {
    WorkflowExecutionStatus,
    WorkflowExecutor: vi.fn().mockImplementation(() => ({
      getExecution: vi.fn().mockImplementation((executionId) => {
        if (executionId === 'test-execution-id') {
          return {
            id: 'test-execution-id',
            owner: 'owner',
            repo: 'repo',
            workflowId: 'test.yml',
            ref: 'main',
            inputs: { input1: 'value1' },
            status: WorkflowExecutionStatus.RUNNING,
            triggeredAt: '2023-01-01T00:00:00Z',
            runId: 123,
          };
        }
        return undefined;
      }),
      updateExecutionStatus: vi.fn(),
    })),
  };
});

describe('useWorkflowStatus', () => {
  let githubClient: GitHubApiClient;
  
  beforeEach(() => {
    githubClient = new GitHubApiClient('mock-token');
    vi.useFakeTimers();
  });
  
  // Clean up timers after tests
  afterEach(() => {
    vi.useRealTimers();
  });
  
  it('should return null status when executionId is null', () => {
    // Arrange & Act
    const { result } = renderHook(() => useWorkflowStatus(githubClient, null));
    
    // Assert
    expect(result.current.status).toBeNull();
  });
  
  it('should return initial status from workflow executor', () => {
    // Arrange & Act
    const { result } = renderHook(() => useWorkflowStatus(githubClient, 'test-execution-id', {
      startPollingImmediately: false,
    }));
    
    // Assert
    expect(result.current.status).not.toBeNull();
    expect(result.current.status?.status).toBe(WorkflowExecutionStatus.RUNNING);
  });
  
  it('should start polling when startPollingImmediately is true', () => {
    // Arrange & Act
    const { result } = renderHook(() => useWorkflowStatus(githubClient, 'test-execution-id', {
      startPollingImmediately: true,
      pollingInterval: 1000,
    }));
    
    // Assert
    expect(result.current.isPolling).toBe(true);
  });
  
  it('should fetch status when polling', async () => {
    // Arrange
    renderHook(() => useWorkflowStatus(githubClient, 'test-execution-id', {
      startPollingImmediately: true,
      pollingInterval: 1000,
    }));
    
    // Act
    await act(async () => {
      // Fast-forward past the first polling interval
      vi.advanceTimersByTime(1000);
    });
    
    // Assert
    expect(githubClient.getWorkflowRunDetails).toHaveBeenCalledWith('owner', 'repo', 123);
  });
  
  it('should stop polling when workflow is completed', async () => {
    // Arrange
    (githubClient.getWorkflowRunDetails as any).mockResolvedValue({
      status: 'completed',
      conclusion: 'success',
      html_url: 'https://github.com/owner/repo/actions/runs/123',
      completed_at: '2023-01-01T00:00:00Z',
    });
    
    const { result } = renderHook(() => useWorkflowStatus(githubClient, 'test-execution-id', {
      startPollingImmediately: true,
      pollingInterval: 1000,
    }));
    
    // Act
    await act(async () => {
      // Fast-forward past the first polling interval
      vi.advanceTimersByTime(1000);
    });
    
    // Assert
    expect(result.current.isPolling).toBe(false);
  });
  
  it('should allow manually starting and stopping polling', () => {
    // Arrange
    const { result } = renderHook(() => useWorkflowStatus(githubClient, 'test-execution-id', {
      startPollingImmediately: false,
    }));
    
    // Act & Assert - Start polling
    act(() => {
      result.current.startPolling();
    });
    expect(result.current.isPolling).toBe(true);
    
    // Act & Assert - Stop polling
    act(() => {
      result.current.stopPolling();
    });
    expect(result.current.isPolling).toBe(false);
  });
  
  it('should refresh status when refreshStatus is called', async () => {
    // Arrange
    const { result } = renderHook(() => useWorkflowStatus(githubClient, 'test-execution-id', {
      startPollingImmediately: false,
    }));
    
    // Act
    await act(async () => {
      result.current.refreshStatus();
    });
    
    // Assert
    expect(githubClient.getWorkflowRunDetails).toHaveBeenCalledWith('owner', 'repo', 123);
  });
});