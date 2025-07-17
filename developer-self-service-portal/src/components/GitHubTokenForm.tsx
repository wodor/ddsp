import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import styled from 'styled-components';
import { configService } from '../services/config';
import { GitHubApiClient } from '../services/github';

// Form validation schema
const tokenSchema = z.object({
  token: z.string().min(1, 'GitHub token is required'),
});

type TokenFormData = z.infer<typeof tokenSchema>;

const FormContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 600;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  font-size: 14px;
  margin-top: 4px;
`;

const Button = styled.button`
  padding: 10px 16px;
  background-color: #0366d6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0255b3;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ClearButton = styled(Button)`
  background-color: #d32f2f;

  &:hover {
    background-color: #b71c1c;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const StatusMessage = styled.div<{ $isError?: boolean }>`
  padding: 10px;
  margin-top: 20px;
  border-radius: 4px;
  background-color: ${(props) => (props.$isError ? '#ffebee' : '#e8f5e9')};
  color: ${(props) => (props.$isError ? '#d32f2f' : '#2e7d32')};
`;

const TokenInfo = styled.div`
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
`;

/**
 * GitHub Token Form Component
 * Allows users to enter, validate, and manage their GitHub token
 */
const GitHubTokenForm = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  
  // Get the current token from config service
  const currentToken = configService.getGitHubToken();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TokenFormData>({
    resolver: zodResolver(tokenSchema),
    defaultValues: {
      token: currentToken || '',
    },
  });

  /**
   * Validate the GitHub token against the API
   * @param token GitHub token to validate
   */
  const validateToken = async (token: string) => {
    setIsValidating(true);
    setValidationStatus(null);
    setUserInfo(null);
    
    try {
      const client = new GitHubApiClient(token);
      const isValid = await client.validateToken();
      
      if (isValid) {
        // If token is valid, save it and get user info
        configService.setGitHubToken(token);
        const user = await client.getUser();
        setUserInfo(user);
        setValidationStatus({
          message: 'GitHub token is valid and has been saved.',
          isError: false,
        });
      } else {
        setValidationStatus({
          message: 'GitHub token is invalid. Please check and try again.',
          isError: true,
        });
      }
    } catch (error) {
      setValidationStatus({
        message: 'Error validating GitHub token. Please check your network connection.',
        isError: true,
      });
      console.error('Token validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Handle form submission
   * @param data Form data containing the token
   */
  const onSubmit = async (data: TokenFormData) => {
    await validateToken(data.token);
  };

  /**
   * Clear the stored GitHub token
   */
  const handleClearToken = () => {
    configService.setGitHubToken(undefined);
    setUserInfo(null);
    setValidationStatus({
      message: 'GitHub token has been cleared.',
      isError: false,
    });
    reset({ token: '' });
  };

  return (
    <FormContainer>
      <h2>GitHub Token Configuration</h2>
      <p>
        To use the Developer Self-Service Portal, you need to provide a GitHub personal access token.
        This token will be stored securely on your device and used to interact with GitHub on your behalf.
      </p>
      
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormGroup>
          <Label htmlFor="token">GitHub Personal Access Token</Label>
          <Input
            id="token"
            type="password"
            placeholder="Enter your GitHub token"
            {...register('token')}
            data-testid="github-token-input"
          />
          {errors.token && (
            <ErrorMessage data-testid="token-error">{errors.token.message}</ErrorMessage>
          )}
        </FormGroup>
        
        <ButtonGroup>
          <Button 
            type="submit" 
            disabled={isValidating}
            data-testid="validate-token-button"
          >
            {isValidating ? 'Validating...' : 'Validate & Save Token'}
          </Button>
          
          {currentToken && (
            <ClearButton 
              type="button" 
              onClick={handleClearToken}
              data-testid="clear-token-button"
            >
              Clear Token
            </ClearButton>
          )}
        </ButtonGroup>
      </Form>
      
      {validationStatus && (
        <StatusMessage 
          $isError={validationStatus.isError}
          data-testid="validation-status"
        >
          {validationStatus.message}
        </StatusMessage>
      )}
      
      {userInfo && (
        <TokenInfo data-testid="user-info">
          <h3>Connected GitHub Account</h3>
          <p>Username: {userInfo.login}</p>
          <p>Name: {userInfo.name || 'Not provided'}</p>
          <p>Email: {userInfo.email || 'Not provided'}</p>
        </TokenInfo>
      )}
    </FormContainer>
  );
};

export default GitHubTokenForm;