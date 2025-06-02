/**
 * Custom hook for managing filter state with URL persistence
 */

import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { 
  FilterState, 
  getDateFilterByValue, 
  getProbabilityStageByValue,
  getDefaultDateFilter,
  getDefaultProbabilityStage,
  DateFilter,
  ProbabilityStage
} from '@/types/filters';

export const useFilterState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get current filter values from URL or defaults
  const filters: FilterState = useMemo(() => ({
    dateRange: searchParams.get('date') || getDefaultDateFilter().value,
    probabilityStage: searchParams.get('stage') || getDefaultProbabilityStage().value,
    customStartDate: searchParams.get('custom_start') || undefined,
    customEndDate: searchParams.get('custom_end') || undefined
  }), [searchParams]);

  // Get the actual filter objects
  const selectedDateFilter: DateFilter = useMemo(() => {
    const filter = getDateFilterByValue(filters.dateRange);
    if (!filter) return getDefaultDateFilter();
    
    // Handle custom date range
    if (filter.value === 'custom' && filters.customStartDate && filters.customEndDate) {
      return {
        ...filter,
        startDate: new Date(filters.customStartDate),
        endDate: new Date(filters.customEndDate)
      };
    }
    
    return filter;
  }, [filters]);

  const selectedProbabilityStage: ProbabilityStage = useMemo(() => {
    return getProbabilityStageByValue(filters.probabilityStage) || getDefaultProbabilityStage();
  }, [filters.probabilityStage]);

  // Update filters and URL
  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedParams = new URLSearchParams(searchParams);

    // Map filter state keys to URL parameter names
    const paramMapping: { [key: string]: string } = {
      dateRange: 'date',
      probabilityStage: 'stage',
      customStartDate: 'custom_start',
      customEndDate: 'custom_end'
    };

    Object.entries(newFilters).forEach(([key, value]) => {
      const paramName = paramMapping[key] || key;

      if (value !== undefined && value !== null && value !== '') {
        updatedParams.set(paramName, value);
      } else {
        updatedParams.delete(paramName);
      }
    });

    setSearchParams(updatedParams);
  };

  // Update date range filter
  const updateDateRange = (dateRange: string, customStartDate?: string, customEndDate?: string) => {
    const updates: Partial<FilterState> = { dateRange };
    
    if (dateRange === 'custom') {
      if (customStartDate) updates.customStartDate = customStartDate;
      if (customEndDate) updates.customEndDate = customEndDate;
    } else {
      // Clear custom dates when not using custom range
      updates.customStartDate = undefined;
      updates.customEndDate = undefined;
    }
    
    updateFilters(updates);
  };

  // Update probability stage filter
  const updateProbabilityStage = (probabilityStage: string) => {
    updateFilters({ probabilityStage });
  };

  // Clear all filters to defaults
  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Check if any non-default filters are applied
  const hasActiveFilters = useMemo(() => {
    const defaultDate = getDefaultDateFilter().value;
    const defaultStage = getDefaultProbabilityStage().value;
    
    return filters.dateRange !== defaultDate || 
           filters.probabilityStage !== defaultStage ||
           !!filters.customStartDate ||
           !!filters.customEndDate;
  }, [filters]);

  // Get filter summary for display
  const getFilterSummary = () => {
    const parts = [];
    
    if (filters.dateRange !== getDefaultDateFilter().value) {
      parts.push(selectedDateFilter.label);
    }
    
    if (filters.probabilityStage !== getDefaultProbabilityStage().value) {
      parts.push(selectedProbabilityStage.label);
    }
    
    return parts.length > 0 ? parts.join(' + ') : 'Default filters';
  };

  return {
    filters,
    selectedDateFilter,
    selectedProbabilityStage,
    updateFilters,
    updateDateRange,
    updateProbabilityStage,
    clearAllFilters,
    hasActiveFilters,
    getFilterSummary
  };
};
