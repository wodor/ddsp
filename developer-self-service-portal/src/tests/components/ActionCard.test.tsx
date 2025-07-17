import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActionCard from '../../components/ActionCard';
import type { CatalogAction } from '../../types/catalog';

describe('ActionCard', () => {
  const mockAction: CatalogAction = {
    id: 'test-action',
    name: 'Test Action',
    description: 'This is a test action',
    category: 'testing',
    repository: 'test/repo',
    workflowPath: '.github/workflows/test.yml',
    inputs: [],
    tags: ['test', 'example'],
    featured: true,
    lastUpdated: '2023-01-01T00:00:00Z'
  };

  it('renders action details correctly', () => {
    render(<ActionCard action={mockAction} />);
    
    // Check that basic information is displayed
    expect(screen.getByText('Test Action')).toBeInTheDocument();
    expect(screen.getByText('This is a test action')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
    expect(screen.getByText('test/repo')).toBeInTheDocument();
    
    // Check that tags are displayed
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('example')).toBeInTheDocument();
    
    // Check that featured badge is displayed
    expect(screen.getByText('Featured')).toBeInTheDocument();
    
    // Check that last updated date is displayed
    expect(screen.getByText(/Updated:/)).toBeInTheDocument();
  });

  it('does not display featured badge when action is not featured', () => {
    const nonFeaturedAction = { ...mockAction, featured: false };
    render(<ActionCard action={nonFeaturedAction} />);
    
    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<ActionCard action={mockAction} onClick={handleClick} />);
    
    await user.click(screen.getByText('Test Action'));
    
    expect(handleClick).toHaveBeenCalledWith('test-action');
  });

  it('handles missing optional fields gracefully', () => {
    const minimalAction: CatalogAction = {
      id: 'minimal-action',
      name: 'Minimal Action',
      description: 'Minimal description',
      category: 'minimal',
      repository: 'minimal/repo',
      workflowPath: '.github/workflows/minimal.yml',
      inputs: []
    };
    
    render(<ActionCard action={minimalAction} />);
    
    // Basic information should still be displayed
    expect(screen.getByText('Minimal Action')).toBeInTheDocument();
    expect(screen.getByText('Minimal description')).toBeInTheDocument();
    
    // No tags should be displayed
    expect(screen.queryByText('test')).not.toBeInTheDocument();
    
    // No featured badge
    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });
});