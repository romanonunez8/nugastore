"use client";

import type { Categoria } from "@/lib/supabase";

export default function CategoryFilter({
  categorias,
  activa,
  onChange,
}: {
  categorias: Categoria[];
  activa: string | null;
  onChange: (categoriaId: string | null) => void;
}) {
  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto px-4 pb-1">
      <button
        onClick={() => onChange(null)}
        className={`shrink-0 rounded-full px-4 py-1.5 font-body text-sm font-medium transition-colors ${
          activa === null
            ? "bg-ink text-paper"
            : "bg-white text-inkSoft border border-line"
        }`}
      >
        Todo
      </button>
      {categorias.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`shrink-0 rounded-full px-4 py-1.5 font-body text-sm font-medium transition-colors ${
            activa === c.id
              ? "bg-ink text-paper"
              : "bg-white text-inkSoft border border-line"
          }`}
        >
          {c.nombre}
        </button>
      ))}
    </div>
  );
}
