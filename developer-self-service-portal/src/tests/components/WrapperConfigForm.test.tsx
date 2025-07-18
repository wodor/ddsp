/**
 * Tests for the WrapperConfigForm component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WrapperConfigForm from '../../components/WrapperConfigForm';
import type { ActionAnalysisResult } from '../../types/mcpConfig';

describe('WrapperConfigForm', () => {
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
      },
      {
        id: 'booleanQuestion',
        question: 'Enable advanced features?',
        type: 'boolean',
        required: false
      },
      {
        id: 'selectQuestion',
        question: 'Select a color',
        type: 'select',
        options: ['red', 'green', 'blue'],
        required: true
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

  const mockOnSubmit = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    render(
      <WrapperConfigForm
        analysis={mockAnalysis}
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
      />
    );
    
    // Check basic fields
    expect(screen.getByLabelText('Wrapper Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    
    // Check question fields
    expect(screen.getByLabelText('What is your name?')).toBeInTheDocument();
    expect(screen.getByLabelText('Enable advanced features?')).toBeInTheDocument();
    expect(screen.getByLabelText('Select a color')).toBeInTheDocument();
    
    // Check help text
    expect(screen.getByText('This will be used for personalization')).toBeInTheDocument();
  });

  it('pre-populates wrapper name and description', () => {
    render(
      <WrapperConfigForm
        analysis={mockAnalysis}
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
      />
    );
    
    const nameInput = screen.getByLabelText('Wrapper Name') as HTMLInputElement;
    const descriptionInput = screen.getByLabelText('Description') as HTMLTextAreaElement;
    
    expect(nameInput.value).toBe('test-action-wrapper');
    expect(descriptionInput.value).toBe('Wrapper for Test Action - This is a test action');
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <WrapperConfigForm
        analysis={mockAnalysis}
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
      />
    );
    
    const backButton = screen.getByText('Back');
    await user.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(
      <WrapperConfigForm
        analysis={mockAnalysis}
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
      />
    );
    
    // Clear required fields
    await user.clear(screen.getByLabelText('Wrapper Name'));
    await user.clear(screen.getByLabelText('Description'));
    await user.clear(screen.getByLabelText('What is your name?'));
    
    // Submit the form
    const submitButton = screen.getByText('Generate Wrapper');
    await user.click(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText('Wrapper name is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
      expect(screen.getByText('What is your name? is required')).toBeInTheDocument();
    });
    
    // Ensure onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with correct data when valid', async () => {
    const user = userEvent.setup();
    render(
      <WrapperConfigForm
        analysis={mockAnalysis}
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
      />
    );
    
    // Fill in required fields
    await user.type(screen.getByLabelText('What is your name?'), 'John Doe');
    
    // Select an option
    const selectElement = screen.getByLabelText('Select a color');
    fireEvent.change(selectElement, { target: { value: 'green' } });
    
    // Check the checkbox
    await user.click(screen.getByLabelText('Enable advanced features?'));
    
    // Submit the form
    const submitButton = screen.getByText('Generate Wrapper');
    await user.click(submitButton);
    
    // Check that onSubmit was called with the correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        wrapperName: 'test-action-wrapper',
        description: 'Wrapper for Test Action - This is a test action',
        additionalOptions: {
          textQuestion: 'John Doe',
          booleanQuestion: true,
          selectQuestion: 'green'
        }
      });
    });
  });

  it('disables buttons when isSubmitting is true', () => {
    render(
      <WrapperConfigForm
        analysis={mockAnalysis}
        onSubmit={mockOnSubmit}
        onBack={mockOnBack}
        isSubmitting={true}
      />
    );
    
    const backButton = screen.getByText('Back');
    const submitButton = screen.getByText('Generating...');
    
    expect(backButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });
});