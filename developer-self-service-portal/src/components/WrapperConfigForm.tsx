/**
 * Component for configuring a GitHub Action wrapper
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styled from 'styled-components';
import type { ActionAnalysisResult, WrapperConfiguration } from '../types/mcpConfig';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.label`
  font-weight: 600;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  width: 100%;
`;

const TextArea = styled.textarea`
  padding: 8px;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  width: 100%;
  min-height: 80px;
  resize: vertical;
`;

const Select = styled.select`
  padding: 8px;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  width: 100%;
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ErrorMessage = styled.div`
  color: #cb2431;
  font-size: 12px;
  margin-top: 4px;
`;

const HelpText = styled.div`
  color: #586069;
  font-size: 12px;
  margin-top: 4px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #2ea44f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;

  &:hover {
    background-color: #2c974b;
  }

  &:disabled {
    background-color: #94d3a2;
    cursor: not-allowed;
  }
`;

const BackButton = styled.button`
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;

  &:hover {
    background-color: #5a6268;
  }

  &:disabled {
    background-color: #adb5bd;
    cursor: not-allowed;
  }
`;

interface WrapperConfigFormProps {
  /** The analysis result to configure */
  analysis: ActionAnalysisResult;
  /** Function called when form is submitted */
  onSubmit: (config: WrapperConfiguration) => void;
  /** Function called when back button is clicked */
  onBack: () => void;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
}

/**
 * Component for configuring a GitHub Action wrapper
 */
const WrapperConfigForm: React.FC<WrapperConfigFormProps> = ({
  analysis,
  onSubmit,
  onBack,
  isSubmitting = false,
}) => {
  // Create a schema based on the analysis questions
  const createSchema = () => {
    const schemaObj: Record<string, any> = {
      wrapperName: z.string().min(1, 'Wrapper name is required'),
      description: z.string().min(1, 'Description is required'),
    };

    // Add questions to schema
    analysis.questions.forEach((question) => {
      let fieldSchema;
      switch (question.type) {
        case 'boolean':
          fieldSchema = z.boolean();
          break;
        case 'select':
        case 'multiselect':
          fieldSchema = z.string();
          break;
        case 'text':
        default:
          fieldSchema = z.string();
          if (question.required) {
            fieldSchema = fieldSchema.min(1, `${question.question} is required`);
          }
          break;
      }
      schemaObj[question.id] = question.required ? fieldSchema : fieldSchema.optional();
    });

    return z.object(schemaObj);
  };

  const schema = createSchema();
  type FormValues = z.infer<typeof schema>;

  // Set up form with React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      wrapperName: `${analysis.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-wrapper`,
      description: `Wrapper for ${analysis.name} - ${analysis.description}`,
    },
  });

  // Handle form submission
  const handleFormSubmit = (data: FormValues) => {
    // Extract question answers
    const additionalOptions: Record<string, any> = {};
    analysis.questions.forEach((question) => {
      additionalOptions[question.id] = data[question.id as keyof FormValues];
    });

    // Create configuration object
    const config: WrapperConfiguration = {
      wrapperName: data.wrapperName as string,
      description: data.description as string,
      additionalOptions,
    };

    onSubmit(config);
  };

  return (
    <Form onSubmit={handleSubmit(handleFormSubmit)}>
      <FormGroup>
        <Label htmlFor="wrapperName">Wrapper Name</Label>
        <Input
          id="wrapperName"
          {...register('wrapperName')}
          placeholder="Enter a name for your wrapper"
        />
        {errors.wrapperName && <ErrorMessage>{errors.wrapperName.message}</ErrorMessage>}
        <HelpText>This will be used as the name of your wrapper function</HelpText>
      </FormGroup>

      <FormGroup>
        <Label htmlFor="description">Description</Label>
        <TextArea
          id="description"
          {...register('description')}
          placeholder="Enter a description for your wrapper"
        />
        {errors.description && <ErrorMessage>{errors.description.message}</ErrorMessage>}
        <HelpText>This will be used in the documentation for your wrapper</HelpText>
      </FormGroup>

      {analysis.questions.map((question) => (
        <FormGroup key={question.id}>
          <Label htmlFor={question.id}>{question.question}</Label>
          
          {question.type === 'boolean' ? (
            <Checkbox>
              <input
                type="checkbox"
                id={question.id}
                {...register(question.id as any)}
              />
              <span>Yes</span>
            </Checkbox>
          ) : question.type === 'select' ? (
            <Select
              id={question.id}
              {...register(question.id as any)}
            >
              {question.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          ) : question.type === 'multiselect' ? (
            <Select
              id={question.id}
              {...register(question.id as any)}
              multiple
            >
              {question.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              id={question.id}
              {...register(question.id as any)}
              placeholder={`Enter ${question.question.toLowerCase()}`}
            />
          )}
          
          {errors[question.id as keyof FormValues] && (
            <ErrorMessage>
              {errors[question.id as keyof FormValues]?.message as string}
            </ErrorMessage>
          )}
          
          {question.context && <HelpText>{question.context}</HelpText>}
        </FormGroup>
      ))}

      <ButtonGroup>
        <BackButton type="button" onClick={onBack} disabled={isSubmitting}>
          Back
        </BackButton>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Generating...' : 'Generate Wrapper'}
        </Button>
      </ButtonGroup>
    </Form>
  );
};

export default WrapperConfigForm;