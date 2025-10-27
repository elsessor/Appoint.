export const capitalize = (value) => {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.length === 0) return s;
  if (s.toUpperCase() === "N/A") return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

export default {
  capitalize,
};
