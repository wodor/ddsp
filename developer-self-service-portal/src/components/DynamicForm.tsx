/**
 * Dynamic form component that renders form fields based on a schema
 */
import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import styled from 'styled-components';
import type { FormSchema } from '../utils/formSchemaParser';
import { generateDefaultValues, getVisibleFields, validateFormData } from '../utils/formSchemaParser';
import FormField from './form/FormField';

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 800px;
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const FormError = styled.div`
  color: #d32f2f;
  background-color: #ffebee;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`;

const SubmitButton = styled.button`
  background-color: #0366d6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0255b3;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  background-color: transparent;
  color: #0366d6;
  border: 1px solid #0366d6;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f0f4f8;
  }
`;

export interface DynamicFormProps {
  /** Form schema defining fields and validation */
  schema: FormSchema;
  /** Initial values for the form */
  initialValues?: Record<string, any>;
  /** Function called when form is submitted successfully */
  onSubmit: (data: Record<string, any>) => void;
  /** Function called when form submission is cancelled */
  onCancel?: () => void;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Submit button text */
  submitText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Whether to show the cancel button */
  showCancel?: boolean;
}

/**
 * Dynamic form component that renders form fields based on a schema
 */
const DynamicForm: React.FC<DynamicFormProps> = ({
  schema,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitText = 'Submit',
  cancelText = 'Cancel',
  showCancel = true,
}) => {
  // Generate default values from schema and merge with initialValues
  const defaultValues = {
    ...generateDefaultValues(schema),
    ...initialValues,
  };

  // Set up form with React Hook Form
  const methods = useForm({
    resolver: zodResolver(schema.validationSchema),
    defaultValues,
    mode: 'onChange',
  });

  const {
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
  } = methods;

  // Reset form when initialValues change
  useEffect(() => {
    if (initialValues) {
      reset({ ...defaultValues, ...initialValues });
    }
  }, [initialValues, reset]);

  // Watch form values to determine which fields should be visible
  const formValues = watch();
  const [visibleFields, setVisibleFields] = useState<string[]>([]);

  useEffect(() => {
    setVisibleFields(getVisibleFields(schema, formValues));
  }, [schema, formValues]);

  // Handle form submission
  const handleFormSubmit = (data: Record<string, any>) => {
    const validationResult = validateFormData(schema, data);
    if (validationResult.success && validationResult.data) {
      onSubmit(validationResult.data);
    }
  };

  // Get form-level error if any
  const formError = errors._formError?.message || errors._form?.message;

  return (
    <FormProvider {...methods}>
      <FormContainer onSubmit={handleSubmit(handleFormSubmit)}>
        {formError && <FormError>{formError}</FormError>}

        {schema.fields.map((field) => (
          visibleFields.includes(field.name) && (
            <FormField
              key={field.name}
              field={field}
            />
          )
        ))}

        <FormActions>
          {showCancel && (
            <CancelButton
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {cancelText}
            </CancelButton>
          )}
          <SubmitButton
            type="submit"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : submitText}
          </SubmitButton>
        </FormActions>
      </FormContainer>
    </FormProvider>
  );
};

export default DynamicForm;