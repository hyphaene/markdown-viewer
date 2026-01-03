import { useTabStore } from "../../stores/tabStore";

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore();

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center bg-surface border-b border-white/5 overflow-x-auto">
      {tabs.map((tab) => (
        <Tab
          key={tab.id}
          name={tab.name}
          path={tab.path}
          isActive={tab.id === activeTabId}
          isLoading={tab.isLoading}
          isDirty={tab.isDirty}
          onClick={() => setActiveTab(tab.id)}
          onClose={(e) => {
            e.stopPropagation();
            closeTab(tab.id);
          }}
        />
      ))}
    </div>
  );
}

interface TabProps {
  name: string;
  path: string;
  isActive: boolean;
  isLoading: boolean;
  isDirty: boolean;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
}

function Tab({
  name,
  path,
  isActive,
  isLoading,
  isDirty,
  onClick,
  onClose,
}: TabProps) {
  return (
    <div
      onClick={onClick}
      title={path}
      className={`
        group flex items-center gap-2 px-4 py-2.5 min-w-0 max-w-[200px] cursor-pointer
        border-r border-white/5 transition-all
        ${
          isActive
            ? "bg-background text-text border-b-2 border-b-accent"
            : "text-muted hover:text-text hover:bg-white/5"
        }
      `}
    >
      {isLoading ? <LoadingSpinner /> : <FileIcon isActive={isActive} />}
      <span className="truncate text-sm font-medium">{name}</span>
      {isDirty && (
        <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
      )}
      <button
        onClick={onClose}
        className={`
          flex-shrink-0 p-1 rounded-md
          ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
          hover:bg-white/10 transition-all
        `}
        title="Close tab (⌘W)"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

function FileIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg
      className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-accent" : "text-muted"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="w-4 h-4 flex-shrink-0 animate-spin text-accent"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
