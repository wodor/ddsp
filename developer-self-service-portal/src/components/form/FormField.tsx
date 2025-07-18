/**
 * Form field component that renders the appropriate input based on field type
 */
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';
import type { FormFieldSchema } from '../../utils/formSchemaParser';
import TextField from './TextField';
import NumberField from './NumberField';
import BooleanField from './BooleanField';
import SelectField from './SelectField';
import MultiSelectField from './MultiSelectField';
import BranchField from './BranchField';
import RepositoryField from './RepositoryField';
import DateField from './DateField';
import TextAreaField from './TextAreaField';

const FieldContainer = styled.div<{ width?: string | number }>`
  width: ${({ width }) => width || '100%'};
`;

const FieldLabel = styled.label<{ required: boolean }>`
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  
  &::after {
    content: ${({ required }) => required ? '"*"' : '""'};
    color: #d32f2f;
    margin-left: 0.25rem;
  }
`;

const FieldDescription = styled.div`
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

export interface FormFieldProps {
  /** Field schema */
  field: FormFieldSchema;
}

/**
 * Form field component that renders the appropriate input based on field type
 */
const FormField: React.FC<FormFieldProps> = ({ field }) => {
  const { formState: { errors } } = useFormContext();
  const error = errors[field.name]?.message as string | undefined;

  // Render the appropriate field component based on field type
  const renderFieldComponent = () => {
    switch (field.type) {
      case 'text':
        return <TextField field={field} />;
      case 'number':
        return <NumberField field={field} />;
      case 'boolean':
        return <BooleanField field={field} />;
      case 'select':
        return <SelectField field={field} />;
      case 'multiselect':
        return <MultiSelectField field={field} />;
      case 'branch':
        return <BranchField field={field} />;
      case 'repository':
        return <RepositoryField field={field} />;
      case 'date':
        return <DateField field={field} />;
      case 'textarea':
        return <TextAreaField field={field} />;
      default:
        return <TextField field={field} />;
    }
  };

  return (
    <FieldContainer width={field.ui?.width}>
      <FieldLabel htmlFor={field.name} required={field.required}>
        {field.label}
      </FieldLabel>
      
      {field.description && (
        <FieldDescription>{field.description}</FieldDescription>
      )}
      
      {renderFieldComponent()}
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </FieldContainer>
  );
};

export default FormField;