/**
 * Confirmation dialog component
 */
import { useEffect, useRef } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 500px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
`;

const DialogTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.25rem;
  color: #24292e;
`;

const DialogContent = styled.div`
  margin-bottom: 1.5rem;
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const CancelButton = styled.button`
  background-color: transparent;
  color: #24292e;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f6f8fa;
  }
`;

const ConfirmButton = styled.button<{ variant?: 'danger' | 'primary' }>`
  background-color: ${props => props.variant === 'danger' ? '#d73a49' : '#2ea44f'};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.variant === 'danger' ? '#cb2431' : '#2c974b'};
  }
`;

export interface ConfirmationDialogProps {
  /** Dialog title */
  title: string;
  /** Dialog message */
  message: React.ReactNode;
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Function called when the user confirms */
  onConfirm: () => void;
  /** Function called when the user cancels */
  onCancel: () => void;
  /** Text for the confirm button */
  confirmText?: string;
  /** Text for the cancel button */
  cancelText?: string;
  /** Variant for the confirm button */
  confirmVariant?: 'danger' | 'primary';
}

/**
 * Confirmation dialog component
 */
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  title,
  message,
  isOpen,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle click outside to cancel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onCancel]);

  // Handle escape key to cancel
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <Overlay>
      <DialogContainer ref={dialogRef}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>{message}</DialogContent>
        <DialogActions>
          <CancelButton onClick={onCancel}>{cancelText}</CancelButton>
          <ConfirmButton variant={confirmVariant} onClick={onConfirm}>
            {confirmText}
          </ConfirmButton>
        </DialogActions>
      </DialogContainer>
    </Overlay>
  );
};

export default ConfirmationDialog;