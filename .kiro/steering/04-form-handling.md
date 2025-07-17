---
inclusion: fileMatch
fileMatchPattern: 'src/components/*Form*'
---

# Form Handling and UI Components

## Form Implementation Guidelines

Forms are a critical part of the Developer Self-Service Portal, especially for workflow execution. This document provides guidelines for implementing forms with React Hook Form and Zod validation.

## Form Structure

```typescript
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Define schema with Zod
const formSchema = z.object({
  field1: z.string().min(1, 'Field is required'),
  field2: z.number().min(0, 'Must be a positive number'),
  // More fields...
});

// Infer TypeScript type from schema
type FormData = z.infer<typeof formSchema>;

const MyForm = () => {
  // Initialize form with React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      field1: '',
      field2: 0,
    },
  });

  // Form submission handler
  const onSubmit = (data: FormData) => {
    // Handle form submission
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="field1">Field 1</label>
        <input id="field1" {...register('field1')} />
        {errors.field1 && <span>{errors.field1.message}</span>}
      </div>
      
      <div>
        <label htmlFor="field2">Field 2</label>
        <input 
          id="field2" 
          type="number" 
          {...register('field2', { valueAsNumber: true })} 
        />
        {errors.field2 && <span>{errors.field2.message}</span>}
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
};
```

## Form Components

Create reusable form components for common input types:

### Text Input

```typescript
interface TextInputProps {
  name: string;
  label: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  placeholder?: string;
  type?: 'text' | 'password' | 'email';
  required?: boolean;
}

const TextInput: FC<TextInputProps> = ({
  name,
  label,
  register,
  error,
  placeholder = '',
  type = 'text',
  required = false,
}) => (
  <FormGroup>
    <Label htmlFor={name}>
      {label}
      {required && <RequiredIndicator>*</RequiredIndicator>}
    </Label>
    <Input
      id={name}
      type={type}
      placeholder={placeholder}
      {...register(name)}
      $hasError={!!error}
    />
    {error && <ErrorMessage>{error.message}</ErrorMessage>}
  </FormGroup>
);
```

### Select Input

```typescript
interface Option {
  value: string;
  label: string;
}

interface SelectInputProps {
  name: string;
  label: string;
  options: Option[];
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
}

const SelectInput: FC<SelectInputProps> = ({
  name,
  label,
  options,
  register,
  error,
  required = false,
}) => (
  <FormGroup>
    <Label htmlFor={name}>
      {label}
      {required && <RequiredIndicator>*</RequiredIndicator>}
    </Label>
    <Select id={name} {...register(name)} $hasError={!!error}>
      <option value="">Select...</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
    {error && <ErrorMessage>{error.message}</ErrorMessage>}
  </FormGroup>
);
```

## Form Validation

- Use Zod schemas for form validation
- Create reusable validation schemas for common patterns
- Provide clear error messages for validation failures
- Implement both client-side and server-side validation

### Common Validation Schemas

```typescript
// GitHub repository name validation
const repoNameSchema = z.string().regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid repository name format');

// GitHub owner validation
const ownerSchema = z.string().regex(/^[a-zA-Z0-9_-]+$/, 'Invalid owner format');

// GitHub reference (branch, tag) validation
const refSchema = z.string().regex(/^[a-zA-Z0-9_/.-]+$/, 'Invalid reference format');

// GitHub token validation
const tokenSchema = z.string().min(1, 'Token is required');

// Email validation
const emailSchema = z.string().email('Invalid email format');

// URL validation
const urlSchema = z.string().url('Invalid URL format');
```

## Form Styling

Use styled-components for consistent form styling:

```typescript
const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
`;

const Label = styled.label`
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const RequiredIndicator = styled.span`
  color: #d32f2f;
  margin-left: 0.25rem;
`;

const Input = styled.input<{ $hasError?: boolean }>`
  padding: 0.75rem;
  border: 1px solid ${(props) => (props.$hasError ? '#d32f2f' : '#ccc')};
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${(props) => (props.$hasError ? '#d32f2f' : '#0366d6')};
    box-shadow: 0 0 0 2px ${(props) => (props.$hasError ? 'rgba(211, 47, 47, 0.2)' : 'rgba(3, 102, 214, 0.2)')};
  }
`;

const Select = styled.select<{ $hasError?: boolean }>`
  padding: 0.75rem;
  border: 1px solid ${(props) => (props.$hasError ? '#d32f2f' : '#ccc')};
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: ${(props) => (props.$hasError ? '#d32f2f' : '#0366d6')};
    box-shadow: 0 0 0 2px ${(props) => (props.$hasError ? 'rgba(211, 47, 47, 0.2)' : 'rgba(3, 102, 214, 0.2)')};
  }
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

const Button = styled.button`
  padding: 0.75rem 1rem;
  background-color: #0366d6;
  color: white;
  border: none;
  border-radius: 4px;
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
```

## Form Accessibility

- Use proper HTML form elements with semantic markup
- Include labels for all form controls
- Provide aria attributes for screen readers
- Ensure keyboard navigation works correctly
- Use proper error messaging that is accessible to screen readers

## Form Testing

- Test form validation with valid and invalid inputs
- Verify error messages are displayed correctly
- Test form submission and handling
- Test form reset functionality
- Verify accessibility requirements