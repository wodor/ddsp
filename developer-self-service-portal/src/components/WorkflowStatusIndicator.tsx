/**
 * Component for displaying workflow execution status
 */
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { WorkflowExecutionStatus } from '../services/workflowExecutor';
import type { WorkflowStatus } from '../hooks/useWorkflowStatus';

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

const StatusIndicator = styled.div<{ status: WorkflowExecutionStatus }>`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.status) {
      case WorkflowExecutionStatus.PENDING:
        return '#6e7781';
      case WorkflowExecutionStatus.RUNNING:
        return '#3fb950';
      case WorkflowExecutionStatus.COMPLETED:
        return '#2ea043';
      case WorkflowExecutionStatus.FAILED:
        return '#f85149';
      case WorkflowExecutionStatus.CANCELLED:
        return '#8250df';
      default:
        return '#6e7781';
    }
  }};
  
  ${props => props.status === WorkflowExecutionStatus.RUNNING && `
    animation: pulse 1.5s infinite;
    
    @keyframes pulse {
      0% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
      100% {
        opacity: 1;
      }
    }
  `}
`;

const StatusText = styled.span<{ status: WorkflowExecutionStatus }>`
  color: ${props => {
    switch (props.status) {
      case WorkflowExecutionStatus.PENDING:
        return '#6e7781';
      case WorkflowExecutionStatus.RUNNING:
        return '#3fb950';
      case WorkflowExecutionStatus.COMPLETED:
        return '#2ea043';
      case WorkflowExecutionStatus.FAILED:
        return '#f85149';
      case WorkflowExecutionStatus.CANCELLED:
        return '#8250df';
      default:
        return '#6e7781';
    }
  }};
`;

const StatusLink = styled.a`
  color: #0366d6;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const TimeInfo = styled.span`
  color: #6e7781;
  font-size: 0.75rem;
  margin-left: 0.5rem;
`;

const ErrorMessage = styled.div`
  color: #f85149;
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

export interface WorkflowStatusIndicatorProps {
  /** Workflow status */
  status: WorkflowStatus | null;
  /** Whether to show the time information */
  showTime?: boolean;
  /** Whether to show the error message */
  showError?: boolean;
  /** Whether to show the run link */
  showRunLink?: boolean;
}

/**
 * Component for displaying workflow execution status
 */
const WorkflowStatusIndicator: React.FC<WorkflowStatusIndicatorProps> = ({
  status,
  showTime = true,
  showError = true,
  showRunLink = true,
}) => {
  const [timeAgo, setTimeAgo] = useState<string>('');
  
  // Update time ago every minute
  useEffect(() => {
    if (!status) return;
    
    const updateTimeAgo = () => {
      const now = new Date();
      const triggeredAt = new Date(status.triggeredAt);
      const diffMs = now.getTime() - triggeredAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) {
        setTimeAgo('just now');
      } else if (diffMins === 1) {
        setTimeAgo('1 minute ago');
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins} minutes ago`);
      } else {
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours === 1) {
          setTimeAgo('1 hour ago');
        } else {
          setTimeAgo(`${diffHours} hours ago`);
        }
      }
    };
    
    updateTimeAgo();
    const intervalId = setInterval(updateTimeAgo, 60000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [status]);
  
  if (!status) {
    return null;
  }
  
  // Get status text
  const getStatusText = () => {
    switch (status.status) {
      case WorkflowExecutionStatus.PENDING:
        return 'Pending';
      case WorkflowExecutionStatus.RUNNING:
        return 'Running';
      case WorkflowExecutionStatus.COMPLETED:
        return 'Completed';
      case WorkflowExecutionStatus.FAILED:
        return 'Failed';
      case WorkflowExecutionStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <div>
      <StatusContainer>
        <StatusIndicator status={status.status} />
        <StatusText status={status.status}>
          {getStatusText()}
        </StatusText>
        
        {showRunLink && status.runUrl && (
          <StatusLink href={status.runUrl} target="_blank" rel="noopener noreferrer">
            View run
          </StatusLink>
        )}
        
        {showTime && (
          <TimeInfo>
            {timeAgo}
          </TimeInfo>
        )}
      </StatusContainer>
      
      {showError && status.error && (
        <ErrorMessage>
          {status.error}
        </ErrorMessage>
      )}
    </div>
  );
};

export default WorkflowStatusIndicator;