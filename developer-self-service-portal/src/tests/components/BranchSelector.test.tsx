/**
 * Tests for the BranchSelector component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import BranchSelector from '../../components/form/BranchSelector';
import { GitHubApiClient } from '../../services/github';

// Mock the GitHub API client
vi.mock('../../services/github', () => {
  const mockClient = {
    getBranches: vi.fn().mockResolvedValue([
      {
        name: 'main',
        commit: {
          sha: 'abc1234567890',
          commit: {
            author: {
              name: 'John Doe',
              date: '2023-07-15T10:30:00Z'
            }
          }
        },
        protected: true
      },
      {
        name: 'develop',
        commit: {
          sha: 'def1234567890',
          commit: {
            author: {
              name: 'Jane Smith',
              date: '2023-07-14T15:45:00Z'
            }
          }
        }
      },
      {
        name: 'feature/new-ui',
        commit: {
          sha: 'ghi1234567890',
          commit: {
            author: {
              name: 'Bob Johnson',
              date: '2023-07-13T09:20:00Z'
            }
          }
        }
      }
    ]),
    validateToken: vi.fn().mockResolvedValue(true),
    getRepositories: vi.fn().mockResolvedValue([]),
    getWorkflows: vi.fn().mockResolvedValue([]),
    triggerWorkflow: vi.fn().mockResolvedValue({}),
    getWorkflowRuns: vi.fn().mockResolvedValue([]),
    getWorkflowRunDetails: vi.fn().mockResolvedValue({}),
    downloadArtifact: vi.fn().mockResolvedValue({}),
    getFileContent: vi.fn().mockResolvedValue(''),
    isAuthenticated: vi.fn().mockReturnValue(true)
  };
  
  return {
    GitHubApiClient: vi.fn().mockImplementation(() => mockClient)
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Test component wrapper
const TestComponent = ({ field }: { field: any }) => {
  const methods = useForm({
    defaultValues: {
      [field.name]: ''
    }
  });
  
  return (
    <FormProvider {...methods}>
      <form>
        <BranchSelector field={field} />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
};

describe('BranchSelector', () => {
  beforeEach(() => {
    localStorageMock.setItem('githubToken', 'test-token');
    vi.clearAllMocks();
  });
  
  const testField = {
    name: 'branch',
    label: 'Branch',
    description: 'Select a branch',
    required: true,
    type: 'branch' as const,
    validation: z.string().min(1, 'Branch is required'),
    ui: {
      placeholder: 'Select a branch',
      helpText: 'Choose a branch for your workflow'
    }
  };
  
  it('renders the branch selector with help text', () => {
    render(<TestComponent field={testField} />);
    
    expect(screen.getByRole('button', { name: /select a branch/i })).toBeInTheDocument();
    expect(screen.getByText('Choose a branch for your workflow')).toBeInTheDocument();
  });
  
  it('opens the dropdown when clicked', async () => {
    const user = userEvent.setup();
    render(<TestComponent field={testField} />);
    
    const button = screen.getByRole('button', { name: /select a branch/i });
    await user.click(button);
    
    // Wait for branches to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search branches...')).toBeInTheDocument();
    });
  });
  
  it('displays branches with metadata', async () => {
    const user = userEvent.setup();
    render(<TestComponent field={testField} />);
    
    const button = screen.getByRole('button', { name: /select a branch/i });
    await user.click(button);
    
    // Wait for branches to load
    await waitFor(() => {
      expect(screen.getByText('main')).toBeInTheDocument();
      expect(screen.getByText('develop')).toBeInTheDocument();
      expect(screen.getByText('feature/new-ui')).toBeInTheDocument();
    });
    
    // Check for metadata
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('default')).toBeInTheDocument();
    expect(screen.getByText('protected')).toBeInTheDocument();
  });
  
  it('filters branches when searching', async () => {
    const user = userEvent.setup();
    render(<TestComponent field={testField} />);
    
    const button = screen.getByRole('button', { name: /select a branch/i });
    await user.click(button);
    
    // Wait for branches to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search branches...')).toBeInTheDocument();
    });
    
    // Type in search box
    const searchInput = screen.getByPlaceholderText('Search branches...');
    await user.type(searchInput, 'feature');
    
    // Check filtered results
    expect(screen.getByText('feature/new-ui')).toBeInTheDocument();
    expect(screen.queryByText('main')).not.toBeInTheDocument();
    expect(screen.queryByText('develop')).not.toBeInTheDocument();
  });
  
  it('selects a branch when clicked', async () => {
    const user = userEvent.setup();
    render(<TestComponent field={testField} />);
    
    const button = screen.getByRole('button', { name: /select a branch/i });
    await user.click(button);
    
    // Wait for branches to load
    await waitFor(() => {
      expect(screen.getByText('develop')).toBeInTheDocument();
    });
    
    // Click on a branch
    await user.click(screen.getByText('develop'));
    
    // Check that the branch was selected
    expect(screen.getByRole('button', { name: /develop/i })).toBeInTheDocument();
  });
  
  it('handles API errors gracefully', async () => {
    // Mock the GitHub API client to throw an error
    const mockGetBranches = vi.fn().mockRejectedValue(new Error('API Error'));
    vi.mocked(GitHubApiClient).mockImplementationOnce(() => ({
      getBranches: mockGetBranches,
      validateToken: vi.fn().mockResolvedValue(true),
      getRepositories: vi.fn().mockResolvedValue([]),
      getWorkflows: vi.fn().mockResolvedValue([]),
      triggerWorkflow: vi.fn().mockResolvedValue({}),
      getWorkflowRuns: vi.fn().mockResolvedValue([]),
      getWorkflowRunDetails: vi.fn().mockResolvedValue({}),
      downloadArtifact: vi.fn().mockResolvedValue({}),
      getFileContent: vi.fn().mockResolvedValue(''),
      isAuthenticated: vi.fn().mockReturnValue(true)
    } as unknown as GitHubApiClient));
    
    const user = userEvent.setup();
    render(<TestComponent field={testField} />);
    
    const button = screen.getByRole('button', { name: /select a branch/i });
    await user.click(button);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to load branches/)).toBeInTheDocument();
    });
  });
});