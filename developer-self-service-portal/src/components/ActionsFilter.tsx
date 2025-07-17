import React, { type FC } from 'react';
import styled from 'styled-components';
import { FaSearch, FaFilter, FaStar } from 'react-icons/fa';
import type { ActionCategory, CatalogFilterOptions } from '../types/catalog';

interface ActionsFilterProps {
  categories: ActionCategory[];
  filters: CatalogFilterOptions;
  onFilterChange: (filters: CatalogFilterOptions) => void;
}

const FilterContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 24px;
`;

const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 8px;
  color: var(--secondary-color);
`;

const FilterTitle = styled.h3`
  margin: 0;
  font-size: 18px;
`;

const FilterForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SearchGroup = styled.div`
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CategoryList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const CategoryCheckbox = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #f6f8fa;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e1e4e8;
  }

  input:checked + & {
    background-color: #ddf4ff;
    color: var(--primary-color);
  }
`;

const SortGroup = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const SortSelect = styled.select`
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: white;
`;

const FeaturedCheckbox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FeaturedIcon = styled(FaStar)`
  color: var(--warning-color);
`;

/**
 * ActionsFilter component provides filtering and search functionality for the actions catalog
 */
const ActionsFilter: FC<ActionsFilterProps> = ({ 
  categories, 
  filters,
  onFilterChange
}) => {
  // Handle search text change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      searchText: e.target.value
    });
  };
  
  // Handle category selection change
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const currentCategories = filters.categories || [];
    
    if (checked) {
      onFilterChange({
        ...filters,
        categories: [...currentCategories, categoryId]
      });
    } else {
      onFilterChange({
        ...filters,
        categories: currentCategories.filter(id => id !== categoryId)
      });
    }
  };
  
  // Handle sort option change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'name' | 'lastUpdated' | 'category' | '';
    
    if (value) {
      onFilterChange({
        ...filters,
        sortBy: value
      });
    } else {
      // Remove sort if empty value selected
      const { sortBy, ...rest } = filters;
      onFilterChange(rest);
    }
  };
  
  // Handle sort direction change
  const handleSortDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'asc' | 'desc';
    
    onFilterChange({
      ...filters,
      sortDirection: value
    });
  };
  
  // Handle featured filter change
  const handleFeaturedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      onlyFeatured: e.target.checked
    });
  };
  
  return (
    <FilterContainer>
      <FilterHeader>
        <FaFilter />
        <FilterTitle>Filter Actions</FilterTitle>
      </FilterHeader>
      
      <FilterForm onSubmit={(e) => e.preventDefault()}>
        <SearchGroup>
          <SearchIcon>
            <FaSearch />
          </SearchIcon>
          <SearchInput 
            type="text"
            placeholder="Search actions..."
            value={filters.searchText || ''}
            onChange={handleSearchChange}
            data-testid="actions-search-input"
          />
        </SearchGroup>
        
        <FilterGroup>
          <FilterLabel>
            <FaFilter /> Categories
          </FilterLabel>
          <CategoryList>
            {categories.map((category) => (
              <CategoryCheckbox key={category.id}>
                <input
                  type="checkbox"
                  id={`category-${category.id}`}
                  checked={filters.categories?.includes(category.id) || false}
                  onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                  style={{ display: 'none' }}
                />
                <CheckboxLabel htmlFor={`category-${category.id}`}>
                  {category.name}
                </CheckboxLabel>
              </CategoryCheckbox>
            ))}
          </CategoryList>
        </FilterGroup>
        
        <FilterGroup>
          <FilterLabel>Sort</FilterLabel>
          <SortGroup>
            <SortSelect 
              value={filters.sortBy || ''} 
              onChange={handleSortChange}
              data-testid="sort-select"
            >
              <option value="">Default</option>
              <option value="name">Name</option>
              <option value="lastUpdated">Last Updated</option>
              <option value="category">Category</option>
            </SortSelect>
            
            <SortSelect 
              value={filters.sortDirection || 'asc'} 
              onChange={handleSortDirectionChange}
              data-testid="sort-direction-select"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </SortSelect>
          </SortGroup>
        </FilterGroup>
        
        <FeaturedCheckbox>
          <input
            type="checkbox"
            id="featured-only"
            checked={filters.onlyFeatured || false}
            onChange={handleFeaturedChange}
            data-testid="featured-checkbox"
          />
          <label htmlFor="featured-only">
            <FeaturedIcon /> Show featured actions only
          </label>
        </FeaturedCheckbox>
      </FilterForm>
    </FilterContainer>
  );
};

export default ActionsFilter;