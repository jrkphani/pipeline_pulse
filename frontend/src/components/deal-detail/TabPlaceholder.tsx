import type { PlaceholderTab } from '@/types/deal-detail';

interface TabPlaceholderProps {
  tab: PlaceholderTab;
}

export function TabPlaceholder({ tab }: TabPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[220px] gap-1.5 text-muted-foreground">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
        {tab.icon}
      </div>
      <p className="text-[11px] font-medium">{tab.title}</p>
      <p className="text-[10px]">{tab.subtitle}</p>
    </div>
  );
}
