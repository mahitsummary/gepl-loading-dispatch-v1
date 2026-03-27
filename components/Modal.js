'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title = '',
  children,
  size = 'md',
  actions = [],
  closeOnBackdropClick = true,
  closeOnEscape = true,
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        onClick={() => closeOnBackdropClick && onClose()}
        className="absolute inset-0 bg-black/50"
      />

      {/* Modal */}
      <div className={`relative bg-white rounded-lg shadow-lg w-full mx-4 ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        {title && (
          <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-secondary-200 bg-white">
            <h2 className="text-lg font-semibold text-secondary-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-secondary-600 hover:text-secondary-900 transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Close button (no title) */}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-secondary-600 hover:text-secondary-900 transition-colors p-1 z-10"
          >
            <X size={20} />
          </button>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer with actions */}
        {actions && actions.length > 0 && (
          <div className="sticky bottom-0 flex gap-3 px-6 py-4 border-t border-secondary-200 bg-secondary-50">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  action.variant === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                    : action.variant === 'secondary'
                      ? 'bg-secondary-200 text-secondary-900 hover:bg-secondary-300 disabled:opacity-50'
                      : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
