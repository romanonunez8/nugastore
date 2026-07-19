"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase, fotoPortada, stockTotal, type Producto } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";

function nombreArchivo(extension: string) {
  const fecha = new Date().toISOString().slice(0, 10);
  return `inventario-${fecha}.${extension}`;
}

function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

export default function InventarioPage() {
  const { sesion } = useAdminAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState<"excel" | "pdf" | null>(null);

  const cargar = useCallback(async () => {
    if (!sesion?.tiendaId) return;
    setCargando(true);
    const { data } = await supabase
      .from("productos")
      .select("*, categorias(nombre), variantes(*), producto_fotos(*)")
      .eq("tienda_id", sesion.tiendaId)
      .order("nombre");
    setProductos((data as unknown as Producto[]) ?? []);
    setCargando(false);
  }, [sesion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function exportarExcel() {
    setExportando("excel");
    try {
      const ExcelJS = (await import("exceljs")).default;
      const libro = new ExcelJS.Workbook();
      const hoja = libro.addWorksheet("Inventario");

      hoja.columns = [
        { header: "Código", key: "codigo", width: 14 },
        { header: "Nombre", key: "nombre", width: 32 },
        { header: "Categoría", key: "categoria", width: 20 },
        { header: "Precio (Bs)", key: "precio", width: 12 },
        { header: "Stock total", key: "stock", width: 12 },
        { header: "Estado", key: "estado", width: 14 },
      ];
      hoja.getRow(1).font = { bold: true };

      productos.forEach((p) => {
        hoja.addRow({
          codigo: p.codigo,
          nombre: p.nombre,
          categoria: p.categorias?.nombre ?? "",
          precio: p.precio,
          stock: stockTotal(p.variantes),
          estado: p.activo ? "Activo" : "Desactivado",
        });
      });

      const buffer = await libro.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      descargarBlob(blob, nombreArchivo("xlsx"));
    } finally {
      setExportando(null);
    }
  }

  async function exportarPDF() {
    setExportando("pdf");
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("Inventario", 14, 15);
      doc.setFontSize(9);
      doc.text(new Date().toLocaleDateString("es-BO"), 14, 21);

      autoTable(doc, {
        startY: 26,
        head: [["Código", "Nombre", "Categoría", "Precio (Bs)", "Stock", "Estado"]],
        body: productos.map((p) => [
          p.codigo,
          p.nombre,
          p.categorias?.nombre ?? "—",
          p.precio.toFixed(2),
          String(stockTotal(p.variantes)),
          p.activo ? "Activo" : "Desactivado",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 92, 92] },
      });

      doc.save(nombreArchivo("pdf"));
    } finally {
      setExportando(null);
    }
  }

  if (sesion && sesion.rol !== "admin_tienda") {
    return <p className="text-berry">Esta sección es solo para el administrador de la tienda.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink">Inventario</h1>
        <div className="flex gap-2">
          <button
            onClick={exportarExcel}
            disabled={exportando !== null || productos.length === 0}
            className="rounded-card border border-line px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
          >
            {exportando === "excel" ? "Generando…" : "Exportar a Excel"}
          </button>
          <button
            onClick={exportarPDF}
            disabled={exportando !== null || productos.length === 0}
            className="rounded-card border border-line px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
          >
            {exportando === "pdf" ? "Generando…" : "Exportar a PDF"}
          </button>
        </div>
      </div>

      {cargando ? (
        <p className="text-inkSoft">Cargando…</p>
      ) : productos.length === 0 ? (
        <p className="text-inkSoft">Todavía no cargaste productos.</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-line bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-inkSoft">
                <th className="px-3 py-2 font-medium">Foto</th>
                <th className="px-3 py-2 font-medium">Código</th>
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Categoría</th>
                <th className="px-3 py-2 font-medium text-right">Precio</th>
                <th className="px-3 py-2 font-medium text-right">Stock</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => {
                const foto = fotoPortada(p);
                return (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-2">
                      {foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={foto}
                          alt={p.nombre}
                          className="h-10 w-10 rounded-card object-cover border border-line"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-card bg-tealSoft" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-ink">{p.codigo}</td>
                    <td className="px-3 py-2 text-ink">{p.nombre}</td>
                    <td className="px-3 py-2 text-inkSoft">{p.categorias?.nombre ?? "—"}</td>
                    <td className="px-3 py-2 text-right text-ink">Bs {p.precio.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right text-ink">{stockTotal(p.variantes)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          p.activo ? "bg-tealSoft text-teal" : "bg-berrySoft text-berry"
                        }`}
                      >
                        {p.activo ? "Activo" : "Desactivado"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/tienda/productos/${p.id}`}
                        className="font-medium text-teal"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
