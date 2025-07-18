/**
 * Component for monitoring multiple workflow executions
 */
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { GitHubApiClient } from '../services/github';
import { WorkflowExecutionStatus } from '../services/workflowExecutor';
import { useWorkflowStatus } from '../hooks/useWorkflowStatus';
import { useNotification, NotificationType } from '../contexts/NotificationContext';
import WorkflowStatusIndicator from './WorkflowStatusIndicator';

const MonitorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 800px;
`;

const MonitorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MonitorTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  color: #24292e;
`;

const ClearButton = styled.button`
  background-color: transparent;
  color: #0366d6;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const WorkflowList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const WorkflowItem = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background-color: #f6f8fa;
`;

const WorkflowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const WorkflowName = styled.div`
  font-weight: 600;
  color: #24292e;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6e7781;
  padding: 0;
  font-size: 1rem;
  
  &:hover {
    color: #24292f;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 1px dashed #d0d7de;
  border-radius: 6px;
  color: #6e7781;
  text-align: center;
`;

/**
 * Workflow execution to monitor
 */
export interface MonitoredWorkflow {
  /** Unique ID for the workflow execution */
  id: string;
  /** Name of the workflow */
  name: string;
  /** Repository owner */
  owner: string;
  /** Repository name */
  repo: string;
  /** Workflow ID */
  workflowId: string;
  /** Run ID (if available) */
  runId?: number;
}

export interface WorkflowMonitorProps {
  /** GitHub API client */
  githubClient: GitHubApiClient;
  /** List of workflows to monitor */
  workflows?: MonitoredWorkflow[];
  /** Whether to show notifications for status changes */
  showNotifications?: boolean;
  /** Whether to show the clear button */
  showClearButton?: boolean;
  /** Function called when a workflow is removed */
  onWorkflowRemoved?: (workflowId: string) => void;
  /** Function called when all workflows are cleared */
  onClear?: () => void;
}

/**
 * Component for monitoring multiple workflow executions
 */
const WorkflowMonitor: React.FC<WorkflowMonitorProps> = ({
  githubClient,
  workflows = [],
  showNotifications = true,
  showClearButton = true,
  onWorkflowRemoved,
  onClear,
}) => {
  const [monitoredWorkflows, setMonitoredWorkflows] = useState<MonitoredWorkflow[]>(workflows);
  // We'll use the notification context but don't need it at this level
  // We'll use the notification context in the MonitoredWorkflowItem component
  
  // Update monitored workflows when props change
  useEffect(() => {
    setMonitoredWorkflows(workflows);
  }, [workflows]);
  
  // Handle workflow removal
  const handleRemoveWorkflow = (workflowId: string) => {
    setMonitoredWorkflows(prev => prev.filter(workflow => workflow.id !== workflowId));
    
    if (onWorkflowRemoved) {
      onWorkflowRemoved(workflowId);
    }
  };
  
  // Handle clear all
  const handleClearAll = () => {
    setMonitoredWorkflows([]);
    
    if (onClear) {
      onClear();
    }
  };
  
  // Render empty state if no workflows
  if (monitoredWorkflows.length === 0) {
    return (
      <MonitorContainer>
        <MonitorHeader>
          <MonitorTitle>Workflow Monitor</MonitorTitle>
        </MonitorHeader>
        <EmptyState>
          <p>No workflows are currently being monitored.</p>
          <p>When you trigger a workflow, it will appear here.</p>
        </EmptyState>
      </MonitorContainer>
    );
  }
  
  return (
    <MonitorContainer>
      <MonitorHeader>
        <MonitorTitle>Workflow Monitor</MonitorTitle>
        {showClearButton && monitoredWorkflows.length > 0 && (
          <ClearButton onClick={handleClearAll}>
            Clear All
          </ClearButton>
        )}
      </MonitorHeader>
      <WorkflowList>
        {monitoredWorkflows.map(workflow => (
          <MonitoredWorkflowItem
            key={workflow.id}
            workflow={workflow}
            githubClient={githubClient}
            onRemove={handleRemoveWorkflow}
            showNotifications={showNotifications}
          />
        ))}
      </WorkflowList>
    </MonitorContainer>
  );
};

interface MonitoredWorkflowItemProps {
  workflow: MonitoredWorkflow;
  githubClient: GitHubApiClient;
  onRemove: (workflowId: string) => void;
  showNotifications: boolean;
}

/**
 * Individual workflow item in the monitor
 */
const MonitoredWorkflowItem: React.FC<MonitoredWorkflowItemProps> = ({
  workflow,
  githubClient,
  onRemove,
  showNotifications,
}) => {
  const { addNotification } = useNotification();
  const { status } = useWorkflowStatus(githubClient, workflow.id, {
    startPollingImmediately: true,
  });
  
  // Show notifications for status changes
  useEffect(() => {
    if (!status || !showNotifications) {
      return;
    }
    
    // Only show notifications for completed, failed, or cancelled workflows
    if (
      status.status === WorkflowExecutionStatus.COMPLETED ||
      status.status === WorkflowExecutionStatus.FAILED ||
      status.status === WorkflowExecutionStatus.CANCELLED
    ) {
      let notificationType: NotificationType;
      let message: string;
      
      switch (status.status) {
        case WorkflowExecutionStatus.COMPLETED:
          notificationType = NotificationType.SUCCESS;
          message = `Workflow "${workflow.name}" completed successfully.`;
          break;
        case WorkflowExecutionStatus.FAILED:
          notificationType = NotificationType.ERROR;
          message = `Workflow "${workflow.name}" failed.`;
          break;
        case WorkflowExecutionStatus.CANCELLED:
          notificationType = NotificationType.WARNING;
          message = `Workflow "${workflow.name}" was cancelled.`;
          break;
        default:
          return;
      }
      
      addNotification({
        type: notificationType,
        message,
        duration: 5000,
        actionText: status.runUrl ? 'View Run' : undefined,
        onAction: status.runUrl ? () => window.open(status.runUrl, '_blank') : undefined,
      });
    }
  }, [status?.status, workflow.name, showNotifications, addNotification, status?.runUrl]);
  
  return (
    <WorkflowItem>
      <WorkflowHeader>
        <WorkflowName>{workflow.name}</WorkflowName>
        <RemoveButton onClick={() => onRemove(workflow.id)}>
          ×
        </RemoveButton>
      </WorkflowHeader>
      <WorkflowStatusIndicator status={status} showTime showError showRunLink />
    </WorkflowItem>
  );
};

export default WorkflowMonitor;