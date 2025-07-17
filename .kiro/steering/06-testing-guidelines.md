---
inclusion: always
---

# Testing Guidelines

## General Testing Principles

- Write tests that verify behavior, not implementation details
- Follow the Arrange-Act-Assert pattern for test structure
- Keep tests independent and isolated from each other
- Use descriptive test names that explain what is being tested
- Maintain a balance between test coverage and maintenance cost

## Test Organization

- Group tests logically using `describe` blocks
- Use nested `describe` blocks for related test groups
- Keep test files alongside the code they test
- Follow a consistent naming convention for test files (e.g., `*.test.ts`, `*.spec.ts`)
- Organize tests from simple to complex scenarios

## Mocking

- Mock external dependencies to isolate the code being tested
- Use Vitest's mocking capabilities for functions, modules, and timers
- Create reusable mock factories for complex objects
- Reset mocks between tests to prevent test pollution
- Mock browser globals using `vi.stubGlobal()` for consistent behavior

## Expected Console Output

- Some tests intentionally trigger error conditions that produce console output
- Console errors in the following test cases are expected and do not indicate test failures:
  - `GitHubApiClient > getWorkflowDispatchInputs > should handle errors gracefully`: Tests error handling when workflow file cannot be found
  - `GitHubTokenForm > handles API errors during validation`: Tests error handling when token validation fails
- Do not suppress these expected errors as they verify that error handling works correctly
- When adding new tests that intentionally trigger errors, document them in this section

## Assertions

- Use specific assertions that clearly communicate what is being tested
- Prefer `toEqual` over `toBe` for object comparisons
- Use `toBeInTheDocument()` for React component rendering tests
- Use `toHaveBeenCalledWith()` for verifying function calls with specific arguments
- Use `waitFor()` for asynchronous assertions

## Test Data

- Use factory functions to generate test data
- Keep test data minimal and focused on what's being tested
- Avoid using production data in tests
- Use descriptive variable names for test data
- Consider using test data builders for complex objects

## Testing Async Code

- Use `async/await` for asynchronous tests
- Use `waitFor()` for assertions that may take time to become true
- Set appropriate timeouts for async operations
- Test both success and failure paths
- Mock timers for predictable testing of time-dependent code

## Component Testing

- Focus on testing component behavior from the user's perspective
- Use React Testing Library's queries in this order of preference:
  1. Accessible queries (getByRole, getByLabelText, getByPlaceholderText, getByText)
  2. Test ID queries (getByTestId) when accessibility queries aren't practical
- Test user interactions using `userEvent` rather than `fireEvent`
- Test accessibility concerns alongside functionality
- Verify that components handle loading, error, and empty states correctly

## Service Testing

- Test service methods in isolation
- Mock API calls and external dependencies
- Test both success and error handling paths
- Verify retry logic and error parsing
- Test edge cases and boundary conditions