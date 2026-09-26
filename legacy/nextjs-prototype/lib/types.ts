// Tipos alinhados ao schema em supabase/migrations/0001_init.sql (ver spec-tecnica.md)
// Quando o projeto Supabase estiver criado, rode:
//   npx supabase gen types typescript --project-id <seu-projeto> > lib/types.ts
// para substituir este arquivo pelos tipos gerados automaticamente a partir do banco real.

export type Role = "pastor" | "lider" | "membro" | "visitante";
export type WorshipFunction = "vocal" | "instrumentista" | "som" | "midia";
export type VoicePart = "soprano" | "contralto" | "tenor" | "baixo" | "geral";
export type EventType = "culto" | "congresso" | "reuniao" | "aniversario" | "outro";

export interface Member {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  birth_date: string | null;
  role: Role;
  phone: string | null;
  photo_url: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
}

export interface EbdClass {
  id: string;
  name: string;
  teacher_id: string | null;
  description: string | null;
  active: boolean;
  created_at: string;
}

export interface AttendanceSession {
  id: string;
  class_id: string;
  session_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface BulletinPost {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  published_at: string;
  author_id: string | null;
  pinned: boolean;
}

export interface ChurchEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  created_by: string | null;
}

export interface Service {
  id: string;
  name: string;
  service_type: string | null;
  scheduled_at: string;
  theme: string | null;
  preacher_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface WorshipScale {
  id: string;
  service_id: string;
  name: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface WorshipScaleSlot {
  id: string;
  scale_id: string;
  member_id: string;
  function: WorshipFunction;
  confirmed: boolean | null;
}

export interface Song {
  id: string;
  title: string;
  artist: string | null;
  key: string | null;
  lyrics_url: string | null;
  chords_url: string | null;
  audio_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

// Placeholder — substituído pelo type gerado via `supabase gen types` quando o projeto existir.
export type Database = any;
