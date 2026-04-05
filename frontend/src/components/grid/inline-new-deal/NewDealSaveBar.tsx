interface NewDealSaveBarProps {
  visible: boolean;
  canSave: boolean;
  missingCount: number;
  onSave: () => void;
  onDiscard: () => void;
}

export function NewDealSaveBar({ visible, canSave, missingCount, onSave, onDiscard }: NewDealSaveBarProps) {
  if (!visible) return null;

  return (
    <div
      className="flex h-8 items-center gap-2 border-t px-3 text-xs"
      style={{
        background: 'var(--pp-save-bg)',
        borderTopColor: 'var(--pp-save-border)',
        color: 'var(--pp-save-text)',
      }}
    >
      <span className="font-medium">1 unsaved row</span>
      <span style={{ color: 'var(--pp-save-text)', opacity: 0.8 }}>
        &middot;{' '}
        {canSave
          ? 'All required fields complete'
          : `${missingCount} required field${missingCount !== 1 ? 's' : ''} missing`}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onDiscard}
          className="rounded border px-2.5 py-0.5 text-[11px]"
          style={{
            borderColor: 'var(--pp-save-border)',
            color: 'var(--pp-save-text)',
            background: 'transparent',
          }}
        >
          Discard
        </button>
        <button
          onClick={onSave}
          className="rounded px-2.5 py-0.5 text-[11px] font-medium text-white"
          style={{ background: canSave ? 'var(--pp-health-green)' : '#999', cursor: canSave ? 'pointer' : 'not-allowed' }}
          disabled={!canSave}
        >
          Save
        </button>
        <span style={{ color: 'var(--pp-save-text)', opacity: 0.5 }} className="text-[10px] ml-1 hidden sm:inline">
          Esc to discard &middot; Enter to save
        </span>
      </div>
    </div>
  );
}
