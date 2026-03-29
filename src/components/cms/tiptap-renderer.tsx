import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { generateHTML, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  Shared extensions used for HTML generation                         */
/* ------------------------------------------------------------------ */

const extensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Image,
  Link.configure({ openOnClick: true }),
];

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface TipTapRendererProps {
  content: JSONContent;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Renderer                                                           */
/* ------------------------------------------------------------------ */

export function TipTapRenderer({ content, className = "" }: TipTapRendererProps) {
  const html = useMemo(() => {
    try {
      return generateHTML(content, extensions);
    } catch {
      return "";
    }
  }, [content]);

  if (!html) return null;

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
