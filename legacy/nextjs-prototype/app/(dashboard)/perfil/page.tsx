"use client";

import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function PerfilPage() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div>
      <Topbar title="Perfil" />

      <div className="space-y-4 p-4 md:p-8">
        <Card className="text-sm text-ink-soft">
          Meus dados e minhas escalas — a implementar seguindo o mesmo padrão dos
          outros módulos (buscar o `member` vinculado a `auth.uid()`).
        </Card>

        <Button variant="secondary" onClick={handleLogout}>
          Sair
        </Button>
      </div>
    </div>
  );
}
