import React, { useState } from 'react';
import styled from 'styled-components';
import mcpClient from '../services/mcpClient';
import mcpServerManager from '../services/mcpServerManager';
import mcpConfigService from '../services/mcpConfig';
import type { ActionAnalysisResult } from '../types/mcpConfig';

const Container = styled.div`
  padding: 20px;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin-top: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-weight: 600;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #2ea44f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 10px;

  &:hover {
    background-color: #2c974b;
  }

  &:disabled {
    background-color: #94d3a2;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #cb2431;
  margin-top: 10px;
`;

const LoadingIndicator = styled.div`
  margin-top: 10px;
  color: #586069;
`;

/**
 * Component for importing GitHub Actions from a URL
 */
const WorkflowUrlImporter: React.FC = () => {
  const [url, setUrl] = useState('');
  const [version, setVersion] = useState('main');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ActionAnalysisResult | null>(null);

  /**
   * Handles form submission
   * @param e - The form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      // Check if the MCP server is running
      const isRunning = await mcpClient.isServerRunning();
      if (!isRunning) {
        // Start the MCP server if it's not running
        await mcpServerManager.startServer();
      }

      // Analyze the GitHub Action
      const result = await mcpClient.analyzeGitHubAction(url, version);
      setAnalysis(result);
    } catch (error) {
      setError(`Failed to analyze GitHub Action: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Title>Import GitHub Action</Title>
      <Form onSubmit={handleSubmit}>
        <InputGroup>
          <Label htmlFor="url">GitHub Action URL</Label>
          <Input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/actions/checkout"
            required
          />
        </InputGroup>
        <InputGroup>
          <Label htmlFor="version">Version/Tag</Label>
          <Input
            id="version"
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="main, v4, etc."
          />
        </InputGroup>
        <Button type="submit" disabled={loading || !url}>
          {loading ? 'Analyzing...' : 'Analyze Action'}
        </Button>
      </Form>

      {loading && <LoadingIndicator>Analyzing GitHub Action...</LoadingIndicator>}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {analysis && (
        <div>
          <h3>Analysis Results</h3>
          <p>
            <strong>Name:</strong> {analysis.name}
          </p>
          <p>
            <strong>Description:</strong> {analysis.description}
          </p>
          <h4>Inputs</h4>
          <ul>
            {Object.entries(analysis.inputs).map(([name, input]) => (
              <li key={name}>
                <strong>{name}</strong>
                {input.required && ' (Required)'}: {input.description}
                {input.default && ` (Default: ${input.default})`}
              </li>
            ))}
          </ul>
          <h4>Outputs</h4>
          {Object.keys(analysis.outputs).length > 0 ? (
            <ul>
              {Object.entries(analysis.outputs).map(([name, output]) => (
                <li key={name}>
                  <strong>{name}</strong>: {output.description}
                </li>
              ))}
            </ul>
          ) : (
            <p>No outputs defined</p>
          )}
          
          {/* This is just a placeholder - we'll implement the full UI in a later task */}
          <Button>Continue to Configuration</Button>
        </div>
      )}
    </Container>
  );
};

export default WorkflowUrlImporter;