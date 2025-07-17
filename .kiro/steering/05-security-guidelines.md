---
inclusion: always
---

# Security Guidelines

## Token Handling

The Developer Self-Service Portal handles sensitive GitHub tokens that provide access to user repositories and workflows. Follow these guidelines to ensure secure token handling:

### Storage

- Never store tokens in code or commit them to version control
- Use secure local storage with encryption for token persistence
- Clear tokens from memory when no longer needed
- Provide a clear way for users to revoke/clear their tokens

### Encryption

- Implement proper encryption for stored tokens
- Use a unique encryption key for each user session
- Store encryption keys securely, separate from the encrypted data
- Use established encryption algorithms and libraries

Example implementation:

```typescript
/**
 * Encrypt a token for secure storage
 * @param token The token to encrypt
 * @returns The encrypted token
 */
private encryptToken(token: string): string {
  // Generate a random encryption key
  const key = this.generateEncryptionKey();
  
  // Encrypt the token using the key
  const encrypted = this.encryptData(token, key);
  
  // Store the key and encrypted data together
  // Format: base64(key):base64(encrypted)
  return `${btoa(key)}:${btoa(encrypted)}`;
}

/**
 * Decrypt a token from secure storage
 * @param encryptedData The encrypted token
 * @returns The decrypted token
 */
private decryptToken(encryptedData: string): string {
  try {
    // Split the key and encrypted data
    const [keyBase64, dataBase64] = encryptedData.split(':');
    if (!keyBase64 || !dataBase64) {
      throw new Error('Invalid encrypted data format');
    }

    const key = atob(keyBase64);
    const data = atob(dataBase64);
    
    // Decrypt the data using the key
    return this.decryptData(data, key);
  } catch (error) {
    console.error('Failed to decrypt token:', error);
    return '';
  }
}
```

## API Security

- Use HTTPS for all API communication
- Implement proper error handling to avoid exposing sensitive information
- Validate all API responses before processing
- Handle rate limiting and implement appropriate backoff strategies
- Use token scopes to limit access to only what's needed

## Input Validation

- Validate all user inputs before processing
- Sanitize inputs to prevent injection attacks
- Use Zod or similar libraries for schema validation
- Implement both client-side and server-side validation

## Error Handling

- Avoid exposing sensitive information in error messages
- Log errors securely without including sensitive data
- Provide user-friendly error messages
- Implement proper error boundaries in React components

## Secure Development Practices

- Keep dependencies up to date
- Regularly audit dependencies for security vulnerabilities
- Follow the principle of least privilege
- Implement Content Security Policy (CSP)
- Use CORS headers appropriately

## User Permissions

- Respect GitHub's permission model
- Only show and allow actions the user has permission to perform
- Verify permissions before attempting actions
- Handle permission errors gracefully

## Testing Security

- Include security-focused tests in your test suite
- Test token validation and encryption
- Verify proper error handling for security-related issues
- Test permission checking and authorization

## Security Checklist

Before releasing new features, verify:

- [ ] No tokens or credentials are hardcoded or committed to version control
- [ ] All user inputs are properly validated and sanitized
- [ ] Sensitive data is encrypted when stored
- [ ] API calls use HTTPS and proper authentication
- [ ] Error messages don't expose sensitive information
- [ ] Dependencies are up to date and free from known vulnerabilities
- [ ] Permission checks are implemented for all actions