/**
 * Tests for the ActionWrapperCreator component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActionWrapperCreator from '../../components/ActionWrapperCreator';
import mcpClient from '../../services/mcpClient';
import mcpServerManager from '../../services/mcpServerManager';
import wrapperIntegrationService from '../../services/wrapperIntegration';
import type { ActionAnalysisResult } from '../../types/mcpConfig';

// Mock the MCP client
vi.mock('../../services/mcpClient', () => ({
  default: {
    isServerRunning: vi.fn().mockResolvedValue(true),
    analyzeGitHubAction: vi.fn(),
    generateWrapperCode: vi.fn(),
    setPort: vi.fn(),
  },
}));

// Mock the MCP server manager
vi.mock('../../services/mcpServerManager', () => ({
  default: {
    startServer: vi.fn().mockResolvedValue(true),
    stopServer: vi.fn().mockResolvedValue(true),
    isServerRunning: vi.fn().mockResolvedValue(true),
  },
}));

// Mock the wrapper integration service
vi.mock('../../services/wrapperIntegration', () => ({
  default: {
    saveWrapperCode: vi.fn().mockResolvedValue('/path/to/wrapper.js'),
    registerWithCatalog: vi.fn().mockResolvedValue('wrapper-id'),
  },
}));

describe('ActionWrapperCreator', () => {
  const mockAnalysis: ActionAnalysisResult = {
    name: 'Test Action',
    description: 'This is a test action',
    inputs: {
      input1: {
        description: 'Input 1 description',
        required: true,
        default: 'default value'
      }
    },
    outputs: {
      output1: {
        description: 'Output 1 description'
      }
    },
    questions: [
      {
        id: 'textQuestion',
        question: 'What is your name?',
        type: 'text',
        required: true,
        context: 'This will be used for personalization'
      }
    ],
    metadata: {
      actionUrl: 'https://github.com/test/action',
      version: 'v1',
      runs: {
        using: 'node16',
        main: 'dist/index.js'
      }
    }
  };

  const mockGeneratedCode = `
function testActionWrapper(inputs) {
  // Generated wrapper code
  return { success: true };
}
`;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mcpClient.analyzeGitHubAction).mockResolvedValue(mockAnalysis);
    vi.mocked(mcpClient.generateWrapperCode).mockResolvedValue(mockGeneratedCode);
  });

  it('renders the initial form', () => {
    render(<ActionWrapperCreator />);
    
    expect(screen.getByText('Create GitHub Action Wrapper')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub Action URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Version/Tag')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analyze Action' })).toBeInTheDocument();
  });

  it('analyzes a GitHub Action when form is submitted', async () => {
    const user = userEvent.setup();
    render(<ActionWrapperCreator />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('GitHub Action URL'), 'https://github.com/test/action');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: 'Analyze Action' }));
    
    // Check that the MCP client was called
    expect(mcpClient.analyzeGitHubAction).toHaveBeenCalledWith(
      'https://github.com/test/action',
      'main'
    );
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('Configure Wrapper')).toBeInTheDocument();
    });
  });

  it('starts the MCP server if it is not running', async () => {
    vi.mocked(mcpClient.isServerRunning).mockResolvedValueOnce(false);
    
    const user = userEvent.setup();
    render(<ActionWrapperCreator />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('GitHub Action URL'), 'https://github.com/test/action');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: 'Analyze Action' }));
    
    // Check that the server was started
    expect(mcpServerManager.startServer).toHaveBeenCalled();
    
    // Check that the MCP client was called
    expect(mcpClient.analyzeGitHubAction).toHaveBeenCalledWith(
      'https://github.com/test/action',
      'main'
    );
  });

  it('displays analysis results and configuration form', async () => {
    const user = userEvent.setup();
    render(<ActionWrapperCreator />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('GitHub Action URL'), 'https://github.com/test/action');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: 'Analyze Action' }));
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('Configure Wrapper')).toBeInTheDocument();
      expect(screen.getByText('Test Action')).toBeInTheDocument();
      expect(screen.getByText('This is a test action')).toBeInTheDocument();
      expect(screen.getByLabelText('Wrapper Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('What is your name?')).toBeInTheDocument();
    });
  });

  it('generates wrapper code when configuration form is submitted', async () => {
    const user = userEvent.setup();
    render(<ActionWrapperCreator />);
    
    // Fill in the analysis form
    await user.type(screen.getByLabelText('GitHub Action URL'), 'https://github.com/test/action');
    await user.click(screen.getByRole('button', { name: 'Analyze Action' }));
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('Configure Wrapper')).toBeInTheDocument();
    });
    
    // Fill in the configuration form
    await user.type(screen.getByLabelText('What is your name?'), 'John Doe');
    
    // Submit the configuration form
    await user.click(screen.getByRole('button', { name: 'Generate Wrapper' }));
    
    // Check that the MCP client was called
    expect(mcpClient.generateWrapperCode).toHaveBeenCalled();
    
    // Wait for code generation to complete
    await waitFor(() => {
      expect(screen.getByText('Review and Save')).toBeInTheDocument();
      expect(screen.getByText('Generated Code')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save Wrapper' })).toBeInTheDocument();
    });
  });

  it('saves wrapper code when save button is clicked', async () => {
    const user = userEvent.setup();
    render(<ActionWrapperCreator />);
    
    // Fill in the analysis form
    await user.type(screen.getByLabelText('GitHub Action URL'), 'https://github.com/test/action');
    await user.click(screen.getByRole('button', { name: 'Analyze Action' }));
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('Configure Wrapper')).toBeInTheDocument();
    });
    
    // Fill in the configuration form
    await user.type(screen.getByLabelText('What is your name?'), 'John Doe');
    
    // Submit the configuration form
    await user.click(screen.getByRole('button', { name: 'Generate Wrapper' }));
    
    // Wait for code generation to complete
    await waitFor(() => {
      expect(screen.getByText('Review and Save')).toBeInTheDocument();
    });
    
    // Click the save button
    await user.click(screen.getByRole('button', { name: 'Save Wrapper' }));
    
    // Check that the wrapper integration service was called
    expect(wrapperIntegrationService.saveWrapperCode).toHaveBeenCalled();
    expect(wrapperIntegrationService.registerWithCatalog).toHaveBeenCalled();
    
    // Wait for save to complete
    await waitFor(() => {
      expect(screen.getByText('Wrapper saved successfully! It has been added to your action catalog.')).toBeInTheDocument();
    });
  });

  it('handles errors during analysis', async () => {
    vi.mocked(mcpClient.analyzeGitHubAction).mockRejectedValueOnce(new Error('Analysis failed'));
    
    const user = userEvent.setup();
    render(<ActionWrapperCreator />);
    
    // Fill in the form
    await user.type(screen.getByLabelText('GitHub Action URL'), 'https://github.com/test/action');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: 'Analyze Action' }));
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to analyze GitHub Action: Analysis failed')).toBeInTheDocument();
    });
  });

  it('handles errors during code generation', async () => {
    vi.mocked(mcpClient.generateWrapperCode).mockRejectedValueOnce(new Error('Generation failed'));
    
    const user = userEvent.setup();
    render(<ActionWrapperCreator />);
    
    // Fill in the analysis form
    await user.type(screen.getByLabelText('GitHub Action URL'), 'https://github.com/test/action');
    await user.click(screen.getByRole('button', { name: 'Analyze Action' }));
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('Configure Wrapper')).toBeInTheDocument();
    });
    
    // Fill in the configuration form
    await user.type(screen.getByLabelText('What is your name?'), 'John Doe');
    
    // Submit the configuration form
    await user.click(screen.getByRole('button', { name: 'Generate Wrapper' }));
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to generate wrapper code: Generation failed')).toBeInTheDocument();
    });
  });

  it('handles errors during save', async () => {
    vi.mocked(wrapperIntegrationService.saveWrapperCode).mockRejectedValueOnce(new Error('Save failed'));
    
    const user = userEvent.setup();
    render(<ActionWrapperCreator />);
    
    // Fill in the analysis form
    await user.type(screen.getByLabelText('GitHub Action URL'), 'https://github.com/test/action');
    await user.click(screen.getByRole('button', { name: 'Analyze Action' }));
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('Configure Wrapper')).toBeInTheDocument();
    });
    
    // Fill in the configuration form
    await user.type(screen.getByLabelText('What is your name?'), 'John Doe');
    
    // Submit the configuration form
    await user.click(screen.getByRole('button', { name: 'Generate Wrapper' }));
    
    // Wait for code generation to complete
    await waitFor(() => {
      expect(screen.getByText('Review and Save')).toBeInTheDocument();
    });
    
    // Click the save button
    await user.click(screen.getByRole('button', { name: 'Save Wrapper' }));
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to save wrapper: Save failed')).toBeInTheDocument();
    });
  });

  it('allows going back to previous steps', async () => {
    const user = userEvent.setup();
    render(<ActionWrapperCreator />);
    
    // Fill in the analysis form
    await user.type(screen.getByLabelText('GitHub Action URL'), 'https://github.com/test/action');
    await user.click(screen.getByRole('button', { name: 'Analyze Action' }));
    
    // Wait for analysis to complete
    await waitFor(() => {
      expect(screen.getByText('Configure Wrapper')).toBeInTheDocument();
    });
    
    // Fill in the configuration form
    await user.type(screen.getByLabelText('What is your name?'), 'John Doe');
    
    // Submit the configuration form
    await user.click(screen.getByRole('button', { name: 'Generate Wrapper' }));
    
    // Wait for code generation to complete
    await waitFor(() => {
      expect(screen.getByText('Review and Save')).toBeInTheDocument();
    });
    
    // Go back to configuration
    await user.click(screen.getByRole('button', { name: 'Back to Configuration' }));
    
    // Check that we're back at the configuration step
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Generate Wrapper' })).toBeInTheDocument();
    });
    
    // Go back to analysis
    await user.click(screen.getByRole('button', { name: 'Back' }));
    
    // Check that we're back at the analysis step
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Analyze Action' })).toBeInTheDocument();
    });
  });
});