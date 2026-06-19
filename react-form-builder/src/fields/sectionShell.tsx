import type { ReactNode } from "react";

export function SectionShell(props: {
  label?: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const {
    label,
    collapsible = false,
    defaultOpen = true,
    children,
    className,
  } = props;

  if (!collapsible) {
    return (
      <div className={className}>
        {label}
        {children}
      </div>
    );
  }

  return (
    <details className={className} open={defaultOpen}>
      {label ? <summary className="cursor-pointer">{label}</summary> : null}
      {children}
    </details>
  );
}
