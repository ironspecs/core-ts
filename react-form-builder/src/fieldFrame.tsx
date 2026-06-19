// Owns the shared form field chrome for labels, descriptions, errors, and
// child field controls. Keep this component presentational; field state,
// validation, and value ownership belong to callers.
import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@core-ts/react";
import * as Label from "@radix-ui/react-label";
import { Typography } from "@core-ts/react";

export type FieldFrameProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  required?: boolean;
  description?: string;
  error?: string;
  children: ReactNode;
};

export function FieldFrame(props: FieldFrameProps) {
  const { label, required, description, error, children, className, ...rest } =
    props;

  return (
    <div {...rest} className={cn("form-control w-full", className)}>
      {label ? (
        <Label.Root className="label">
          <Typography variant="body">
            {label} {required ? <span className="text-error">*</span> : null}
          </Typography>
        </Label.Root>
      ) : null}

      {children}

      {description ? (
        <div className="label">
          <Typography variant="hint">{description}</Typography>
        </div>
      ) : null}

      {error ? (
        <div className="label">
          <Typography variant="hint" className="text-error">
            {error}
          </Typography>
        </div>
      ) : null}
    </div>
  );
}
