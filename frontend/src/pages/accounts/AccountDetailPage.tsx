import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { AccountDetailShell } from '@/components/accounts/AccountDetailShell';
import { toast } from '@/components/ui/use-toast';
import type { Account } from '@/types/accounts';
import type { Contact } from '@/types/contacts';
import type { Lead } from '@/types/leads';
import type { Deal } from '@/types/index';

interface AccountDetailResponse {
  account: Account;
  contacts: Contact[];
  leads: Lead[];
  deals: Deal[];
}

export function AccountDetailPage() {
  const { accountId } = useParams({ from: '/_authenticated/accounts/$accountId' });
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery<AccountDetailResponse>({
    queryKey: ['account-detail', accountId],
    queryFn: () => apiClient.get<AccountDetailResponse>(`/accounts/${accountId}`),
  });

  const updateAccount = useMutation({
    mutationFn: (updates: Partial<Account>) =>
      apiClient.patch<Account>(`/accounts/${accountId}`, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account-detail', accountId] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: () => toast({ description: 'Failed to update account', variant: 'destructive' }),
  });

  const handleBack = useCallback(() => {
    navigate({ to: '/accounts' });
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <Skeleton className="h-12 w-full rounded-none" />
        <Skeleton className="h-full w-full flex-1 rounded-none" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <p className="text-lg font-medium">Account not found</p>
        <p className="text-sm mt-1">ID: {accountId}</p>
        <button type="button" className="mt-4 px-3 py-1.5 text-sm border rounded hover:bg-muted transition-colors" onClick={handleBack}>
          Back to Accounts
        </button>
      </div>
    );
  }

  return (
    <AccountDetailShell
      account={data.account}
      contacts={data.contacts}
      leads={data.leads}
      deals={data.deals}
      onBack={handleBack}
      onUpdate={(updates) => updateAccount.mutate(updates)}
    />
  );
}
