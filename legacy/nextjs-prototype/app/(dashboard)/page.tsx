import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Home: próximos eventos, boletim recente e "minha próxima escala" — como
// descrito na Estrutura de Telas do spec-tecnica.md.
export default async function HomePage() {
  const supabase = createClient();

  const [{ data: events }, { data: posts }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, starts_at, location")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(3),
    supabase
      .from("bulletin_posts")
      .select("id, title, published_at, pinned")
      .order("published_at", { ascending: false })
      .limit(3),
  ]);

  return (
    <div>
      <Topbar title="Início" />

      <div className="space-y-6 p-4 md:p-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Próximos eventos
          </h2>
          <div className="space-y-2">
            {events?.length ? (
              events.map((event) => (
                <Card key={event.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    {event.location && (
                      <p className="text-sm text-ink-soft">{event.location}</p>
                    )}
                  </div>
                  <p className="text-sm text-ink-muted">
                    {format(new Date(event.starts_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </Card>
              ))
            ) : (
              <Card className="text-sm text-ink-soft">Nenhum evento agendado.</Card>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Boletim recente
          </h2>
          <div className="space-y-2">
            {posts?.length ? (
              posts.map((post) => (
                <Card key={post.id}>
                  <p className="font-medium">{post.title}</p>
                  <p className="text-sm text-ink-soft">
                    {format(new Date(post.published_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </Card>
              ))
            ) : (
              <Card className="text-sm text-ink-soft">Nenhum aviso publicado ainda.</Card>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Minha próxima escala
          </h2>
          <Card className="text-sm text-ink-soft">
            Você ainda não está escalado para nenhum culto.
          </Card>
        </section>
      </div>
    </div>
  );
}
