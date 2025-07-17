import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GitHubTokenForm from '../../components/GitHubTokenForm';
import { configService } from '../../services/config';

// Mock validateToken and getUser methods
const mockValidateToken = vi.fn();
const mockGetUser = vi.fn();

// Mock the GitHub API client
vi.mock('../../services/github', () => {
  return {
    GitHubApiClient: vi.fn().mockImplementation(() => {
      return {
        validateToken: mockValidateToken,
        getUser: mockGetUser,
      };
    }),
  };
});

// Mock the config service
vi.mock('../../services/config', () => {
  return {
    configService: {
      getGitHubToken: vi.fn(),
      setGitHubToken: vi.fn(),
    },
  };
});

describe('GitHubTokenForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form correctly', () => {
    render(<GitHubTokenForm />);
    
    expect(screen.getByText('GitHub Token Configuration')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub Personal Access Token')).toBeInTheDocument();
    expect(screen.getByTestId('validate-token-button')).toBeInTheDocument();
  });

  it('shows the current token if one exists', () => {
    vi.mocked(configService.getGitHubToken).mockReturnValue('existing-token');
    
    render(<GitHubTokenForm />);
    
    const tokenInput = screen.getByTestId('github-token-input') as HTMLInputElement;
    expect(tokenInput.value).toBe('existing-token');
    expect(screen.getByTestId('clear-token-button')).toBeInTheDocument();
  });

  it('validates and saves a valid token', async () => {
    const user = userEvent.setup();
    
    // Clear any existing token
    vi.mocked(configService.getGitHubToken).mockReturnValue(undefined);
    
    mockValidateToken.mockResolvedValue(true);
    mockGetUser.mockResolvedValue({
      login: 'testuser',
      name: 'Test User',
      email: 'test@example.com',
    });
    
    render(<GitHubTokenForm />);
    
    const tokenInput = screen.getByTestId('github-token-input');
    await user.clear(tokenInput);
    await user.type(tokenInput, 'valid-token');
    
    const validateButton = screen.getByTestId('validate-token-button');
    await user.click(validateButton);
    
    await waitFor(() => {
      expect(mockValidateToken).toHaveBeenCalled();
      expect(configService.setGitHubToken).toHaveBeenCalled();
      expect(screen.getByTestId('validation-status')).toHaveTextContent('GitHub token is valid');
      expect(screen.getByTestId('user-info')).toBeInTheDocument();
      expect(screen.getByText('Username: testuser')).toBeInTheDocument();
    });
  });

  it('shows an error for an invalid token', async () => {
    const user = userEvent.setup();
    
    mockValidateToken.mockResolvedValue(false);
    
    render(<GitHubTokenForm />);
    
    const tokenInput = screen.getByTestId('github-token-input');
    await user.type(tokenInput, 'invalid-token');
    
    const validateButton = screen.getByTestId('validate-token-button');
    await user.click(validateButton);
    
    await waitFor(() => {
      expect(mockValidateToken).toHaveBeenCalled();
      expect(configService.setGitHubToken).not.toHaveBeenCalled();
      expect(screen.getByTestId('validation-status')).toHaveTextContent('GitHub token is invalid');
    });
  });

  it('clears the token when the clear button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(configService.getGitHubToken).mockReturnValue('existing-token');
    
    render(<GitHubTokenForm />);
    
    const clearButton = screen.getByTestId('clear-token-button');
    await user.click(clearButton);
    
    expect(configService.setGitHubToken).toHaveBeenCalledWith(undefined);
    
    await waitFor(() => {
      const tokenInput = screen.getByTestId('github-token-input') as HTMLInputElement;
      expect(tokenInput.value).toBe('');
      expect(screen.getByTestId('validation-status')).toHaveTextContent('GitHub token has been cleared');
    });
  });

  it('shows validation error when submitting an empty form', async () => {
    const user = userEvent.setup();
    
    // Make sure we start with an empty token
    vi.mocked(configService.getGitHubToken).mockReturnValue(undefined);
    
    render(<GitHubTokenForm />);
    
    // Clear the input field to ensure it's empty
    const tokenInput = screen.getByTestId('github-token-input');
    await user.clear(tokenInput);
    
    // Submit the form
    const validateButton = screen.getByTestId('validate-token-button');
    await user.click(validateButton);
    
    // The form should prevent submission and show an error
    expect(mockValidateToken).not.toHaveBeenCalled();
    expect(configService.setGitHubToken).not.toHaveBeenCalled();
  });

  it('handles API errors during validation', async () => {
    const user = userEvent.setup();
    
    mockValidateToken.mockRejectedValue(new Error('Network error'));
    
    render(<GitHubTokenForm />);
    
    const tokenInput = screen.getByTestId('github-token-input');
    await user.type(tokenInput, 'test-token');
    
    const validateButton = screen.getByTestId('validate-token-button');
    await user.click(validateButton);
    
    await waitFor(() => {
      expect(mockValidateToken).toHaveBeenCalled();
      expect(screen.getByTestId('validation-status')).toHaveTextContent('Error validating GitHub token');
    });
  });
});