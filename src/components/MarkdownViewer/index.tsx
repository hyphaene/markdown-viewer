import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { useFileStore } from "../../stores/fileStore";

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

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-800">
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h1 className="text-lg font-semibold truncate" title={selectedFile}>
          {fileName}
        </h1>
      </header>
      <div className="flex-1 overflow-auto p-6">
        <article className="prose prose-gray dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-900 prose-pre:text-gray-100">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </main>
  );
}
