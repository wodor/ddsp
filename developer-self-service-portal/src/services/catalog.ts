/**
 * Service for managing the actions catalog
 */
import type { 
  ActionCatalog, 
  CatalogAction, 
  CatalogFilterOptions, 
  CatalogLoadOptions 
} from '../types/catalog';
import { GitHubApiClient } from './github';

/**
 * Service for managing the actions catalog
 */
export class CatalogService {
  private catalog: ActionCatalog | null = null;
  private githubClient: GitHubApiClient;
  private readonly storageKey = 'dssp_action_catalog';
  private readonly catalogRefreshThreshold = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  /**
   * Creates a new instance of the CatalogService
   * @param githubClient - The GitHub API client to use
   */
  constructor(githubClient: GitHubApiClient) {
    this.githubClient = githubClient;
  }
  
  /**
   * Loads the action catalog from local storage or from the source
   * @param options - Options for loading the catalog
   * @returns The action catalog
   */
  public async loadCatalog(options: CatalogLoadOptions = {}): Promise<ActionCatalog> {
    const { forceRefresh = false } = options;
    
    // Try to load from local storage first, unless force refresh is requested
    if (!forceRefresh) {
      const cachedCatalog = this.loadFromLocalStorage();
      if (cachedCatalog && this.isCatalogFresh(cachedCatalog)) {
        this.catalog = cachedCatalog;
        return cachedCatalog;
      }
    }
    
    // If we don't have a cached catalog or it's stale, load from sources
    try {
      // First try to load from static JSON
      const staticCatalog = await this.loadFromStaticSource();
      
      // Then enrich with data from GitHub API if possible
      const enrichedCatalog = await this.enrichFromGitHubApi(staticCatalog);
      
      // Save to local storage and return
      this.catalog = enrichedCatalog;
      this.saveToLocalStorage(enrichedCatalog);
      return enrichedCatalog;
    } catch (error) {
      console.error('Failed to load catalog from sources:', error);
      
      // If we have a cached catalog, return it even if it's stale
      const cachedCatalog = this.loadFromLocalStorage();
      if (cachedCatalog) {
        this.catalog = cachedCatalog;
        return cachedCatalog;
      }
      
      // If all else fails, return an empty catalog
      const emptyCatalog: ActionCatalog = {
        actions: [],
        categories: [],
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        }
      };
      
      this.catalog = emptyCatalog;
      return emptyCatalog;
    }
  }
  
  /**
   * Gets all actions in the catalog
   * @param options - Filter options
   * @returns Filtered list of actions
   */
  public async getActions(options: CatalogFilterOptions = {}): Promise<CatalogAction[]> {
    const catalog = this.catalog || await this.loadCatalog();
    let actions = catalog.actions;
    
    // Apply filters
    if (options.searchText) {
      const searchLower = options.searchText.toLowerCase();
      actions = actions.filter(action => 
        action.name.toLowerCase().includes(searchLower) ||
        action.description.toLowerCase().includes(searchLower) ||
        action.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    if (options.categories && options.categories.length > 0) {
      actions = actions.filter(action => 
        options.categories?.includes(action.category)
      );
    }
    
    if (options.onlyFeatured) {
      actions = actions.filter(action => action.featured);
    }
    
    // Apply sorting
    if (options.sortBy) {
      const direction = options.sortDirection === 'desc' ? -1 : 1;
      
      actions = [...actions].sort((a, b) => {
        switch (options.sortBy) {
          case 'name':
            return direction * a.name.localeCompare(b.name);
          case 'lastUpdated':
            if (!a.lastUpdated) return direction;
            if (!b.lastUpdated) return -direction;
            return direction * (new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime());
          case 'category':
            return direction * a.category.localeCompare(b.category);
          default:
            return 0;
        }
      });
    }
    
    return actions;
  }
  
  /**
   * Gets a specific action by ID
   * @param id - The ID of the action to get
   * @returns The action, or null if not found
   */
  public async getActionById(id: string): Promise<CatalogAction | null> {
    const catalog = this.catalog || await this.loadCatalog();
    return catalog.actions.find(action => action.id === id) || null;
  }
  
  /**
   * Gets all categories in the catalog
   * @returns List of categories
   */
  public async getCategories(): Promise<ActionCatalog['categories']> {
    const catalog = this.catalog || await this.loadCatalog();
    return catalog.categories;
  }
  
  /**
   * Refreshes the catalog from the source
   * @returns The refreshed catalog
   */
  public async refreshCatalog(): Promise<ActionCatalog> {
    return this.loadCatalog({ forceRefresh: true });
  }
  
  /**
   * Loads the catalog from local storage
   * @returns The catalog from local storage, or null if not found
   */
  private loadFromLocalStorage(): ActionCatalog | null {
    try {
      const catalogJson = localStorage.getItem(this.storageKey);
      if (!catalogJson) return null;
      
      const catalog = JSON.parse(catalogJson) as ActionCatalog;
      return catalog;
    } catch (error) {
      console.error('Failed to load catalog from local storage:', error);
      return null;
    }
  }
  
  /**
   * Saves the catalog to local storage
   * @param catalog - The catalog to save
   */
  private saveToLocalStorage(catalog: ActionCatalog): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(catalog));
    } catch (error) {
      console.error('Failed to save catalog to local storage:', error);
    }
  }
  
  /**
   * Checks if the catalog is fresh (updated within the refresh threshold)
   * @param catalog - The catalog to check
   * @returns Whether the catalog is fresh
   */
  private isCatalogFresh(catalog: ActionCatalog): boolean {
    if (!catalog.metadata.lastUpdated) return false;
    
    const lastUpdated = new Date(catalog.metadata.lastUpdated).getTime();
    const now = new Date().getTime();
    
    return now - lastUpdated < this.catalogRefreshThreshold;
  }
  
  /**
   * Loads the catalog from a static JSON source
   * @returns The catalog from the static source
   */
  private async loadFromStaticSource(): Promise<ActionCatalog> {
    try {
      // In a real implementation, this would load from a static JSON file
      // For now, we'll return a sample catalog
      return {
        actions: [
          {
            id: 'deploy-to-s3',
            name: 'Deploy to S3',
            description: 'Deploys static assets to an AWS S3 bucket',
            category: 'deployment',
            repository: 'organization/actions-repo',
            workflowPath: '.github/workflows/deploy-s3.yml',
            inputs: [
              {
                name: 'bucket',
                description: 'The S3 bucket to deploy to',
                required: true,
                type: 'string'
              },
              {
                name: 'source-dir',
                description: 'The directory containing files to upload',
                required: true,
                default: 'dist',
                type: 'string'
              },
              {
                name: 'cloudfront-distribution-id',
                description: 'CloudFront distribution ID to invalidate',
                required: false,
                type: 'string'
              }
            ],
            documentation: '# Deploy to S3\n\nThis action deploys static assets to an AWS S3 bucket.',
            tags: ['aws', 's3', 'deployment', 'static-site'],
            featured: true,
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'run-tests',
            name: 'Run Tests',
            description: 'Runs the test suite for a project',
            category: 'testing',
            repository: 'organization/actions-repo',
            workflowPath: '.github/workflows/run-tests.yml',
            inputs: [
              {
                name: 'test-command',
                description: 'The command to run tests',
                required: false,
                default: 'npm test',
                type: 'string'
              },
              {
                name: 'coverage',
                description: 'Whether to collect coverage',
                required: false,
                default: 'true',
                type: 'boolean',
                options: ['true', 'false']
              }
            ],
            documentation: '# Run Tests\n\nThis action runs the test suite for a project.',
            tags: ['testing', 'ci'],
            lastUpdated: new Date().toISOString()
          }
        ],
        categories: [
          {
            id: 'deployment',
            name: 'Deployment',
            description: 'Actions for deploying applications'
          },
          {
            id: 'testing',
            name: 'Testing',
            description: 'Actions for running tests'
          }
        ],
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        }
      };
    } catch (error) {
      console.error('Failed to load catalog from static source:', error);
      throw error;
    }
  }
  
  /**
   * Enriches the catalog with data from the GitHub API
   * @param baseCatalog - The base catalog to enrich
   * @returns The enriched catalog
   */
  private async enrichFromGitHubApi(baseCatalog: ActionCatalog): Promise<ActionCatalog> {
    try {
      if (!this.githubClient.isAuthenticated()) {
        // If not authenticated, just return the base catalog
        return baseCatalog;
      }
      
      // Clone the catalog to avoid modifying the original
      const enrichedCatalog: ActionCatalog = JSON.parse(JSON.stringify(baseCatalog));
      
      // Enrich each action with data from GitHub API
      for (const action of enrichedCatalog.actions) {
        try {
          // Extract owner and repo from repository string
          const [owner, repo] = action.repository.split('/');
          
          // Get workflow file content to extract more details
          if (owner && repo && action.workflowPath) {
            // Get the workflow content but we don't need to use it yet
            await this.githubClient.getFileContent(
              owner,
              repo,
              action.workflowPath
            );
            
            // In a real implementation, we would parse the workflow YAML
            // and extract more details about the action
            
            // For now, just update the lastUpdated field
            action.lastUpdated = new Date().toISOString();
          }
        } catch (actionError) {
          console.error(`Failed to enrich action ${action.id}:`, actionError);
          // Continue with the next action
        }
      }
      
      // Update metadata
      enrichedCatalog.metadata.lastUpdated = new Date().toISOString();
      
      return enrichedCatalog;
    } catch (error) {
      console.error('Failed to enrich catalog from GitHub API:', error);
      // Return the base catalog if enrichment fails
      return baseCatalog;
    }
  }
}