# Developer Self-Service Portal

A web application that provides a user-friendly interface for developers to interact with GitHub Actions. It enhances the GitHub Actions experience by offering more intuitive forms, contextual information, and guided instructions.

## Features

- GitHub token configuration for API access
- Curated list of GitHub Actions
- Enhanced workflow execution forms
- Real-time workflow execution monitoring
- Contextual documentation
- Workflow history and results
- Responsive design for desktop and mobile
- Security and permissions management

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

### Building for Production

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate test coverage report:

```bash
npm run test:coverage
```

### Linting and Formatting

Lint the code:

```bash
npm run lint
```

Fix linting issues:

```bash
npm run lint:fix
```

Format the code:

```bash
npm run format
```

## Project Structure

- `src/components`: Reusable UI components
- `src/contexts`: React context providers
- `src/hooks`: Custom React hooks
- `src/pages`: Application pages
- `src/services`: API clients and services
- `src/types`: TypeScript type definitions
- `src/utils`: Utility functions
- `src/tests`: Test files and setup

## Technologies

- React
- TypeScript
- Vite
- React Router
- Axios
- React Hook Form
- Zod
- Styled Components
- Vitest
- Testing Library
- ESLint
- Prettier