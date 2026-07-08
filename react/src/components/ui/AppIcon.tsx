import { cn } from "../../lib/cn.js";

export type AppIconProps = {
  icon: React.ComponentType<{ className?: string; [key: string]: unknown }>;
  className?: string;
} & (
  | { hidden: true; label?: never }
  | { hidden?: never; label: string }
);

/**
 * `AppIcon` is the single enforcement point for icon sizing and accessibility
 * across every workspace. It always renders at `h-5 w-5`.
 *
 * Every call site must make an explicit accessibility choice:
 *
 * - `<AppIcon icon={Mail} hidden />` — decorative, hidden from screen readers
 * - `<AppIcon icon={Mail} label="Email" />` — meaningful, exposed to screen
 *    readers via `role="img"` and `aria-label`
 *
 * Additional Tailwind classes (`text-success`, `opacity-60`, `animate-spin`)
 * go in the optional `className` prop.
 */
export function AppIcon({ icon: Icon, hidden, label, className }: AppIconProps) {
  if (hidden) {
    return <Icon className={cn("h-5 w-5", className)} aria-hidden="true" />;
  }

  return (
    <Icon
      className={cn("h-5 w-5", className)}
      role="img"
      aria-label={label}
      focusable="false"
    />
  );
}
