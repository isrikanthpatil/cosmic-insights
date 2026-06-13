/**
 * Utility functions for handling date parsing and formatting
 */

/**
 * Parse DD/MM/YYYY format to Date object
 * @param dateString - Date in DD/MM/YYYY format (e.g., "15/06/1990")
 * @returns Date object or null if invalid
 */
export const parseDDMMYYYY = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  // Remove any extra whitespace
  const cleanDate = dateString.trim();
  
  // Check if it matches DD/MM/YYYY format
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = cleanDate.match(dateRegex);
  
  if (!match) {
    return null;
  }

  const [, dayStr, monthStr, yearStr] = match;
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);

  // Validate ranges
  if (month < 1 || month > 12) {
    return null;
  }
  
  if (day < 1 || day > 31) {
    return null;
  }

  if (year < 1900 || year > new Date().getFullYear()) {
    return null;
  }

  // Create date object (month is 0-indexed in JavaScript)
  const date = new Date(year, month - 1, day);
  
  // Verify the date is valid (handles cases like 31/02/2023)
  if (date.getFullYear() !== year || 
      date.getMonth() !== month - 1 || 
      date.getDate() !== day) {
    return null;
  }

  return date;
};

/**
 * Format Date object to DD/MM/YYYY string
 * @param date - Date object
 * @returns Formatted date string
 */
export const formatToDDMMYYYY = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  
  return `${day}/${month}/${year}`;
};

/**
 * Validate DD/MM/YYYY format
 * @param dateString - Date string to validate
 * @returns true if valid format and date
 */
export const isValidDDMMYYYY = (dateString: string): boolean => {
  return parseDDMMYYYY(dateString) !== null;
};

/**
 * Get current date in DD/MM/YYYY format
 * @returns Current date as DD/MM/YYYY string
 */
export const getCurrentDateDDMMYYYY = (): string => {
  return formatToDDMMYYYY(new Date());
};

/**
 * Calculate age from DD/MM/YYYY birth date
 * @param dateOfBirth - Birth date in DD/MM/YYYY format
 * @returns Age in years
 */
export const calculateAge = (dateOfBirth: string): number => {
  const birthDate = parseDDMMYYYY(dateOfBirth);
  if (!birthDate) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};