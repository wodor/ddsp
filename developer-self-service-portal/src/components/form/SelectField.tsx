/**
 * Select dropdown field component
 */
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';
import type { FormFieldSchema } from '../../utils/formSchemaParser';

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
  background-color: white;
  
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

export interface SelectFieldProps {
  /** Field schema */
  field: FormFieldSchema;
}

/**
 * Select dropdown field component
 */
const SelectField: React.FC<SelectFieldProps> = ({ field }) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[field.name];
  
  return (
    <>
      <Select
        id={field.name}
        aria-invalid={!!error}
        {...register(field.name)}
      >
        <option value="">Select {field.label}</option>
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      
      {field.ui?.helpText && !error && (
        <HelpText>{field.ui.helpText}</HelpText>
      )}
    </>
  );
};

export default SelectField;