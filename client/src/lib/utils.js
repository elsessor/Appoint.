export const capitalize = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatLastOnline = (lastOnlineDate) => {
  if (!lastOnlineDate) return "Never";
  
  const now = new Date();
  const lastOnline = new Date(lastOnlineDate);
  const diffMs = now - lastOnline;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return lastOnline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: lastOnline.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};