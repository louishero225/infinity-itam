"use client";

import * as React from "react";

import { DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "sm:max-w-lg",
  md: "sm:max-w-2xl max-h-[90vh] overflow-y-auto",
  lg: "sm:max-w-3xl max-h-[90vh] overflow-y-auto",
  xl: "sm:max-w-4xl max-h-[90vh] overflow-y-auto",
} as const;

export type FormDialogSize = keyof typeof sizeClasses;

export function FormDialogContent({
  size = "sm",
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogContent> & { size?: FormDialogSize }) {
  return (
    <DialogContent className={cn(sizeClasses[size], className)} {...props}>
      {children}
    </DialogContent>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        {description ? (
          <p className="text-muted-foreground text-xs mt-0.5">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
