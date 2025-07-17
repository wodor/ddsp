/**
 * Tests for the workflow parser utility
 */
import { describe, it, expect } from 'vitest';
import {
  parseWorkflowYaml,
  extractWorkflowInputs,
  extractWorkflowName,
  extractWorkflowDescription,
  hasWorkflowDispatchTrigger,
  extractWorkflowMetadata,
  extractInputsFromYaml
} from '../../utils/workflowParser';

describe('workflowParser', () => {
  const sampleWorkflowYaml = `
name: 'Sample Workflow'

on:
  workflow_dispatch:
    inputs:
      branch:
        description: 'Branch to deploy'
        required: true
        default: 'main'
      environment:
        description: 'Environment to deploy to'
        required: true
        type: choice
        options:
        - 'dev'
        - 'staging'
        - 'prod'
        default: 'dev'
      debug:
        description: 'Enable debug mode'
        required: false
        type: boolean
        default: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
`;

  const workflowWithoutDispatch = `
name: 'CI Workflow'

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
`;

  const invalidYaml = `
name: 'Invalid Workflow
  this is not valid yaml
`;

  describe('parseWorkflowYaml', () => {
    it('should parse valid workflow YAML', () => {
      const result = parseWorkflowYaml(sampleWorkflowYaml);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Sample Workflow');
      expect(result?.on.workflow_dispatch).toBeDefined();
      expect(result?.jobs.deploy).toBeDefined();
    });

    it('should return null for invalid YAML', () => {
      const result = parseWorkflowYaml(invalidYaml);
      expect(result).toBeNull();
    });
  });

  describe('extractWorkflowInputs', () => {
    it('should extract inputs from workflow with dispatch trigger', () => {
      const workflow = parseWorkflowYaml(sampleWorkflowYaml);
      expect(workflow).not.toBeNull();
      
      if (workflow) {
        const inputs = extractWorkflowInputs(workflow);
        expect(inputs).toHaveLength(3);
        
        // Check branch input
        const branchInput = inputs.find(input => input.name === 'branch');
        expect(branchInput).toBeDefined();
        expect(branchInput?.description).toBe('Branch to deploy');
        expect(branchInput?.required).toBe(true);
        expect(branchInput?.default).toBe('main');
        
        // Check environment input
        const envInput = inputs.find(input => input.name === 'environment');
        expect(envInput).toBeDefined();
        expect(envInput?.type).toBe('choice');
        expect(envInput?.options).toEqual(['dev', 'staging', 'prod']);
        
        // Check debug input
        const debugInput = inputs.find(input => input.name === 'debug');
        expect(debugInput).toBeDefined();
        expect(debugInput?.type).toBe('boolean');
        expect(debugInput?.default).toBe('false');
      }
    });

    it('should return empty array for workflow without dispatch inputs', () => {
      const workflow = parseWorkflowYaml(workflowWithoutDispatch);
      expect(workflow).not.toBeNull();
      
      if (workflow) {
        const inputs = extractWorkflowInputs(workflow);
        expect(inputs).toHaveLength(0);
      }
    });
  });

  describe('extractWorkflowName', () => {
    it('should extract workflow name', () => {
      const workflow = parseWorkflowYaml(sampleWorkflowYaml);
      expect(workflow).not.toBeNull();
      
      if (workflow) {
        const name = extractWorkflowName(workflow);
        expect(name).toBe('Sample Workflow');
      }
    });

    it('should return "Unnamed Workflow" if name is not defined', () => {
      const workflowWithoutName = parseWorkflowYaml(`
on:
  workflow_dispatch:
    inputs:
      branch:
        description: 'Branch to deploy'
        required: true
`);
      expect(workflowWithoutName).not.toBeNull();
      
      if (workflowWithoutName) {
        const name = extractWorkflowName(workflowWithoutName);
        expect(name).toBe('Unnamed Workflow');
      }
    });
  });

  describe('extractWorkflowDescription', () => {
    it('should use name as fallback for description', () => {
      const workflow = parseWorkflowYaml(sampleWorkflowYaml);
      expect(workflow).not.toBeNull();
      
      if (workflow) {
        const description = extractWorkflowDescription(workflow);
        expect(description).toBe('Sample Workflow');
      }
    });

    it('should return default message if no name or description is available', () => {
      const workflowWithoutName = parseWorkflowYaml(`
on:
  workflow_dispatch:
    inputs:
      branch:
        description: 'Branch to deploy'
        required: true
`);
      expect(workflowWithoutName).not.toBeNull();
      
      if (workflowWithoutName) {
        const description = extractWorkflowDescription(workflowWithoutName);
        expect(description).toBe('No description available');
      }
    });
  });

  describe('hasWorkflowDispatchTrigger', () => {
    it('should return true for workflow with dispatch trigger', () => {
      const workflow = parseWorkflowYaml(sampleWorkflowYaml);
      expect(workflow).not.toBeNull();
      
      if (workflow) {
        const hasDispatch = hasWorkflowDispatchTrigger(workflow);
        expect(hasDispatch).toBe(true);
      }
    });

    it('should return false for workflow without dispatch trigger', () => {
      const workflow = parseWorkflowYaml(workflowWithoutDispatch);
      expect(workflow).not.toBeNull();
      
      if (workflow) {
        const hasDispatch = hasWorkflowDispatchTrigger(workflow);
        expect(hasDispatch).toBe(false);
      }
    });
  });

  describe('extractWorkflowMetadata', () => {
    it('should extract metadata from workflow YAML', () => {
      const metadata = extractWorkflowMetadata(sampleWorkflowYaml);
      expect(metadata).not.toBeNull();
      
      if (metadata) {
        expect(metadata.name).toBe('Sample Workflow');
        expect(metadata.description).toBe('Sample Workflow');
        expect(metadata.hasDispatchTrigger).toBe(true);
        expect(metadata.inputs).toHaveLength(3);
      }
    });

    it('should return null for invalid YAML', () => {
      const metadata = extractWorkflowMetadata(invalidYaml);
      expect(metadata).toBeNull();
    });
  });

  describe('extractInputsFromYaml', () => {
    it('should extract inputs directly from YAML string', () => {
      const inputs = extractInputsFromYaml(sampleWorkflowYaml);
      expect(inputs).not.toBeNull();
      
      if (inputs) {
        expect(inputs).toHaveLength(3);
        expect(inputs[0].name).toBe('branch');
        expect(inputs[1].name).toBe('environment');
        expect(inputs[2].name).toBe('debug');
      }
    });

    it('should return null for invalid YAML', () => {
      const inputs = extractInputsFromYaml(invalidYaml);
      expect(inputs).toBeNull();
    });
  });
});