import { format, formatDistance, formatDistanceToNow, parseISO, isValid } from 'date-fns';

export const formatDate = (dateString: string | Date, dateFormat: string = 'PPP'): string => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    
    if (!isValid(date)) {
      return 'Invalid date';
    }
    
    return format(date, dateFormat);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const formatDateTime = (dateString: string | Date): string => {
  return formatDate(dateString, 'PPP p');
};

export const formatDateShort = (dateString: string | Date): string => {
  return formatDate(dateString, 'PP');
};

export const formatRelativeTime = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    
    if (!isValid(date)) {
      return 'Invalid date';
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid date';
  }
};

export const formatDuration = (startDate: string | Date, endDate: string | Date): string => {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    if (!isValid(start) || !isValid(end)) {
      return 'Invalid dates';
    }
    
    return formatDistance(start, end);
  } catch (error) {
    console.error('Error formatting duration:', error);
    return 'Invalid dates';
  }
};

export const isDateInPast = (dateString: string | Date): boolean => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return isValid(date) && date < new Date();
  } catch (error) {
    return false;
  }
};

export const isDateInFuture = (dateString: string | Date): boolean => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return isValid(date) && date > new Date();
  } catch (error) {
    return false;
  }
};