import React from 'react';
import styled from 'styled-components';
import WorkflowUrlImporter from '../components/WorkflowUrlImporter';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.h1`
  margin-bottom: 20px;
`;

const Description = styled.p`
  margin-bottom: 20px;
  line-height: 1.5;
`;

/**
 * Example component for demonstrating the WorkflowUrlImporter
 */
const WorkflowUrlImporterExample: React.FC = () => {
  return (
    <Container>
      <Header>GitHub Action Wrapper Creator</Header>
      <Description>
        This tool allows you to create custom wrappers for GitHub Actions. Enter the URL of a GitHub
        Action below to analyze it and create a wrapper.
      </Description>
      <WorkflowUrlImporter />
    </Container>
  );
};

export default WorkflowUrlImporterExample;