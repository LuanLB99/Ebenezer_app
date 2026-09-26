import { Sidebar } from "@/components/layout/sidebar";
import { BottomTabs } from "@/components/layout/bottom-tabs";

// Shell responsivo compartilhado por todas as telas autenticadas:
// - >= md (desktop/tablet): sidebar fixa à esquerda, sem tabs inferiores.
// - < md (celular): sem sidebar, navegação por tabs fixas embaixo.
// O conteúdo de cada página não precisa saber em qual layout está — só
// evita ficar por baixo das tabs no mobile (pb-16).
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <main className="flex-1 pb-20 md:pb-0">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
        <BottomTabs />
      </div>
    </div>
  );
}
