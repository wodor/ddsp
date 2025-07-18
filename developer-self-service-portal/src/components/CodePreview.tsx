/**
 * Component for previewing generated code
 */
import { useState } from 'react';
import styled from 'styled-components';
import type { ActionAnalysisResult, WrapperConfiguration } from '../types/mcpConfig';
import wrapperIntegrationService from '../services/wrapperIntegration';

const Container = styled.div`
  margin-bottom: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const Title = styled.h4`
  margin: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button`
  background-color: transparent;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background-color: #f6f8fa;
  }
`;

const SaveButton = styled(Button)`
  background-color: #2ea44f;
  color: white;
  border-color: #2ea44f;

  &:hover {
    background-color: #2c974b;
  }
`;

const CodeContainer = styled.div`
  position: relative;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  overflow: hidden;
`;

const Pre = styled.pre`
  margin: 0;
  padding: 16px;
  overflow: auto;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 14px;
  line-height: 1.5;
  background-color: #f6f8fa;
  max-height: 400px;
`;

const Code = styled.code`
  font-family: inherit;
  white-space: pre;
`;

// Styled components for line numbers - will be used in future implementation
/*
const LineNumbers = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  padding: 16px 0;
  background-color: #f6f8fa;
  border-right: 1px solid #e1e4e8;
  text-align: right;
  user-select: none;
`;

const LineNumber = styled.div`
  color: #6a737d;
  padding: 0 8px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 14px;
  line-height: 1.5;
`;
*/

const StatusMessage = styled.span<{ $success?: boolean }>`
  color: ${props => props.$success ? '#2ea44f' : '#cb2431'};
  margin-left: 8px;
`;

interface CodePreviewProps {
  /** The code to preview */
  code: string;
  /** The title of the code preview */
  title?: string;
  /** Whether to show save and integrate buttons */
  showActions?: boolean;
  /** The URL of the GitHub Action (for integration) */
  actionUrl?: string;
  /** The analysis result (for integration) */
  actionAnalysis?: ActionAnalysisResult;
  /** The wrapper configuration (for integration) */
  wrapperConfig?: WrapperConfiguration;
  /** Callback when integration is complete */
  onIntegrationComplete?: (actionId: string) => void;
}

/**
 * Component for previewing generated code
 */
const CodePreview: React.FC<CodePreviewProps> = ({ 
  code, 
  title = 'Generated Code',
  showActions = false,
  actionUrl,
  actionAnalysis,
  wrapperConfig,
  onIntegrationComplete
}) => {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [integrating, setIntegrating] = useState(false);
  const [status, setStatus] = useState<{ message: string; success: boolean } | null>(null);

  /**
   * Handles copying the code to the clipboard
   */
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Handles saving the code to the file system
   */
  const handleSave = async () => {
    if (!wrapperConfig) {
      setStatus({ message: 'Missing wrapper configuration', success: false });
      return;
    }

    try {
      setSaving(true);
      setStatus(null);
      
      const filePath = await wrapperIntegrationService.saveWrapperCode(code, wrapperConfig);
      
      setStatus({ message: 'Code saved successfully', success: true });
      return filePath;
    } catch (error) {
      console.error('Error saving code:', error);
      setStatus({ message: `Error saving code: ${error instanceof Error ? error.message : String(error)}`, success: false });
      return null;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Handles integrating the wrapper with the catalog
   */
  const handleIntegrate = async () => {
    if (!actionUrl || !actionAnalysis || !wrapperConfig) {
      setStatus({ message: 'Missing required information for integration', success: false });
      return;
    }

    try {
      setIntegrating(true);
      setStatus(null);
      
      // First save the code
      const filePath = await handleSave();
      if (!filePath) {
        throw new Error('Failed to save code');
      }
      
      // Then register with the catalog
      const actionId = await wrapperIntegrationService.registerWithCatalog(
        actionUrl,
        actionAnalysis,
        wrapperConfig,
        filePath
      );
      
      setStatus({ message: 'Integration complete', success: true });
      
      // Call the callback if provided
      if (onIntegrationComplete) {
        onIntegrationComplete(actionId);
      }
    } catch (error) {
      console.error('Error integrating wrapper:', error);
      setStatus({ message: `Error integrating wrapper: ${error instanceof Error ? error.message : String(error)}`, success: false });
    } finally {
      setIntegrating(false);
    }
  };

  // Code is ready to render
  return (
    <Container>
      <Header>
        <Title>{title}</Title>
        <ButtonGroup>
          {status && (
            <StatusMessage $success={status.success}>{status.message}</StatusMessage>
          )}
          {showActions && (
            <>
              <SaveButton onClick={handleSave} disabled={saving || !wrapperConfig}>
                {saving ? 'Saving...' : 'Save'}
              </SaveButton>
              <Button 
                onClick={handleIntegrate} 
                disabled={integrating || !actionUrl || !actionAnalysis || !wrapperConfig}
              >
                {integrating ? 'Integrating...' : 'Integrate with Catalog'}
              </Button>
            </>
          )}
          <Button onClick={handleCopy}>
            {copied ? (
              <>
                <StatusMessage $success={true}>Copied!</StatusMessage>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"
                  ></path>
                  <path
                    fillRule="evenodd"
                    d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"
                  ></path>
                </svg>
                Copy
              </>
            )}
          </Button>
        </ButtonGroup>
      </Header>
      <CodeContainer>
        <Pre>
          <Code>{code}</Code>
        </Pre>
      </CodeContainer>
    </Container>
  );
};

export default CodePreview;