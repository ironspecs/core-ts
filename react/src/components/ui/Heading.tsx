import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/cn.js";

const headingVariants = cva("font-semibold", {
  variants: {
    size: {
      sm: "text-lg",
      md: "text-2xl",
      lg: "text-3xl",
    },
    gutterBottom: {
      true: "mb-[0.35em]",
      false: "",
    },
  },
  defaultVariants: {
    size: "md",
    gutterBottom: false,
  },
});

export type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants> & {
    as: HeadingElement;
    children: ReactNode;
  };

export function Heading({
  as: Tag,
  size,
  gutterBottom,
  className,
  children,
  ...rest
}: HeadingProps) {
  return (
    <Tag
      {...rest}
      className={cn(headingVariants({ size, gutterBottom }), className)}
    >
      {children}
    </Tag>
  );
}
