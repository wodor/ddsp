/**
 * Component for creating GitHub Action wrappers
 */
import { useState } from 'react';
import styled from 'styled-components';
import mcpClient from '../services/mcpClient';
import mcpServerManager from '../services/mcpServerManager';
import wrapperIntegrationService from '../services/wrapperIntegration';
import type { ActionAnalysisResult, WrapperConfiguration } from '../types/mcpConfig';
import ActionAnalysisView from './ActionAnalysisView';
import WrapperConfigForm from './WrapperConfigForm';
import CodePreview from './CodePreview';

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

const StepContainer = styled.div`
  margin-top: 20px;
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const StepNumber = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #0366d6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-weight: 600;
`;

const StepTitle = styled.h3`
  margin: 0;
`;

/**
 * Component for creating GitHub Action wrappers
 */
const ActionWrapperCreator: React.FC = () => {
  const [url, setUrl] = useState('');
  const [version, setVersion] = useState('main');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ActionAnalysisResult | null>(null);
  const [configuration, setConfiguration] = useState<WrapperConfiguration | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  /**
   * Handles form submission for action analysis
   * @param e - The form event
   */
  const handleAnalyzeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setConfiguration(null);
    setGeneratedCode(null);
    setSaveSuccess(false);
    setSaveError(null);

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
      setCurrentStep(2);
    } catch (error) {
      setError(`Failed to analyze GitHub Action: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles configuration submission
   * @param config - The wrapper configuration
   */
  const handleConfigSubmit = async (config: WrapperConfiguration) => {
    if (!analysis) return;
    
    setLoading(true);
    setConfiguration(config);
    
    try {
      // Generate wrapper code
      const code = await mcpClient.generateWrapperCode(url, analysis, config);
      setGeneratedCode(code);
      setCurrentStep(3);
    } catch (error) {
      setError(`Failed to generate wrapper code: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles saving the generated code
   */
  const handleSaveCode = async () => {
    if (!generatedCode || !configuration || !analysis) return;
    
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      // Save the wrapper code
      const filePath = await wrapperIntegrationService.saveWrapperCode(generatedCode, configuration);
      
      // Register with catalog
      await wrapperIntegrationService.registerWithCatalog(url, analysis, configuration, filePath);
      
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(`Failed to save wrapper: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handles going back to a previous step
   * @param step - The step to go back to
   */
  const handleGoBack = (step: number) => {
    setCurrentStep(step);
    if (step < 3) {
      setGeneratedCode(null);
      setSaveSuccess(false);
      setSaveError(null);
    }
    if (step < 2) {
      setConfiguration(null);
    }
  };

  return (
    <Container>
      <Title>Create GitHub Action Wrapper</Title>
      
      <StepContainer>
        <StepHeader>
          <StepNumber>1</StepNumber>
          <StepTitle>Select GitHub Action</StepTitle>
        </StepHeader>
        
        <Form onSubmit={handleAnalyzeSubmit}>
          <InputGroup>
            <Label htmlFor="url">GitHub Action URL</Label>
            <Input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/actions/checkout"
              required
              disabled={currentStep > 1 && !!analysis}
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
              disabled={currentStep > 1 && !!analysis}
            />
          </InputGroup>
          {currentStep === 1 && (
            <Button type="submit" disabled={loading || !url}>
              {loading ? 'Analyzing...' : 'Analyze Action'}
            </Button>
          )}
        </Form>

        {loading && currentStep === 1 && <LoadingIndicator>Analyzing GitHub Action...</LoadingIndicator>}
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </StepContainer>

      {analysis && (
        <StepContainer>
          <StepHeader>
            <StepNumber>2</StepNumber>
            <StepTitle>Configure Wrapper</StepTitle>
          </StepHeader>
          
          <ActionAnalysisView analysis={analysis} />
          
          {currentStep === 2 && (
            <WrapperConfigForm 
              analysis={analysis} 
              onSubmit={handleConfigSubmit} 
              onBack={() => handleGoBack(1)}
              isSubmitting={loading}
            />
          )}
        </StepContainer>
      )}

      {generatedCode && configuration && (
        <StepContainer>
          <StepHeader>
            <StepNumber>3</StepNumber>
            <StepTitle>Review and Save</StepTitle>
          </StepHeader>
          
          <CodePreview code={generatedCode} />
          
          {currentStep === 3 && (
            <div>
              <Button 
                onClick={handleSaveCode} 
                disabled={saving || saveSuccess}
              >
                {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Wrapper'}
              </Button>
              <Button 
                onClick={() => handleGoBack(2)} 
                style={{ marginLeft: '10px', backgroundColor: '#6c757d' }}
                disabled={saving}
              >
                Back to Configuration
              </Button>
              
              {saveError && <ErrorMessage>{saveError}</ErrorMessage>}
              {saveSuccess && (
                <div style={{ color: '#2ea44f', marginTop: '10px' }}>
                  Wrapper saved successfully! It has been added to your action catalog.
                </div>
              )}
            </div>
          )}
        </StepContainer>
      )}
    </Container>
  );
};

export default ActionWrapperCreator;