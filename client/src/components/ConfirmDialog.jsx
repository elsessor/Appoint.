import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity -z-10"
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-base-200 rounded-2xl shadow-xl w-full max-w-lg my-auto overflow-hidden">
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

