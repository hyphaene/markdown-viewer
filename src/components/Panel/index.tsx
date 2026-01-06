import { useEffect, useState } from "react";
import { usePanelStore } from "../../stores/panelStore";
import { TabBar } from "../TabBar";
import { MarkdownViewer } from "../MarkdownViewer";

interface PanelProps {
  panelId: string;
  isActive: boolean;
}

export function Panel({ panelId, isActive }: PanelProps) {
  const { setActivePanel } = usePanelStore();
  const [isAnimating, setIsAnimating] = useState(true);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    if (!isActive) {
      setActivePanel(panelId);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative flex-1 flex flex-col min-w-0 bg-background
        transition-all duration-200 ease-out
        ${isActive ? "ring-1 ring-accent/30 ring-inset" : ""}
        ${isAnimating ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"}
      `}
    >
      <TabBar panelId={panelId} />
      <MarkdownViewer panelId={panelId} />
    </div>
  );
}
