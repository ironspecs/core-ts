/**
 * Owns the shared visual control for choosing the current UI language. The
 * supported language list and mutation behavior come from the package runtime.
 */

import { Typography, useMountEffect } from "@core-ts/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CheckIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { useRef, useState } from "react";
import { useCurrentLanguage } from "../hooks/useCurrentLanguage.js";
import { safeNormalizeLanguage, SUPPORTED_LANGUAGES } from "../lib/i18n.js";
import { changeLanguage } from "../lib/language.js";

const MENU_CLOSE_ANIMATION_MS = 120;

export type LanguageSwitcherLabels = {
  selectLanguage: string;
};

export type LanguageSwitcherProps = {
  labels: LanguageSwitcherLabels;
};

export function LanguageSwitcher(props: LanguageSwitcherProps) {
  const closeTimerRef = useRef<number | null>(null);
  const [isMenuMounted, setIsMenuMounted] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const currentLanguageCode = useCurrentLanguage();

  useMountEffect(() => {
    return () => {
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  });

  const currentLanguage =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === currentLanguageCode) ??
    SUPPORTED_LANGUAGES[0];

  const handleLanguageChange = (code: string) => {
    const language = safeNormalizeLanguage(code);
    if (!language) {
      throw new Error(`Unsupported language switcher value: ${code}`);
    }
    changeLanguage(language).catch(console.error);
  };

  const handleMenuOpenChange = (nextOpen: boolean) => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (nextOpen) {
      setIsMenuMounted(true);
      setIsMenuVisible(true);
      return;
    }

    setIsMenuVisible(false);
    closeTimerRef.current = window.setTimeout(() => {
      setIsMenuMounted(false);
      closeTimerRef.current = null;
    }, MENU_CLOSE_ANIMATION_MS);
  };

  return (
    <DropdownMenu.Root open={isMenuMounted} onOpenChange={handleMenuOpenChange}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="btn btn-ghost c-btn-min-h c-btn-min-w gap-2"
          aria-label={props.labels.selectLanguage}
        >
          <Globe className="h-5 w-5" />
          <span className="hidden sm:inline">
            <Typography variant="body">{currentLanguage.short}</Typography>
          </span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        {isMenuMounted ? (
          <DropdownMenu.Content align="end" sideOffset={8} forceMount asChild>
            <motion.div
              initial={false}
              animate={
                isMenuVisible
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: -4, scale: 0.98 }
              }
              transition={{ duration: MENU_CLOSE_ANIMATION_MS / 1000 }}
              className="bg-base-100 rounded-box border-base-300 z-50 w-52 border-(length:--border) p-1 shadow-lg"
            >
              <DropdownMenu.RadioGroup
                value={currentLanguageCode}
                onValueChange={handleLanguageChange}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <DropdownMenu.RadioItem
                    key={lang.code}
                    value={lang.code}
                    className="data-[highlighted]:bg-base-200 rounded-field relative flex cursor-default items-center py-2 pr-3 pl-8 outline-none data-[state=checked]:font-medium"
                  >
                    <DropdownMenu.ItemIndicator className="absolute left-2 inline-flex h-4 w-4 items-center justify-center">
                      <CheckIcon className="h-4 w-4" />
                    </DropdownMenu.ItemIndicator>
                    <Typography variant="body">{lang.name}</Typography>
                  </DropdownMenu.RadioItem>
                ))}
              </DropdownMenu.RadioGroup>
            </motion.div>
          </DropdownMenu.Content>
        ) : null}
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
