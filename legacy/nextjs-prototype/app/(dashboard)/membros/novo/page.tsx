"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";

const ROLES: { value: Role; label: string }[] = [
  { value: "membro", label: "Membro" },
  { value: "visitante", label: "Visitante" },
  { value: "lider", label: "Líder" },
  { value: "pastor", label: "Pastor" },
];

export default function NovoMembroPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    birth_date: "",
    role: "membro" as Role,
    phone: "",
    email: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error } = await supabase.from("members").insert({
      full_name: form.full_name,
      birth_date: form.birth_date || null,
      role: form.role,
      phone: form.phone || null,
      email: form.email || null,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push("/membros");
    router.refresh();
  }

  return (
    <div>
      <Topbar title="Novo Membro" />

      <form onSubmit={handleSubmit} className="space-y-4 p-4 md:max-w-md md:p-8">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">
            Nome completo
          </label>
          <Input
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">
            Data de nascimento
          </label>
          <Input
            type="date"
            value={form.birth_date}
            onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">Cargo</label>
          <select
            className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">Telefone</label>
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="(12) 99999-9999"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-muted">E-mail</label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
