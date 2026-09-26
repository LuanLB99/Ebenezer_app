import Link from "next/link";
import { Plus } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Núcleo do app (Módulo 3): Gestão de Cultos + Escalas de Louvor.
// Fluxo completo (criar culto → criar escala → adicionar equipe/repertório →
// notificar) está descrito no User Flow do spec-tecnica.md, seção 4.
export default async function CultosPage() {
  const supabase = createClient();

  const { data: services } = await supabase
    .from("services")
    .select("id, name, scheduled_at, theme")
    .order("scheduled_at", { ascending: false });

  return (
    <div>
      <Topbar title="Cultos" />

      <div className="p-4 md:p-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-ink-soft">{services?.length ?? 0} culto(s)</p>
          <Button disabled title="Implementar seguindo o padrão de /membros/novo">
            <Plus size={16} /> Novo Culto
          </Button>
        </div>

        <div className="space-y-2">
          {services?.length ? (
            services.map((service) => (
              <Link key={service.id} href={`/cultos/${service.id}`}>
                <Card className="flex items-center justify-between hover:border-brand/40">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    {service.theme && (
                      <p className="text-sm text-ink-soft">{service.theme}</p>
                    )}
                  </div>
                  <p className="text-sm text-ink-muted">
                    {format(new Date(service.scheduled_at), "dd/MM 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="text-sm text-ink-soft">Nenhum culto cadastrado ainda.</Card>
          )}
        </div>

        <div className="mt-8">
          <Link href="/repertorio" className="text-sm font-medium text-brand">
            Ver Repertório completo →
          </Link>
        </div>
      </div>
    </div>
  );
}
