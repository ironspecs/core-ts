import { type ButtonHTMLAttributes, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

import { cn } from "../../lib/cn.js";
import {
  applyThemeAttributeSafe,
  persistThemePreferenceSafe,
  readThemeFromDomSafe,
  resolveBrowserThemeContextSafe,
  resolveThemeSafe,
  type Theme,
} from "./theme-preference.js";

export type ThemeToggleIconButtonLabels = {
  switchToDarkMode: string;
  switchToLightMode: string;
};
export type ThemeToggleIconButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    labels: ThemeToggleIconButtonLabels;
    sharedCookieDomain?: string | null;
  };
export function ThemeToggleIconButton(props: ThemeToggleIconButtonProps) {
  const {
    className,
    labels,
    sharedCookieDomain,
    type = "button",
    ...buttonProps
  } = props;
  const context = useMemo(
    () =>
      resolveBrowserThemeContextSafe({
        sharedCookieDomain: sharedCookieDomain ?? null,
      }),
    [sharedCookieDomain],
  );

  const [theme, setTheme] = useState<Theme>(
    () => readThemeFromDomSafe() ?? resolveThemeSafe(context),
  );

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    persistThemePreferenceSafe(nextTheme, context);
    applyThemeAttributeSafe(nextTheme);
    setTheme(nextTheme);
  };

  const title =
    theme === "dark" ? labels.switchToLightMode : labels.switchToDarkMode;

  return (
    <button
      {...buttonProps}
      type={type}
      onClick={toggleTheme}
      className={cn("btn btn-ghost", className)}
      aria-label={title}
      title={title}
    >
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {theme === "dark" ? (
            <motion.span
              key="moon"
              initial={{ opacity: 0, rotate: -60, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 60, scale: 0.7 }}
              transition={{ duration: 0.16 }}
              className="absolute"
            >
              <Moon className="h-5 w-5" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ opacity: 0, rotate: 60, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -60, scale: 0.7 }}
              transition={{ duration: 0.16 }}
              className="absolute"
            >
              <Sun className="h-5 w-5" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}
