/**
 * Owns the animated drawer surface that slides over a bounded target pane on
 * mobile-sized layouts. This file owns only the mechanical drawer behavior:
 * open rendering, back action, Escape close, swipe close, and scroll framing.
 * Callers own the content, labels, routing, and selection state.
 */

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ArrowLeftIcon } from "lucide-react";
import {
  useCallback,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { useMountEffect } from "../hooks/useMountEffect.js";
import { cn } from "../lib/cn.js";

const SWIPE_CLOSE_THRESHOLD = 80;
const SWIPE_VELOCITY_THRESHOLD = 300;

export type SlidingDrawerLabels = {
  back: string;
};

export type SlidingDrawerProps = ComponentPropsWithoutRef<typeof motion.div> & {
  isOpen: boolean;
  children: ReactNode;
  onRequestClose: () => void;
  labels: SlidingDrawerLabels;
};

export function SlidingDrawer(props: SlidingDrawerProps) {
  const { isOpen, children, onRequestClose, labels, className, ...rootProps } =
    props;
  const isOpenRef = useRef(isOpen);
  const onRequestCloseRef = useRef(onRequestClose);
  isOpenRef.current = isOpen;
  onRequestCloseRef.current = onRequestClose;

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (
        info.offset.x > SWIPE_CLOSE_THRESHOLD ||
        info.velocity.x > SWIPE_VELOCITY_THRESHOLD
      ) {
        onRequestClose();
      }
    },
    [onRequestClose],
  );

  useMountEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !isOpenRef.current) {
        return;
      }

      onRequestCloseRef.current();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          {...rootProps}
          className={cn(
            "bg-base-100 absolute inset-0 z-10 flex flex-col overflow-hidden",
            className,
          )}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
        >
          <div className="border-base-300 flex items-center border-b-(length:--border) px-3 py-2">
            <button
              type="button"
              className="btn btn-ghost focus-visible:ring-primary c-btn-min-h c-btn-min-w gap-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              onClick={onRequestClose}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              {labels.back}
            </button>
          </div>

          <div className="flex-1 overflow-auto">{children}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
