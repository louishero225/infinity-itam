import { Suspense } from "react";

import { LoginForm } from "@/components/app/login-form";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, oklch(0.75 0.02 265 / 0.25) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background via-background to-accent/30" />
      <Suspense fallback={<div className="text-muted-foreground text-sm">Chargement...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
