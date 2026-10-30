import { useState, useMemo } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

type AssetStatus = "Disponible" | "Alquilado" | "En Mantenimiento";

interface Asset {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  description: string;
  purchaseDate: string;
  status: AssetStatus;
  lastMaintenance: string; // ISO date
  active: boolean;
}

interface Category {
  id: string;
  name: string;
  active: boolean;
}

interface Rate {
  id: string;
  category: string;
  priceWeek: number;
  priceMonth: number;
  priceDay: number;
  priceDayExtra: number;
  startDate: string;
  endDate: string | null;
  active: boolean;
}

interface MaintenanceRecord {
  id: string;
  assetId: string;
  assetName: string;
  date: string;
  description: string;
  cost: number;
}

// ── Mock Data ──────────────────────────────────────────────────────────────────

const CATEGORIES_INIT: Category[] = [
  { id: "c1", name: "Andamio", active: true },
  { id: "c2", name: "Plataforma", active: true },
  { id: "c3", name: "Rodo", active: true },
  { id: "c4", name: "Puntal", active: true },
  { id: "c5", name: "Escalera", active: false },
];

const ASSETS_INIT: Asset[] = [
  { id: "a1", code: "AND-0034", name: "Andamio Tubular 48mm", category: "Andamio", brand: "Layher", model: "Allround R7", description: "Andamio modular de acero galvanizado, altura máx. 20m.", purchaseDate: "2021-03-15", status: "Disponible", lastMaintenance: "2026-03-12", active: true },
  { id: "a2", code: "AND-0035", name: "Andamio Colgante Mono", category: "Andamio", brand: "Peri", model: "UP Rosett", description: "Sistema colgante para fachadas.", purchaseDate: "2022-06-10", status: "Alquilado", lastMaintenance: "2026-02-20", active: true },
  { id: "a3", code: "PLT-0007", name: "Plataforma Tijera 6m", category: "Plataforma", brand: "JLG", model: "2630ES", description: "Plataforma eléctrica tijera, cap. 230kg.", purchaseDate: "2020-11-01", status: "En Mantenimiento", lastMaintenance: "2026-04-15", active: true },
  { id: "a4", code: "PLT-0009", name: "Plataforma Articulada 10m", category: "Plataforma", brand: "Genie", model: "Z-34/22 DC", description: "Boom articulado 10m de altura de trabajo.", purchaseDate: "2023-01-22", status: "Disponible", lastMaintenance: "2026-05-01", active: true },
  { id: "a5", code: "ROD-0011", name: "Jgo. Rodos Industriales", category: "Rodo", brand: "Hilman", model: "60-ton", description: "Set de 4 rodos industriales para carga pesada.", purchaseDate: "2019-08-05", status: "Disponible", lastMaintenance: "2026-03-18", active: true },
  { id: "a6", code: "PUN-0028", name: "Puntal Metálico 3m", category: "Puntal", brand: "Acrow", model: "E3000", description: "Puntal extensible 2.0–3.6m, carga máx. 18kN.", purchaseDate: "2021-09-30", status: "Alquilado", lastMaintenance: "2026-04-02", active: true },
  { id: "a7", code: "AND-0041", name: "Andamio Fachada Euro", category: "Andamio", brand: "ULMA", model: "MK", description: "Andamio de fachada certificado EN-12810.", purchaseDate: "2023-05-12", status: "Disponible", lastMaintenance: "2026-06-10", active: true },
  { id: "a8", code: "PLT-0012", name: "Plataforma Vertical 4m", category: "Plataforma", brand: "Skyjack", model: "SJ3219", description: "Plataforma vertical compacta, ancho 76cm.", purchaseDate: "2022-03-08", status: "Alquilado", lastMaintenance: "2026-01-25", active: false },
];

const RATES_INIT: Rate[] = [
  { id: "r1", category: "Andamio", priceWeek: 85000, priceMonth: 280000, priceDay: 15000, priceDayExtra: 12000, startDate: "2026-01-01", endDate: null, active: true },
  { id: "r2", category: "Andamio", priceWeek: 78000, priceMonth: 250000, priceDay: 13000, priceDayExtra: 10500, startDate: "2025-01-01", endDate: "2025-12-31", active: false },
  { id: "r3", category: "Plataforma", priceWeek: 220000, priceMonth: 750000, priceDay: 45000, priceDayExtra: 38000, startDate: "2026-01-01", endDate: null, active: true },
  { id: "r4", category: "Rodo", priceWeek: 60000, priceMonth: 195000, priceDay: 12000, priceDayExtra: 9500, startDate: "2026-03-01", endDate: null, active: true },
  { id: "r5", category: "Puntal", priceWeek: 18000, priceMonth: 58000, priceDay: 4000, priceDayExtra: 3200, startDate: "2026-01-01", endDate: null, active: true },
];

const MAINTENANCE_INIT: MaintenanceRecord[] = [
  { id: "m1", assetId: "a1", assetName: "AND-0034 — Andamio Tubular 48mm", date: "2026-03-12", description: "Revisión general, reemplazo de tornillos oxidados y tratamiento anticorrosivo.", cost: 45000 },
  { id: "m2", assetId: "a3", assetName: "PLT-0007 — Plataforma Tijera 6m", date: "2026-04-15", description: "Cambio de batería principal y ajuste de cilindro hidráulico.", cost: 128000 },
  { id: "m3", assetId: "a5", assetName: "ROD-0011 — Jgo. Rodos Industriales", date: "2026-03-18", description: "Lubricación de rodamientos y verificación de carga máxima.", cost: 22000 },
  { id: "m4", assetId: "a6", assetName: "PUN-0028 — Puntal Metálico 3m", date: "2026-04-02", description: "Inspección de roscas, pintura anticorrosiva y prueba de carga.", cost: 15000 },
  { id: "m5", assetId: "a2", assetName: "AND-0035 — Andamio Colgante Mono", date: "2026-02-20", description: "Revisión de cables de suspensión y ajuste de mordazas.", cost: 67000 },
  { id: "m6", assetId: "a4", assetName: "PLT-0009 — Plataforma Articulada 10m", date: "2026-05-01", description: "Mantenimiento preventivo completo, cambio de filtros hidráulicos.", cost: 95000 },
  { id: "m7", assetId: "a7", assetName: "AND-0041 — Andamio Fachada Euro", date: "2026-06-10", description: "Limpieza general y verificación de anclajes y pines.", cost: 32000 },
];

const RENTAL_HISTORY: { assetId: string; id: string; client: string; start: string; end: string; status: string }[] = [
  { assetId: "a1", id: "ALQ-0058", client: "Constructora Vega S.A.", start: "2025-11-10", end: "2025-12-15", status: "Completado" },
  { assetId: "a1", id: "ALQ-0072", client: "Obras Civiles del Sur", start: "2026-01-20", end: "2026-02-28", status: "Completado" },
  { assetId: "a3", id: "ALQ-0061", client: "Inmobiliaria del Norte", start: "2025-12-01", end: "2026-01-10", status: "Completado" },
  { assetId: "a2", id: "ALQ-0091", client: "Grupo Constructivo Merino", start: "2026-07-01", end: null as unknown as string, status: "Activo" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n: number) => "$" + n.toLocaleString("es-CL");

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function maintenanceDueIn(lastMaint: string) {
  const TARGET_DAYS = 150; // ~5 months
  const elapsed = daysSince(lastMaint);
  return TARGET_DAYS - elapsed;
}

function maintBadge(dueIn: number) {
  if (dueIn <= 0) return { label: "¡Vencido!", cls: "bg-red-100 text-red-700 border border-red-300", dot: "bg-red-500" };
  if (dueIn <= 20) return { label: `${dueIn}d`, cls: "bg-red-100 text-red-700 border border-red-300", dot: "bg-red-500" };
  if (dueIn <= 45) return { label: `${dueIn}d`, cls: "bg-amber-100 text-amber-700 border border-amber-200", dot: "bg-amber-400" };
  return null;
}

const statusCfg: Record<AssetStatus, { cls: string; dot: string }> = {
  Disponible: { cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  Alquilado: { cls: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  "En Mantenimiento": { cls: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

// ── Shared UI ──────────────────────────────────────────────────────────────────

function Badge({ status }: { status: AssetStatus }) {
  const cfg = statusCfg[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
}

function Toggle({ active, onChange }: { active: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${active ? "bg-[#102c4d]" : "bg-gray-300"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${active ? "translate-x-4.5" : "translate-x-0.5"}`} />
    </button>
  );
}

function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} my-4`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-[#102c4d] font-bold text-base" style={{ fontFamily: "Outfit, sans-serif" }}>{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#102c4d] uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#102c4d] focus:ring-2 focus:ring-[#102c4d]/10 transition-all";
const selectCls = inputCls + " bg-white";

function ActionBtn({ onClick, title, color = "gray", icon }: { onClick: () => void; title: string; color?: string; icon: React.ReactNode }) {
  const colors: Record<string, string> = {
    gray: "text-gray-400 hover:text-[#102c4d] hover:bg-gray-100",
    gold: "text-amber-500 hover:text-amber-700 hover:bg-amber-50",
    red: "text-red-400 hover:text-red-600 hover:bg-red-50",
  };
  return (
    <button onClick={onClick} title={title} className={`p-1.5 rounded transition-colors ${colors[color]}`}>{icon}</button>
  );
}

// SVG icons inline
const IcoEye = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;
const IcoEdit = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>;
const IcoQR = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zm-2 7a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zm8-12a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1zM9 9a1 1 0 000 2h1a1 1 0 100-2H9zm7 0a1 1 0 10-2 0v1h1a1 1 0 001-1zm-1 4a1 1 0 10-2 0 1 1 0 002 0zm-5 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>;
const IcoPlus = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
const IcoBack = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>;
const IcoFilter = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>;
const IcoPrint = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h6a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9v-1h8v1a1 1 0 01-1 1H7a1 1 0 01-1-1zm9-4a1 1 0 110 2 1 1 0 010-2z" clipRule="evenodd" /></svg>;
const IcoWrench = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L4 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A1.002 1.002 0 0118 6v2a1 1 0 11-2 0v-.277l-.254.145a1 1 0 11-.992-1.736l.23-.132-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.58V12a1 1 0 11-2 0v-1.42l-1.246-.712a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.42l1.246.712a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.42V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372l.254.145V16a1 1 0 112 0v.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-.992 0l-1.735-.992a1 1 0 01-.372-1.364z" clipRule="evenodd" /></svg>;
const IcoAlert = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const IcoSearch = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>;
const IcoTag = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const IcoCheck = () => <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;

// ── QR SVG Component ───────────────────────────────────────────────────────────

function QRCode({ code, size = 120 }: { code: string; size?: number }) {
  // Deterministic pixel pattern from code string
  const seed = code.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const grid = 11;
  const cells: boolean[][] = [];
  for (let r = 0; r < grid; r++) {
    cells[r] = [];
    for (let c = 0; c < grid; c++) {
      // Finder patterns (corners)
      const inFinder =
        (r < 3 && c < 3) || (r < 3 && c >= grid - 3) || (r >= grid - 3 && c < 3);
      if (inFinder) { cells[r][c] = true; continue; }
      // Pseudo-random data
      cells[r][c] = ((seed * (r + 1) * (c + 1) * 7 + r * 13 + c * 31) % 3) !== 0;
    }
  }
  const cell = size / grid;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="rounded">
      <rect width={size} height={size} fill="white" />
      {cells.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#102c4d" />
          ) : null
        )
      )}
      {/* Finder outlines */}
      {[[0, 0], [0, grid - 3], [grid - 3, 0]].map(([fr, fc]) => (
        <rect key={`f${fr}${fc}`} x={fc * cell} y={fr * cell} width={3 * cell} height={3 * cell} fill="none" stroke="#102c4d" strokeWidth={1} />
      ))}
    </svg>
  );
}

// ── Asset Modal ────────────────────────────────────────────────────────────────

function AssetModal({ onClose, categories, initial }: {
  onClose: () => void;
  categories: Category[];
  initial?: Partial<Asset>;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    category: initial?.category ?? "",
    brand: initial?.brand ?? "",
    model: initial?.model ?? "",
    description: initial?.description ?? "",
    purchaseDate: initial?.purchaseDate ?? "",
    code: initial?.code ?? "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = !!initial?.id;
  const generatedCode = form.category && form.brand
    ? (form.category.slice(0, 3).toUpperCase() + "-" + String(Math.floor(Math.random() * 900 + 100)))
    : "---";
  const displayCode = form.code || generatedCode;

  return (
    <Modal title={isEdit ? "Editar Activo" : "Nuevo Activo"} onClose={onClose} wide>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombre del activo">
          <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej. Andamio Tubular 48mm" />
        </Field>
        <Field label="Categoría">
          <select className={selectCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">Seleccionar…</option>
            {categories.filter((c) => c.active).map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Marca">
          <input className={inputCls} value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Ej. Layher" />
        </Field>
        <Field label="Modelo">
          <input className={inputCls} value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="Ej. Allround R7" />
        </Field>
        <Field label="Fecha de compra">
          <input type="date" className={inputCls} value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Descripción">
            <textarea className={inputCls + " resize-none"} rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Detalles adicionales del activo…" />
          </Field>
        </div>

        {/* QR section */}
        <div className="md:col-span-2 border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
          <p className="text-xs font-semibold text-[#102c4d] uppercase tracking-wider mb-3">Código QR / Código de barras</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-shrink-0 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
              <QRCode code={displayCode} size={96} />
            </div>
            <div className="flex-1 space-y-3">
              <Field label="Código asignado">
                <div className="flex gap-2">
                  <input className={inputCls} value={form.code} onChange={(e) => set("code", e.target.value)} placeholder={generatedCode} />
                  <button
                    type="button"
                    onClick={() => set("code", generatedCode)}
                    className="flex-shrink-0 px-3 py-2 text-xs font-semibold bg-[#102c4d] text-white rounded-lg hover:bg-[#1a3d6b] transition-colors"
                  >
                    Generar
                  </button>
                </div>
              </Field>
              <p className="text-xs text-gray-400">El código QR se genera automáticamente al guardar. También puedes cargar uno existente ingresando el código manualmente.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
        <button onClick={onClose} className="px-5 py-2 text-sm font-bold bg-[#ffbc07] text-[#102c4d] rounded-lg hover:bg-[#e5a800] transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
          {isEdit ? "Guardar cambios" : "Crear Activo"}
        </button>
      </div>
    </Modal>
  );
}

// ── Asset Detail ───────────────────────────────────────────────────────────────

function AssetDetail({ asset, onBack, maintenances }: {
  asset: Asset;
  onBack: () => void;
  maintenances: MaintenanceRecord[];
}) {
  const [tab, setTab] = useState<"info" | "maintenance" | "rentals">("info");
  const assetMaints = maintenances.filter((m) => m.assetId === asset.id);
  const assetRentals = RENTAL_HISTORY.filter((r) => r.assetId === asset.id);
  const dueIn = maintenanceDueIn(asset.lastMaintenance);
  const badge = maintBadge(dueIn);

  const tabs = [
    { id: "info", label: "Información" },
    { id: "maintenance", label: `Mantenimientos (${assetMaints.length})` },
    { id: "rentals", label: `Alquileres (${assetRentals.length})` },
  ] as const;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-200 text-[#102c4d] transition-colors">
          <IcoBack />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[#102c4d] font-bold text-xl" style={{ fontFamily: "Outfit, sans-serif" }}>{asset.name}</h2>
            <Badge status={asset.status} />
            {badge && (
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                <IcoAlert />
                Mant. en {badge.label}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">{asset.code} · {asset.category} · {asset.brand} {asset.model}</p>
        </div>
        <button className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#102c4d] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <IcoPrint /> Imprimir QR
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* QR Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center gap-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Código QR del Activo</p>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <QRCode code={asset.code} size={160} />
          </div>
          <p className="font-mono text-sm font-bold text-[#102c4d]">{asset.code}</p>
          <button className="flex items-center gap-2 text-xs font-semibold text-[#102c4d] border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors w-full justify-center">
            <IcoPrint /> Imprimir / Descargar
          </button>
        </div>

        {/* Detail tabs */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-3 text-xs font-semibold transition-colors ${tab === t.id ? "text-[#102c4d] border-b-2 border-[#ffbc07]" : "text-gray-400 hover:text-gray-600"}`}
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === "info" && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Nombre", asset.name],
                  ["Categoría", asset.category],
                  ["Marca", asset.brand],
                  ["Modelo", asset.model],
                  ["Fecha de compra", asset.purchaseDate],
                  ["Último mantenimiento", asset.lastMaintenance],
                  ["Días para próx. mant.", dueIn <= 0 ? "¡Vencido!" : `${dueIn} días`],
                  ["Estado", asset.status],
                ].map(([k, v]) => (
                  <div key={k} className="space-y-0.5">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">{k}</div>
                    <div className={`text-sm font-semibold ${k === "Días para próx. mant." && dueIn <= 20 ? "text-red-600" : "text-gray-900"}`}>{v}</div>
                  </div>
                ))}
                <div className="col-span-2 space-y-0.5">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Descripción</div>
                  <div className="text-sm text-gray-700">{asset.description}</div>
                </div>
              </div>
            )}

            {tab === "maintenance" && (
              <div className="space-y-3">
                {assetMaints.length === 0 && <p className="text-gray-400 text-sm text-center py-8">Sin registros de mantenimiento.</p>}
                {assetMaints.map((m) => (
                  <div key={m.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs text-gray-400">{m.date}</div>
                        <div className="text-sm font-medium text-gray-900 mt-0.5">{m.description}</div>
                      </div>
                      <div className="flex-shrink-0 text-sm font-bold text-[#102c4d]">{fmt(m.cost)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "rentals" && (
              <div className="space-y-3">
                {assetRentals.length === 0 && <p className="text-gray-400 text-sm text-center py-8">Sin historial de alquileres.</p>}
                {assetRentals.map((r) => (
                  <div key={r.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-semibold bg-blue-50 text-[#102c4d] px-2 py-0.5 rounded">{r.id}</span>
                        <div className="text-sm font-medium text-gray-900 mt-1">{r.client}</div>
                        <div className="text-xs text-gray-400">{r.start} → {r.end ?? "En curso"}</div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.status === "Activo" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Assets List ────────────────────────────────────────────────────────────────

function AssetsList({ categories, maintenances }: { categories: Category[]; maintenances: MaintenanceRecord[] }) {
  const [assets, setAssets] = useState<Asset[]>(ASSETS_INIT);
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);

  const filtered = useMemo(() =>
    assets.filter((a) =>
      (!filterCat || a.category === filterCat) &&
      (!filterStatus || a.status === filterStatus) &&
      (!filterSearch || a.name.toLowerCase().includes(filterSearch.toLowerCase()) || a.code.toLowerCase().includes(filterSearch.toLowerCase()))
    ), [assets, filterCat, filterStatus, filterSearch]);

  if (detailAsset) {
    return <AssetDetail asset={detailAsset} onBack={() => setDetailAsset(null)} maintenances={maintenances} />;
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-[#102c4d] font-bold text-xl" style={{ fontFamily: "Outfit, sans-serif" }}>Activos</h2>
          <p className="text-gray-400 text-sm">{assets.length} equipos registrados · {assets.filter((a) => a.active).length} activos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#ffbc07] text-[#102c4d] font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-[#e5a800] transition-colors shadow-sm"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          <IcoPlus /> Nuevo Activo
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
            <IcoFilter /> Filtros:
          </div>
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IcoSearch /></span>
            <input
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#102c4d]"
              placeholder="Buscar por nombre o código…"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
          </div>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#102c4d] bg-white" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#102c4d] bg-white" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            <option>Disponible</option>
            <option>Alquilado</option>
            <option>En Mantenimiento</option>
          </select>
          {(filterCat || filterStatus || filterSearch) && (
            <button onClick={() => { setFilterCat(""); setFilterStatus(""); setFilterSearch(""); }} className="text-xs text-red-500 hover:text-red-700 font-medium whitespace-nowrap">Limpiar</button>
          )}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Código", "Nombre", "Categoría", "Marca / Modelo", "Estado", "Próx. Mant.", "Activo", "Acciones"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((asset) => {
              const dueIn = maintenanceDueIn(asset.lastMaintenance);
              const badge = maintBadge(dueIn);
              return (
                <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[#102c4d]"><IcoQR /></span>
                      <span className="font-mono text-xs font-semibold text-[#102c4d] bg-blue-50 px-2 py-0.5 rounded">{asset.code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-gray-900 max-w-[180px] truncate">{asset.name}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 text-xs bg-[#102c4d]/8 text-[#102c4d] px-2 py-0.5 rounded-full font-medium">
                      <IcoTag />{asset.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600">{asset.brand} · {asset.model}</td>
                  <td className="px-4 py-3.5"><Badge status={asset.status} /></td>
                  <td className="px-4 py-3.5">
                    {badge ? (
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                        <IcoAlert />{badge.label}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">{dueIn}d</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <Toggle active={asset.active} onChange={() => setAssets((prev) => prev.map((a) => a.id === asset.id ? { ...a, active: !a.active } : a))} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-0.5">
                      <ActionBtn onClick={() => setDetailAsset(asset)} title="Ver detalle" icon={<IcoEye />} />
                      <ActionBtn onClick={() => setEditAsset(asset)} title="Editar" color="gold" icon={<IcoEdit />} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">Sin resultados para los filtros seleccionados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((asset) => {
          const dueIn = maintenanceDueIn(asset.lastMaintenance);
          const badge = maintBadge(dueIn);
          return (
            <div key={asset.id} className={`bg-white rounded-xl border shadow-sm p-4 space-y-3 ${!asset.active ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-[#102c4d] bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <IcoQR />{asset.code}
                    </span>
                    {badge && (
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                        <IcoAlert />{badge.label}
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-gray-900 mt-1.5">{asset.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{asset.brand} · {asset.model}</div>
                </div>
                <Badge status={asset.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs bg-[#102c4d]/8 text-[#102c4d] px-2 py-0.5 rounded-full font-medium">
                  <IcoTag />{asset.category}
                </span>
                <div className="flex items-center gap-2">
                  <Toggle active={asset.active} onChange={() => setAssets((prev) => prev.map((a) => a.id === asset.id ? { ...a, active: !a.active } : a))} />
                  <ActionBtn onClick={() => setDetailAsset(asset)} title="Ver" icon={<IcoEye />} />
                  <ActionBtn onClick={() => setEditAsset(asset)} title="Editar" color="gold" icon={<IcoEdit />} />
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-xl border">Sin resultados.</div>
        )}
      </div>

      {showModal && <AssetModal onClose={() => setShowModal(false)} categories={categories} />}
      {editAsset && <AssetModal onClose={() => setEditAsset(null)} categories={categories} initial={editAsset} />}
    </div>
  );
}

// ── Categories ─────────────────────────────────────────────────────────────────

function CategoriesView() {
  const [cats, setCats] = useState<Category[]>(CATEGORIES_INIT);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");

  const openCreate = () => { setFormName(""); setEditCat(null); setShowModal(true); };
  const openEdit = (c: Category) => { setFormName(c.name); setEditCat(c); setShowModal(true); };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#102c4d] font-bold text-xl" style={{ fontFamily: "Outfit, sans-serif" }}>Categorías</h2>
          <p className="text-gray-400 text-sm">Clasificación de activos</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#ffbc07] text-[#102c4d] font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-[#e5a800] transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
          <IcoPlus /> Nueva Categoría
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Nombre</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-3">Estado</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cats.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <IcoTag />
                    {c.name}
                  </div>
                </td>
                <td className="px-3 py-3.5">
                  <Toggle active={c.active} onChange={() => setCats((prev) => prev.map((x) => x.id === c.id ? { ...x, active: !x.active } : x))} />
                </td>
                <td className="px-3 py-3.5">
                  <ActionBtn onClick={() => openEdit(c)} title="Editar" color="gold" icon={<IcoEdit />} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editCat ? "Editar Categoría" : "Nueva Categoría"} onClose={() => setShowModal(false)}>
          <Field label="Nombre de la categoría">
            <input className={inputCls} value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ej. Andamio" autoFocus />
          </Field>
          <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
            <button onClick={() => {
              if (editCat) { setCats((prev) => prev.map((c) => c.id === editCat.id ? { ...c, name: formName } : c)); }
              else { setCats((prev) => [...prev, { id: `c${Date.now()}`, name: formName, active: true }]); }
              setShowModal(false);
            }} className="px-5 py-2 text-sm font-bold bg-[#ffbc07] text-[#102c4d] rounded-lg hover:bg-[#e5a800] transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
              {editCat ? "Guardar" : "Crear"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Rates ──────────────────────────────────────────────────────────────────────

function RatesView({ categories }: { categories: Category[] }) {
  const [rates, setRates] = useState<Rate[]>(RATES_INIT);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: "", priceWeek: "", priceMonth: "", priceDay: "", priceDayExtra: "", startDate: "" });
  const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const hasActive = form.category ? rates.some((r) => r.category === form.category && r.active) : false;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#102c4d] font-bold text-xl" style={{ fontFamily: "Outfit, sans-serif" }}>Tarifas</h2>
          <p className="text-gray-400 text-sm">Precios por categoría · Las tarifas anteriores se mantienen como históricas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#ffbc07] text-[#102c4d] font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-[#e5a800] transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
          <IcoPlus /> Nueva Tarifa
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Categoría", "Semana", "Mes", "Día único", "Día extra", "Fecha inicio", "Fecha fin", "Estado"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rates.map((r) => (
              <tr key={r.id} className={`transition-colors ${r.active ? "hover:bg-gray-50/50" : "bg-gray-50/50 opacity-60"}`}>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1 text-xs bg-[#102c4d]/8 text-[#102c4d] px-2 py-0.5 rounded-full font-semibold">
                    <IcoTag />{r.category}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-semibold text-gray-900">{fmt(r.priceWeek)}</td>
                <td className="px-4 py-3.5 font-semibold text-gray-900">{fmt(r.priceMonth)}</td>
                <td className="px-4 py-3.5 font-semibold text-gray-900">{fmt(r.priceDay)}</td>
                <td className="px-4 py-3.5 font-semibold text-gray-900">{fmt(r.priceDayExtra)}</td>
                <td className="px-4 py-3.5 text-xs text-gray-600">{r.startDate}</td>
                <td className="px-4 py-3.5 text-xs text-gray-600">{r.endDate ?? <span className="text-emerald-600 font-semibold">Vigente</span>}</td>
                <td className="px-4 py-3.5">
                  {r.active
                    ? <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full"><IcoCheck />Activa</span>
                    : <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">Histórica</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {rates.map((r) => (
          <div key={r.id} className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3 ${!r.active ? "opacity-60" : ""}`}>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs bg-[#102c4d]/8 text-[#102c4d] px-2 py-0.5 rounded-full font-semibold"><IcoTag />{r.category}</span>
              {r.active
                ? <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">Activa</span>
                : <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">Histórica</span>}
            </div>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
              {[["Semana", fmt(r.priceWeek)], ["Mes", fmt(r.priceMonth)], ["Día único", fmt(r.priceDay)], ["Día extra", fmt(r.priceDayExtra)]].map(([k, v]) => (
                <div key={k}><div className="text-xs text-gray-400">{k}</div><div className="font-semibold text-gray-900">{v}</div></div>
              ))}
            </div>
            <div className="flex gap-4 text-xs text-gray-500 pt-1 border-t border-gray-100">
              <span>Inicio: {r.startDate}</span>
              <span>Fin: {r.endDate ?? <span className="text-emerald-600 font-semibold">Vigente</span>}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="Nueva Tarifa" onClose={() => setShowModal(false)} wide>
          <div className="space-y-4">
            {/* Warning when overriding active rate */}
            {hasActive && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <span className="text-amber-500 mt-0.5 flex-shrink-0"><IcoAlert /></span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Tarifa vigente existente</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    La categoría <strong>{form.category}</strong> ya tiene una tarifa activa. Al guardar esta nueva tarifa, la anterior quedará marcada automáticamente como <strong>histórica/inactiva</strong> con fecha de cierre igual a ayer.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Categoría">
                  <select className={selectCls} value={form.category} onChange={(e) => setF("category", e.target.value)}>
                    <option value="">Seleccionar…</option>
                    {categories.filter((c) => c.active).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Precio por semana"><input type="number" className={inputCls} value={form.priceWeek} onChange={(e) => setF("priceWeek", e.target.value)} placeholder="85000" /></Field>
              <Field label="Precio por mes"><input type="number" className={inputCls} value={form.priceMonth} onChange={(e) => setF("priceMonth", e.target.value)} placeholder="280000" /></Field>
              <Field label="Precio día único"><input type="number" className={inputCls} value={form.priceDay} onChange={(e) => setF("priceDay", e.target.value)} placeholder="15000" /></Field>
              <Field label="Precio día extra"><input type="number" className={inputCls} value={form.priceDayExtra} onChange={(e) => setF("priceDayExtra", e.target.value)} placeholder="12000" /></Field>
              <div className="sm:col-span-2">
                <Field label="Fecha de inicio vigencia">
                  <input type="date" className={inputCls} value={form.startDate} onChange={(e) => setF("startDate", e.target.value)} />
                </Field>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
            <button onClick={() => {
              const today = new Date(); today.setDate(today.getDate() - 1);
              const yesterday = today.toISOString().slice(0, 10);
              setRates((prev) => [
                ...prev.map((r) => r.category === form.category && r.active ? { ...r, active: false, endDate: yesterday } : r),
                { id: `r${Date.now()}`, category: form.category, priceWeek: +form.priceWeek, priceMonth: +form.priceMonth, priceDay: +form.priceDay, priceDayExtra: +form.priceDayExtra, startDate: form.startDate, endDate: null, active: true },
              ]);
              setShowModal(false);
            }} className="px-5 py-2 text-sm font-bold bg-[#ffbc07] text-[#102c4d] rounded-lg hover:bg-[#e5a800] transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
              Crear Tarifa
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Maintenances ───────────────────────────────────────────────────────────────

function MaintenancesView() {
  const [records, setRecords] = useState<MaintenanceRecord[]>(MAINTENANCE_INIT);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ assetId: "", date: "", description: "", cost: "" });
  const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = records.filter(
    (r) => !search || r.assetName.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase())
  );

  const alertAssets = ASSETS_INIT.filter((a) => {
    const dueIn = maintenanceDueIn(a.lastMaintenance);
    return dueIn <= 45;
  });

  const selectedAsset = ASSETS_INIT.find((a) => a.id === form.assetId);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#102c4d] font-bold text-xl" style={{ fontFamily: "Outfit, sans-serif" }}>Mantenimientos</h2>
          <p className="text-gray-400 text-sm">{records.length} registros · ciclo de revisión: 5 meses</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#ffbc07] text-[#102c4d] font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-[#e5a800] transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
          <IcoPlus /> Registrar Mantenimiento
        </button>
      </div>

      {/* Maintenance alerts banner */}
      {alertAssets.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-amber-500 mt-0.5 flex-shrink-0"><IcoWrench /></span>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800 mb-2">{alertAssets.length} activo(s) próximos a vencer ciclo de mantenimiento</p>
              <div className="flex flex-wrap gap-2">
                {alertAssets.map((a) => {
                  const d = maintenanceDueIn(a.lastMaintenance);
                  const b = maintBadge(d)!;
                  return (
                    <span key={a.id} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${b.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                      {a.code} — {d <= 0 ? "¡Vencido!" : `${d}d restantes`}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><IcoSearch /></span>
        <input className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#102c4d] shadow-sm" placeholder="Buscar por activo o descripción…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Activo", "Fecha", "Descripción", "Costo"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((m) => {
              const asset = ASSETS_INIT.find((a) => a.id === m.assetId);
              const dueIn = asset ? maintenanceDueIn(asset.lastMaintenance) : 999;
              const badge = maintBadge(dueIn);
              return (
                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#102c4d] bg-blue-50 px-2 py-0.5 rounded">{asset?.code}</span>
                      {badge && <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${badge.cls}`}><IcoAlert />{badge.label}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{asset?.name}</div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">{m.date}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-700 max-w-xs">{m.description}</td>
                  <td className="px-4 py-3.5 font-semibold text-gray-900 whitespace-nowrap">{fmt(m.cost)}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={4} className="text-center py-12 text-gray-400 text-sm">Sin registros.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((m) => {
          const asset = ASSETS_INIT.find((a) => a.id === m.assetId);
          const dueIn = asset ? maintenanceDueIn(asset.lastMaintenance) : 999;
          const badge = maintBadge(dueIn);
          return (
            <div key={m.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-semibold text-[#102c4d] bg-blue-50 px-2 py-0.5 rounded">{asset?.code}</span>
                {badge && <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${badge.cls}`}><IcoAlert />{badge.label}</span>}
              </div>
              <div className="text-sm font-medium text-gray-900">{asset?.name}</div>
              <div className="text-xs text-gray-600">{m.description}</div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <span className="text-xs text-gray-400">{m.date}</span>
                <span className="font-bold text-[#102c4d] text-sm">{fmt(m.cost)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="Registrar Mantenimiento" onClose={() => setShowModal(false)} wide>
          <div className="space-y-4">
            <Field label="Activo">
              <select className={selectCls} value={form.assetId} onChange={(e) => setF("assetId", e.target.value)}>
                <option value="">Seleccionar activo…</option>
                {ASSETS_INIT.filter((a) => a.active).map((a) => {
                  const dueIn = maintenanceDueIn(a.lastMaintenance);
                  const urgent = dueIn <= 20;
                  return (
                    <option key={a.id} value={a.id}>
                      {urgent ? "⚠ " : ""}{a.code} — {a.name} {urgent ? `(vence en ${dueIn}d)` : ""}
                    </option>
                  );
                })}
              </select>
              {selectedAsset && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  <span>Último mant.:</span>
                  <span className="font-semibold text-gray-700">{selectedAsset.lastMaintenance}</span>
                  <span>·</span>
                  <span>Días restantes:</span>
                  <span className={`font-bold ${maintenanceDueIn(selectedAsset.lastMaintenance) <= 20 ? "text-red-600" : "text-emerald-600"}`}>
                    {maintenanceDueIn(selectedAsset.lastMaintenance)}d
                  </span>
                </div>
              )}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fecha">
                <input type="date" className={inputCls} value={form.date} onChange={(e) => setF("date", e.target.value)} />
              </Field>
              <Field label="Costo (CLP)">
                <input type="number" className={inputCls} value={form.cost} onChange={(e) => setF("cost", e.target.value)} placeholder="45000" />
              </Field>
            </div>
            <Field label="Descripción del trabajo">
              <textarea className={inputCls + " resize-none"} rows={3} value={form.description} onChange={(e) => setF("description", e.target.value)} placeholder="Describe el mantenimiento realizado…" />
            </Field>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
            <button onClick={() => {
              if (!form.assetId || !form.date || !form.description) return;
              const asset = ASSETS_INIT.find((a) => a.id === form.assetId)!;
              setRecords((prev) => [{ id: `m${Date.now()}`, assetId: form.assetId, assetName: `${asset.code} — ${asset.name}`, date: form.date, description: form.description, cost: +form.cost }, ...prev]);
              setShowModal(false);
              setForm({ assetId: "", date: "", description: "", cost: "" });
            }} className="px-5 py-2 text-sm font-bold bg-[#ffbc07] text-[#102c4d] rounded-lg hover:bg-[#e5a800] transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
              Guardar Registro
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Tab bar for Assets sub-module ─────────────────────────────────────────────

type AssetTab = "list" | "categories" | "rates" | "maintenances";

const assetTabs: { id: AssetTab; label: string }[] = [
  { id: "list", label: "Activos" },
  { id: "categories", label: "Categorías" },
  { id: "rates", label: "Tarifas" },
  { id: "maintenances", label: "Mantenimientos" },
];

export default function AssetsModule() {
  const [categories, setCategories] = useState<Category[]>(CATEGORIES_INIT);
  const [maintenances] = useState<MaintenanceRecord[]>(MAINTENANCE_INIT);
  const [tab, setTab] = useState<AssetTab>("list");

  void setCategories; // used by sub-views via prop

  return (
    <div className="flex flex-col h-full">
      {/* Sub-nav tabs */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6">
        <div className="flex gap-1 overflow-x-auto">
          {assetTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors ${tab === t.id ? "border-[#ffbc07] text-[#102c4d]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "list" && <AssetsList categories={categories} maintenances={maintenances} />}
        {tab === "categories" && <CategoriesView />}
        {tab === "rates" && <RatesView categories={categories} />}
        {tab === "maintenances" && <MaintenancesView />}
      </div>
    </div>
  );
}
