/**
 * Filter Control Panel Component
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, X, Calendar as CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  DATE_FILTER_PRESETS, 
  PROBABILITY_STAGE_PRESETS,
  formatDateRange,
  DateFilter,
  ProbabilityStage
} from '@/types/filters';
import { useFilterState } from '@/hooks/useFilterState';

interface FilterPanelProps {
  filteredDealsCount: number;
  totalValue: number;
  onExport?: () => void;
  loading?: boolean;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filteredDealsCount,
  totalValue,
  onExport,
  loading = false
}) => {
  const {
    filters,
    selectedDateFilter,
    selectedProbabilityStage,
    updateDateRange,
    updateProbabilityStage,
    clearAllFilters,
    hasActiveFilters
  } = useFilterState();

  const [customStartDate, setCustomStartDate] = useState(filters.customStartDate || '');
  const [customEndDate, setCustomEndDate] = useState(filters.customEndDate || '');
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const handleDateRangeChange = (value: string) => {
    if (value === 'custom') {
      updateDateRange(value, customStartDate, customEndDate);
    } else {
      updateDateRange(value);
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      updateDateRange('custom', customStartDate, customEndDate);
    }
  };

  const formatCurrency = (amount: number) => {
    return `SGD ${(amount / 1000000).toFixed(1)}M`;
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Closing Date Range</Label>
            <Select value={filters.dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                {DATE_FILTER_PRESETS.map(preset => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {filters.dateRange === 'custom' && (
              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Start Date</Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !customStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customStartDate ? format(new Date(customStartDate), "PPP") : "Pick start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customStartDate ? new Date(customStartDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const dateStr = format(date, "yyyy-MM-dd");
                            setCustomStartDate(dateStr);
                            setStartDateOpen(false);
                            if (customEndDate) {
                              updateDateRange('custom', dateStr, customEndDate);
                            }
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">End Date</Label>
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !customEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customEndDate ? format(new Date(customEndDate), "PPP") : "Pick end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customEndDate ? new Date(customEndDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const dateStr = format(date, "yyyy-MM-dd");
                            setCustomEndDate(dateStr);
                            setEndDateOpen(false);
                            if (customStartDate) {
                              updateDateRange('custom', customStartDate, dateStr);
                            }
                          }
                        }}
                        initialFocus
                        disabled={(date) =>
                          customStartDate ? date < new Date(customStartDate) : false
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
            
            {selectedDateFilter && selectedDateFilter.value !== 'custom' && (
              <p className="text-xs text-muted-foreground">
                {formatDateRange(selectedDateFilter)}
              </p>
            )}
          </div>

          {/* Probability Stage Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pipeline Stage</Label>
            <Select value={filters.probabilityStage} onValueChange={updateProbabilityStage}>
              <SelectTrigger>
                <SelectValue placeholder="Select pipeline stage" />
              </SelectTrigger>
              <SelectContent>
                {PROBABILITY_STAGE_PRESETS.map(stage => (
                  <SelectItem key={stage.value} value={stage.value}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{"--bg-color": stage.color, backgroundColor: "var(--bg-color)"} as React.CSSProperties}
                      />
                      <span>{stage.label}</span>
                      <span className="text-xs text-muted-foreground">
                        ({stage.minProbability}%-{stage.maxProbability}%)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {selectedProbabilityStage?.description}
            </p>
          </div>

          {/* Additional Controls */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Actions</Label>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearAllFilters}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
              {onExport && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onExport}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Summary */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          <Badge variant="secondary">
            {selectedDateFilter.label}
          </Badge>
          
          <Badge 
            variant="secondary"
            style={{
              "--badge-bg": selectedProbabilityStage.color + '20',
              "--badge-color": selectedProbabilityStage.color,
              "--badge-border": selectedProbabilityStage.color + '40',
              backgroundColor: "var(--badge-bg)",
              color: "var(--badge-color)",
              borderColor: "var(--badge-border)"
            } as React.CSSProperties}
          >
            {selectedProbabilityStage.label}
          </Badge>
          
          <span className="text-sm text-muted-foreground ml-auto">
            Showing {filteredDealsCount.toLocaleString()} deals • {formatCurrency(totalValue)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
