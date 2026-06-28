// Owns the shared sanitized markdown block renderer and its stable rendering configuration.
import { Link as RouterLink } from "@tanstack/react-router";
import { memo, type HTMLAttributes } from "react";
import ReactMarkdown, {
  type Components,
  type Options as MarkdownOptions,
} from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

const isExternalHrefSafe = (href?: string): boolean =>
  Boolean(href && /^https?:\/\//i.test(href));

const isInternalHrefSafe = (href?: string): boolean =>
  Boolean(href && href.startsWith("/"));

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a || []), "href", "title"],
    code: [...(defaultSchema.attributes?.code || []), "className"],
    pre: [...(defaultSchema.attributes?.pre || []), "className"],
  },
};

const markdownRemarkPlugins: NonNullable<MarkdownOptions["remarkPlugins"]> = [
  remarkGfm,
];
const markdownRehypePlugins: NonNullable<MarkdownOptions["rehypePlugins"]> = [
  [rehypeSanitize, sanitizeSchema],
];
const markdownComponents = {
  a: ({ href, children, title }) => {
    if (isInternalHrefSafe(href)) {
      return (
        <RouterLink to={href} className="link" title={title}>
          {children}
        </RouterLink>
      );
    }

    if (href?.startsWith("#")) {
      return (
        <a href={href} className="link" title={title}>
          {children}
        </a>
      );
    }

    if (isExternalHrefSafe(href)) {
      return (
        <a
          href={href}
          className="link"
          title={title}
          target="_blank"
          rel="noreferrer"
        >
          {children}
        </a>
      );
    }

    return (
      <a href={href} className="link" title={title}>
        {children}
      </a>
    );
  },
  ul: ({ children }) => (
    <ul className="list-disc space-y-1 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal space-y-1 pl-5">{children}</ol>
  ),
  p: ({ children }) => <p className="mb-3 leading-6 last:mb-0">{children}</p>,
  pre: ({ children }) => (
    <pre className="rounded-box overflow-auto p-3">{children}</pre>
  ),
  code: ({ children, className: codeClassName }) => {
    const text = String(children && "");
    const looksBlock =
      text.includes("\n") || Boolean(codeClassName?.includes("language-"));
    if (!looksBlock) {
      return <code className="rounded-field px-1">{children}</code>;
    }

    return <code className={codeClassName}>{children}</code>;
  },
} satisfies Components;

export type MarkdownBlockProps = HTMLAttributes<HTMLDivElement> & {
  markdown?: string;
};
function MarkdownBlockComponent(props: MarkdownBlockProps) {
  const { markdown, className, ...rootProps } = props;
  if (!markdown) {
    return null;
  }

  return (
    <div {...rootProps} className={className}>
      <ReactMarkdown
        remarkPlugins={markdownRemarkPlugins}
        rehypePlugins={markdownRehypePlugins}
        components={markdownComponents}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

export const MarkdownBlock = memo(MarkdownBlockComponent);
