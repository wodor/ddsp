import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import type { ActionInput } from '../../types/catalog';
import type { FormSchema } from '../../utils/formSchemaParser';
import {
  inferZodSchema,
  inferFieldType,
  inputToFieldSchema,
  createFormSchema,
  generateDefaultValues,
  validateFormData,
  getVisibleFields,
  createBranchFieldSchema,
  createRepositoryFieldSchema,
} from '../../utils/formSchemaParser';

describe('formSchemaParser', () => {
  describe('inferZodSchema', () => {
    it('should create string schema for text inputs', () => {
      const input: ActionInput = {
        name: 'text-input',
        description: 'A text input',
        required: true,
        type: 'string',
      };
      
      const schema = inferZodSchema(input);
      expect(schema).toBeInstanceOf(z.ZodString);
      
      // Test validation
      expect(() => schema.parse('')).toThrow();
      expect(() => schema.parse(undefined)).toThrow();
      expect(schema.parse('value')).toBe('value');
    });
    
    it('should create boolean schema for boolean inputs', () => {
      const input: ActionInput = {
        name: 'bool-input',
        description: 'A boolean input',
        required: true,
        type: 'boolean',
      };
      
      const schema = inferZodSchema(input);
      expect(schema).toBeInstanceOf(z.ZodBoolean);
      
      // Test validation
      expect(() => schema.parse(undefined)).toThrow();
      expect(schema.parse(true)).toBe(true);
      expect(schema.parse(false)).toBe(false);
    });
    
    it('should create number schema for number inputs', () => {
      const input: ActionInput = {
        name: 'num-input',
        description: 'A number input',
        required: true,
        type: 'number',
      };
      
      const schema = inferZodSchema(input);
      expect(schema).toBeInstanceOf(z.ZodNumber);
      
      // Test validation
      expect(() => schema.parse(undefined)).toThrow();
      expect(schema.parse(42)).toBe(42);
    });
    
    it('should create enum schema for select inputs with options', () => {
      const input: ActionInput = {
        name: 'select-input',
        description: 'A select input',
        required: true,
        type: 'select',
        options: ['option1', 'option2', 'option3'],
      };
      
      const schema = inferZodSchema(input);
      expect(schema).toBeInstanceOf(z.ZodEnum);
      
      // Test validation
      expect(() => schema.parse('option4')).toThrow();
      expect(schema.parse('option2')).toBe('option2');
    });
    
    it('should make schema optional when required is false', () => {
      const input: ActionInput = {
        name: 'optional-input',
        description: 'An optional input',
        required: false,
        type: 'string',
      };
      
      const schema = inferZodSchema(input);
      
      // Test validation
      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.parse('value')).toBe('value');
    });
  });
  
  describe('inferFieldType', () => {
    it('should infer text type by default', () => {
      const input: ActionInput = {
        name: 'input',
        description: 'An input',
        required: true,
      };
      
      expect(inferFieldType(input)).toBe('text');
    });
    
    it('should infer boolean type for boolean inputs', () => {
      const input: ActionInput = {
        name: 'input',
        description: 'An input',
        required: true,
        type: 'boolean',
      };
      
      expect(inferFieldType(input)).toBe('boolean');
    });
    
    it('should infer branch type for inputs with branch in the name', () => {
      const input: ActionInput = {
        name: 'branch-name',
        description: 'Branch input',
        required: true,
      };
      
      expect(inferFieldType(input)).toBe('branch');
    });
    
    it('should infer repository type for inputs with repo in the name', () => {
      const input: ActionInput = {
        name: 'repository',
        description: 'Repository input',
        required: true,
      };
      
      expect(inferFieldType(input)).toBe('repository');
    });
    
    it('should use enhanced type if provided', () => {
      const input: ActionInput = {
        name: 'input',
        description: 'An input',
        required: true,
        enhanced: {
          type: 'branch-selector',
          dataSource: 'github-api',
        },
      };
      
      expect(inferFieldType(input)).toBe('branch');
    });
  });
  
  describe('inputToFieldSchema', () => {
    it('should convert a basic input to field schema', () => {
      const input: ActionInput = {
        name: 'test-input',
        description: 'A test input',
        required: true,
        type: 'string',
      };
      
      const fieldSchema = inputToFieldSchema(input);
      
      expect(fieldSchema).toEqual(expect.objectContaining({
        name: 'test-input',
        label: 'Test input',
        description: 'A test input',
        required: true,
        type: 'text',
      }));
      
      expect(fieldSchema.validation).toBeInstanceOf(z.ZodString);
    });
    
    it('should handle default values', () => {
      const input: ActionInput = {
        name: 'input-with-default',
        description: 'Input with default',
        required: false,
        type: 'string',
        default: 'default-value',
      };
      
      const fieldSchema = inputToFieldSchema(input);
      
      expect(fieldSchema.defaultValue).toBe('default-value');
    });
    
    it('should convert boolean default values', () => {
      const input: ActionInput = {
        name: 'bool-input',
        description: 'Boolean input',
        required: true,
        type: 'boolean',
        default: 'true',
      };
      
      const fieldSchema = inputToFieldSchema(input);
      
      expect(fieldSchema.defaultValue).toBe(true);
    });
    
    it('should handle select options', () => {
      const input: ActionInput = {
        name: 'select-input',
        description: 'Select input',
        required: true,
        type: 'select',
        options: ['option1', 'option2', 'option3'],
      };
      
      const fieldSchema = inputToFieldSchema(input);
      
      expect(fieldSchema.type).toBe('select');
      expect(fieldSchema.options).toEqual([
        { value: 'option1', label: 'option1' },
        { value: 'option2', label: 'option2' },
        { value: 'option3', label: 'option3' },
      ]);
    });
    
    it('should handle dependencies', () => {
      const input: ActionInput = {
        name: 'dependent-input',
        description: 'Dependent input',
        required: true,
        enhanced: {
          type: 'text',
          dataSource: 'manual',
          dependsOn: 'other-field',
          condition: 'show-me',
        },
      };
      
      const fieldSchema = inputToFieldSchema(input);
      
      expect(fieldSchema.dependsOn).toEqual({
        field: 'other-field',
        value: 'show-me',
      });
    });
  });
  
  describe('createFormSchema', () => {
    it('should create a form schema from inputs', () => {
      const inputs: ActionInput[] = [
        {
          name: 'name',
          description: 'Your name',
          required: true,
          type: 'string',
        },
        {
          name: 'age',
          description: 'Your age',
          required: true,
          type: 'number',
        },
        {
          name: 'subscribe',
          description: 'Subscribe to newsletter',
          required: false,
          type: 'boolean',
          default: 'false',
        },
      ];
      
      const formSchema = createFormSchema(inputs);
      
      expect(formSchema.fields).toHaveLength(3);
      expect(formSchema.validationSchema).toBeInstanceOf(z.ZodObject);
      
      // Test validation
      const validData = { name: 'John', age: 30, subscribe: false };
      const invalidData = { name: '', age: 'not-a-number', subscribe: false };
      
      expect(() => formSchema.validationSchema.parse(validData)).not.toThrow();
      expect(() => formSchema.validationSchema.parse(invalidData)).toThrow();
    });
  });
  
  describe('generateDefaultValues', () => {
    it('should generate default values from schema', () => {
      const formSchema = createFormSchema([
        {
          name: 'name',
          description: 'Your name',
          required: true,
          type: 'string',
        },
        {
          name: 'age',
          description: 'Your age',
          required: true,
          type: 'number',
          default: '25',
        },
        {
          name: 'subscribe',
          description: 'Subscribe to newsletter',
          required: false,
          type: 'boolean',
          default: 'true',
        },
        {
          name: 'preferences',
          description: 'Your preferences',
          required: false,
          type: 'select',
          options: ['option1', 'option2'],
          default: 'option1',
        },
      ]);
      
      const defaultValues = generateDefaultValues(formSchema);
      
      expect(defaultValues).toEqual({
        name: '',
        age: 25,
        subscribe: true,
        preferences: 'option1',
      });
    });
  });
  
  describe('validateFormData', () => {
    it('should validate form data against schema', () => {
      const formSchema = createFormSchema([
        {
          name: 'name',
          description: 'Your name',
          required: true,
          type: 'string',
        },
        {
          name: 'age',
          description: 'Your age',
          required: true,
          type: 'number',
        },
      ]);
      
      const validResult = validateFormData(formSchema, { name: 'John', age: 30 });
      expect(validResult.success).toBe(true);
      expect(validResult.data).toEqual({ name: 'John', age: 30 });
      
      const invalidResult = validateFormData(formSchema, { name: '', age: 'not-a-number' });
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errors).toBeDefined();
    });
  });
  
  describe('getVisibleFields', () => {
    it('should return all fields when there are no dependencies', () => {
      const formSchema = createFormSchema([
        {
          name: 'field1',
          description: 'Field 1',
          required: true,
        },
        {
          name: 'field2',
          description: 'Field 2',
          required: true,
        },
      ]);
      
      const visibleFields = getVisibleFields(formSchema, {});
      expect(visibleFields).toEqual(['field1', 'field2']);
    });
    
    it('should filter fields based on dependencies', () => {
      // Create a properly typed FormSchema
      const formSchema = {
        fields: [
          {
            name: 'showExtra',
            label: 'Show Extra',
            description: 'Show extra fields',
            required: true,
            type: 'boolean',
            validation: z.boolean(),
          },
          {
            name: 'extraField',
            label: 'Extra Field',
            description: 'Extra field',
            required: false,
            type: 'text',
            validation: z.string(),
            dependsOn: {
              field: 'showExtra',
              value: true,
            },
          },
        ],
        validationSchema: z.object({
          showExtra: z.boolean(),
          extraField: z.string().optional(),
        }),
      } as FormSchema;
      
      // When showExtra is false, extraField should be hidden
      let visibleFields = getVisibleFields(formSchema, { showExtra: false });
      expect(visibleFields).toEqual(['showExtra']);
      
      // When showExtra is true, extraField should be visible
      visibleFields = getVisibleFields(formSchema, { showExtra: true });
      expect(visibleFields).toEqual(['showExtra', 'extraField']);
    });
  });
  
  describe('createBranchFieldSchema', () => {
    it('should create a branch field schema', () => {
      const fieldSchema = createBranchFieldSchema();
      
      expect(fieldSchema).toEqual(expect.objectContaining({
        name: 'branch',
        label: 'Branch',
        required: true,
        type: 'branch',
        ui: expect.objectContaining({
          component: 'BranchSelector',
        }),
      }));
    });
    
    it('should allow customization', () => {
      const fieldSchema = createBranchFieldSchema('custom-branch', false, 'Custom description');
      
      expect(fieldSchema).toEqual(expect.objectContaining({
        name: 'custom-branch',
        label: 'Branch',
        description: 'Custom description',
        required: false,
      }));
    });
  });
  
  describe('createRepositoryFieldSchema', () => {
    it('should create a repository field schema', () => {
      const fieldSchema = createRepositoryFieldSchema();
      
      expect(fieldSchema).toEqual(expect.objectContaining({
        name: 'repository',
        label: 'Repository',
        required: true,
        type: 'repository',
        ui: expect.objectContaining({
          component: 'RepositorySelector',
        }),
      }));
    });
  });
});