import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Trash2,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

const NotificationContext = createContext();

// Fallback standalone emitter for non-React contexts if needed
let globalNotificationHandler = null;

export const toast = {
  success: (msg, title) => globalNotificationHandler?.showToast({ type: 'success', message: msg, title }),
  error: (msg, title) => globalNotificationHandler?.showToast({ type: 'error', message: msg, title }),
  warning: (msg, title) => globalNotificationHandler?.showToast({ type: 'warning', message: msg, title }),
  info: (msg, title) => globalNotificationHandler?.showToast({ type: 'info', message: msg, title }),
};

export const confirmDialog = (options) => {
  if (globalNotificationHandler?.showConfirm) {
    return globalNotificationHandler.showConfirm(options);
  }
  return Promise.resolve(window.confirm(options?.message || options?.title || 'Are you sure?'));
};

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null); // { isOpen, title, message, confirmText, cancelText, type, resolve }
  const toastIdRef = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ type = 'info', message, title, duration = 4000 }) => {
    if (!message) return;
    const id = ++toastIdRef.current;

    const newToast = {
      id,
      type, // 'success', 'error', 'warning', 'info'
      title: title || (type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Notice'),
      message,
      duration,
    };

    setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const showConfirm = useCallback(({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger', // 'danger', 'warning', 'primary'
  }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        resolve,
      });
    });
  }, []);

  const handleConfirmAction = (result) => {
    if (confirmState?.resolve) {
      confirmState.resolve(result);
    }
    setConfirmState(null);
  };

  // Bind global handler
  globalNotificationHandler = {
    showToast,
    showConfirm,
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} className="text-emerald" />;
      case 'error':
        return <AlertCircle size={18} style={{ color: '#dc2626' }} />;
      case 'warning':
        return <AlertTriangle size={18} style={{ color: '#d97706' }} />;
      default:
        return <Info size={18} style={{ color: 'var(--color-primary)' }} />;
    }
  };

  const getConfirmIcon = (type) => {
    switch (type) {
      case 'danger':
        return <Trash2 size={24} style={{ color: '#dc2626' }} />;
      case 'warning':
        return <ShieldAlert size={24} style={{ color: '#d97706' }} />;
      default:
        return <HelpCircle size={24} style={{ color: 'var(--color-primary)' }} />;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        showToast,
        showConfirm,
        success: (msg, title) => showToast({ type: 'success', message: msg, title }),
        error: (msg, title) => showToast({ type: 'error', message: msg, title }),
        warning: (msg, title) => showToast({ type: 'warning', message: msg, title }),
        info: (msg, title) => showToast({ type: 'info', message: msg, title }),
        confirm: showConfirm,
      }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      {toasts.length > 0 && (
        <div className="toast-container" aria-live="polite" aria-atomic="true">
          {toasts.map((t) => (
            <div key={t.id} className={`in-app-toast toast-${t.type}`}>
              <div className="toast-icon-wrap">{getToastIcon(t.type)}</div>
              <div className="toast-content">
                {t.title && <div className="toast-title">{t.title}</div>}
                <div className="toast-message">{t.message}</div>
              </div>
              <button
                type="button"
                className="toast-close-btn"
                onClick={() => removeToast(t.id)}
                aria-label="Close notification"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* In-App Confirmation Modal */}
      {confirmState?.isOpen && (
        <div className="modal-backdrop in-app-confirm-backdrop" onClick={() => handleConfirmAction(false)}>
          <div
            className="modal-content in-app-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="confirm-modal-header">
              <div className={`confirm-icon-box confirm-icon-${confirmState.type}`}>
                {getConfirmIcon(confirmState.type)}
              </div>
              <div className="confirm-header-text">
                <h3 className="confirm-modal-title">{confirmState.title}</h3>
                <p className="confirm-modal-message">{confirmState.message}</p>
              </div>
            </div>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleConfirmAction(false)}
                style={{ minWidth: '100px' }}
                autoFocus
              >
                {confirmState.cancelText}
              </button>
              <button
                type="button"
                className={`btn ${confirmState.type === 'danger' ? 'btn-danger-action' : 'btn-primary'}`}
                onClick={() => handleConfirmAction(true)}
                style={{ minWidth: '110px' }}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    // Return fallback bound to global helper
    return {
      showToast: toast.info,
      success: toast.success,
      error: toast.error,
      warning: toast.warning,
      info: toast.info,
      confirm: confirmDialog,
    };
  }
  return context;
}
