import { useCallback, useRef } from "react";
import { usePanelStore } from "../../stores/panelStore";

interface PanelSeparatorProps {
  leftPanelId: string;
  rightPanelId: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function PanelSeparator({
  leftPanelId,
  rightPanelId,
  onDragStart,
  onDragEnd,
}: PanelSeparatorProps) {
  const resizePanel = usePanelStore((s) => s.resizePanel);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      const container = containerRef.current?.parentElement;
      if (!container) return;

      // Find DOM elements for direct manipulation
      const leftPanelEl = container.querySelector<HTMLElement>(
        `[data-panel-id="${leftPanelId}"]`,
      );
      const rightPanelEl = container.querySelector<HTMLElement>(
        `[data-panel-id="${rightPanelId}"]`,
      );

      if (!leftPanelEl || !rightPanelEl) return;

      // Get initial bounds
      const leftRect = leftPanelEl.getBoundingClientRect();
      const rightRect = rightPanelEl.getBoundingClientRect();
      const totalWidth = leftRect.width + rightRect.width;
      const startX = leftRect.left;

      let lastLeftWidth = (leftRect.width / totalWidth) * 100;

      onDragStart?.();
      containerRef.current?.classList.add("bg-accent/50");

      const handleMouseMove = (e: MouseEvent) => {
        const mouseX = e.clientX - startX;
        const leftPercent = (mouseX / totalWidth) * 100;

        // Clamp to 15-85%
        const clampedLeft = Math.max(15, Math.min(85, leftPercent));
        const clampedRight = 100 - clampedLeft;

        // Direct DOM manipulation - no React re-render
        leftPanelEl.style.width = `${clampedLeft}%`;
        rightPanelEl.style.width = `${clampedRight}%`;
        lastLeftWidth = clampedLeft;
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        containerRef.current?.classList.remove("bg-accent/50");

        // Convert local % to global % for store
        const currentPanels = usePanelStore.getState().panels;
        const leftPanel = currentPanels.find((p) => p.id === leftPanelId);
        const rightPanel = currentPanels.find((p) => p.id === rightPanelId);
        if (leftPanel && rightPanel) {
          const combinedWidth = leftPanel.width + rightPanel.width;
          const newLeftGlobal = (lastLeftWidth / 100) * combinedWidth;
          resizePanel(leftPanelId, newLeftGlobal);
        }

        onDragEnd?.();
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [leftPanelId, rightPanelId, onDragStart, onDragEnd, resizePanel],
  );

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className="w-1 flex-shrink-0 bg-white/5 cursor-col-resize relative transition-colors duration-100 hover:bg-accent/30"
    >
      {/* Extended hit zone */}
      <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
    </div>
  );
}
