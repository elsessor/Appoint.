/**
 * Standardized status color mapping for appointment statuses
 * Used consistently across all pages (Notifications, Appointments, etc.)
 */

export const getStatusColor = (status) => {
  if (!status) return 'badge-base-300';
  
  const statusLower = status.toLowerCase().trim();
  
  switch(statusLower) {
    case 'pending':
      return 'badge-warning';
    case 'confirmed':
      return 'badge-info';
    case 'completed':
      return 'badge-success';
    case 'cancelled':
    case 'declined':
    case 'rejected':
      return 'badge-error';
    case 'rescheduled':
      return 'badge-secondary';
    default:
      return 'badge-base-300';
  }
};

export const getStatusTextColor = (status) => {
  if (!status) return 'text-base-content';
  
  const statusLower = status.toLowerCase().trim();
  
  switch(statusLower) {
    case 'pending':
      return 'text-warning';
    case 'confirmed':
      return 'text-info';
    case 'completed':
      return 'text-success';
    case 'cancelled':
    case 'declined':
    case 'rejected':
      return 'text-error';
    case 'rescheduled':
      return 'text-secondary';
    default:
      return 'text-base-content';
  }
};

export const formatStatusLabel = (status) => {
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

export const getStatusBgColor = (status) => {
  if (!status) return 'bg-base-300/20';
  
  const statusLower = status.toLowerCase().trim();
  
  switch(statusLower) {
    case 'pending':
      return 'bg-warning/20';
    case 'confirmed':
      return 'bg-info/20';
    case 'completed':
      return 'bg-success/20';
    case 'cancelled':
    case 'declined':
    case 'rejected':
      return 'bg-error/20';
    case 'rescheduled':
      return 'bg-secondary/20';
    default:
      return 'bg-base-300/20';
  }
};
