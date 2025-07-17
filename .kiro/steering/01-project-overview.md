---
inclusion: always
---

# Developer Self-Service Portal - Project Overview

The Developer Self-Service Portal (DSSP) is a web application that provides a user-friendly interface for developers to interact with GitHub Actions. It enhances the GitHub Actions experience by offering more intuitive forms, contextual information, and guided instructions.

## Key Features

- GitHub token configuration and secure storage
- Curated list of GitHub Actions with metadata
- Enhanced workflow execution forms with validation
- Real-time workflow execution monitoring
- Contextual documentation and guidance
- Workflow execution history and results
- Responsive design for all devices
- Security and permissions management

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Routing**: React Router v7
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Styled Components
- **HTTP Client**: Axios
- **Testing**: Vitest with React Testing Library
- **Build Tool**: Vite

## Project Structure

- `src/components/`: Reusable UI components
- `src/contexts/`: React context providers
- `src/hooks/`: Custom React hooks
- `src/pages/`: Page components for each route
- `src/services/`: API clients and services
- `src/types/`: TypeScript type definitions
- `src/utils/`: Utility functions
- `src/tests/`: Test files

## Development Guidelines

- Follow TypeScript best practices with proper typing
- Write unit tests for all components and services
- Implement responsive design for all UI components
- Follow security best practices for handling tokens
- Document all components and functions with JSDoc comments
- Use React hooks for state management
- Implement proper error handling throughout the application