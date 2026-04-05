import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { ContactsGrid } from '@/components/contacts/ContactsGrid';
import type { Contact, ContactsStats } from '@/types/contacts';

interface ContactsResponse {
  contacts: Contact[];
  stats: ContactsStats;
}

export function ContactsPage() {
  const { data, isLoading } = useQuery<ContactsResponse>({
    queryKey: ['contacts'],
    queryFn: () => apiClient.get<ContactsResponse>('/contacts'),
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
      <ContactsGrid contacts={data.contacts} stats={data.stats} />
    </div>
  );
}
