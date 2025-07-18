import React from 'react';
import styled from 'styled-components';
import GitHubTokenForm from '../components/GitHubTokenForm';

const Container = styled.div`
  padding: 20px;
`;

const Title = styled.h1`
  margin-bottom: 20px;
`;

const Section = styled.section`
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
`;

const SectionTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 15px;
`;

/**
 * Settings page component for managing application configuration
 * @returns React component
 */
const SettingsPage: React.FC = () => {
  return (
    <Container>
      <Title>Settings</Title>
      
      <Section>
        <SectionTitle>GitHub Configuration</SectionTitle>
        <p>
          Configure your GitHub token to allow the portal to interact with GitHub on your behalf.
          Your token is stored securely on your local machine.
        </p>
        <GitHubTokenForm />
      </Section>
      
      {/* Additional settings sections can be added here in the future */}
    </Container>
  );
};

export default SettingsPage;