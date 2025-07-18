/**
 * Example component demonstrating the DynamicForm usage
 */
import { useState } from 'react';
import styled from 'styled-components';
import { z } from 'zod';
import DynamicForm from '../components/DynamicForm';
import type { FormSchema } from '../utils/formSchemaParser';

const Container = styled.div`
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const ResultContainer = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f6f8fa;
  border-radius: 4px;
  border: 1px solid #e1e4e8;
`;

const ResultTitle = styled.h2`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
`;

const ResultCode = styled.pre`
  background-color: #f0f0f0;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
`;

/**
 * Example component demonstrating the DynamicForm usage
 */
const DynamicFormExample: React.FC = () => {
  const [formResult, setFormResult] = useState<Record<string, any> | null>(null);
  
  // Example form schema
  const exampleSchema: FormSchema = {
    fields: [
      {
        name: 'name',
        label: 'Name',
        description: 'Your full name',
        required: true,
        type: 'text',
        validation: z.string().min(1, 'Name is required'),
        ui: {
          placeholder: 'Enter your name',
          helpText: 'Please provide your full name',
        },
      },
      {
        name: 'email',
        label: 'Email',
        description: 'Your email address',
        required: true,
        type: 'text',
        validation: z.string().email('Invalid email address'),
        ui: {
          placeholder: 'Enter your email',
          helpText: 'We will never share your email',
        },
      },
      {
        name: 'age',
        label: 'Age',
        description: 'Your age in years',
        required: false,
        type: 'number',
        validation: z.number().min(18, 'Must be at least 18 years old').optional(),
        ui: {
          placeholder: 'Enter your age',
          helpText: 'Optional',
        },
      },
      {
        name: 'country',
        label: 'Country',
        description: 'Your country of residence',
        required: true,
        type: 'select',
        options: [
          { value: 'us', label: 'United States' },
          { value: 'ca', label: 'Canada' },
          { value: 'uk', label: 'United Kingdom' },
          { value: 'au', label: 'Australia' },
        ],
        validation: z.string().min(1, 'Country is required'),
      },
      {
        name: 'interests',
        label: 'Interests',
        description: 'Select your interests',
        required: false,
        type: 'multiselect',
        options: [
          { value: 'tech', label: 'Technology' },
          { value: 'sports', label: 'Sports' },
          { value: 'music', label: 'Music' },
          { value: 'art', label: 'Art' },
          { value: 'travel', label: 'Travel' },
        ],
        validation: z.array(z.string()).optional(),
      },
      {
        name: 'subscribe',
        label: 'Subscribe',
        description: 'Subscribe to our newsletter',
        required: false,
        type: 'boolean',
        validation: z.boolean().optional(),
        defaultValue: false,
      },
      {
        name: 'showAdvanced',
        label: 'Show Advanced Options',
        required: false,
        type: 'boolean',
        validation: z.boolean().optional(),
        defaultValue: false,
      },
      {
        name: 'apiKey',
        label: 'API Key',
        description: 'Your API key for advanced features',
        required: false,
        type: 'text',
        validation: z.string().optional(),
        dependsOn: {
          field: 'showAdvanced',
          value: true,
        },
      },
      {
        name: 'comments',
        label: 'Comments',
        description: 'Any additional comments',
        required: false,
        type: 'textarea',
        validation: z.string().optional(),
        ui: {
          placeholder: 'Enter your comments here',
        },
      },
    ],
    validationSchema: z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email address'),
      age: z.number().min(18, 'Must be at least 18 years old').optional(),
      country: z.string().min(1, 'Country is required'),
      interests: z.array(z.string()).optional(),
      subscribe: z.boolean().optional(),
      showAdvanced: z.boolean().optional(),
      apiKey: z.string().optional(),
      comments: z.string().optional(),
    }),
  };
  
  // Handle form submission
  const handleSubmit = (data: Record<string, any>) => {
    console.log('Form submitted:', data);
    setFormResult(data);
  };
  
  // Handle form cancellation
  const handleCancel = () => {
    console.log('Form cancelled');
    setFormResult(null);
  };
  
  return (
    <Container>
      <Title>Dynamic Form Example</Title>
      
      <DynamicForm
        schema={exampleSchema}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitText="Save Information"
      />
      
      {formResult && (
        <ResultContainer>
          <ResultTitle>Form Result:</ResultTitle>
          <ResultCode>
            {JSON.stringify(formResult, null, 2)}
          </ResultCode>
        </ResultContainer>
      )}
    </Container>
  );
};

export default DynamicFormExample;