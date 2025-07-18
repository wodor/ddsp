/**
 * Tests for the ActionAnalysisView component
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActionAnalysisView from '../../components/ActionAnalysisView';
import type { ActionAnalysisResult } from '../../types/mcpConfig';

describe('ActionAnalysisView', () => {
  const mockAnalysis: ActionAnalysisResult = {
    name: 'Test Action',
    description: 'This is a test action',
    inputs: {
      input1: {
        description: 'Input 1 description',
        required: true,
        default: 'default value',
        type: 'string'
      },
      input2: {
        description: 'Input 2 description',
        required: false,
        type: 'boolean'
      }
    },
    outputs: {
      output1: {
        description: 'Output 1 description',
        value: '${{ steps.test.outputs.result }}'
      }
    },
    questions: [
      {
        id: 'question1',
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

  it('renders action information correctly', () => {
    render(<ActionAnalysisView analysis={mockAnalysis} />);
    
    expect(screen.getByText('Test Action')).toBeInTheDocument();
    expect(screen.getByText('This is a test action')).toBeInTheDocument();
    expect(screen.getByText('test/action')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByText('node16')).toBeInTheDocument();
  });

  it('renders inputs correctly', () => {
    render(<ActionAnalysisView analysis={mockAnalysis} />);
    
    expect(screen.getByText('input1')).toBeInTheDocument();
    expect(screen.getByText('Input 1 description')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText('Default: default value')).toBeInTheDocument();
    expect(screen.getByText('string')).toBeInTheDocument();
    
    expect(screen.getByText('input2')).toBeInTheDocument();
    expect(screen.getByText('Input 2 description')).toBeInTheDocument();
    expect(screen.getByText('boolean')).toBeInTheDocument();
  });

  it('renders outputs correctly', () => {
    render(<ActionAnalysisView analysis={mockAnalysis} />);
    
    expect(screen.getByText('output1')).toBeInTheDocument();
    expect(screen.getByText('Output 1 description')).toBeInTheDocument();
    expect(screen.getByText('${{ steps.test.outputs.result }}')).toBeInTheDocument();
  });

  it('renders configuration questions section', () => {
    render(<ActionAnalysisView analysis={mockAnalysis} />);
    
    expect(screen.getByText('Configuration Questions')).toBeInTheDocument();
    expect(screen.getByText('This action requires additional configuration. Please answer the questions below to customize your wrapper.')).toBeInTheDocument();
  });

  it('handles empty outputs gracefully', () => {
    const analysisWithNoOutputs = {
      ...mockAnalysis,
      outputs: {}
    };
    
    render(<ActionAnalysisView analysis={analysisWithNoOutputs} />);
    
    expect(screen.getByText('No outputs defined')).toBeInTheDocument();
  });

  it('handles empty questions gracefully', () => {
    const analysisWithNoQuestions = {
      ...mockAnalysis,
      questions: []
    };
    
    render(<ActionAnalysisView analysis={analysisWithNoQuestions} />);
    
    expect(screen.getByText('No configuration questions available')).toBeInTheDocument();
  });
});