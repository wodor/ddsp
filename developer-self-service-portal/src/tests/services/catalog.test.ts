/**
 * Tests for the CatalogService
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CatalogService } from '../../services/catalog';
import { GitHubApiClient } from '../../services/github';
import type { ActionCatalog } from '../../types/catalog';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Mock GitHub API client
vi.mock('../../services/github', () => {
  return {
    GitHubApiClient: vi.fn().mockImplementation(() => {
      return {
        isAuthenticated: vi.fn().mockReturnValue(true),
        getFileContent: vi.fn().mockResolvedValue('# Sample workflow file content'),
      };
    }),
  };
});

describe('CatalogService', () => {
  let catalogService: CatalogService;
  let githubClient: GitHubApiClient;
  
  beforeEach(() => {
    // Setup mocks
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    localStorageMock.clear();
    
    // Create a new instance for each test
    githubClient = new GitHubApiClient('fake-token');
    catalogService = new CatalogService(githubClient);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('loadCatalog', () => {
    it('should load catalog from local storage if available and fresh', async () => {
      // Setup mock data
      const mockCatalog: ActionCatalog = {
        actions: [
          {
            id: 'test-action',
            name: 'Test Action',
            description: 'A test action',
            category: 'testing',
            repository: 'test/repo',
            workflowPath: '.github/workflows/test.yml',
            inputs: [],
            lastUpdated: new Date().toISOString(),
          },
        ],
        categories: [
          {
            id: 'testing',
            name: 'Testing',
            description: 'Testing actions',
          },
        ],
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: '1.0.0',
        },
      };
      
      // Store mock catalog in localStorage
      localStorageMock.setItem('dssp_action_catalog', JSON.stringify(mockCatalog));
      
      // Load catalog
      const result = await catalogService.loadCatalog();
      
      // Verify result
      expect(result).toEqual(mockCatalog);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('dssp_action_catalog');
    });
    
    it('should load catalog from source if local storage is empty', async () => {
      // Load catalog
      const result = await catalogService.loadCatalog();
      
      // Verify result
      expect(result).toBeDefined();
      expect(result.actions.length).toBeGreaterThan(0);
      expect(result.categories.length).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
    
    it('should load catalog from source if forceRefresh is true', async () => {
      // Setup mock data
      const mockCatalog: ActionCatalog = {
        actions: [],
        categories: [],
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: '1.0.0',
        },
      };
      
      // Store mock catalog in localStorage
      localStorageMock.setItem('dssp_action_catalog', JSON.stringify(mockCatalog));
      
      // Load catalog with forceRefresh
      const result = await catalogService.loadCatalog({ forceRefresh: true });
      
      // Verify result
      expect(result).toBeDefined();
      expect(result.actions.length).toBeGreaterThan(0);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });
  
  describe('getActions', () => {
    it('should return all actions when no filters are applied', async () => {
      // Load catalog first
      await catalogService.loadCatalog();
      
      // Get actions
      const actions = await catalogService.getActions();
      
      // Verify result
      expect(actions).toBeDefined();
      expect(actions.length).toBeGreaterThan(0);
    });
    
    it('should filter actions by search text', async () => {
      // Load catalog first
      await catalogService.loadCatalog();
      
      // Get actions with search filter
      const actions = await catalogService.getActions({ searchText: 'deploy' });
      
      // Verify result
      expect(actions).toBeDefined();
      expect(actions.length).toBeGreaterThan(0);
      expect(actions.every(action => 
        action.name.toLowerCase().includes('deploy') || 
        action.description.toLowerCase().includes('deploy') ||
        action.tags?.some(tag => tag.toLowerCase().includes('deploy'))
      )).toBe(true);
    });
    
    it('should filter actions by category', async () => {
      // Load catalog first
      await catalogService.loadCatalog();
      
      // Get actions with category filter
      const actions = await catalogService.getActions({ categories: ['deployment'] });
      
      // Verify result
      expect(actions).toBeDefined();
      expect(actions.every(action => action.category === 'deployment')).toBe(true);
    });
    
    it('should filter actions by featured flag', async () => {
      // Load catalog first
      await catalogService.loadCatalog();
      
      // Get featured actions
      const actions = await catalogService.getActions({ onlyFeatured: true });
      
      // Verify result
      expect(actions).toBeDefined();
      expect(actions.every(action => action.featured === true)).toBe(true);
    });
    
    it('should sort actions by name', async () => {
      // Load catalog first
      await catalogService.loadCatalog();
      
      // Get actions sorted by name
      const actions = await catalogService.getActions({ sortBy: 'name' });
      
      // Verify result
      expect(actions).toBeDefined();
      
      // Check if sorted
      const sortedActions = [...actions].sort((a, b) => a.name.localeCompare(b.name));
      expect(actions).toEqual(sortedActions);
    });
  });
  
  describe('getActionById', () => {
    it('should return an action by ID', async () => {
      // Load catalog first
      await catalogService.loadCatalog();
      
      // Get a specific action
      const action = await catalogService.getActionById('deploy-to-s3');
      
      // Verify result
      expect(action).toBeDefined();
      expect(action?.id).toBe('deploy-to-s3');
    });
    
    it('should return null for non-existent action ID', async () => {
      // Load catalog first
      await catalogService.loadCatalog();
      
      // Get a non-existent action
      const action = await catalogService.getActionById('non-existent-action');
      
      // Verify result
      expect(action).toBeNull();
    });
  });
  
  describe('getCategories', () => {
    it('should return all categories', async () => {
      // Load catalog first
      await catalogService.loadCatalog();
      
      // Get categories
      const categories = await catalogService.getCategories();
      
      // Verify result
      expect(categories).toBeDefined();
      expect(categories.length).toBeGreaterThan(0);
    });
  });
  
  describe('refreshCatalog', () => {
    it('should force refresh the catalog', async () => {
      // Setup spy on loadCatalog
      const loadCatalogSpy = vi.spyOn(catalogService, 'loadCatalog');
      
      // Refresh catalog
      await catalogService.refreshCatalog();
      
      // Verify loadCatalog was called with forceRefresh: true
      expect(loadCatalogSpy).toHaveBeenCalledWith({ forceRefresh: true });
    });
  });
});