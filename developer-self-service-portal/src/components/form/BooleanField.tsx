/**
 * Boolean input field component (checkbox)
 */
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';
import type { FormFieldSchema } from '../../utils/formSchemaParser';

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
`;

const Checkbox = styled.input`
  margin-right: 0.5rem;
  cursor: pointer;
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const CheckboxLabel = styled.label`
  font-size: 1rem;
  cursor: pointer;
`;

const HelpText = styled.div`
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
`;

export interface BooleanFieldProps {
  /** Field schema */
  field: FormFieldSchema;
}

/**
 * Boolean input field component (checkbox)
 */
const BooleanField: React.FC<BooleanFieldProps> = ({ field }) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[field.name];
  
  return (
    <>
      <CheckboxContainer>
        <Checkbox
          id={field.name}
          type="checkbox"
          aria-invalid={!!error}
          {...register(field.name)}
        />
        <CheckboxLabel htmlFor={field.name}>
          {field.ui?.helpText || field.description || field.label}
        </CheckboxLabel>
      </CheckboxContainer>
      
      {field.ui?.helpText && !error && field.ui.helpText !== field.description && (
        <HelpText>{field.ui.helpText}</HelpText>
      )}
    </>
  );
};

export default BooleanField;