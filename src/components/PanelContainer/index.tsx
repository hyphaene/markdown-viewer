import { Fragment, useState } from "react";
import { usePanelStore } from "../../stores/panelStore";
import { Panel } from "../Panel";
import { PanelSeparator } from "../PanelSeparator";

export function PanelContainer() {
  const { panels, activePanelId } = usePanelStore();
  const [isResizing, setIsResizing] = useState(false);

  if (panels.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background grid-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-accent"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p className="text-lg font-medium text-text">Select a file to view</p>
          <p className="text-sm mt-2 text-muted">
            Choose a markdown file from the sidebar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-w-0 overflow-hidden">
      {panels.map((panel, index) => (
        <Fragment key={panel.id}>
          <div
            data-panel-id={panel.id}
            className={`min-w-0 flex ${!isResizing ? "transition-[width] duration-200 ease-out" : ""}`}
            style={{ width: `${panel.width}%` }}
          >
            <Panel panelId={panel.id} isActive={panel.id === activePanelId} />
          </div>
          {index < panels.length - 1 && (
            <PanelSeparator
              key={`sep-${panel.id}`}
              leftPanelId={panel.id}
              rightPanelId={panels[index + 1].id}
              onDragStart={() => setIsResizing(true)}
              onDragEnd={() => setIsResizing(false)}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}
