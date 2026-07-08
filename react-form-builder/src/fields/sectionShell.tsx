import { cn, Heading, Typography } from "@core-ts/react";
import type { ReactNode } from "react";

export function SectionShell(props: {
  title?: string;
  description?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const {
    title,
    description,
    collapsible = false,
    defaultOpen = true,
    children,
    className,
  } = props;

  if (!collapsible) {
    return (
      <div className={className}>
        {title ? (
          <div className="mb-3">
            <Heading as="h3" size="sm" gutterBottom>
              {title}
            </Heading>
            {description ? (
              <Typography variant="hint">{description}</Typography>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    );
  }

  return (
    <details
      className={cn("c-collapse", className)}
      open={defaultOpen}
    >
      {title ? (
        <summary className="c-collapse-title select-none">
          <Heading as="h3" size="sm">
            {title}
          </Heading>
          {description ? (
            <Typography variant="hint">{description}</Typography>
          ) : null}
        </summary>
      ) : null}
      <div className="c-collapse-content">{children}</div>
    </details>
  );
}
