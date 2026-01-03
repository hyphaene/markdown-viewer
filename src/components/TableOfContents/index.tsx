import { useMemo } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const headings = useMemo(() => {
    const result: Heading[] = [];
    const lines = content.split("\n");

    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        result.push({ id, text, level });
      }
    }

    return result;
  }, [content]);

  if (headings.length === 0) {
    return null;
  }

  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <nav className="w-56 shrink-0 border-l border-white/5 overflow-auto hidden lg:block bg-surface">
      <div className="p-4">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
          On this page
        </h3>
        <ul className="space-y-1">
          {headings.map((heading, index) => (
            <li
              key={index}
              style={{ paddingLeft: `${(heading.level - minLevel) * 12}px` }}
            >
              <a
                href={`#${heading.id}`}
                className="block text-sm text-text/70 hover:text-accent truncate py-1 transition-colors"
                title={heading.text}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
