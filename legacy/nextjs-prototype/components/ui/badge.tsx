import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const ROLE_LABEL: Record<string, string> = {
  pastor: "Pastor",
  lider: "Líder",
  membro: "Membro",
  visitante: "Visitante",
};

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand-dark",
        className
      )}
    >
      {ROLE_LABEL[role] ?? role}
    </span>
  );
}

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-block rounded-full bg-bg px-2.5 py-0.5 text-xs font-medium text-ink-muted",
        className
      )}
      {...props}
    />
  );
}
