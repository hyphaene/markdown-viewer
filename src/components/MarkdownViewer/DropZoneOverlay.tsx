import { useState, useRef } from "react";
import { usePanelStore } from "../../stores/panelStore";

interface DropZoneOverlayProps {
  panelId: string;
}

type DropSide = "left" | "right" | null;

export function DropZoneOverlay({ panelId }: DropZoneOverlayProps) {
  const { dragState } = usePanelStore();
  const [dropSide, setDropSide] = useState<DropSide>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isSourcePanel = dragState.sourcePanelId === panelId;
  const isDragging = dragState.isDragging && isSourcePanel;

  const calculateSide = (clientX: number): DropSide => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const midpoint = rect.width / 2;
    return x < midpoint ? "left" : "right";
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropSide(calculateSide(e.clientX));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setDropSide(null);
    }
  };

  // Always render, but only visible when dragging from this panel
  // Drop is handled via dragend in TabBar using checkDropZone
  return (
    <div
      ref={containerRef}
      data-drop-zone-panel={panelId}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        absolute inset-0 z-[100] flex transition-opacity duration-150
        ${isDragging ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
    >
      {/* Left half */}
      <div
        className={`
          flex-1 flex items-center justify-center transition-all duration-150
          ${dropSide === "left" ? "bg-accent/25" : "bg-black/10"}
        `}
      >
        <div
          className={`
            flex flex-col items-center gap-3 px-6 py-4 rounded-xl shadow-xl transition-all duration-150
            ${dropSide === "left" ? "bg-accent text-white scale-105" : "bg-surface/90 text-muted"}
          `}
        >
          <SplitIcon side="left" active={dropSide === "left"} />
          <span className="text-sm font-semibold">Split Left</span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-0.5 bg-white/30" />

      {/* Right half */}
      <div
        className={`
          flex-1 flex items-center justify-center transition-all duration-150
          ${dropSide === "right" ? "bg-accent/25" : "bg-black/10"}
        `}
      >
        <div
          className={`
            flex flex-col items-center gap-3 px-6 py-4 rounded-xl shadow-xl transition-all duration-150
            ${dropSide === "right" ? "bg-accent text-white scale-105" : "bg-surface/90 text-muted"}
          `}
        >
          <SplitIcon side="right" active={dropSide === "right"} />
          <span className="text-sm font-semibold">Split Right</span>
        </div>
      </div>
    </div>
  );
}

function SplitIcon({
  side,
  active,
}: {
  side: "left" | "right";
  active: boolean;
}) {
  return (
    <svg
      className="w-8 h-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect
        x="3"
        y="3"
        width="7"
        height="18"
        rx="1"
        opacity={side === "left" && active ? 1 : 0.3}
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="18"
        rx="1"
        opacity={side === "right" && active ? 1 : 0.3}
      />
    </svg>
  );
}
