import { APP_NAME, APP_TAGLINE } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function AppBrand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-sidebar-border bg-background/60",
        compact ? "px-2.5 py-2" : "px-3 py-3",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-bold tracking-tight">
          IT
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight">{APP_NAME}</div>
          {!compact ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{APP_TAGLINE}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
