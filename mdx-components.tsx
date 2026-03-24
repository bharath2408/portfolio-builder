import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="mb-2 mt-10 font-display text-[32px] font-extrabold leading-tight tracking-tight text-foreground first:mt-0 sm:text-[36px]">
        <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
          {children}
        </span>
      </h1>
    ),
    h2: ({ children }) => {
      const id = typeof children === "string"
        ? children.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        : undefined;
      return (
        <h2
          id={id}
          className="group mb-3 mt-12 flex items-center gap-2 font-display text-[20px] font-bold tracking-tight text-foreground first:mt-6 sm:text-[22px]"
        >
          <span className="h-5 w-1 flex-shrink-0 rounded-full bg-gradient-to-b from-teal-400 to-cyan-500" />
          {children}
        </h2>
      );
    },
    h3: ({ children }) => (
      <h3 className="mb-2 mt-8 font-display text-[16px] font-bold text-foreground/90">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-5 text-[14.5px] leading-[1.8] text-muted-foreground/80">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="mb-5 space-y-2 text-[14.5px] text-muted-foreground/80">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-5 list-none space-y-2.5 text-[14.5px] text-muted-foreground/80 [counter-reset:step]">
        {children}
      </ol>
    ),
    li: ({ children }) => {
      // Detect if inside an ordered list by checking if parent uses counter
      return (
        <li className="group/li flex gap-3 leading-[1.75] [ol_&]:[counter-increment:step]">
          {/* Unordered list bullet */}
          <span className="mt-[10px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 opacity-70 [ol_&]:hidden" />
          {/* Ordered list number */}
          <span className="mt-[1px] hidden h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-teal-500/10 font-mono text-[10px] font-bold text-teal-600 [ol_&]:flex dark:text-teal-400 [ol_&]:before:content-[counter(step)]" />
          <span className="flex-1">{children}</span>
        </li>
      );
    },
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="text-foreground/70">{children}</em>
    ),
    code: ({ children, ...props }) => {
      const isBlock = typeof children === "string" && children.includes("\n");
      if (isBlock) {
        return (
          <code
            className="block overflow-x-auto rounded-xl border border-border/40 bg-muted/40 p-5 font-mono text-[12px] leading-relaxed text-foreground/90"
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          className="rounded-md border border-border/30 bg-muted/50 px-1.5 py-[2px] font-mono text-[12px] text-foreground/90"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="mb-5 overflow-x-auto rounded-xl border border-border/40 bg-gradient-to-br from-muted/30 to-muted/10 p-5 font-mono text-[12px] leading-relaxed">
        {children}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote className="relative mb-6 overflow-hidden rounded-xl border border-teal-500/15 bg-gradient-to-r from-teal-500/[0.04] to-cyan-500/[0.02] py-4 pl-5 pr-5">
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-teal-400 to-cyan-500" />
        <div className="text-[13.5px] leading-relaxed text-foreground/70 [&>p]:mb-0">
          {children}
        </div>
      </blockquote>
    ),
    hr: () => (
      <div className="my-10 flex items-center justify-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        <div className="flex gap-1">
          <span className="h-1 w-1 rounded-full bg-teal-500/30" />
          <span className="h-1 w-1 rounded-full bg-teal-500/50" />
          <span className="h-1 w-1 rounded-full bg-teal-500/30" />
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      </div>
    ),
    table: ({ children }) => (
      <div className="mb-5 overflow-x-auto rounded-xl border border-border/40">
        <table className="w-full text-[13px]">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-muted/30">{children}</thead>
    ),
    th: ({ children }) => (
      <th className="border-b border-border/40 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-foreground/60">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-border/20 px-4 py-3 text-muted-foreground/80">
        {children}
      </td>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="font-medium text-teal-600 decoration-teal-500/30 underline-offset-[3px] transition-all hover:text-teal-500 hover:underline dark:text-teal-400 dark:hover:text-teal-300"
      >
        {children}
      </a>
    ),
    ...components,
  };
}
