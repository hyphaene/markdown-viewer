import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import "highlight.js/styles/github-dark.css";
import { useTabStore } from "../../stores/tabStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { openInVscode, revealInFinder } from "../../lib/tauri";
import { TableOfContents } from "../TableOfContents";

export function MarkdownViewer() {
  const { tabs, activeTabId } = useTabStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const fontSize = useSettingsStore((state) => state.settings.fontSize ?? 18);

  const selectedFile = activeTab?.path ?? null;
  const content = activeTab?.content ?? "";
  const isLoading = activeTab?.isLoading ?? false;

  if (!selectedFile) {
    return (
      <main className="flex-1 flex items-center justify-center bg-background grid-background">
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
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-muted">Loading...</span>
        </div>
      </main>
    );
  }

  const fileName = selectedFile.split("/").pop() || selectedFile;

  const handleOpenInVscode = async () => {
    try {
      await openInVscode(selectedFile);
    } catch (e) {
      console.error("Failed to open in VS Code:", e);
    }
  };

  const handleRevealInFinder = async () => {
    try {
      await revealInFinder(selectedFile);
    } catch (e) {
      console.error("Failed to reveal in Finder:", e);
    }
  };

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(selectedFile);
    } catch (e) {
      console.error("Failed to copy path:", e);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-surface">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-accent"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h1
              className="text-base font-semibold truncate text-text"
              title={selectedFile}
            >
              {fileName}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <ActionButton
              onClick={handleOpenInVscode}
              title="Open in VS Code (⌘O)"
            >
              <VscodeIcon />
            </ActionButton>
            <ActionButton
              onClick={handleRevealInFinder}
              title="Reveal in Finder (⌘⇧R)"
            >
              <FinderIcon />
            </ActionButton>
            <ActionButton onClick={handleCopyPath} title="Copy Path (⌘⇧C)">
              <CopyIcon />
            </ActionButton>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8 grid-background">
          <article
            className="prose prose-invert prose-custom max-w-4xl mx-auto prose-headings:font-semibold prose-code:before:content-none prose-code:after:content-none prose-code:font-mono"
            style={{ fontSize: `${fontSize}px` }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeSlug]}
            >
              {content}
            </ReactMarkdown>
          </article>
        </div>
      </main>
      <TableOfContents content={content} />
    </div>
  );
}

function ActionButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-all"
    >
      {children}
    </button>
  );
}

function VscodeIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.583 3.112l-4.833 4.577L6.083 2 3 4.18v15.64L6.083 22l6.667-5.689 4.833 4.577L21 18.6V5.4l-3.417-2.288zM6.083 17.43V6.57l4.833 5.43-4.833 5.43zM17.583 17.43L12.75 12l4.833-5.43v10.86z" />
    </svg>
  );
}

function FinderIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
