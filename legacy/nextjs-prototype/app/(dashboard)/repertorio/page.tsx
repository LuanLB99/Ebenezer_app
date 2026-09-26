import Link from "next/link";
import { Plus, FileText, Music as MusicIcon } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

// Repertório Musical: título/artista, letra e cifra (PDF ou imagem),
// áudio-guia e divisão de vozes (spec-tecnica.md, Módulo 3).
export default async function RepertorioPage() {
  const supabase = createClient();

  const { data: songs } = await supabase
    .from("songs")
    .select("id, title, artist, key, lyrics_url, chords_url, audio_url")
    .order("title");

  return (
    <div>
      <Topbar title="Repertório" />

      <div className="p-4 md:p-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-ink-soft">{songs?.length ?? 0} música(s)</p>
          <Button disabled title="Implementar seguindo o padrão de /membros/novo">
            <Plus size={16} /> Nova Música
          </Button>
        </div>

        <div className="space-y-2">
          {songs?.length ? (
            songs.map((song) => (
              <Card key={song.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{song.title}</p>
                  <p className="text-sm text-ink-soft">
                    {song.artist}
                    {song.key ? ` · Tom ${song.key}` : ""}
                  </p>
                </div>
                <div className="flex gap-3 text-ink-soft">
                  {song.lyrics_url && <FileText size={16} />}
                  {song.audio_url && <MusicIcon size={16} />}
                </div>
              </Card>
            ))
          ) : (
            <Card className="text-sm text-ink-soft">Nenhuma música cadastrada ainda.</Card>
          )}
        </div>
      </div>
    </div>
  );
}
