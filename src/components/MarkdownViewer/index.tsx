import { useMemo } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import "highlight.js/styles/github-dark.css";
import { useTabStore } from "../../stores/tabStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useFilterStore } from "../../stores/filterStore";
import { openInVscode, revealInFinder } from "../../lib/tauri";
import { TableOfContents } from "../TableOfContents";
import { parseMarkdown, resolveImageSrc } from "../../lib/markdown";
import type { Frontmatter } from "../../types";

export function MarkdownViewer() {
  const { tabs, activeTabId } = useTabStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const fontSize = useSettingsStore((state) => state.settings.fontSize ?? 18);
  const contentPadding = useSettingsStore(
    (state) => state.settings.contentPadding ?? 16,
  );
  const contentMargin = useSettingsStore(
    (state) => state.settings.contentMargin ?? 200,
  );
  const addTagFilter = useFilterStore((state) => state.addTagFilter);

  const selectedFile = activeTab?.path ?? null;
  const rawContent = activeTab?.content ?? "";
  const isLoading = activeTab?.isLoading ?? false;

  const { content, frontmatter } = useMemo(
    () => parseMarkdown(rawContent),
    [rawContent],
  );

  const markdownComponents = useMemo<Components>(
    () => ({
      img: ({ src, alt, ...props }) => {
        if (!src || !selectedFile) return null;
        const resolvedSrc = resolveImageSrc(src, selectedFile);
        return (
          <img
            src={resolvedSrc}
            alt={alt ?? ""}
            loading="lazy"
            className="max-w-full h-auto rounded-lg"
            {...props}
          />
        );
      },
    }),
    [selectedFile],
  );

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
        <header className="px-6 py-3 border-b border-white/5 bg-surface">
          <div className="flex items-center justify-between">
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
                {frontmatter?.title || fileName}
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
          </div>
          {frontmatter && (
            <FrontmatterDisplay
              frontmatter={frontmatter}
              onTagClick={addTagFilter}
            />
          )}
        </header>
        <div
          className="flex-1 overflow-auto grid-background"
          style={{
            paddingTop: `${contentPadding}px`,
            paddingBottom: `${contentPadding}px`,
            paddingLeft: `${contentMargin}px`,
            paddingRight: `${contentMargin}px`,
          }}
        >
          <article
            className="prose prose-invert prose-custom max-w-none prose-headings:font-semibold prose-code:before:content-none prose-code:after:content-none prose-code:font-mono"
            style={{ fontSize: `${fontSize}px` }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeSlug]}
              components={markdownComponents}
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

function FrontmatterDisplay({
  frontmatter,
  onTagClick,
}: {
  frontmatter: Frontmatter;
  onTagClick: (tag: string) => void;
}) {
  const hasMetadata =
    frontmatter.date || frontmatter.author || frontmatter.tags?.length;

  if (!hasMetadata) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
      {frontmatter.date && (
        <span className="flex items-center gap-1 text-muted">
          <CalendarIcon />
          {formatDate(frontmatter.date)}
        </span>
      )}
      {frontmatter.author && (
        <span className="flex items-center gap-1 text-muted">
          <AuthorIcon />
          {frontmatter.author}
        </span>
      )}
      {frontmatter.tags && frontmatter.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {frontmatter.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick(tag)}
              className="px-2 py-0.5 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
              title={`Filter by "${tag}"`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function CalendarIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function AuthorIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
