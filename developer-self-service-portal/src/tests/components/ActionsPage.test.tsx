import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ActionsPage from '../../pages/ActionsPage';
import { configService } from '../../services/config';

// Mock the services
vi.mock('../../services/catalog', () => {
  return {
    CatalogService: vi.fn().mockImplementation(() => ({
      loadCatalog: vi.fn().mockResolvedValue({}),
      getActions: vi.fn().mockResolvedValue([
        {
          id: 'test-action-1',
          name: 'Test Action 1',
          description: 'Test description 1',
          category: 'testing',
          repository: 'test/repo',
          workflowPath: '.github/workflows/test.yml',
          inputs: [],
          featured: true
        },
        {
          id: 'test-action-2',
          name: 'Test Action 2',
          description: 'Test description 2',
          category: 'deployment',
          repository: 'test/repo',
          workflowPath: '.github/workflows/deploy.yml',
          inputs: []
        }
      ]),
      getCategories: vi.fn().mockResolvedValue([
        { id: 'testing', name: 'Testing', description: 'Testing actions' },
        { id: 'deployment', name: 'Deployment', description: 'Deployment actions' }
      ]),
      refreshCatalog: vi.fn().mockResolvedValue({})
    }))
  };
});

vi.mock('../../services/github', () => {
  return {
    GitHubApiClient: vi.fn().mockImplementation(() => ({
      isAuthenticated: vi.fn().mockReturnValue(true)
    }))
  };
});

vi.mock('../../services/config', () => {
  return {
    configService: {
      getGitHubToken: vi.fn().mockReturnValue('fake-token')
    }
  };
});

describe('ActionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title and refresh button', () => {
    render(
      <BrowserRouter>
        <ActionsPage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('GitHub Actions Catalog')).toBeInTheDocument();
    expect(screen.getByText('Refresh Catalog')).toBeInTheDocument();
  });

  it('shows token warning when no token is configured', () => {
    // Mock the token as undefined for this test
    (configService.getGitHubToken as any).mockReturnValueOnce(undefined);
    
    render(
      <BrowserRouter>
        <ActionsPage />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('token-warning')).toBeInTheDocument();
    expect(screen.getByText('GitHub token not configured.')).toBeInTheDocument();
    expect(screen.getByText('Configure your GitHub token')).toBeInTheDocument();
  });
});