/**
 * Tests for the WorkflowStatusIndicator component
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WorkflowStatusIndicator from '../../components/WorkflowStatusIndicator';
import { WorkflowExecutionStatus } from '../../services/workflowExecutor';
import type { WorkflowStatus } from '../../hooks/useWorkflowStatus';

describe('WorkflowStatusIndicator', () => {
  it('renders nothing when status is null', () => {
    // Arrange & Act
    const { container } = render(<WorkflowStatusIndicator status={null} />);
    
    // Assert
    expect(container.firstChild).toBeNull();
  });
  
  it('renders pending status correctly', () => {
    // Arrange
    const status: WorkflowStatus = {
      status: WorkflowExecutionStatus.PENDING,
      triggeredAt: new Date().toISOString(),
      isPolling: false,
    };
    
    // Act
    render(<WorkflowStatusIndicator status={status} />);
    
    // Assert
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
  
  it('renders running status correctly', () => {
    // Arrange
    const status: WorkflowStatus = {
      status: WorkflowExecutionStatus.RUNNING,
      triggeredAt: new Date().toISOString(),
      isPolling: true,
    };
    
    // Act
    render(<WorkflowStatusIndicator status={status} />);
    
    // Assert
    expect(screen.getByText('Running')).toBeInTheDocument();
  });
  
  it('renders completed status correctly', () => {
    // Arrange
    const status: WorkflowStatus = {
      status: WorkflowExecutionStatus.COMPLETED,
      triggeredAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      isPolling: false,
    };
    
    // Act
    render(<WorkflowStatusIndicator status={status} />);
    
    // Assert
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
  
  it('renders failed status correctly', () => {
    // Arrange
    const status: WorkflowStatus = {
      status: WorkflowExecutionStatus.FAILED,
      triggeredAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      error: 'Workflow failed',
      isPolling: false,
    };
    
    // Act
    render(<WorkflowStatusIndicator status={status} />);
    
    // Assert
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Workflow failed')).toBeInTheDocument();
  });
  
  it('renders cancelled status correctly', () => {
    // Arrange
    const status: WorkflowStatus = {
      status: WorkflowExecutionStatus.CANCELLED,
      triggeredAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      isPolling: false,
    };
    
    // Act
    render(<WorkflowStatusIndicator status={status} />);
    
    // Assert
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });
  
  it('renders run link when available', () => {
    // Arrange
    const status: WorkflowStatus = {
      status: WorkflowExecutionStatus.RUNNING,
      triggeredAt: new Date().toISOString(),
      runUrl: 'https://github.com/owner/repo/actions/runs/123',
      isPolling: true,
    };
    
    // Act
    render(<WorkflowStatusIndicator status={status} showRunLink={true} />);
    
    // Assert
    const link = screen.getByText('View run');
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('https://github.com/owner/repo/actions/runs/123');
  });
  
  it('does not render run link when showRunLink is false', () => {
    // Arrange
    const status: WorkflowStatus = {
      status: WorkflowExecutionStatus.RUNNING,
      triggeredAt: new Date().toISOString(),
      runUrl: 'https://github.com/owner/repo/actions/runs/123',
      isPolling: true,
    };
    
    // Act
    render(<WorkflowStatusIndicator status={status} showRunLink={false} />);
    
    // Assert
    expect(screen.queryByText('View run')).not.toBeInTheDocument();
  });
  
  it('does not render error when showError is false', () => {
    // Arrange
    const status: WorkflowStatus = {
      status: WorkflowExecutionStatus.FAILED,
      triggeredAt: new Date().toISOString(),
      error: 'Workflow failed',
      isPolling: false,
    };
    
    // Act
    render(<WorkflowStatusIndicator status={status} showError={false} />);
    
    // Assert
    expect(screen.queryByText('Workflow failed')).not.toBeInTheDocument();
  });
  
  it('does not render time when showTime is false', () => {
    // Arrange
    const status: WorkflowStatus = {
      status: WorkflowExecutionStatus.RUNNING,
      triggeredAt: new Date().toISOString(),
      isPolling: true,
    };
    
    // Act
    render(<WorkflowStatusIndicator status={status} showTime={false} />);
    
    // Assert
    expect(screen.queryByText(/just now|minute|hour/)).not.toBeInTheDocument();
  });
});