import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Star } from 'lucide-react';

const RatingModal = ({ isOpen, onClose, initialRating, initialFeedback, onSubmit, isLoading }) => {
  const [rating, setRating] = useState(Number(initialRating) || 0);
  const [feedback, setFeedback] = useState(initialFeedback || '');

  useEffect(() => {
    setRating(Number(initialRating) || 0);
    setFeedback(initialFeedback || '');
  }, [initialRating, initialFeedback, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-10">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">Rate this meeting</h3>
          <button onClick={onClose} className="text-base-content/60 hover:text-base-content"><X /></button>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2">
            {[1,2,3,4,5].map((s) => {
              const filled = s <= rating;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`}
                  className={`p-1 transition-colors ${filled ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-300'}`}
                >
                  <Star className="w-6 h-6" strokeWidth={filled ? 0 : 1.5} fill={filled ? 'currentColor' : 'none'} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Add feedback (optional)"
            className="w-full p-3 border border-base-300 rounded-lg textarea textarea-bordered resize-none"
            rows={4}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button
            onClick={() => onSubmit({ rating, feedback })}
            className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || rating < 1}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

RatingModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  initialRating: PropTypes.number,
  initialFeedback: PropTypes.string,
  onSubmit: PropTypes.func,
  isLoading: PropTypes.bool,
};

export default RatingModal;
