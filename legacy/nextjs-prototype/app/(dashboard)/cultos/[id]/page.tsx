import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Detalhe do Culto → Escala de Louvor vinculada, com equipe (por função) e
// repertório (músicas ordenadas). Ver Estrutura de Telas no spec-tecnica.md.
export default async function CultoDetalhePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!service) notFound();

  const { data: scale } = await supabase
    .from("worship_scales")
    .select(
      `
      id, name,
      slots:worship_scale_slots(id, function, confirmed, member:member_id(full_name)),
      songs:scale_songs(order_index, notes, song:song_id(id, title, artist))
    `
    )
    .eq("service_id", params.id)
    .maybeSingle();

  return (
    <div>
      <Topbar title={service.name} />

      <div className="space-y-6 p-4 md:p-8">
        <Card>
          <p className="text-sm text-ink-soft">
            {format(new Date(service.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
          {service.theme && <p className="mt-1 font-medium">{service.theme}</p>}
        </Card>

        {scale ? (
          <>
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
                Equipe — {scale.name}
              </h2>
              <div className="space-y-2">
                {scale.slots?.length ? (
                  scale.slots.map((slot: any) => (
                    <Card key={slot.id} className="flex items-center justify-between">
                      <p className="font-medium">{slot.member?.full_name}</p>
                      <div className="flex items-center gap-2">
                        <Badge>{slot.function}</Badge>
                        <span className="text-xs text-ink-soft">
                          {slot.confirmed === true
                            ? "Confirmado"
                            : slot.confirmed === false
                              ? "Recusado"
                              : "Pendente"}
                        </span>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="text-sm text-ink-soft">Ninguém escalado ainda.</Card>
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
                Repertório
              </h2>
              <div className="space-y-2">
                {scale.songs?.length ? (
                  scale.songs
                    .sort((a: any, b: any) => a.order_index - b.order_index)
                    .map((s: any) => (
                      <Card key={s.song.id}>
                        <p className="font-medium">{s.song.title}</p>
                        {s.song.artist && (
                          <p className="text-sm text-ink-soft">{s.song.artist}</p>
                        )}
                      </Card>
                    ))
                ) : (
                  <Card className="text-sm text-ink-soft">Nenhuma música adicionada ainda.</Card>
                )}
              </div>
            </section>
          </>
        ) : (
          <Card className="text-sm text-ink-soft">
            Este culto ainda não tem escala de louvor criada.
          </Card>
        )}
      </div>
    </div>
  );
}
