/**
 * Types for the action catalog system
 */

/**
 * Represents an input parameter for a GitHub Action
 */
export interface ActionInput {
  /** The name of the input parameter */
  name: string;
  /** Description of what the input parameter does */
  description: string;
  /** Whether the input is required */
  required: boolean;
  /** Default value for the input, if any */
  default?: string;
  /** Type of the input (string, boolean, number, etc.) */
  type?: string;
  /** Options for select-type inputs */
  options?: string[];
  /** Enhanced input configuration for improved UI experience */
  enhanced?: {
    /** Type of enhanced input component to use */
    type: string;
    /** Source of data for the input */
    dataSource: string;
    /** API method to call for data (if dataSource is github-api) */
    apiMethod?: string;
    /** Parameters for the API method */
    apiParams?: Record<string, any>;
    /** Name of another input this input depends on */
    dependsOn?: string;
    /** Condition for showing this input */
    condition?: string;
  };
}

/**
 * Represents a GitHub Action in the catalog
 */
export interface CatalogAction {
  /** Unique identifier for the action */
  id: string;
  /** Display name of the action */
  name: string;
  /** Short description of what the action does */
  description: string;
  /** Category for grouping similar actions */
  category: string;
  /** Repository where the action is defined */
  repository: string;
  /** Path to the workflow file within the repository */
  workflowPath: string;
  /** Input parameters for the action */
  inputs: ActionInput[];
  /** Markdown documentation for the action */
  documentation?: string;
  /** URL to the action's documentation */
  documentationUrl?: string;
  /** Tags for filtering and searching */
  tags?: string[];
  /** Version of the action */
  version?: string;
  /** Whether the action is featured/recommended */
  featured?: boolean;
  /** Timestamp when the action was last updated */
  lastUpdated?: string;
}

/**
 * Represents a category of actions
 */
export interface ActionCategory {
  /** Unique identifier for the category */
  id: string;
  /** Display name of the category */
  name: string;
  /** Description of the category */
  description: string;
}

/**
 * Represents the complete action catalog
 */
export interface ActionCatalog {
  /** List of all actions in the catalog */
  actions: CatalogAction[];
  /** List of all categories */
  categories: ActionCategory[];
  /** Metadata about the catalog */
  metadata: {
    /** When the catalog was last updated */
    lastUpdated: string;
    /** Version of the catalog */
    version: string;
  };
}

/**
 * Options for loading the action catalog
 */
export interface CatalogLoadOptions {
  /** Whether to force a refresh from the source */
  forceRefresh?: boolean;
  /** Whether to include deprecated actions */
  includeDeprecated?: boolean;
}

/**
 * Filter options for searching the catalog
 */
export interface CatalogFilterOptions {
  /** Text to search for in name, description, and tags */
  searchText?: string;
  /** Filter by specific categories */
  categories?: string[];
  /** Only include featured actions */
  onlyFeatured?: boolean;
  /** Sort order for results */
  sortBy?: 'name' | 'lastUpdated' | 'category';
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}