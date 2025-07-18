import React from 'react';
import styled from 'styled-components';
import ActionWrapperCreator from '../components/ActionWrapperCreator';

const Container = styled.div`
  padding: 20px;
`;

const Title = styled.h1`
  margin-bottom: 20px;
`;

/**
 * Page component for creating GitHub Action wrappers
 * @returns React component
 */
const WrapperCreationPage: React.FC = () => {
  return (
    <Container>
      <Title>Create Action Wrapper</Title>
      <p>
        Create custom wrappers for GitHub Actions to integrate them with the Developer Self-Service Portal.
        Provide a GitHub Action URL to get started.
      </p>
      <ActionWrapperCreator />
    </Container>
  );
};

export default WrapperCreationPage;