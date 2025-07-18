/**
 * Repository selector field component
 */
import { useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import styled from 'styled-components';
import type { FormFieldSchema } from '../../utils/formSchemaParser';

// Mock data for repositories - in a real implementation, this would come from the GitHub API
const MOCK_REPOSITORIES = [
  { name: 'user/repo1', description: 'First repository', stars: 120, updatedAt: '2023-07-15' },
  { name: 'user/repo2', description: 'Second repository', stars: 45, updatedAt: '2023-07-10' },
  { name: 'org/repo3', description: 'Organization repository', stars: 230, updatedAt: '2023-07-05' },
  { name: 'org/repo4', description: 'Another org repository', stars: 78, updatedAt: '2023-06-28' },
];

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
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: none;
  border-bottom: 1px solid #eee;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    background-color: #f8f8f8;
  }
`;

const RepoItem = styled.div<{ isSelected: boolean }>`
  padding: 0.5rem;
  cursor: pointer;
  background-color: ${({ isSelected }) => isSelected ? '#f0f4f8' : 'transparent'};
  
  &:hover {
    background-color: ${({ isSelected }) => isSelected ? '#f0f4f8' : '#f5f5f5'};
  }
`;

const RepoName = styled.div`
  font-weight: 500;
`;

const RepoDescription = styled.div`
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

const RepoMeta = styled.div`
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
  display: flex;
  gap: 1rem;
`;

const HelpText = styled.div`
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
`;

export interface RepositoryFieldProps {
  /** Field schema */
  field: FormFieldSchema;
}

/**
 * Repository selector field component with enhanced UI
 */
const RepositoryField: React.FC<RepositoryFieldProps> = ({ field }) => {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[field.name];
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [repositories] = useState(MOCK_REPOSITORIES);
  const [filteredRepositories, setFilteredRepositories] = useState(repositories);
  
  // Filter repositories when search text changes
  useEffect(() => {
    if (!searchText) {
      setFilteredRepositories(repositories);
    } else {
      const filtered = repositories.filter(repo => 
        repo.name.toLowerCase().includes(searchText.toLowerCase()) ||
        repo.description.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredRepositories(filtered);
    }
  }, [searchText, repositories]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.repo-selector')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // In a real implementation, we would fetch repositories from the GitHub API
  useEffect(() => {
    // This would be replaced with an API call
    // Example: const fetchRepos = async () => {
    //   const repos = await githubClient.getRepositories();
    //   setRepositories(repos);
    // };
    // fetchRepos();
  }, []);
  
  return (
    <>
      <Controller
        name={field.name}
        control={control}
        render={({ field: { onChange, value } }) => (
          <SelectContainer className="repo-selector">
            <SelectButton 
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              isOpen={isOpen}
            >
              {value || 'Select a repository'}
              <DropdownIcon isOpen={isOpen}>▼</DropdownIcon>
            </SelectButton>
            
            <DropdownMenu isOpen={isOpen}>
              <SearchInput
                type="text"
                placeholder="Search repositories..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              
              {filteredRepositories.map((repo) => (
                <RepoItem
                  key={repo.name}
                  isSelected={value === repo.name}
                  onClick={() => {
                    onChange(repo.name);
                    setIsOpen(false);
                  }}
                >
                  <RepoName>{repo.name}</RepoName>
                  <RepoDescription>{repo.description}</RepoDescription>
                  <RepoMeta>
                    <span>⭐ {repo.stars}</span>
                    <span>Updated: {repo.updatedAt}</span>
                  </RepoMeta>
                </RepoItem>
              ))}
              
              {filteredRepositories.length === 0 && (
                <RepoItem isSelected={false}>
                  No repositories found
                </RepoItem>
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

export default RepositoryField;