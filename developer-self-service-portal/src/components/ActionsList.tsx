import { type FC } from 'react';
import styled from 'styled-components';
import ActionCard from './ActionCard';
import type { CatalogAction } from '../types/catalog';

interface ActionsListProps {
  actions: CatalogAction[];
  isLoading?: boolean;
  error?: string | null;
  onActionClick?: (actionId: string) => void;
}

const ListContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 24px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const EmptyStateTitle = styled.h3`
  margin-bottom: 16px;
  color: var(--secondary-color);
`;

const EmptyStateMessage = styled.p`
  color: #666;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 24px;
  background-color: #ffebee;
  border-radius: 8px;
  color: var(--error-color);
  margin-bottom: 24px;
`;

/**
 * ActionsList component displays a grid of action cards
 */
const ActionsList: FC<ActionsListProps> = ({ 
  actions, 
  isLoading = false, 
  error = null,
  onActionClick 
}) => {
  if (isLoading) {
    return (
      <LoadingState data-testid="actions-loading">
        <h3>Loading actions...</h3>
      </LoadingState>
    );
  }

  if (error) {
    return (
      <ErrorState data-testid="actions-error">
        <h3>Error loading actions</h3>
        <p>{error}</p>
      </ErrorState>
    );
  }

  if (actions.length === 0) {
    return (
      <EmptyState data-testid="actions-empty">
        <EmptyStateTitle>No actions found</EmptyStateTitle>
        <EmptyStateMessage>
          Try adjusting your filters or search criteria to find actions.
        </EmptyStateMessage>
      </EmptyState>
    );
  }

  return (
    <ListContainer data-testid="actions-list">
      {actions.map((action) => (
        <ActionCard 
          key={action.id} 
          action={action} 
          onClick={onActionClick}
        />
      ))}
    </ListContainer>
  );
};

export default ActionsList;