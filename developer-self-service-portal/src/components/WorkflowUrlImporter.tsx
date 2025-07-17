import React, { useState } from 'react';
import { GitHubApiClient } from '../services/github';
import { createActionFromUrl, fetchWorkflowMetadataFromUrl } from '../utils/workflowUrlParser';
import type { CatalogAction } from '../types/catalog';

interface WorkflowUrlImporterProps {
  githubClient: GitHubApiClient;
  onActionCreated?: (action: CatalogAction) => void;
}

/**
 * Component for importing GitHub workflow files from URLs
 */
const WorkflowUrlImporter: React.FC<WorkflowUrlImporterProps> = ({ 
  githubClient,
  onActionCreated 
}) => {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any | null>(null);
  const [action, setAction] = useState<CatalogAction | null>(null);
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(null);
    setMetadata(null);
    setAction(null);
  };
  
  const handleFetchMetadata = async () => {
    if (!url.trim()) {
      setError('Please enter a GitHub workflow URL');
      return;
    }
    
    setLoading(true);
    setError(null);
    setMetadata(null);
    setAction(null);
    
    try {
      const result = await fetchWorkflowMetadataFromUrl(url, githubClient);
      
      if (!result) {
        throw new Error('Failed to fetch workflow metadata');
      }
      
      if (!result.hasDispatchTrigger) {
        throw new Error('This workflow does not have a workflow_dispatch trigger and cannot be used as an action');
      }
      
      setMetadata(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateAction = async () => {
    if (!url.trim()) {
      setError('Please enter a GitHub workflow URL');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await createActionFromUrl(url, githubClient);
      
      if (!result) {
        throw new Error('Failed to create action from workflow');
      }
      
      setAction(result);
      
      if (onActionCreated) {
        onActionCreated(result);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="workflow-url-importer">
      <h2>Import GitHub Workflow</h2>
      
      <div className="input-group">
        <input
          type="text"
          value={url}
          onChange={handleUrlChange}
          placeholder="Enter GitHub workflow URL (e.g., https://github.com/owner/repo/actions/workflows/workflow.yml)"
          disabled={loading}
          className="workflow-url-input"
        />
        
        <div className="button-group">
          <button
            onClick={handleFetchMetadata}
            disabled={loading || !url.trim()}
            className="fetch-button"
          >
            {loading ? 'Loading...' : 'Fetch Metadata'}
          </button>
          
          <button
            onClick={handleCreateAction}
            disabled={loading || !url.trim()}
            className="create-button"
          >
            {loading ? 'Loading...' : 'Create Action'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {metadata && (
        <div className="metadata-preview">
          <h3>Workflow Metadata</h3>
          <div className="metadata-content">
            <p><strong>Name:</strong> {metadata.name}</p>
            <p><strong>Description:</strong> {metadata.description}</p>
            <p><strong>Has Dispatch Trigger:</strong> {metadata.hasDispatchTrigger ? 'Yes' : 'No'}</p>
            
            <h4>Inputs:</h4>
            <ul className="inputs-list">
              {metadata.inputs.map((input: any) => (
                <li key={input.name}>
                  <strong>{input.name}</strong>
                  {input.required && <span className="required-badge">Required</span>}
                  <p>{input.description}</p>
                  {input.type && <p><strong>Type:</strong> {input.type}</p>}
                  {input.default !== undefined && <p><strong>Default:</strong> {input.default}</p>}
                  {input.options && (
                    <div>
                      <strong>Options:</strong>
                      <ul>
                        {input.options.map((option: string) => (
                          <li key={option}>{option}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {action && (
        <div className="action-preview">
          <h3>Created Action</h3>
          <div className="action-content">
            <p><strong>ID:</strong> {action.id}</p>
            <p><strong>Name:</strong> {action.name}</p>
            <p><strong>Description:</strong> {action.description}</p>
            <p><strong>Category:</strong> {action.category}</p>
            <p><strong>Repository:</strong> {action.repository}</p>
            <p><strong>Workflow Path:</strong> {action.workflowPath}</p>
            
            <h4>Inputs:</h4>
            <ul className="inputs-list">
              {action.inputs.map((input) => (
                <li key={input.name}>
                  <strong>{input.name}</strong>
                  {input.required && <span className="required-badge">Required</span>}
                  <p>{input.description}</p>
                  {input.type && <p><strong>Type:</strong> {input.type}</p>}
                  {input.default !== undefined && <p><strong>Default:</strong> {input.default}</p>}
                  {input.options && (
                    <div>
                      <strong>Options:</strong>
                      <ul>
                        {input.options.map((option) => (
                          <li key={option}>{option}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowUrlImporter;