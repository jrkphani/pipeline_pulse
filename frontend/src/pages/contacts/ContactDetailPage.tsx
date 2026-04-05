import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { ContactDetailShell } from '@/components/contacts/ContactDetailShell';
import { toast } from '@/components/ui/use-toast';
import type { Contact } from '@/types/contacts';

export function ContactDetailPage() {
  const { contactId } = useParams({ from: '/_authenticated/contacts/$contactId' });
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: contact, isLoading, error } = useQuery<Contact>({
    queryKey: ['contact-detail', contactId],
    queryFn: () => apiClient.get<Contact>(`/contacts/${contactId}`),
  });

  const updateContact = useMutation({
    mutationFn: (updates: Partial<Contact>) =>
      apiClient.patch<Contact>(`/contacts/${contactId}`, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-detail', contactId] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: () => toast({ description: 'Failed to update contact', variant: 'destructive' }),
  });

  const handleBack = useCallback(() => {
    navigate({ to: '/contacts' });
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <Skeleton className="h-12 w-full rounded-none" />
        <Skeleton className="h-full w-full flex-1 rounded-none" />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <p className="text-lg font-medium">Contact not found</p>
        <p className="text-sm mt-1">ID: {contactId}</p>
        <button type="button" className="mt-4 px-3 py-1.5 text-sm border rounded hover:bg-muted transition-colors" onClick={handleBack}>
          Back to Contacts
        </button>
      </div>
    );
  }

  return (
    <ContactDetailShell
      contact={contact}
      onBack={handleBack}
      onUpdate={(updates) => updateContact.mutate(updates)}
    />
  );
}
