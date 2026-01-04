import { convertFileSrc } from "@tauri-apps/api/core";
import type { Frontmatter } from "../types";

export interface ParsedMarkdown {
  content: string;
  frontmatter: Frontmatter | undefined;
}

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseMarkdown(raw: string): ParsedMarkdown {
  const match = raw.match(FRONTMATTER_REGEX);

  if (!match) {
    return { content: raw, frontmatter: undefined };
  }

  const yamlContent = match[1];
  const content = raw.slice(match[0].length);
  const frontmatter = parseYamlFrontmatter(yamlContent);

  return { content, frontmatter };
}

function parseYamlFrontmatter(yaml: string): Frontmatter | undefined {
  const frontmatter: Frontmatter = {};
  const lines = yaml.split("\n");

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    switch (key) {
      case "title":
        frontmatter.title = value;
        break;
      case "date":
        frontmatter.date = value;
        break;
      case "author":
        frontmatter.author = value;
        break;
      case "tags":
        // Handle [tag1, tag2] or tag1, tag2
        if (value.startsWith("[") && value.endsWith("]")) {
          value = value.slice(1, -1);
        }
        frontmatter.tags = value
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        break;
    }
  }

  return Object.keys(frontmatter).length > 0 ? frontmatter : undefined;
}

export function resolveImageSrc(src: string, filePath: string): string {
  // Already an absolute URL or data URL
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:")
  ) {
    return src;
  }

  // Get the directory of the current markdown file
  const fileDir = filePath.substring(0, filePath.lastIndexOf("/"));

  let absolutePath: string;

  if (src.startsWith("/")) {
    // Absolute path from root
    absolutePath = src;
  } else {
    // Relative path - resolve from the markdown file's directory
    const normalizedSrc = src.replace(/^\.\//, "");
    absolutePath = `${fileDir}/${normalizedSrc}`;
  }

  // Normalize path (remove ../ and ./)
  absolutePath = normalizePath(absolutePath);

  // Convert to Tauri asset URL
  return convertFileSrc(absolutePath);
}

function normalizePath(path: string): string {
  const parts = path.split("/");
  const result: string[] = [];

  for (const part of parts) {
    if (part === "..") {
      result.pop();
    } else if (part !== "." && part !== "") {
      result.push(part);
    }
  }

  return "/" + result.join("/");
}
