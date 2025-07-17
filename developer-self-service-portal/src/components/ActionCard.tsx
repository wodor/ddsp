import { type FC } from 'react';
import styled from 'styled-components';
import { FaStar, FaCodeBranch, FaTag } from 'react-icons/fa';
import type { CatalogAction } from '../types/catalog';

interface ActionCardProps {
  action: CatalogAction;
  onClick?: (actionId: string) => void;
}

const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const Title = styled.h3`
  margin: 0;
  color: var(--primary-color);
  font-size: 18px;
`;

const FeaturedBadge = styled.div`
  background-color: var(--warning-color);
  color: #333;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Description = styled.p`
  color: var(--text-color);
  margin-bottom: 16px;
  flex-grow: 1;
`;

const MetaInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: auto;
  font-size: 14px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
`;

const CategoryBadge = styled.div`
  background-color: #e1e4e8;
  color: #24292e;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
`;

const Tag = styled.span`
  background-color: #f1f8ff;
  color: var(--primary-color);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
`;

/**
 * ActionCard component displays a GitHub Action from the catalog
 */
const ActionCard: FC<ActionCardProps> = ({ action, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(action.id);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Card onClick={handleClick} data-testid={`action-card-${action.id}`}>
      <CardHeader>
        <Title>{action.name}</Title>
        {action.featured && (
          <FeaturedBadge>
            <FaStar /> Featured
          </FeaturedBadge>
        )}
      </CardHeader>
      
      <Description>{action.description}</Description>
      
      <CategoryBadge>{action.category}</CategoryBadge>
      
      {action.tags && action.tags.length > 0 && (
        <TagsContainer>
          {action.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </TagsContainer>
      )}
      
      <MetaInfo>
        <MetaItem>
          <FaCodeBranch />
          {action.repository}
        </MetaItem>
        {action.version && (
          <MetaItem>
            <FaTag />
            {action.version}
          </MetaItem>
        )}
        {action.lastUpdated && (
          <MetaItem>
            Updated: {formatDate(action.lastUpdated)}
          </MetaItem>
        )}
      </MetaInfo>
    </Card>
  );
};

export default ActionCard;