/**
 * Component for displaying GitHub Action analysis results
 */
import styled from 'styled-components';
import type { ActionAnalysisResult } from '../types/mcpConfig';

const Container = styled.div`
  margin-bottom: 20px;
`;

const Section = styled.div`
  margin-bottom: 16px;
`;

const SectionTitle = styled.h4`
  margin-top: 16px;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
`;

const MetadataItem = styled.div`
  display: flex;
  margin-bottom: 4px;
`;

const MetadataLabel = styled.div`
  font-weight: 600;
  width: 120px;
  flex-shrink: 0;
`;

const MetadataValue = styled.div`
  flex: 1;
`;

const List = styled.ul`
  margin: 0;
  padding-left: 20px;
`;

const ListItem = styled.li`
  margin-bottom: 8px;
`;

const Badge = styled.span<{ type?: string }>`
  display: inline-block;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 6px;
  background-color: ${(props) => {
    switch (props.type) {
      case 'required':
        return '#ffebee';
      case 'default':
        return '#e8f5e9';
      default:
        return '#e3f2fd';
    }
  }};
  color: ${(props) => {
    switch (props.type) {
      case 'required':
        return '#c62828';
      case 'default':
        return '#2e7d32';
      default:
        return '#1565c0';
    }
  }};
`;

const Description = styled.p`
  margin-top: 4px;
  margin-bottom: 16px;
  color: #586069;
`;

interface ActionAnalysisViewProps {
  /** The analysis result to display */
  analysis: ActionAnalysisResult;
}

/**
 * Component for displaying GitHub Action analysis results
 */
const ActionAnalysisView: React.FC<ActionAnalysisViewProps> = ({ analysis }) => {
  return (
    <Container>
      <Section>
        <SectionTitle>Action Information</SectionTitle>
        <MetadataItem>
          <MetadataLabel>Name</MetadataLabel>
          <MetadataValue>{analysis.name}</MetadataValue>
        </MetadataItem>
        <MetadataItem>
          <MetadataLabel>Description</MetadataLabel>
          <MetadataValue>{analysis.description}</MetadataValue>
        </MetadataItem>
        <MetadataItem>
          <MetadataLabel>Repository</MetadataLabel>
          <MetadataValue>
            <a href={analysis.metadata.actionUrl} target="_blank" rel="noopener noreferrer">
              {analysis.metadata.actionUrl.replace('https://github.com/', '')}
            </a>
          </MetadataValue>
        </MetadataItem>
        <MetadataItem>
          <MetadataLabel>Version</MetadataLabel>
          <MetadataValue>{analysis.metadata.version}</MetadataValue>
        </MetadataItem>
        <MetadataItem>
          <MetadataLabel>Runtime</MetadataLabel>
          <MetadataValue>{analysis.metadata.runs.using}</MetadataValue>
        </MetadataItem>
      </Section>

      <Section>
        <SectionTitle>Inputs</SectionTitle>
        {Object.keys(analysis.inputs).length > 0 ? (
          <List>
            {Object.entries(analysis.inputs).map(([name, input]) => (
              <ListItem key={name}>
                <strong>{name}</strong>
                {input.required && <Badge type="required">Required</Badge>}
                {input.default && <Badge type="default">Default: {input.default}</Badge>}
                {input.type && <Badge>{input.type}</Badge>}
                {input.description && <div>{input.description}</div>}
              </ListItem>
            ))}
          </List>
        ) : (
          <Description>No inputs defined</Description>
        )}
      </Section>

      <Section>
        <SectionTitle>Outputs</SectionTitle>
        {Object.keys(analysis.outputs).length > 0 ? (
          <List>
            {Object.entries(analysis.outputs).map(([name, output]) => (
              <ListItem key={name}>
                <strong>{name}</strong>
                {output.description && <div>{output.description}</div>}
                {output.value && <div><code>{output.value}</code></div>}
              </ListItem>
            ))}
          </List>
        ) : (
          <Description>No outputs defined</Description>
        )}
      </Section>

      <Section>
        <SectionTitle>Configuration Questions</SectionTitle>
        {analysis.questions.length > 0 ? (
          <Description>
            This action requires additional configuration. Please answer the questions below to customize your wrapper.
          </Description>
        ) : (
          <Description>No configuration questions available</Description>
        )}
      </Section>
    </Container>
  );
};

export default ActionAnalysisView;