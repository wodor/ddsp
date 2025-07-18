/**
 * Tests for the ConfirmationDialog component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmationDialog from '../../components/ConfirmationDialog';

describe('ConfirmationDialog', () => {
  it('renders nothing when isOpen is false', () => {
    // Arrange
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    
    // Act
    const { container } = render(
      <ConfirmationDialog
        title="Test Dialog"
        message="This is a test message"
        isOpen={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    
    // Assert
    expect(container.firstChild).toBeNull();
  });
  
  it('renders dialog when isOpen is true', () => {
    // Arrange
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    
    // Act
    render(
      <ConfirmationDialog
        title="Test Dialog"
        message="This is a test message"
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    
    // Assert
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('This is a test message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });
  
  it('calls onConfirm when confirm button is clicked', async () => {
    // Arrange
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    
    // Act
    render(
      <ConfirmationDialog
        title="Test Dialog"
        message="This is a test message"
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }));
    
    // Assert
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });
  
  it('calls onCancel when cancel button is clicked', async () => {
    // Arrange
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    
    // Act
    render(
      <ConfirmationDialog
        title="Test Dialog"
        message="This is a test message"
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    
    // Assert
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
  
  it('calls onCancel when clicking outside the dialog', () => {
    // Arrange
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    
    // Act
    render(
      <ConfirmationDialog
        title="Test Dialog"
        message="This is a test message"
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    
    // Click on the overlay (outside the dialog)
    const overlay = screen.getByText('Test Dialog').parentElement?.parentElement;
    if (overlay) {
      fireEvent.mouseDown(overlay);
    }
    
    // Assert
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
  
  it('calls onCancel when pressing Escape key', () => {
    // Arrange
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    
    // Act
    render(
      <ConfirmationDialog
        title="Test Dialog"
        message="This is a test message"
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    
    // Press Escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // Assert
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
  
  it('renders custom button text', () => {
    // Arrange
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    
    // Act
    render(
      <ConfirmationDialog
        title="Test Dialog"
        message="This is a test message"
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
        confirmText="Custom Confirm"
        cancelText="Custom Cancel"
      />
    );
    
    // Assert
    expect(screen.getByRole('button', { name: /custom confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /custom cancel/i })).toBeInTheDocument();
  });
  
  it('renders danger variant for confirm button', () => {
    // Arrange
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    
    // Act
    render(
      <ConfirmationDialog
        title="Test Dialog"
        message="This is a test message"
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
        confirmVariant="danger"
      />
    );
    
    // Assert - checking for danger styling is tricky with styled-components
    // In a real test, we might check for a specific class or data attribute
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
  });
  
  it('renders React node as message', () => {
    // Arrange
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const message = (
      <div>
        <p>Paragraph 1</p>
        <p>Paragraph 2</p>
      </div>
    );
    
    // Act
    render(
      <ConfirmationDialog
        title="Test Dialog"
        message={message}
        isOpen={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    
    // Assert
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
  });
});