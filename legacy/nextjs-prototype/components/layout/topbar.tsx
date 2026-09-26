// Cabeçalho leve, mobile e desktop. No mobile substitui a sidebar como identificação
// do app; no desktop convive com ela mostrando o título da página atual.
export function Topbar({ title }: { title: string }) {
  return (
    <header className="flex items-center gap-3 border-b border-border bg-white px-4 py-3 md:px-8 md:py-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white font-heading text-sm md:hidden">
        E
      </div>
      <h1 className="font-heading text-lg text-brand-dark md:text-2xl">{title}</h1>
    </header>
  );
}
