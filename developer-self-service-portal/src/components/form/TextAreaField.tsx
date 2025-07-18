/**
 * Text area field component for multi-line text input
 */
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';
import type { FormFieldSchema } from '../../utils/formSchemaParser';

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
  min-height: 100px;
  resize: vertical;
  
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

const HelpText = styled.div`
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
`;

export interface TextAreaFieldProps {
  /** Field schema */
  field: FormFieldSchema;
}

/**
 * Text area field component for multi-line text input
 */
const TextAreaField: React.FC<TextAreaFieldProps> = ({ field }) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[field.name];
  
  return (
    <>
      <TextArea
        id={field.name}
        placeholder={field.ui?.placeholder}
        aria-invalid={!!error}
        rows={5}
        {...register(field.name)}
      />
      
      {field.ui?.helpText && !error && (
        <HelpText>{field.ui.helpText}</HelpText>
      )}
    </>
  );
};

export default TextAreaField;