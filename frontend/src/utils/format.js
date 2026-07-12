// EcoSphere - Formatting Utilities

// Formats carbon footprint emissions with metric units
export const formatEmissions = (value) => {
  if (value === undefined || value === null) return '0.0 tCO2e';
  return `${Number(value).toFixed(1)} tCO2e`;
};

// Formats gamification points
export const formatPoints = (value) => {
  if (value === undefined || value === null) return '0 pts';
  return `${Number(value).toLocaleString()} pts`;
};

// Formats a generic date string to locale readable format
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
};
