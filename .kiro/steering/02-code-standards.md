---
inclusion: always
---

# Code Standards and Best Practices

## TypeScript Standards

- Use explicit typing rather than relying on type inference when defining functions and variables
- Prefer interfaces for object types that will be extended or implemented
- Use type for simple object shapes or unions
- Avoid using `any` type; use `unknown` when type is truly unknown
- Use proper return types for all functions including React components
- Leverage TypeScript's utility types (Partial, Pick, Omit, etc.) when appropriate

## React Best Practices

- Use functional components with hooks instead of class components
- Keep components focused on a single responsibility
- Extract reusable logic into custom hooks
- Use React.memo() for performance optimization when appropriate
- Avoid prop drilling by using React Context for shared state
- Use lazy loading for code splitting with React.lazy() and Suspense

## Component Structure

```tsx
// Import statements
import { useState, useEffect } from 'react';
import type { FC } from 'react';
import styled from 'styled-components';

// Types and interfaces
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

// Styled components
const Container = styled.div`
  // styles
`;

// Component definition with JSDoc
/**
 * Component description
 * @param props - Component props
 * @returns React component
 */
const ComponentName: FC<ComponentProps> = ({ prop1, prop2 = 0 }) => {
  // State and hooks
  const [state, setState] = useState<string>('');
  
  // Effects
  useEffect(() => {
    // effect logic
  }, [dependencies]);
  
  // Event handlers
  const handleEvent = (): void => {
    // handler logic
  };
  
  // Helper functions
  const helperFunction = (): string => {
    // function logic
    return 'result';
  };
  
  // Render
  return (
    <Container>
      {/* JSX content */}
    </Container>
  );
};

export default ComponentName;
```

## Form Handling

- Use React Hook Form for form state management
- Implement Zod schemas for form validation
- Create reusable form components for common input types
- Provide clear error messages for validation failures
- Use controlled components for form inputs

## Styling Guidelines

- Use Styled Components for component styling
- Follow a consistent naming convention for styled components
- Use theme variables for colors, spacing, and typography
- Implement responsive design using media queries
- Keep styles close to the components they apply to

## Testing Standards

- Write unit tests for all components and services
- Use React Testing Library for component testing
- Test component behavior, not implementation details
- Mock external dependencies in tests
- Aim for high test coverage of critical paths

## Error Handling

- Implement proper error boundaries for React components
- Use try/catch blocks for async operations
- Provide user-friendly error messages
- Log errors for debugging purposes
- Handle network errors gracefully

## Performance Considerations

- Avoid unnecessary re-renders
- Use memoization for expensive calculations
- Implement virtualization for long lists
- Optimize bundle size with code splitting
- Use proper keys for list items

## Use context7 for documentation

- Use context7 mcp to get info on how to use frameworks and libraries


