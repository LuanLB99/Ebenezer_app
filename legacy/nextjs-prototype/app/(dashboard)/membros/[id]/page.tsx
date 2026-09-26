import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { RoleBadge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export default async function MembroDetalhePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!member) notFound();

  return (
    <div>
      <Topbar title={member.full_name} />

      <div className="space-y-4 p-4 md:p-8">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-soft">Cargo</p>
            <RoleBadge role={member.role} />
          </div>
          {member.birth_date && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-soft">Nascimento</p>
              <p className="text-sm">{format(new Date(member.birth_date), "dd/MM/yyyy")}</p>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-soft">Telefone</p>
              <p className="text-sm">{member.phone}</p>
            </div>
          )}
          {member.email && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-soft">E-mail</p>
              <p className="text-sm">{member.email}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
