import Link from "next/link";
import { Plus } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

// Lista de Membros — visível para líderes/pastores (ver RLS no spec-tecnica.md).
// Este módulo serve de referência de padrão para os demais (EBD, Cultos, Repertório):
// Server Component busca os dados via createClient() do lado do servidor,
// e as ações de escrita (criar/editar) ficam em telas/rotas próprias.
export default async function MembrosPage() {
  const supabase = createClient();

  const { data: members } = await supabase
    .from("members")
    .select("id, full_name, role, phone, photo_url, active")
    .order("full_name", { ascending: true });

  return (
    <div>
      <Topbar title="Membros" />

      <div className="p-4 md:p-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-ink-soft">
            {members?.length ?? 0} membro(s) cadastrado(s)
          </p>
          <Link href="/membros/novo">
            <Button>
              <Plus size={16} /> Novo Membro
            </Button>
          </Link>
        </div>

        <div className="space-y-2">
          {members?.length ? (
            members.map((member) => (
              <Link key={member.id} href={`/membros/${member.id}`}>
                <Card className="flex items-center justify-between hover:border-brand/40">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brand-light text-sm font-semibold text-brand-dark">
                      {member.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.photo_url}
                          alt={member.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        member.full_name.slice(0, 1)
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{member.full_name}</p>
                      {member.phone && (
                        <p className="text-sm text-ink-soft">{member.phone}</p>
                      )}
                    </div>
                  </div>
                  <RoleBadge role={member.role} />
                </Card>
              </Link>
            ))
          ) : (
            <Card className="text-sm text-ink-soft">
              Nenhum membro cadastrado ainda. Comece adicionando o primeiro.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
