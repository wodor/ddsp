import React, { useState } from 'react';
import { GitHubApiClient } from '../services/github';
import WorkflowUrlImporter from '../components/WorkflowUrlImporter';
import type { CatalogAction } from '../types/catalog';

/**
 * Example component showing how to use the WorkflowUrlImporter
 */
const WorkflowUrlImporterExample: React.FC = () => {
  const [token, setToken] = useState<string>('');
  const [githubClient, setGithubClient] = useState<GitHubApiClient | null>(null);
  const [actions, setActions] = useState<CatalogAction[]>([]);
  
  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
  };
  
  const handleConnect = () => {
    if (token.trim()) {
      const client = new GitHubApiClient(token);
      setGithubClient(client);
    }
  };
  
  const handleActionCreated = (action: CatalogAction) => {
    setActions(prevActions => [...prevActions, action]);
  };
  
  return (
    <div className="workflow-url-importer-example">
      <h1>GitHub Workflow Importer</h1>
      
      {!githubClient ? (
        <div className="token-form">
          <h2>Connect to GitHub</h2>
          <p>Enter your GitHub personal access token to connect to the GitHub API:</p>
          
          <div className="input-group">
            <input
              type="password"
              value={token}
              onChange={handleTokenChange}
              placeholder="GitHub Personal Access Token"
              className="token-input"
            />
            
            <button
              onClick={handleConnect}
              disabled={!token.trim()}
              className="connect-button"
            >
              Connect
            </button>
          </div>
          
          <p className="token-help">
            <small>
              Your token needs the <code>repo</code> scope to access private repositories.
            </small>
          </p>
        </div>
      ) : (
        <>
          <div className="connected-status">
            <p>✅ Connected to GitHub API</p>
            <button
              onClick={() => setGithubClient(null)}
              className="disconnect-button"
            >
              Disconnect
            </button>
          </div>
          
          <WorkflowUrlImporter
            githubClient={githubClient}
            onActionCreated={handleActionCreated}
          />
          
          {actions.length > 0 && (
            <div className="imported-actions">
              <h2>Imported Actions ({actions.length})</h2>
              
              <ul className="actions-list">
                {actions.map(action => (
                  <li key={action.id} className="action-item">
                    <h3>{action.name}</h3>
                    <p>{action.description}</p>
                    <p><strong>Repository:</strong> {action.repository}</p>
                    <p><strong>Path:</strong> {action.workflowPath}</p>
                    <p><strong>Inputs:</strong> {action.inputs.length}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      
      <div className="usage-instructions">
        <h2>How to Use</h2>
        <ol>
          <li>Enter your GitHub personal access token and click "Connect"</li>
          <li>Paste a GitHub workflow URL (e.g., <code>https://github.com/arbor-education/sis/actions/workflows/deploy_test_branch.yaml</code>)</li>
          <li>Click "Fetch Metadata" to preview the workflow metadata</li>
          <li>Click "Create Action" to create an action from the workflow</li>
        </ol>
        
        <h3>Supported URL Formats</h3>
        <ul>
          <li><code>https://github.com/{owner}/{repo}/actions/workflows/{filename}</code></li>
          <li><code>https://github.com/{owner}/{repo}/blob/{branch}/{path}</code></li>
        </ul>
        
        <div className="note">
          <p><strong>Note:</strong> For private repositories, your token must have the <code>repo</code> scope.</p>
        </div>
      </div>
    </div>
  );
};

export default WorkflowUrlImporterExample;