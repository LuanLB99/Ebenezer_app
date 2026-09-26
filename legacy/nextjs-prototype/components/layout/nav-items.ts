import { Home, Users, Calendar, Music, User } from "lucide-react";

// Fonte única de verdade para a navegação — usada tanto pela sidebar (desktop)
// quanto pelas tabs inferiores (mobile). Reflete a Estrutura de Telas do spec-tecnica.md.
export const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/membros", label: "Membros", icon: Users },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/cultos", label: "Cultos", icon: Music },
  { href: "/perfil", label: "Perfil", icon: User },
] as const;
