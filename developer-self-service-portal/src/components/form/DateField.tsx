/**
 * Date picker field component
 */
import { useFormContext, Controller } from 'react-hook-form';
import styled from 'styled-components';
import type { FormFieldSchema } from '../../utils/formSchemaParser';

const DateContainer = styled.div`
  position: relative;
  width: 100%;
`;

const DateInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #0366d6;
    box-shadow: 0 0 0 2px rgba(3, 102, 214, 0.2);
  }
  
  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
  }
`;

const HelpText = styled.div`
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
`;

export interface DateFieldProps {
  /** Field schema */
  field: FormFieldSchema;
}

/**
 * Date picker field component
 */
const DateField: React.FC<DateFieldProps> = ({ field }) => {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[field.name];
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <>
      <Controller
        name={field.name}
        control={control}
        render={({ field: { onChange, value } }) => (
          <DateContainer>
            <DateInput
              type="date"
              id={field.name}
              value={formatDate(value)}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.ui?.placeholder}
              aria-invalid={!!error}
            />
          </DateContainer>
        )}
      />
      
      {field.ui?.helpText && !error && (
        <HelpText>{field.ui.helpText}</HelpText>
      )}
    </>
  );
};

export default DateField;