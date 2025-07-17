import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActionsFilter from '../../components/ActionsFilter';
import type { ActionCategory, CatalogFilterOptions } from '../../types/catalog';

describe('ActionsFilter', () => {
  const mockCategories: ActionCategory[] = [
    { id: 'deployment', name: 'Deployment', description: 'Deployment actions' },
    { id: 'testing', name: 'Testing', description: 'Testing actions' },
    { id: 'security', name: 'Security', description: 'Security actions' }
  ];

  const defaultFilters: CatalogFilterOptions = {};

  it('renders all filter options correctly', () => {
    render(
      <ActionsFilter 
        categories={mockCategories} 
        filters={defaultFilters}
        onFilterChange={vi.fn()} 
      />
    );
    
    // Check that search input is displayed
    expect(screen.getByPlaceholderText('Search actions...')).toBeInTheDocument();
    
    // Check that all categories are displayed
    expect(screen.getByText('Deployment')).toBeInTheDocument();
    expect(screen.getByText('Testing')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    
    // Check that sort options are displayed
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Last Updated')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    
    // Check that featured checkbox is displayed
    expect(screen.getByText('Show featured actions only')).toBeInTheDocument();
  });

  it('calls onFilterChange when search text changes', async () => {
    const handleFilterChange = vi.fn();
    const user = userEvent.setup();
    
    render(
      <ActionsFilter 
        categories={mockCategories}
        filters={defaultFilters}
        onFilterChange={handleFilterChange} 
      />
    );
    
    const searchInput = screen.getByTestId('actions-search-input');
    await user.type(searchInput, 'test');
    
    // Check the last call to handleFilterChange
    const lastCallIndex = handleFilterChange.mock.calls.length - 1;
    expect(handleFilterChange.mock.calls[lastCallIndex][0]).toEqual(
      expect.objectContaining({
        searchText: 't'
      })
    );
    
    // Verify that handleFilterChange was called for each character
    expect(handleFilterChange).toHaveBeenCalledTimes(4);
  });

  it('calls onFilterChange when category is selected', async () => {
    const handleFilterChange = vi.fn();
    const user = userEvent.setup();
    
    render(
      <ActionsFilter 
        categories={mockCategories}
        filters={defaultFilters}
        onFilterChange={handleFilterChange} 
      />
    );
    
    await user.click(screen.getByText('Deployment'));
    
    expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      categories: ['deployment']
    }));
  });

  it('calls onFilterChange when sort option changes', async () => {
    const handleFilterChange = vi.fn();
    const user = userEvent.setup();
    
    render(
      <ActionsFilter 
        categories={mockCategories}
        filters={defaultFilters}
        onFilterChange={handleFilterChange} 
      />
    );
    
    const sortSelect = screen.getByTestId('sort-select');
    await user.selectOptions(sortSelect, 'name');
    
    expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      sortBy: 'name'
    }));
  });

  it('calls onFilterChange when featured checkbox is toggled', async () => {
    const handleFilterChange = vi.fn();
    const user = userEvent.setup();
    
    render(
      <ActionsFilter 
        categories={mockCategories}
        filters={defaultFilters}
        onFilterChange={handleFilterChange} 
      />
    );
    
    const featuredCheckbox = screen.getByTestId('featured-checkbox');
    await user.click(featuredCheckbox);
    
    expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      onlyFeatured: true
    }));
  });

  it('displays provided filter values', () => {
    const customFilters: CatalogFilterOptions = {
      searchText: 'initial',
      categories: ['testing'],
      onlyFeatured: true,
      sortBy: 'name',
      sortDirection: 'desc'
    };
    
    render(
      <ActionsFilter 
        categories={mockCategories}
        filters={customFilters}
        onFilterChange={vi.fn()} 
      />
    );
    
    // Check that search input has initial value
    expect(screen.getByTestId('actions-search-input')).toHaveValue('initial');
    
    // Check that featured checkbox is checked
    expect(screen.getByTestId('featured-checkbox')).toBeChecked();
    
    // Check that sort select has initial value
    expect(screen.getByTestId('sort-select')).toHaveValue('name');
    expect(screen.getByTestId('sort-direction-select')).toHaveValue('desc');
  });
});