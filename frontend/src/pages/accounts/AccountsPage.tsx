import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { AccountsGrid } from '@/components/accounts/AccountsGrid';
import { toast } from '@/components/ui/use-toast';
import type { Account, AccountsStats } from '@/types/accounts';

interface AccountsResponse {
  accounts: Account[];
  stats: AccountsStats;
}

export function AccountsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<AccountsResponse>({
    queryKey: ['accounts'],
    queryFn: () => apiClient.get<AccountsResponse>('/accounts'),
  });

  const updateAccount = useMutation({
    mutationFn: ({ accountId, updates }: { accountId: string; updates: Partial<Account> }) =>
      apiClient.patch<Account>(`/accounts/${accountId}`, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
    onError: () => toast({ description: 'Failed to update account', variant: 'destructive' }),
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-full flex-col gap-px overflow-hidden p-0">
        <Skeleton className="h-10 w-full rounded-none" />
        <Skeleton className="h-9 w-full rounded-none" />
        <Skeleton className="h-full w-full flex-1 rounded-none" />
      </div>
    );
  }

  return (
    <div className="h-full flex-col overflow-hidden flex">
      <AccountsGrid
        accounts={data.accounts}
        stats={data.stats}
        onAccountUpdate={(accountId, updates) => updateAccount.mutate({ accountId, updates })}
      />
    </div>
  );
}
