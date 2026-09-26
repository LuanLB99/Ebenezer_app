import Link from "next/link";
import { Plus } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

// Escola Bíblica Dominical: classes/turmas, com professor e chamada digital
// (spec-tecnica.md, Módulo 1). Segue o mesmo padrão de app/(dashboard)/membros:
// listagem em Server Component + ação de criação em rota própria.
export default async function EbdPage() {
  const supabase = createClient();

  const { data: classes } = await supabase
    .from("ebd_classes")
    .select("id, name, description, teacher:teacher_id(full_name)")
    .eq("active", true)
    .order("name");

  return (
    <div>
      <Topbar title="Escola Dominical" />

      <div className="p-4 md:p-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-ink-soft">{classes?.length ?? 0} classe(s)</p>
          <Button disabled title="Implementar seguindo o padrão de /membros/novo">
            <Plus size={16} /> Nova Classe
          </Button>
        </div>

        <div className="space-y-2">
          {classes?.length ? (
            classes.map((c: any) => (
              <Card key={c.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.name}</p>
                  {c.teacher?.full_name && (
                    <p className="text-sm text-ink-soft">Prof. {c.teacher.full_name}</p>
                  )}
                </div>
                <Link href={`/ebd/${c.id}`} className="text-sm font-medium text-brand">
                  Chamada →
                </Link>
              </Card>
            ))
          ) : (
            <Card className="text-sm text-ink-soft">Nenhuma classe cadastrada ainda.</Card>
          )}
        </div>
      </div>
    </div>
  );
}
