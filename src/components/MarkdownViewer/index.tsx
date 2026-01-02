import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import "highlight.js/styles/github-dark.css";
import { useFileStore } from "../../stores/fileStore";
import { openInVscode, revealInFinder } from "../../lib/tauri";
import { TableOfContents } from "../TableOfContents";

export function MarkdownViewer() {
  const { selectedFile, content, isLoading } = useFileStore();

  if (!selectedFile) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg">Select a file to view</p>
          <p className="text-sm mt-2">
            Choose a markdown file from the sidebar
          </p>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
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
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-800">
        <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <h1 className="text-lg font-semibold truncate" title={selectedFile}>
            {fileName}
          </h1>
          <div className="flex items-center gap-2">
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
        <div className="flex-1 overflow-auto p-6">
          <article className="prose prose-gray dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-900 prose-pre:text-gray-100">
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
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
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
      strokeWidth="2"
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
      strokeWidth="2"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
