import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-black/50"
          aria-hidden="true"
          onClick={handleBackdropClick}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-base-200 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-base-200 px-6 pt-6 pb-4">
            <div className="flex items-start">
              <div className={`flex-shrink-0 mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
                variant === 'danger' ? 'bg-error/20' : 'bg-warning/20'
              }`}>
                <AlertTriangle className={`h-6 w-6 ${
                  variant === 'danger' ? 'text-error' : 'text-warning'
                }`} />
              </div>
            </div>
            <div className="mt-4 text-center sm:mt-5">
              <h3 className="text-lg font-semibold text-base-content">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-base-content/70">
                  {message}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-base-200 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 btn btn-outline btn-sm"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`w-full sm:w-auto px-4 py-2 btn btn-sm ${
                variant === 'danger' ? 'btn-error' : 'btn-warning'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  variant: PropTypes.oneOf(['danger', 'warning']),
};

export default ConfirmDialog;

