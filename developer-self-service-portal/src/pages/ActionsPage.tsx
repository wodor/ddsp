import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaSync } from 'react-icons/fa';
import { CatalogService } from '../services/catalog';
import { GitHubApiClient } from '../services/github';
import { configService } from '../services/config';
import ActionsFilter from '../components/ActionsFilter';
import ActionsList from '../components/ActionsList';
import type { CatalogAction, CatalogFilterOptions, ActionCategory } from '../types/catalog';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const PageTitle = styled.h2`
  margin: 0;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0255b3;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const TokenWarning = styled.div`
  background-color: #fff3cd;
  color: #856404;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ConfigLink = styled.a`
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

/**
 * ActionsPage component displays the GitHub Actions catalog
 */
const ActionsPage = () => {
  const [actions, setActions] = useState<CatalogAction[]>([]);
  const [categories, setCategories] = useState<ActionCategory[]>([]);
  const [filters, setFilters] = useState<CatalogFilterOptions>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Initialize catalog service
  const token = configService.getGitHubToken() || '';
  const githubClient = new GitHubApiClient(token);
  const catalogService = new CatalogService(githubClient);
  
  // Load actions and categories on component mount
  useEffect(() => {
    const loadCatalog = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load catalog
        await catalogService.loadCatalog();
        
        // Get categories
        const catalogCategories = await catalogService.getCategories();
        setCategories(catalogCategories);
        
        // Get actions with current filters
        const catalogActions = await catalogService.getActions(filters);
        setActions(catalogActions);
      } catch (err) {
        console.error('Failed to load catalog:', err);
        setError('Failed to load actions catalog. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCatalog();
    // We only want to run this effect once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Handle filter changes
  const handleFilterChange = async (newFilters: CatalogFilterOptions) => {
    setFilters(newFilters);
    
    try {
      const filteredActions = await catalogService.getActions(newFilters);
      setActions(filteredActions);
    } catch (err) {
      console.error('Failed to apply filters:', err);
      setError('Failed to apply filters. Please try again.');
    }
  };
  
  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      // Refresh catalog
      await catalogService.refreshCatalog();
      
      // Get categories
      const catalogCategories = await catalogService.getCategories();
      setCategories(catalogCategories);
      
      // Get actions with current filters
      const catalogActions = await catalogService.getActions(filters);
      setActions(catalogActions);
    } catch (err) {
      console.error('Failed to refresh catalog:', err);
      setError('Failed to refresh actions catalog. Please try again later.');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle action card click
  const handleActionClick = (actionId: string) => {
    // This will be implemented in a future task
    console.log(`Action clicked: ${actionId}`);
  };
  
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>GitHub Actions Catalog</PageTitle>
        <RefreshButton 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          data-testid="refresh-catalog-button"
        >
          <FaSync /> {isRefreshing ? 'Refreshing...' : 'Refresh Catalog'}
        </RefreshButton>
      </PageHeader>
      
      {!token && (
        <TokenWarning data-testid="token-warning">
          <p>
            <strong>GitHub token not configured.</strong> Some features may be limited.
          </p>
          <p>
            <ConfigLink href="/config">Configure your GitHub token</ConfigLink> to access all features.
          </p>
        </TokenWarning>
      )}
      
      <ActionsFilter 
        categories={categories} 
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      
      <ActionsList 
        actions={actions}
        isLoading={isLoading}
        error={error}
        onActionClick={handleActionClick}
      />
    </PageContainer>
  );
};

export default ActionsPage;