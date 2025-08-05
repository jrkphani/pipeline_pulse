import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRelativeTime } from '../../utils/dateHelpers';
import type { Opportunity, HealthStatus } from '../../types';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onView?: (id: number) => void;
  showActions?: boolean;
}

const healthStatusConfig: Record<HealthStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
  success: { variant: 'default', label: 'Healthy' },
  warning: { variant: 'secondary', label: 'Needs Attention' },
  danger: { variant: 'destructive', label: 'Critical' },
  neutral: { variant: 'outline', label: 'Neutral' },
};

const phaseLabels: Record<number, string> = {
  1: 'Opportunity',
  2: 'Qualified',
  3: 'Proposal',
  4: 'Revenue',
};

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onEdit,
  onDelete,
  onView,
  showActions = true,
}) => {
  const healthConfig = healthStatusConfig[opportunity.healthStatus];

  return (
    <Card className="pp-opportunity-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {opportunity.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Territory ID: {opportunity.territoryId} • Account ID: {opportunity.accountId}
            </p>
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(opportunity.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(opportunity.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(opportunity.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">SGD Amount</p>
              <p className="text-xl font-bold">
                {formatCurrency(opportunity.amountSgd, 'SGD')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Local Amount</p>
              <p className="text-lg font-semibold">
                {formatCurrency(opportunity.amountLocal, opportunity.localCurrency)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant={healthConfig.variant}>
                {healthConfig.label}
              </Badge>
              <Badge variant="outline">
                Phase {opportunity.phase}: {phaseLabels[opportunity.phase]}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              {opportunity.probability}% prob
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Updated {formatRelativeTime(opportunity.updatedAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};