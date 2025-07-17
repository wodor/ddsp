/**
 * Type definitions for the GitHub Actions SDK
 */
import type { CatalogAction, ActionInput } from '../../types/catalog';
import type { FC } from 'react';

/**
 * Configuration for enhancing an action input
 */
export interface InputEnhancementConfig {
  /** Input name pattern to match (string or regex) */
  matcher: string | RegExp;
  /** Enhancement to apply */
  enhancement: {
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
 * Options for generating an action from a workflow
 */
export interface ActionGenerationOptions {
  /** Custom ID for the action (generated from URL if not provided) */
  id?: string;
  /** Custom name for the action (uses workflow name if not provided) */
  name?: string;
  /** Custom description for the action (uses workflow description if not provided) */
  description?: string;
  /** Category for the action */
  category?: string;
  /** Custom documentation for the action */
  documentation?: string;
  /** URL to external documentation */
  documentationUrl?: string;
  /** Tags for the action */
  tags?: string[];
  /** Whether the action is featured */
  featured?: boolean;
  /** Custom input enhancements */
  inputEnhancements?: Record<string, InputEnhancementConfig>;
  /** Default branch to use when triggering the workflow */
  defaultBranch?: string;
}

/**
 * Result of generating an action from a workflow
 */
export interface ActionGenerationResult {
  /** The generated action */
  action: CatalogAction;
  /** TypeScript code for the action definition */
  actionDefinitionCode: string;
  /** TypeScript code for the form component */
  formComponentCode: string;
  /** TypeScript code for registering the action */
  registrationCode: string;
}

/**
 * Represents a GitHub Action with its form component
 */
export interface RegisteredAction extends CatalogAction {
  /** React component for rendering the action form */
  formComponent: FC<any>;
}

/**
 * Parsed components of a GitHub workflow URL
 */
export interface ParsedWorkflowUrl {
  /** Repository owner */
  owner: string;
  /** Repository name */
  repo: string;
  /** Path to the workflow file */
  path: string;
}

/**
 * Workflow metadata extracted from a workflow file
 */
export interface WorkflowMetadata {
  /** Workflow name */
  name: string;
  /** Workflow description */
  description: string;
  /** Whether the workflow has a workflow_dispatch trigger */
  hasDispatchTrigger: boolean;
  /** Workflow inputs */
  inputs: ActionInput[];
}