/**
 * Utility for converting GitHub Action inputs to form schemas with Zod validation
 */
import { z } from 'zod';
import type { ActionInput } from '../types/catalog';

/**
 * Represents a form field schema with validation and UI properties
 */
export interface FormFieldSchema {
  /** Field name/id */
  name: string;
  /** Field label */
  label: string;
  /** Field description */
  description?: string;
  /** Whether the field is required */
  required: boolean;
  /** Default value for the field */
  defaultValue?: any;
  /** Field type */
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'branch' | 'repository' | 'date' | 'textarea';
  /** Options for select fields */
  options?: Array<{ value: string; label: string }>;
  /** Validation schema for the field */
  validation: z.ZodTypeAny;
  /** Whether the field is dependent on another field */
  dependsOn?: {
    /** Field this field depends on */
    field: string;
    /** Value of the dependent field that triggers showing this field */
    value: any;
  };
  /** Additional UI properties */
  ui?: {
    /** Placeholder text */
    placeholder?: string;
    /** Help text */
    helpText?: string;
    /** Whether to show the field inline */
    inline?: boolean;
    /** Component to use for rendering the field */
    component?: string;
    /** Width of the field (in grid units or CSS value) */
    width?: string | number;
  };
}

/**
 * Represents a complete form schema
 */
export interface FormSchema {
  /** Form fields */
  fields: FormFieldSchema[];
  /** Zod validation schema for the entire form */
  validationSchema: z.ZodObject<any>;
}

/**
 * Infer the appropriate Zod schema based on input type
 * @param input - The action input
 * @returns Zod schema for the input
 */
export function inferZodSchema(input: ActionInput): z.ZodTypeAny {
  const { type, required, name, options } = input;
  
  // Base schema based on type
  let schema: z.ZodTypeAny;
  
  switch (type?.toLowerCase()) {
    case 'boolean':
      schema = z.boolean();
      break;
    case 'number':
      schema = z.number();
      break;
    case 'choice':
    case 'select':
      if (options && options.length > 0) {
        schema = z.enum(options as [string, ...string[]]);
      } else {
        schema = z.string();
      }
      break;
    case 'array':
    case 'multiselect':
      schema = z.array(z.string());
      break;
    default:
      // Default to string for unknown types
      schema = z.string();
  }
  
  // Add validation based on required flag
  if (required) {
    // Fix: Check if schema is a ZodString instance before applying min
    if (schema instanceof z.ZodString) {
      schema = schema.min(1, `${name} is required`);
    } else {
      schema = schema.refine(val => val !== undefined && val !== null, {
        message: `${name} is required`,
      });
    }
  } else {
    schema = schema.optional();
  }
  
  return schema;
}

/**
 * Infer the appropriate form field type based on input type and name
 * @param input - The action input
 * @returns Form field type
 */
export function inferFieldType(input: ActionInput): FormFieldSchema['type'] {
  // Check if there's an enhanced type specified
  if (input.enhanced?.type) {
    switch (input.enhanced.type.toLowerCase()) {
      case 'branch-selector':
        return 'branch';
      case 'repository-selector':
        return 'repository';
      case 'date-picker':
        return 'date';
      case 'multi-select':
        return 'multiselect';
      case 'textarea':
        return 'textarea';
    }
  }
  
  // Infer from input type
  if (input.type) {
    switch (input.type.toLowerCase()) {
      case 'boolean':
        return 'boolean';
      case 'number':
        return 'number';
      case 'choice':
      case 'select':
        return 'select';
      case 'array':
        return 'multiselect';
    }
  }
  
  // Infer from name patterns
  const name = input.name.toLowerCase();
  if (name.includes('branch')) {
    return 'branch';
  } else if (name.includes('repo')) {
    return 'repository';
  } else if (name.includes('date')) {
    return 'date';
  } else if (name.includes('description') || name.includes('comment')) {
    return 'textarea';
  } else if (input.options && input.options.length > 0) {
    return 'select';
  }
  
  // Default to text
  return 'text';
}

/**
 * Convert an action input to a form field schema
 * @param input - The action input
 * @returns Form field schema
 */
export function inputToFieldSchema(input: ActionInput): FormFieldSchema {
  const fieldType = inferFieldType(input);
  const zodSchema = inferZodSchema(input);
  
  const field: FormFieldSchema = {
    name: input.name,
    label: input.name.charAt(0).toUpperCase() + input.name.slice(1).replace(/-([a-z])/g, ' $1').replace(/([A-Z])/g, ' $1'),
    description: input.description,
    required: input.required,
    type: fieldType,
    validation: zodSchema,
  };
  
  // Add default value if present
  if (input.default !== undefined) {
    // Convert default value to appropriate type
    switch (fieldType) {
      case 'boolean':
        field.defaultValue = input.default === 'true' || input.default === String(true);
        break;
      case 'number':
        field.defaultValue = Number(input.default);
        break;
      default:
        field.defaultValue = input.default;
    }
  }
  
  // Add options for select fields
  if (input.options && (fieldType === 'select' || fieldType === 'multiselect')) {
    field.options = input.options.map(option => ({
      value: option,
      label: option,
    }));
  }
  
  // Add dependency if specified
  if (input.enhanced?.dependsOn) {
    field.dependsOn = {
      field: input.enhanced.dependsOn,
      value: input.enhanced.condition,
    };
  }
  
  // Add UI properties
  field.ui = {
    placeholder: `Enter ${input.name}`,
    helpText: input.description,
  };
  
  return field;
}

/**
 * Convert action inputs to a form schema
 * @param inputs - Array of action inputs
 * @returns Form schema with validation
 */
export function createFormSchema(inputs: ActionInput[]): FormSchema {
  // Convert inputs to field schemas
  const fields = inputs.map(input => inputToFieldSchema(input));
  
  // Create Zod schema object
  const schemaShape: Record<string, z.ZodTypeAny> = {};
  fields.forEach(field => {
    schemaShape[field.name] = field.validation;
  });
  
  const validationSchema = z.object(schemaShape);
  
  return {
    fields,
    validationSchema,
  };
}

/**
 * Generate default values object from form schema
 * @param schema - Form schema
 * @returns Object with default values
 */
export function generateDefaultValues(schema: FormSchema): Record<string, any> {
  const defaultValues: Record<string, any> = {};
  
  schema.fields.forEach(field => {
    if (field.defaultValue !== undefined) {
      defaultValues[field.name] = field.defaultValue;
    } else {
      // Provide appropriate empty values based on field type
      switch (field.type) {
        case 'boolean':
          defaultValues[field.name] = false;
          break;
        case 'number':
          defaultValues[field.name] = 0;
          break;
        case 'select':
          defaultValues[field.name] = '';
          break;
        case 'multiselect':
          defaultValues[field.name] = [];
          break;
        default:
          defaultValues[field.name] = '';
      }
    }
  });
  
  return defaultValues;
}

/**
 * Create a form schema from GitHub workflow YAML inputs
 * @param workflowInputs - Workflow inputs from YAML
 * @returns Form schema with validation
 */
export function createFormSchemaFromWorkflow(workflowInputs: Record<string, any>): FormSchema {
  // Convert workflow inputs to ActionInput format
  const actionInputs: ActionInput[] = Object.entries(workflowInputs).map(([name, input]) => ({
    name,
    description: input.description || '',
    required: input.required || false,
    default: input.default !== undefined ? String(input.default) : undefined,
    type: input.type || 'string',
    options: input.options,
  }));
  
  return createFormSchema(actionInputs);
}

/**
 * Validate form data against a form schema
 * @param schema - Form schema
 * @param data - Form data to validate
 * @returns Validation result with parsed data or errors
 */
export function validateFormData(schema: FormSchema, data: Record<string, any>): {
  success: boolean;
  data?: Record<string, any>;
  errors?: Record<string, string>;
} {
  try {
    const validatedData = schema.validationSchema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    const errors: Record<string, string> = {};
    
    if (error instanceof z.ZodError) {
      // Fix: Access issues property instead of errors
      for (const err of error.issues) {
        if (err.path && Array.isArray(err.path) && err.path.length > 0) {
          const path = err.path.join('.');
          errors[path] = err.message;
        } else {
          errors['_form'] = err.message;
        }
      }
    } else {
      errors['_form'] = 'An unknown error occurred during validation';
    }
    
    return {
      success: false,
      errors,
    };
  }
}

/**
 * Get visible fields based on dependencies
 * @param schema - Form schema
 * @param formData - Current form data
 * @returns Array of visible field names
 */
export function getVisibleFields(schema: FormSchema, formData: Record<string, any>): string[] {
  return schema.fields
    .filter(field => {
      // If field has no dependencies, it's always visible
      if (!field.dependsOn) {
        return true;
      }
      
      // Check if the dependent field has the required value
      const { field: dependentField, value } = field.dependsOn;
      return formData[dependentField] === value;
    })
    .map(field => field.name);
}

/**
 * Create a specialized form schema for branch selection
 * @param fieldName - Name of the branch field
 * @param required - Whether the branch is required
 * @param description - Field description
 * @returns Form field schema for branch selection
 */
export function createBranchFieldSchema(
  fieldName: string = 'branch',
  required: boolean = true,
  description: string = 'Branch to use for the workflow'
): FormFieldSchema {
  return {
    name: fieldName,
    label: 'Branch',
    description,
    required,
    type: 'branch',
    validation: required ? z.string().min(1, 'Branch is required') : z.string().optional(),
    ui: {
      placeholder: 'Select a branch',
      helpText: description,
      component: 'BranchSelector',
    },
  };
}

/**
 * Create a specialized form schema for repository selection
 * @param fieldName - Name of the repository field
 * @param required - Whether the repository is required
 * @param description - Field description
 * @returns Form field schema for repository selection
 */
export function createRepositoryFieldSchema(
  fieldName: string = 'repository',
  required: boolean = true,
  description: string = 'Repository to use for the workflow'
): FormFieldSchema {
  return {
    name: fieldName,
    label: 'Repository',
    description,
    required,
    type: 'repository',
    validation: required ? z.string().min(1, 'Repository is required') : z.string().optional(),
    ui: {
      placeholder: 'Select a repository',
      helpText: description,
      component: 'RepositorySelector',
    },
  };
}