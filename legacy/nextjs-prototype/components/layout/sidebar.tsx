"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

// Navegação lateral — visível a partir do breakpoint `md` (telas de desktop/tablet).
// Em telas menores, quem assume é a <BottomTabs />.
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-white">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand text-white font-heading text-lg">
          E
        </div>
        <div>
          <p className="font-heading text-base leading-tight text-brand-dark">
            IP Ebenézer
          </p>
          <p className="text-xs text-ink-soft">Taubaté</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-light text-brand-dark"
                  : "text-ink-muted hover:bg-bg"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
