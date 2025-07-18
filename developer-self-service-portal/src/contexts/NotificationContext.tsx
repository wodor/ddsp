/**
 * Notification context for displaying notifications
 */
import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import styled from 'styled-components';

/**
 * Notification type
 */
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * Notification object
 */
export interface Notification {
  /** Unique ID for the notification */
  id: string;
  /** Notification type */
  type: NotificationType;
  /** Notification message */
  message: string;
  /** Notification title */
  title?: string;
  /** Whether the notification is dismissible */
  dismissible?: boolean;
  /** Duration in milliseconds before auto-dismissing (0 for no auto-dismiss) */
  duration?: number;
  /** Action button text */
  actionText?: string;
  /** Action button callback */
  onAction?: () => void;
}

/**
 * Notification context value
 */
interface NotificationContextValue {
  /** List of active notifications */
  notifications: Notification[];
  /** Add a new notification */
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  /** Remove a notification by ID */
  removeNotification: (id: string) => void;
  /** Clear all notifications */
  clearNotifications: () => void;
}

// Create the context
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

// Styled components for notifications
const NotificationContainer = styled.div`
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
  z-index: 1000;
`;

const NotificationItem = styled.div<{ type: NotificationType }>`
  padding: 1rem;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease-out;
  
  background-color: ${props => {
    switch (props.type) {
      case NotificationType.INFO:
        return '#f6f8fa';
      case NotificationType.SUCCESS:
        return '#e6ffed';
      case NotificationType.WARNING:
        return '#fff5b1';
      case NotificationType.ERROR:
        return '#ffebe9';
      default:
        return '#f6f8fa';
    }
  }};
  
  border-left: 4px solid ${props => {
    switch (props.type) {
      case NotificationType.INFO:
        return '#0366d6';
      case NotificationType.SUCCESS:
        return '#2ea043';
      case NotificationType.WARNING:
        return '#d29922';
      case NotificationType.ERROR:
        return '#f85149';
      default:
        return '#0366d6';
    }
  }};
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const NotificationTitle = styled.div<{ type: NotificationType }>`
  font-weight: 600;
  color: ${props => {
    switch (props.type) {
      case NotificationType.INFO:
        return '#0366d6';
      case NotificationType.SUCCESS:
        return '#2ea043';
      case NotificationType.WARNING:
        return '#d29922';
      case NotificationType.ERROR:
        return '#f85149';
      default:
        return '#0366d6';
    }
  }};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6e7781;
  padding: 0;
  font-size: 1rem;
  
  &:hover {
    color: #24292f;
  }
`;

const NotificationMessage = styled.div`
  color: #24292f;
  font-size: 0.875rem;
`;

const NotificationActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 0.75rem;
`;

const ActionButton = styled.button`
  background-color: transparent;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  cursor: pointer;
  color: #0366d6;
  
  &:hover {
    background-color: #f6f8fa;
  }
`;

/**
 * Provider component for the notification context
 */
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Add a new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification = { ...notification, id, dismissible: notification.dismissible ?? true };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-dismiss if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }
    
    return id;
  }, []);
  
  // Remove a notification by ID
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);
  
  // Context value
  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer>
        {notifications.map(notification => (
          <NotificationItem key={notification.id} type={notification.type}>
            <NotificationHeader>
              <NotificationTitle type={notification.type}>
                {notification.title || getDefaultTitle(notification.type)}
              </NotificationTitle>
              {notification.dismissible && (
                <CloseButton onClick={() => removeNotification(notification.id)}>
                  ×
                </CloseButton>
              )}
            </NotificationHeader>
            <NotificationMessage>
              {notification.message}
            </NotificationMessage>
            {notification.actionText && notification.onAction && (
              <NotificationActions>
                <ActionButton onClick={notification.onAction}>
                  {notification.actionText}
                </ActionButton>
              </NotificationActions>
            )}
          </NotificationItem>
        ))}
      </NotificationContainer>
    </NotificationContext.Provider>
  );
};

/**
 * Hook for using the notification context
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
};

/**
 * Get default title for notification type
 */
function getDefaultTitle(type: NotificationType): string {
  switch (type) {
    case NotificationType.INFO:
      return 'Information';
    case NotificationType.SUCCESS:
      return 'Success';
    case NotificationType.WARNING:
      return 'Warning';
    case NotificationType.ERROR:
      return 'Error';
    default:
      return 'Notification';
  }
}