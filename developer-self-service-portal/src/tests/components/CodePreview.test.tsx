import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CodePreview from '../../components/CodePreview';
import wrapperIntegrationService from '../../services/wrapperIntegration';
import type { ActionAnalysisResult, WrapperConfiguration } from '../../types/mcpConfig';

// Mock the wrapperIntegrationService
vi.mock('../../services/wrapperIntegration', () => ({
  default: {
    saveWrapperCode: vi.fn().mockResolvedValue('./src/actions/test-wrapper.js'),
    registerWithCatalog: vi.fn().mockResolvedValue('mock-action-id')
  }
}));

describe('CodePreview', () => {
  const mockCode = 'console.log("Hello, world!");';
  const mockTitle = 'Test Code';
  
  const mockActionAnalysis: ActionAnalysisResult = {
    name: 'Test Action',
    description: 'A test action',
    inputs: {
      input1: {
        description: 'Input 1',
        required: true
      }
    },
    outputs: {},
    questions: [],
    metadata: {
      actionUrl: 'https://github.com/owner/repo/actions/test-action',
      version: '1.0.0',
      runs: {
        using: 'node16',
        main: 'dist/index.js'
      }
    }
  };
  
  const mockWrapperConfig: WrapperConfiguration = {
    wrapperName: 'Test Wrapper',
    description: 'A test wrapper'
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined)
      },
      writable: true
    });
  });
  
  it('renders with the provided code and title', () => {
    render(<CodePreview code={mockCode} title={mockTitle} />);
    
    expect(screen.getByText(mockTitle)).toBeInTheDocument();
    expect(screen.getByText(mockCode)).toBeInTheDocument();
  });
  
  it('copies code to clipboard when copy button is clicked', async () => {
    render(<CodePreview code={mockCode} />);
    
    const copyButton = screen.getByText('Copy');
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockCode);
    
    // Wait for "Copied!" message to appear
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
    
    // Wait for "Copied!" message to disappear
    await waitFor(() => {
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    }, { timeout: 2500 });
  });
  
  it('does not show action buttons by default', () => {
    render(<CodePreview code={mockCode} />);
    
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.queryByText('Integrate with Catalog')).not.toBeInTheDocument();
  });
  
  it('shows action buttons when showActions is true', () => {
    render(
      <CodePreview 
        code={mockCode} 
        showActions={true}
        actionUrl="https://github.com/owner/repo/actions/test-action"
        actionAnalysis={mockActionAnalysis}
        wrapperConfig={mockWrapperConfig}
      />
    );
    
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Integrate with Catalog')).toBeInTheDocument();
  });
  
  it('saves code when save button is clicked', async () => {
    render(
      <CodePreview 
        code={mockCode} 
        showActions={true}
        wrapperConfig={mockWrapperConfig}
      />
    );
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    expect(wrapperIntegrationService.saveWrapperCode).toHaveBeenCalledWith(mockCode, mockWrapperConfig);
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Code saved successfully')).toBeInTheDocument();
    });
  });
  
  it('integrates wrapper when integrate button is clicked', async () => {
    const onIntegrationComplete = vi.fn();
    
    render(
      <CodePreview 
        code={mockCode} 
        showActions={true}
        actionUrl="https://github.com/owner/repo/actions/test-action"
        actionAnalysis={mockActionAnalysis}
        wrapperConfig={mockWrapperConfig}
        onIntegrationComplete={onIntegrationComplete}
      />
    );
    
    const integrateButton = screen.getByText('Integrate with Catalog');
    fireEvent.click(integrateButton);
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Integration complete')).toBeInTheDocument();
      expect(wrapperIntegrationService.registerWithCatalog).toHaveBeenCalledWith(
        'https://github.com/owner/repo/actions/test-action',
        mockActionAnalysis,
        mockWrapperConfig,
        './src/actions/test-wrapper.js'
      );
      expect(onIntegrationComplete).toHaveBeenCalledWith('mock-action-id');
    });
  });
  
  it('shows error message when save fails', async () => {
    // Mock the saveWrapperCode to reject
    (wrapperIntegrationService.saveWrapperCode as any).mockRejectedValueOnce(new Error('Save failed'));
    
    render(
      <CodePreview 
        code={mockCode} 
        showActions={true}
        wrapperConfig={mockWrapperConfig}
      />
    );
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Error saving code: Save failed')).toBeInTheDocument();
    });
  });
  
  it('shows error message when integration fails', async () => {
    // Mock the registerWithCatalog to reject
    (wrapperIntegrationService.registerWithCatalog as any).mockRejectedValueOnce(new Error('Integration failed'));
    
    render(
      <CodePreview 
        code={mockCode} 
        showActions={true}
        actionUrl="https://github.com/owner/repo/actions/test-action"
        actionAnalysis={mockActionAnalysis}
        wrapperConfig={mockWrapperConfig}
      />
    );
    
    const integrateButton = screen.getByText('Integrate with Catalog');
    fireEvent.click(integrateButton);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Error integrating wrapper: Integration failed')).toBeInTheDocument();
    });
  });
});