import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Calendário de Atividades + Boletim (feed), unificados numa tela só —
// Módulo 2 do spec-tecnica.md.
export default async function AgendaPage() {
  const supabase = createClient();

  const [{ data: events }, { data: posts }] = await Promise.all([
    supabase.from("events").select("*").order("starts_at", { ascending: true }),
    supabase.from("bulletin_posts").select("*").order("published_at", { ascending: false }),
  ]);

  return (
    <div>
      <Topbar title="Agenda" />

      <div className="space-y-6 p-4 md:p-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Calendário
          </h2>
          <div className="space-y-2">
            {events?.length ? (
              events.map((event) => (
                <Card key={event.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-ink-soft">{event.location}</p>
                  </div>
                  <div className="text-right">
                    <Badge>{event.event_type}</Badge>
                    <p className="mt-1 text-sm text-ink-muted">
                      {format(new Date(event.starts_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="text-sm text-ink-soft">Nenhum evento cadastrado.</Card>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Boletim
          </h2>
          <div className="space-y-2">
            {posts?.length ? (
              posts.map((post) => (
                <Card key={post.id}>
                  <p className="font-medium">{post.title}</p>
                  {post.body && <p className="mt-1 text-sm text-ink-muted">{post.body}</p>}
                </Card>
              ))
            ) : (
              <Card className="text-sm text-ink-soft">Nenhum aviso publicado ainda.</Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
