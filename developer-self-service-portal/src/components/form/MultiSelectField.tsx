/**
 * Multi-select field component
 */
import { useFormContext, Controller } from 'react-hook-form';
import styled from 'styled-components';
import type { FormFieldSchema } from '../../utils/formSchemaParser';

const SelectContainer = styled.div`
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
  transition: border-color 0.2s;
  
  &:focus-within {
    border-color: #0366d6;
    box-shadow: 0 0 0 2px rgba(3, 102, 214, 0.2);
  }
`;

const OptionsContainer = styled.div`
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
`;

const OptionItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.25rem 0;
`;

const Checkbox = styled.input`
  margin-right: 0.5rem;
  cursor: pointer;
`;

const OptionLabel = styled.label`
  font-size: 0.875rem;
  cursor: pointer;
`;

const SelectedCount = styled.div`
  font-size: 0.75rem;
  color: #666;
  padding: 0.25rem 0.5rem;
  border-top: 1px solid #eee;
`;

const HelpText = styled.div`
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
`;

export interface MultiSelectFieldProps {
  /** Field schema */
  field: FormFieldSchema;
}

/**
 * Multi-select field component
 */
const MultiSelectField: React.FC<MultiSelectFieldProps> = ({ field }) => {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[field.name];
  
  return (
    <>
      <Controller
        name={field.name}
        control={control}
        render={({ field: { onChange, value = [] } }) => (
          <SelectContainer>
            <OptionsContainer>
              {field.options?.map((option) => (
                <OptionItem key={option.value}>
                  <Checkbox
                    type="checkbox"
                    id={`${field.name}-${option.value}`}
                    checked={value.includes(option.value)}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...value, option.value]
                        : value.filter((v: string) => v !== option.value);
                      onChange(newValue);
                    }}
                  />
                  <OptionLabel htmlFor={`${field.name}-${option.value}`}>
                    {option.label}
                  </OptionLabel>
                </OptionItem>
              ))}
            </OptionsContainer>
            <SelectedCount>
              {Array.isArray(value) ? value.length : 0} selected
            </SelectedCount>
          </SelectContainer>
        )}
      />
      
      {field.ui?.helpText && !error && (
        <HelpText>{field.ui.helpText}</HelpText>
      )}
    </>
  );
};

export default MultiSelectField;