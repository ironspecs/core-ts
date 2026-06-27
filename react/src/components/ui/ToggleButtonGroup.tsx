/**
 * Owns the shared single-select toggle button primitives for reusable view and
 * filter controls. This file preserves a non-clearable Radix toggle-group
 * contract, and it owns the explicit mapping from React-visible state such as
 * `selected` and `disabled` to shared button classes through `cva`. The local
 * invariant is that visual state is derived inside this wrapper, not through
 * DOM attribute selectors, so the shared styling contract stays explicit and
 * durable across consuming apps.
 */

import { cva } from "class-variance-authority";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import {
  Children,
  cloneElement,
  isValidElement,
  type ReactNode,
} from "react";

import { cn } from "../../lib/cn.js";

const toggleButtonVariants = cva(
  "btn join-item c-btn-min-h c-btn-min-w px-4 font-medium shadow-none",
  {
    variants: {
      selected: {
        false: "",
        true: "bg-base-300 text-base-content",
      },
      disabled: {
        false: "",
        true: "pointer-events-none opacity-50",
      },
    },
    defaultVariants: {
      selected: false,
      disabled: false,
    },
  },
);

export type ToggleButtonProps = ToggleGroupPrimitive.ToggleGroupItemProps & {
  selected?: boolean;
};

export function ToggleButton(props: ToggleButtonProps) {
  const { className, disabled = false, selected = false, ...buttonProps } =
    props;

  return (
    <ToggleGroupPrimitive.Item
      {...buttonProps}
      disabled={disabled}
      className={cn(
        toggleButtonVariants({ disabled, selected }),
        className,
      )}
    />
  );
}

export type ToggleButtonGroupProps = Omit<
  ToggleGroupPrimitive.ToggleGroupSingleProps,
  "type"
>;

function cloneToggleButtonChild(
  child: ReactNode,
  selectedValue: string | undefined,
  groupDisabled: boolean | undefined,
) {
  if (!isValidElement<ToggleButtonProps>(child) || child.type !== ToggleButton) {
    return child;
  }

  return cloneElement(child, {
    disabled: child.props.disabled ?? groupDisabled,
    selected: child.props.value === selectedValue,
  });
}

export function ToggleButtonGroup(props: ToggleButtonGroupProps) {
  const { children, className, disabled, onValueChange, value, ...rootProps } =
    props;

  return (
    <ToggleGroupPrimitive.Root
      {...rootProps}
      disabled={disabled}
      type="single"
      value={value}
      className={cn("join", className)}
      onValueChange={(nextValue) => {
        if (nextValue === "") {
          return;
        }

        onValueChange?.(nextValue);
      }}
    >
      {Children.map(children, (child) =>
        cloneToggleButtonChild(child, value, disabled),
      )}
    </ToggleGroupPrimitive.Root>
  );
}
