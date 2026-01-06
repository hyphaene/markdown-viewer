import { useState, useRef, useEffect } from "react";
import { usePanelStore } from "../../stores/panelStore";

interface TabBarProps {
  panelId: string;
}

export function TabBar({ panelId }: TabBarProps) {
  const { panels, setActiveTab, closeTab, dragState, moveTabToPanel } =
    usePanelStore();
  const panel = panels.find((p) => p.id === panelId);
  const [dropPosition, setDropPosition] = useState<number | null>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  // Calculate drop position based on mouse position
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!tabBarRef.current || !panel) return;

    const rect = tabBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Find position between tabs
    const tabElements = tabBarRef.current.querySelectorAll("[data-tab-id]");
    let position = panel.tabs.length;

    for (let i = 0; i < tabElements.length; i++) {
      const tabRect = tabElements[i].getBoundingClientRect();
      const tabMiddle = tabRect.left + tabRect.width / 2 - rect.left;
      if (x < tabMiddle) {
        position = i;
        break;
      }
    }

    setDropPosition(position);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the tab bar entirely
    if (!tabBarRef.current?.contains(e.relatedTarget as Node)) {
      setDropPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (
      dragState.isDragging &&
      dragState.sourcePanelId &&
      dragState.sourceTabId
    ) {
      moveTabToPanel(panelId, dropPosition ?? "end");
    }
    setDropPosition(null);
  };

  if (!panel || panel.tabs.length === 0) {
    // Show empty drop zone when dragging
    if (dragState.isDragging) {
      return (
        <div
          className="flex items-center h-10 bg-surface border-b border-white/5"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={handleDrop}
        >
          <div className="flex-1 flex items-center justify-center text-muted text-sm">
            Drop here to add tab
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div
      ref={tabBarRef}
      className={`
        flex items-center bg-surface border-b border-white/5 overflow-x-auto
        ${dragState.isDragging ? "bg-accent/5" : ""}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {panel.tabs.map((tab, index) => (
        <div key={tab.id} className="flex items-center">
          {/* Drop indicator before tab */}
          {dropPosition === index && dragState.isDragging && (
            <div className="w-0.5 h-6 bg-accent rounded-full mx-0.5 animate-pulse" />
          )}
          <Tab
            panelId={panelId}
            tabId={tab.id}
            name={tab.name}
            path={tab.path}
            isActive={tab.id === panel.activeTabId}
            isLoading={tab.isLoading}
            isDirty={tab.isDirty}
            onClick={() => setActiveTab(panelId, tab.id)}
            onClose={(e) => {
              e.stopPropagation();
              closeTab(panelId, tab.id);
            }}
          />
        </div>
      ))}
      {/* Drop indicator at the end */}
      {dropPosition === panel.tabs.length && dragState.isDragging && (
        <div className="w-0.5 h-6 bg-accent rounded-full mx-0.5 animate-pulse" />
      )}
    </div>
  );
}

interface TabProps {
  panelId: string;
  tabId: string;
  name: string;
  path: string;
  isActive: boolean;
  isLoading: boolean;
  isDirty: boolean;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
}

function Tab({
  panelId,
  tabId,
  name,
  path,
  isActive,
  isLoading,
  isDirty,
  onClick,
  onClose,
}: TabProps) {
  const { startDrag, endDrag, dragState } = usePanelStore();
  const dragImageRef = useRef<HTMLDivElement | null>(null);

  // Create custom drag image
  useEffect(() => {
    return () => {
      if (dragImageRef.current) {
        document.body.removeChild(dragImageRef.current);
      }
    };
  }, []);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", tabId);

    // Create custom drag image
    const dragImage = document.createElement("div");
    dragImage.className =
      "fixed pointer-events-none bg-surface border border-accent/50 rounded-md px-3 py-1.5 text-sm font-medium text-text shadow-lg";
    dragImage.textContent = name;
    dragImage.style.top = "-1000px";
    dragImage.style.left = "-1000px";
    document.body.appendChild(dragImage);
    dragImageRef.current = dragImage;

    e.dataTransfer.setDragImage(dragImage, 0, 0);

    startDrag(panelId, tabId);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Check if we should create a split (drop events don't fire reliably in Tauri)
    if (e.dataTransfer.dropEffect !== "none") {
      const { checkDropZone } = usePanelStore.getState();
      checkDropZone(panelId, e.clientX, e.clientY);
    }

    endDrag();

    if (dragImageRef.current) {
      document.body.removeChild(dragImageRef.current);
      dragImageRef.current = null;
    }
  };

  const isBeingDragged =
    dragState.isDragging &&
    dragState.sourcePanelId === panelId &&
    dragState.sourceTabId === tabId;

  return (
    <div
      data-tab-id={tabId}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      title={path}
      className={`
        group flex items-center gap-2 px-4 py-2.5 min-w-0 max-w-[200px] cursor-grab
        border-r border-white/5 transition-all select-none
        ${
          isActive
            ? "bg-background text-text border-b-2 border-b-accent"
            : "text-muted hover:text-text hover:bg-white/5"
        }
        ${isBeingDragged ? "opacity-40" : ""}
        active:cursor-grabbing
      `}
    >
      {isLoading ? <LoadingSpinner /> : <FileIcon isActive={isActive} />}
      <span className="truncate text-sm font-medium">{name}</span>
      {isDirty && (
        <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
      )}
      <button
        onClick={onClose}
        onDragStart={(e) => e.stopPropagation()}
        draggable={false}
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
