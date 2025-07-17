import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActionsList from '../../components/ActionsList';
import type { CatalogAction } from '../../types/catalog';

describe('ActionsList', () => {
  const mockActions: CatalogAction[] = [
    {
      id: 'action-1',
      name: 'Action 1',
      description: 'Description for action 1',
      category: 'testing',
      repository: 'org/repo-1',
      workflowPath: '.github/workflows/action1.yml',
      inputs: [],
      featured: true
    },
    {
      id: 'action-2',
      name: 'Action 2',
      description: 'Description for action 2',
      category: 'deployment',
      repository: 'org/repo-2',
      workflowPath: '.github/workflows/action2.yml',
      inputs: [],
      featured: false
    }
  ];

  it('renders a list of action cards', () => {
    render(<ActionsList actions={mockActions} />);
    
    // Check that both actions are rendered
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
    expect(screen.getByText('Description for action 1')).toBeInTheDocument();
    expect(screen.getByText('Description for action 2')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<ActionsList actions={[]} isLoading={true} />);
    
    expect(screen.getByTestId('actions-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading actions...')).toBeInTheDocument();
  });

  it('shows error state when error is provided', () => {
    const errorMessage = 'Failed to load actions';
    render(<ActionsList actions={[]} error={errorMessage} />);
    
    expect(screen.getByTestId('actions-error')).toBeInTheDocument();
    expect(screen.getByText('Error loading actions')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows empty state when no actions are available', () => {
    render(<ActionsList actions={[]} />);
    
    expect(screen.getByTestId('actions-empty')).toBeInTheDocument();
    expect(screen.getByText('No actions found')).toBeInTheDocument();
  });

  it('calls onActionClick when an action card is clicked', async () => {
    const handleActionClick = vi.fn();
    const user = userEvent.setup();
    
    render(
      <ActionsList 
        actions={mockActions} 
        onActionClick={handleActionClick} 
      />
    );
    
    // Click on the first action
    await user.click(screen.getByText('Action 1'));
    
    expect(handleActionClick).toHaveBeenCalledWith('action-1');
  });
});