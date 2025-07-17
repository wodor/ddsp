import { z } from 'zod';

export const AnalysisSchema = z.object({
  actionUrl: z.string().url(),
  version: z.string().default('main'),
});

export const CodeGenerationSchema = z.object({
  actionUrl: z.string().url(),
  actionAnalysis: z.object({
    name: z.string(),
    description: z.string(),
    inputs: z.record(z.any()),
    outputs: z.record(z.any()),
    questions: z.array(z.object({
      id: z.string(),
      question: z.string(),
      type: z.enum(['text', 'boolean', 'select', 'multiselect']),
      options: z.array(z.string()).optional(),
      required: z.boolean().default(false),
    })),
    metadata: z.object({
      actionUrl: z.string(),
      version: z.string(),
      runs: z.object({
        using: z.string(),
        main: z.string().optional(),
        pre: z.string().optional(),
        post: z.string().optional(),
        args: z.array(z.string()).optional(),
        entrypoint: z.string().optional(),
        image: z.string().optional(),
      }),
    }),
  }),
  configuration: z.object({
    wrapperName: z.string(),
    description: z.string(),
    inputMappings: z.record(z.any()).optional(),
    outputMappings: z.record(z.any()).optional(),
    additionalOptions: z.record(z.any()).optional(),
  }),
});

export type AnalysisInput = z.infer<typeof AnalysisSchema>;
export type CodeGenerationInput = z.infer<typeof CodeGenerationSchema>;

export interface GitHubActionMetadata {
  name: string;
  description: string;
  inputs: Record<string, {
    description?: string;
    required?: boolean;
    default?: string;
    type?: string;
  }>;
  outputs: Record<string, {
    description?: string;
    value?: string;
  }>;
  runs: {
    using: string;
    main?: string;
    pre?: string;
    post?: string;
    args?: string[];
    entrypoint?: string;
    image?: string;
  };
}

export interface AnalysisQuestion {
  id: string;
  question: string;
  type: 'text' | 'boolean' | 'select' | 'multiselect';
  options?: string[];
  required: boolean;
  context?: string;
}

export interface AnalysisResult {
  name: string;
  description: string;
  inputs: GitHubActionMetadata['inputs'];
  outputs: GitHubActionMetadata['outputs'];
  questions: AnalysisQuestion[];
  metadata: {
    actionUrl: string;
    version: string;
    runs: GitHubActionMetadata['runs'];
  };
} 