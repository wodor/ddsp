/**
 * Tests for the DynamicForm component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import DynamicForm from '../../components/DynamicForm';
import type { FormSchema } from '../../utils/formSchemaParser';

describe('DynamicForm', () => {
  // Create a simple form schema for testing
  const testSchema: FormSchema = {
    fields: [
      {
        name: 'name',
        label: 'Name',
        description: 'Your full name',
        required: true,
        type: 'text',
        validation: z.string().min(1, 'Name is required'),
        ui: {
          placeholder: 'Enter your name',
          helpText: 'Please provide your full name',
        },
      },
      {
        name: 'email',
        label: 'Email',
        description: 'Your email address',
        required: true,
        type: 'text',
        validation: z.string().email('Invalid email address'),
        ui: {
          placeholder: 'Enter your email',
          helpText: 'We will never share your email',
        },
      },
      {
        name: 'age',
        label: 'Age',
        description: 'Your age in years',
        required: false,
        type: 'number',
        validation: z.number().min(18, 'Must be at least 18 years old').optional(),
        ui: {
          placeholder: 'Enter your age',
          helpText: 'Optional',
        },
      },
      {
        name: 'subscribe',
        label: 'Subscribe',
        description: 'Subscribe to our newsletter',
        required: false,
        type: 'boolean',
        validation: z.boolean().optional(),
        defaultValue: false,
      },
    ],
    validationSchema: z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email address'),
      age: z.number().min(18, 'Must be at least 18 years old').optional(),
      subscribe: z.boolean().optional(),
    }),
  };

  it('renders all form fields', () => {
    const handleSubmit = vi.fn();
    
    render(
      <DynamicForm
        schema={testSchema}
        onSubmit={handleSubmit}
      />
    );
    
    // Check that all fields are rendered
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subscribe/i)).toBeInTheDocument();
    
    // Check that help text is rendered
    expect(screen.getByText('Please provide your full name')).toBeInTheDocument();
    expect(screen.getByText('We will never share your email')).toBeInTheDocument();
    
    // Check that submit button is rendered
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });
  
  it('handles form submission with valid data', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    
    render(
      <DynamicForm
        schema={testSchema}
        onSubmit={handleSubmit}
      />
    );
    
    // Fill out the form
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/age/i), '25');
    await user.click(screen.getByLabelText(/subscribe/i));
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Check that onSubmit was called with the correct data
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
        subscribe: true,
      });
    });
  });
  
  it('displays validation errors for invalid data', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    
    render(
      <DynamicForm
        schema={testSchema}
        onSubmit={handleSubmit}
      />
    );
    
    // Submit without filling required fields
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Check that validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
    
    // Check that onSubmit was not called
    expect(handleSubmit).not.toHaveBeenCalled();
    
    // Fill out the form with invalid data
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.type(screen.getByLabelText(/age/i), '15');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Check that validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      expect(screen.getByText('Must be at least 18 years old')).toBeInTheDocument();
    });
    
    // Check that onSubmit was not called
    expect(handleSubmit).not.toHaveBeenCalled();
  });
  
  it('handles conditional fields', async () => {
    const conditionalSchema: FormSchema = {
      fields: [
        {
          name: 'showExtra',
          label: 'Show Extra Fields',
          required: true,
          type: 'boolean',
          validation: z.boolean(),
          defaultValue: false,
        },
        {
          name: 'extraField',
          label: 'Extra Field',
          required: false,
          type: 'text',
          validation: z.string().optional(),
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
    };
    
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    
    render(
      <DynamicForm
        schema={conditionalSchema}
        onSubmit={handleSubmit}
      />
    );
    
    // Extra field should not be visible initially
    expect(screen.queryByLabelText(/extra field/i)).not.toBeInTheDocument();
    
    // Check the checkbox to show extra fields
    await user.click(screen.getByLabelText(/show extra fields/i));
    
    // Extra field should now be visible
    await waitFor(() => {
      expect(screen.getByLabelText(/extra field/i)).toBeInTheDocument();
    });
    
    // Uncheck the checkbox
    await user.click(screen.getByLabelText(/show extra fields/i));
    
    // Extra field should be hidden again
    await waitFor(() => {
      expect(screen.queryByLabelText(/extra field/i)).not.toBeInTheDocument();
    });
  });
  
  it('handles initial values', () => {
    const handleSubmit = vi.fn();
    const initialValues = {
      name: 'Jane Smith',
      email: 'jane@example.com',
      age: 30,
      subscribe: true,
    };
    
    render(
      <DynamicForm
        schema={testSchema}
        initialValues={initialValues}
        onSubmit={handleSubmit}
      />
    );
    
    // Check that fields have initial values
    expect(screen.getByLabelText(/name/i)).toHaveValue('Jane Smith');
    expect(screen.getByLabelText(/email/i)).toHaveValue('jane@example.com');
    expect(screen.getByLabelText(/age/i)).toHaveValue(30);
    expect(screen.getByLabelText(/subscribe/i)).toBeChecked();
  });
  
  it('handles cancel button click', async () => {
    const handleSubmit = vi.fn();
    const handleCancel = vi.fn();
    const user = userEvent.setup();
    
    render(
      <DynamicForm
        schema={testSchema}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    );
    
    // Click the cancel button
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    
    // Check that onCancel was called
    expect(handleCancel).toHaveBeenCalled();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});