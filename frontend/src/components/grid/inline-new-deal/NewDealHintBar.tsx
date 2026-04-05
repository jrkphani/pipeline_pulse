interface NewDealHintBarProps {
  visible: boolean;
}

export function NewDealHintBar({ visible }: NewDealHintBarProps) {
  if (!visible) return null;

  return (
    <div
      className="flex h-7 items-center gap-2 border-b px-3 text-xs"
      style={{
        background: 'var(--pp-accent-bg)',
        borderBottomColor: 'var(--pp-accent-muted)',
        color: 'var(--pp-accent-text)',
      }}
    >
      <span className="font-medium" style={{ color: 'var(--pp-accent-border)' }}>
        New row
      </span>
      <span className="text-muted-foreground">&mdash;</span>
      <span>
        <Kbd>Tab</Kbd> next cell
      </span>
      <span>
        <Kbd>Enter</Kbd> save row
      </span>
      <span>
        <Kbd>Esc</Kbd> cancel
      </span>
      <span className="ml-auto text-xs" style={{ color: 'var(--pp-accent-text)' }}>
        * Required fields
      </span>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="mx-0.5 rounded border px-1 font-mono text-[10px]"
      style={{ borderColor: 'var(--pp-accent-muted)', background: 'var(--background, #fff)' }}
    >
      {children}
    </kbd>
  );
}
