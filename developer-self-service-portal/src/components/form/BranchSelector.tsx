/**
 * Enhanced branch selector component with GitHub API integration
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import styled from 'styled-components';
import type { FormFieldSchema } from '../../utils/formSchemaParser';
import { GitHubApiClient } from '../../services/github';

// Types for branch data
interface BranchData {
  name: string;
  lastCommit: string;
  author: string;
  commitSha?: string;
  protected?: boolean;
  isDefault?: boolean;
}

const SelectContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SelectButton = styled.button<{ isOpen: boolean }>`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: ${({ isOpen }) => isOpen ? '4px 4px 0 0' : '4px'};
  background-color: white;
  text-align: left;
  font-size: 1rem;
  cursor: pointer;
  transition: border-color 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:focus {
    outline: none;
    border-color: #0366d6;
    box-shadow: 0 0 0 2px rgba(3, 102, 214, 0.2);
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

const DropdownIcon = styled.span<{ isOpen: boolean }>`
  transform: ${({ isOpen }) => isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  transition: transform 0.2s;
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 250px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #ccc;
  border-top: none;
  border-radius: 0 0 4px 4px;
  z-index: 10;
  display: ${({ isOpen }) => isOpen ? 'block' : 'none'};
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const SearchContainer = styled.div`
  position: relative;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 2rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #0366d6;
    box-shadow: 0 0 0 2px rgba(3, 102, 214, 0.2);
  }
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 0.875rem;
`;

const BranchItem = styled.div<{ isSelected: boolean; isDefault?: boolean }>`
  padding: 0.75rem;
  cursor: pointer;
  background-color: ${({ isSelected }) => isSelected ? '#f0f4f8' : 'transparent'};
  border-left: ${({ isDefault }) => isDefault ? '3px solid #2cbe4e' : '3px solid transparent'};
  
  &:hover {
    background-color: ${({ isSelected }) => isSelected ? '#f0f4f8' : '#f5f5f5'};
  }

  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }
`;

const BranchHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BranchName = styled.div`
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DefaultBadge = styled.span`
  background-color: #2cbe4e;
  color: white;
  font-size: 0.6rem;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  text-transform: uppercase;
`;

const ProtectedBadge = styled.span`
  background-color: #6e40c9;
  color: white;
  font-size: 0.6rem;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  text-transform: uppercase;
`;

const BranchMeta = styled.div`
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const CommitInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CommitDate = styled.span`
  color: #666;
`;

const CommitAuthor = styled.span`
  font-weight: 500;
`;

const CommitSha = styled.span`
  font-family: monospace;
  background-color: #f0f0f0;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-size: 0.7rem;
`;

const LoadingIndicator = styled.div`
  padding: 1rem;
  text-align: center;
  color: #666;
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  text-align: center;
  color: #d32f2f;
`;

const EmptyMessage = styled.div`
  padding: 1rem;
  text-align: center;
  color: #666;
`;

const HelpText = styled.div`
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
`;

// Format date to a more readable format
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} weeks ago`;
  } else if (diffDays < 365) {
    return `${Math.floor(diffDays / 30)} months ago`;
  } else {
    return `${Math.floor(diffDays / 365)} years ago`;
  }
};

// Format commit SHA to a shorter version
const formatSha = (sha: string): string => {
  return sha.substring(0, 7);
};

export interface BranchSelectorProps {
  /** Field schema */
  field: FormFieldSchema;
}

/**
 * Enhanced branch selector component with GitHub API integration
 */
const BranchSelector: React.FC<BranchSelectorProps> = ({ field }) => {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[field.name];
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<BranchData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [repository, setRepository] = useState<{ owner: string; repo: string } | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get repository information from field configuration or form data
  useEffect(() => {
    // In a real implementation, this would come from the form context or field configuration
    // For now, we'll use a hardcoded repository for demonstration
    setRepository({ owner: 'octocat', repo: 'Hello-World' });
  }, []);
  
  // Fetch branches from GitHub API
  const fetchBranches = useCallback(async () => {
    if (!repository) return;
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // In a real implementation, you would get the GitHub token from a configuration service
      const token = localStorage.getItem('githubToken') || '';
      const githubClient = new GitHubApiClient(token);
      
      // Fetch branches from GitHub API
      const branchesData = await githubClient.getBranches(repository.owner, repository.repo);
      
      // Transform the data to our format
      const transformedBranches: BranchData[] = branchesData.map((branch: any) => ({
        name: branch.name,
        lastCommit: branch.commit?.commit?.author?.date || '',
        author: branch.commit?.commit?.author?.name || '',
        commitSha: branch.commit?.sha,
        protected: branch.protected,
        isDefault: branch.name === 'main' || branch.name === 'master', // This is a simplification
      }));
      
      // Sort branches by last commit date (newest first)
      transformedBranches.sort((a, b) => {
        return new Date(b.lastCommit).getTime() - new Date(a.lastCommit).getTime();
      });
      
      setBranches(transformedBranches);
      setFilteredBranches(transformedBranches);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      setLoadError('Failed to load branches. Please check your GitHub token and try again.');
      
      // Fallback to mock data for demonstration
      const mockBranches: BranchData[] = [
        { name: 'main', lastCommit: '2023-07-15T10:30:00Z', author: 'John Doe', commitSha: 'abc1234567890', protected: true, isDefault: true },
        { name: 'develop', lastCommit: '2023-07-14T15:45:00Z', author: 'Jane Smith', commitSha: 'def1234567890' },
        { name: 'feature/new-ui', lastCommit: '2023-07-13T09:20:00Z', author: 'Bob Johnson', commitSha: 'ghi1234567890' },
        { name: 'bugfix/login-issue', lastCommit: '2023-07-12T14:10:00Z', author: 'Alice Brown', commitSha: 'jkl1234567890' },
        { name: 'release/v1.0', lastCommit: '2023-07-10T11:05:00Z', author: 'Chris Green', commitSha: 'mno1234567890', protected: true },
      ];
      
      setBranches(mockBranches);
      setFilteredBranches(mockBranches);
    } finally {
      setIsLoading(false);
    }
  }, [repository]);
  
  // Fetch branches when the component mounts or repository changes
  useEffect(() => {
    if (repository) {
      fetchBranches();
    }
  }, [repository, fetchBranches]);
  
  // Filter branches when search text changes
  useEffect(() => {
    if (!searchText) {
      setFilteredBranches(branches);
    } else {
      const filtered = branches.filter(branch => 
        branch.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredBranches(filtered);
    }
  }, [searchText, branches]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  return (
    <>
      <Controller
        name={field.name}
        control={control}
        render={({ field: { onChange, value, disabled } }) => (
          <SelectContainer ref={dropdownRef}>
            <SelectButton 
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              isOpen={isOpen}
              disabled={disabled}
            >
              {value || 'Select a branch'}
              <DropdownIcon isOpen={isOpen}>▼</DropdownIcon>
            </SelectButton>
            
            <DropdownMenu isOpen={isOpen}>
              <SearchContainer>
                <SearchIcon>🔍</SearchIcon>
                <SearchInput
                  type="text"
                  placeholder="Search branches..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </SearchContainer>
              
              {isLoading ? (
                <LoadingIndicator>Loading branches...</LoadingIndicator>
              ) : loadError ? (
                <ErrorMessage>{loadError}</ErrorMessage>
              ) : filteredBranches.length === 0 ? (
                <EmptyMessage>No branches found</EmptyMessage>
              ) : (
                filteredBranches.map((branch) => (
                  <BranchItem
                    key={branch.name}
                    isSelected={value === branch.name}
                    isDefault={branch.isDefault}
                    onClick={() => {
                      onChange(branch.name);
                      setIsOpen(false);
                    }}
                  >
                    <BranchHeader>
                      <BranchName>
                        {branch.name}
                        {branch.isDefault && <DefaultBadge>default</DefaultBadge>}
                        {branch.protected && <ProtectedBadge>protected</ProtectedBadge>}
                      </BranchName>
                    </BranchHeader>
                    <BranchMeta>
                      <CommitInfo>
                        Last updated <CommitDate>{formatDate(branch.lastCommit)}</CommitDate> by <CommitAuthor>{branch.author}</CommitAuthor>
                      </CommitInfo>
                      {branch.commitSha && (
                        <div>
                          Commit: <CommitSha>{formatSha(branch.commitSha)}</CommitSha>
                        </div>
                      )}
                    </BranchMeta>
                  </BranchItem>
                ))
              )}
            </DropdownMenu>
          </SelectContainer>
        )}
      />
      
      {field.ui?.helpText && !error && (
        <HelpText>{field.ui.helpText}</HelpText>
      )}
    </>
  );
};

export default BranchSelector;