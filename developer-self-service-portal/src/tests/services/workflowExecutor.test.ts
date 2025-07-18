/**
 * Tests for the workflow executor service
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubApiClient, GitHubErrorType } from '../../services/github';
import { WorkflowExecutor, WorkflowExecutionStatus, WorkflowExecutionError } from '../../services/workflowExecutor';
import type { CatalogAction } from '../../types/catalog';

// Mock the GitHub API client
vi.mock('../../services/github', () => {
  const GitHubErrorType = {
    AUTHENTICATION: 'authentication',
    PERMISSION: 'permission',
    RATE_LIMIT: 'rate_limit',
    NOT_FOUND: 'not_found',
    VALIDATION: 'validation',
    SERVER_ERROR: 'server_error',
    NETWORK: 'network',
    UNKNOWN: 'unknown',
  };

  return {
    GitHubErrorType,
    GitHubApiClient: vi.fn().mockImplementation(() => ({
      checkPermission: vi.fn().mockResolvedValue(true),
      triggerWorkflow: vi.fn().mockImplementation((owner, repo, workflowId, ref, inputs) => {
        // Return a unique response for each call to ensure we can track multiple executions
        return Promise.resolve({
          id: `${owner}_${repo}_${workflowId}_${ref}_${JSON.stringify(inputs)}`,
        });
      }),
    })),
  };
});

describe('WorkflowExecutor', () => {
  let githubClient: GitHubApiClient;
  let workflowExecutor: WorkflowExecutor;
  let mockAction: CatalogAction;

  beforeEach(() => {
    // Create a new instance for each test
    githubClient = new GitHubApiClient('mock-token');
    workflowExecutor = new WorkflowExecutor(githubClient);

    // Create a mock action
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
        {
          name: 'input2',
          description: 'Input 2',
          required: false,
        },
      ],
    };
  });

  describe('executeWorkflow', () => {
    it('should execute a workflow successfully', async () => {
      // Arrange
      const inputs = { input1: 'value1', input2: 'value2' };
      const ref = 'main';

      // Act
      const executionResult = await workflowExecutor.executeWorkflow(mockAction, inputs, ref);

      // Assert
      expect(githubClient.checkPermission).toHaveBeenCalledWith('owner', 'repo', 'write');
      expect(githubClient.triggerWorkflow).toHaveBeenCalledWith(
        'owner',
        'repo',
        'test.yml',
        'main',
        { input1: 'value1', input2: 'value2' }
      );
      expect(executionResult.status).toBe(WorkflowExecutionStatus.RUNNING);
      expect(executionResult.owner).toBe('owner');
      expect(executionResult.repo).toBe('repo');
      expect(executionResult.workflowId).toBe('test.yml');
      expect(executionResult.ref).toBe('main');
      expect(executionResult.inputs).toEqual({ input1: 'value1', input2: 'value2' });
    });

    it('should handle boolean and array inputs', async () => {
      // Arrange
      const inputs = { 
        input1: true, 
        input2: ['value1', 'value2'] 
      };
      const ref = 'main';

      // Act
      await workflowExecutor.executeWorkflow(mockAction, inputs, ref);

      // Assert
      expect(githubClient.triggerWorkflow).toHaveBeenCalledWith(
        'owner',
        'repo',
        'test.yml',
        'main',
        { input1: 'true', input2: 'value1,value2' }
      );
    });

    it('should throw an error for invalid repository format', async () => {
      // Arrange
      const invalidAction = { ...mockAction, repository: 'invalid' };
      const inputs = { input1: 'value1' };
      const ref = 'main';

      // Act & Assert
      await expect(workflowExecutor.executeWorkflow(invalidAction, inputs, ref))
        .rejects.toThrow(WorkflowExecutionError);
    });

    it('should throw an error for invalid workflow path', async () => {
      // Arrange
      const invalidAction = { ...mockAction, workflowPath: '' };
      const inputs = { input1: 'value1' };
      const ref = 'main';

      // Act & Assert
      await expect(workflowExecutor.executeWorkflow(invalidAction, inputs, ref))
        .rejects.toThrow(WorkflowExecutionError);
    });

    it('should throw an error when user lacks permission', async () => {
      // Arrange
      (githubClient.checkPermission as any).mockResolvedValue(false);
      const inputs = { input1: 'value1' };
      const ref = 'main';

      // Act & Assert
      await expect(workflowExecutor.executeWorkflow(mockAction, inputs, ref))
        .rejects.toThrow(WorkflowExecutionError);
    });

    it('should throw an error when workflow trigger fails', async () => {
      // Arrange
      const error = new Error('API error') as any;
      error.type = GitHubErrorType.SERVER_ERROR;
      error.status = 500;
      (githubClient.triggerWorkflow as any).mockRejectedValue(error);
      
      const inputs = { input1: 'value1' };
      const ref = 'main';

      // Act & Assert
      await expect(workflowExecutor.executeWorkflow(mockAction, inputs, ref))
        .rejects.toThrow(WorkflowExecutionError);
    });

    it('should call onStatusChange callback when provided', async () => {
      // Arrange
      const inputs = { input1: 'value1' };
      const ref = 'main';
      const onStatusChange = vi.fn();

      // Act
      await workflowExecutor.executeWorkflow(mockAction, inputs, ref, { onStatusChange });

      // Assert
      expect(onStatusChange).toHaveBeenCalled();
      expect(onStatusChange.mock.calls[0][0].status).toBe(WorkflowExecutionStatus.RUNNING);
    });
  });

  describe('execution history management', () => {
    it('should store and retrieve execution results', async () => {
      // Arrange
      const inputs = { input1: 'value1' };
      const ref = 'main';

      // Act
      const result = await workflowExecutor.executeWorkflow(mockAction, inputs, ref);
      const retrievedResult = workflowExecutor.getExecution(result.id);

      // Assert
      expect(retrievedResult).toEqual(result);
    });

    it('should return all executions', async () => {
      // Arrange
      // Create a new executor instance to ensure clean state
      const localExecutor = new WorkflowExecutor(githubClient);
      
      // Manually add executions to the history
      const execution1 = {
        id: 'test-execution-1',
        owner: 'owner',
        repo: 'repo',
        workflowId: 'test.yml',
        ref: 'main',
        inputs: { input1: 'value1' },
        status: WorkflowExecutionStatus.RUNNING,
        triggeredAt: new Date().toISOString(),
      };
      
      const execution2 = {
        id: 'test-execution-2',
        owner: 'owner',
        repo: 'repo',
        workflowId: 'test.yml',
        ref: 'develop',
        inputs: { input1: 'value2' },
        status: WorkflowExecutionStatus.RUNNING,
        triggeredAt: new Date().toISOString(),
      };
      
      // Use private property to add executions directly
      (localExecutor as any).executionHistory.set(execution1.id, execution1);
      (localExecutor as any).executionHistory.set(execution2.id, execution2);

      // Act
      const allExecutions = localExecutor.getAllExecutions();

      // Assert
      expect(allExecutions.length).toBe(2);
    });

    it('should return recent executions with limit', async () => {
      // Arrange
      // Create a new executor instance to ensure clean state
      const localExecutor = new WorkflowExecutor(githubClient);
      
      // Manually add executions to the history
      const execution1 = {
        id: 'test-execution-1',
        owner: 'owner',
        repo: 'repo',
        workflowId: 'test.yml',
        ref: 'main',
        inputs: { input1: 'value1' },
        status: WorkflowExecutionStatus.RUNNING,
        triggeredAt: new Date(Date.now() - 3000).toISOString(), // 3 seconds ago
      };
      
      const execution2 = {
        id: 'test-execution-2',
        owner: 'owner',
        repo: 'repo',
        workflowId: 'test.yml',
        ref: 'develop',
        inputs: { input1: 'value2' },
        status: WorkflowExecutionStatus.RUNNING,
        triggeredAt: new Date(Date.now() - 2000).toISOString(), // 2 seconds ago
      };
      
      const execution3 = {
        id: 'test-execution-3',
        owner: 'owner',
        repo: 'repo',
        workflowId: 'test.yml',
        ref: 'feature',
        inputs: { input1: 'value3' },
        status: WorkflowExecutionStatus.RUNNING,
        triggeredAt: new Date(Date.now() - 1000).toISOString(), // 1 second ago
      };
      
      // Use private property to add executions directly
      (localExecutor as any).executionHistory.set(execution1.id, execution1);
      (localExecutor as any).executionHistory.set(execution2.id, execution2);
      (localExecutor as any).executionHistory.set(execution3.id, execution3);

      // Act
      const recentExecutions = localExecutor.getRecentExecutions(2);

      // Assert
      expect(recentExecutions.length).toBe(2);
      // The most recent executions should be returned
      expect(recentExecutions.some(e => e.id === execution3.id)).toBe(true);
      expect(recentExecutions.some(e => e.id === execution2.id)).toBe(true);
    });

    it('should update execution status', async () => {
      // Arrange
      const result = await workflowExecutor.executeWorkflow(mockAction, { input1: 'value1' }, 'main');

      // Act
      const updatedResult = workflowExecutor.updateExecutionStatus(
        result.id,
        WorkflowExecutionStatus.COMPLETED,
        12345
      );

      // Assert
      expect(updatedResult?.status).toBe(WorkflowExecutionStatus.COMPLETED);
      expect(updatedResult?.runId).toBe(12345);
    });

    it('should clear execution history', async () => {
      // Arrange
      await workflowExecutor.executeWorkflow(mockAction, { input1: 'value1' }, 'main');
      await workflowExecutor.executeWorkflow(mockAction, { input1: 'value2' }, 'develop');

      // Act
      workflowExecutor.clearExecutionHistory();
      const allExecutions = workflowExecutor.getAllExecutions();

      // Assert
      expect(allExecutions.length).toBe(0);
    });
  });
});