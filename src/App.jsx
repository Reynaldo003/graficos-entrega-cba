// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  X,
  CarFront,
  CalendarDays,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Loader2,
  Phone,
  UserStar,
  Hash,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  TableProperties,
  BarChart3,
  RefreshCcw,
  Palette,
  Trophy,
  Gauge,
  Activity,
  Timer,
  CalendarCheck2,
  UserRound,
  ClipboardList,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

import { apiEntregas } from "./lib/apiEntregas";

const DEFAULT_DEALER = "VW Cordoba";
const BRAND_BLUE = "#131E5C";
const SKY = "#0EA5E9";
const EMERALD = "#059669";
const AMBER = "#D97706";
const SLATE = "#64748B";

const HOURS = Array.from(
  { length: 9 },
  (_, index) => `${String(index + 10).padStart(2, "0")}:00`
);

const PIE_COLORS = [EMERALD, AMBER];

function normalizeStr(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return normalizeStr(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function sameDealer(value) {
  return normalizeKey(value) === normalizeKey(DEFAULT_DEALER);
}

function entregaFisicaActiva(value) {
  if (value === true || value === 1) return true;

  const v = normalizeKey(value);

  return ["si", "sí", "true", "1", "yes", "entregada", "reportada"].includes(v);
}

function Skeleton({ className = "" }) {
  return (
    <div
      className={["animate-pulse rounded-md bg-black/10", className].join(" ")}
    />
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 11 }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <div className="h-4 w-28 rounded bg-slate-200/70" />
        </td>
      ))}
    </tr>
  );
}

function toYMDLocal(dateLike) {
  const date = new Date(dateLike);

  if (Number.isNaN(date.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

function parseYMDLocal(ymd) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return new Date();

  const [year, month, day] = ymd.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function ymdToInt(ymd) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;

  return Number(ymd.replaceAll("-", ""));
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);

  return d;
}

function startOfWeekMonday(date) {
  const d = new Date(date);
  const jsDay = d.getDay();
  const deltaToMonday = (jsDay + 6) % 7;

  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - deltaToMonday);

  return d;
}

function formatWeekTitle(startDate, endDate) {
  const start = startDate.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
  });

  const end = endDate.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `${start} — ${end}`;
}

function weekdayShortEs(dateObj) {
  const map = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return map[dateObj.getDay()] || "";
}

function formatCardTime(dateLike) {
  if (!dateLike) return "—";

  const date = new Date(dateLike);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(dateLike) {
  if (!dateLike) return "—";

  const date = new Date(dateLike);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getHourKey(dateLike) {
  if (!dateLike) return "";

  const date = new Date(dateLike);

  if (Number.isNaN(date.getTime())) return "";

  return `${String(date.getHours()).padStart(2, "0")}:00`;
}

function getMonthKey(dateLike) {
  if (!dateLike) return "";

  const date = new Date(dateLike);

  if (Number.isNaN(date.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function formatShortDate(ymd) {
  if (!ymd) return "Sin fecha";

  const date = parseYMDLocal(ymd);

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
  });
}

function getWeekdayName(dateLike) {
  if (!dateLike) return "Sin fecha";

  const date = new Date(dateLike);

  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleDateString("es-MX", {
    weekday: "long",
  });
}

function countBy(rows, getKey, labelKey = "name") {
  const map = {};

  for (const row of rows) {
    const key = normalizeStr(getKey(row)) || "Sin capturar";

    if (!map[key]) {
      map[key] = {
        [labelKey]: key,
        total: 0,
      };
    }

    map[key].total += 1;
  }

  return Object.values(map).sort((a, b) => b.total - a.total);
}

function FilterBlock({ label, children }) {
  return (
    <div className="rounded-lg">
      <div className="mb-2 text-xs font-extrabold uppercase tracking-wide text-[#131E5C]">
        {label}
      </div>

      {children}
    </div>
  );
}

function ViewButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-black transition",
        active
          ? "bg-[#131E5C] text-white"
          : "bg-white text-[#131E5C] hover:bg-slate-100",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function StatusBadge({ row, compact = false }) {
  const entregada = entregaFisicaActiva(row?.entrega_reportada);

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border font-extrabold",
        compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
        entregada
          ? "border-emerald-300 bg-emerald-100 text-emerald-800"
          : "border-amber-300 bg-amber-100 text-amber-800",
      ].join(" ")}
      title={entregada ? "Entrega física realizada" : "Entrega física pendiente"}
    >
      {entregada ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <Clock3 className="h-3.5 w-3.5" />
      )}

      {compact ? (entregada ? "Sí" : "No") : entregada ? "Entregada" : "Pendiente"}
    </span>
  );
}

function EntregaAgendaCard({ row, compact = false }) {
  const entregada = entregaFisicaActiva(row?.entrega_reportada);
  const nombreCliente = row?.cliente?.nombre || "Sin nombre";
  const telefonoCliente = row?.cliente?.telefono || "—";
  const modelo = row?.modelo_version || "Modelo sin capturar";
  const version = row?.version ? ` • ${row.version}` : "";
  const color = row?.color || "";
  const asesor = row?.asesor_ventas || "Asesor sin capturar";
  const preparadaPor = row?.preparada_por || "";

  return (
    <div
      className={[
        "relative w-full overflow-hidden rounded-lg border text-left shadow-sm transition hover:-translate-y-[1px] hover:shadow-md",
        compact ? "p-2" : "p-3",
        entregada
          ? "border-emerald-300 bg-emerald-50/95"
          : "border-sky-200 bg-sky-50/95",
      ].join(" ")}
    >
      <span
        className={[
          "absolute bottom-0 left-0 top-0 flex w-2 items-center justify-center",
          entregada ? "bg-emerald-500" : "bg-slate-200",
        ].join(" ")}
      />

      <div className="pl-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5 text-[10px] font-black text-[#131E5C]">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />

              <span className="shrink-0">
                {formatCardTime(row.fecha_hora_entrega)}
              </span>
            </div>

            <div className="mt-1 line-clamp-2 text-[11px] font-black uppercase leading-tight tracking-wide text-[#131E5C]">
              {nombreCliente}
            </div>
          </div>

          <StatusBadge row={row} compact />
        </div>

        <div className="mt-2 grid gap-1 text-[10px] font-semibold leading-tight text-slate-600">
          <div className="flex min-w-0 items-center gap-1.5">
            <CarFront className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
            <span className="truncate">
              {modelo}
              {version}
            </span>
          </div>

          {color ? (
            <div className="flex min-w-0 items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
              <span className="truncate">{color}</span>
            </div>
          ) : null}

          <div className="flex min-w-0 items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
            <span className="truncate">{row.vin || "VIN sin capturar"}</span>
          </div>

          <div className="flex min-w-0 items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
            <span className="truncate">{telefonoCliente}</span>
          </div>

          <div className="flex min-w-0 items-center gap-1.5">
            <UserStar className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
            <span className="truncate">{asesor}</span>
          </div>

          {preparadaPor ? (
            <div className="flex min-w-0 items-center gap-1.5">
              <CalendarCheck2 className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
              <span className="truncate">Preparada por: {preparadaPor}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AgendaMobileList({ rows, loading }) {
  const grouped = useMemo(() => {
    const map = new Map();

    for (const row of rows) {
      const key = row.fecha_hora_entrega
        ? toYMDLocal(row.fecha_hora_entrega)
        : "sin-fecha";

      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    }

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  if (loading) {
    return (
      <div className="grid gap-3 lg:hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-black/10 bg-white p-4 shadow-sm"
          >
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-3 h-4 w-28" />
            <Skeleton className="mt-3 h-4 w-56" />
            <Skeleton className="mt-4 h-8 w-24 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm font-semibold text-[#131E5C] lg:hidden">
        No hay entregas en esta semana o con esos filtros.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:hidden">
      {grouped.map(([key, items]) => {
        const title =
          key === "sin-fecha"
            ? "Sin fecha"
            : parseYMDLocal(key).toLocaleDateString("es-MX", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            });

        return (
          <section
            key={key}
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-[#131E5C]">
              {title}
            </h3>

            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((row) => (
                <EntregaAgendaCard key={row.id} row={row} compact />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function AgendaWeekView({ rows, loading, currentWeekDate, setCurrentWeekDate }) {
  const weekStart = useMemo(
    () => startOfWeekMonday(currentWeekDate),
    [currentWeekDate]
  );

  const weekDays = useMemo(
    () => Array.from({ length: 6 }, (_, index) => addDays(weekStart, index)),
    [weekStart]
  );

  const weekEnd = weekDays[weekDays.length - 1];
  const todayIso = toYMDLocal(new Date());

  const rowsBySlot = useMemo(() => {
    const map = new Map();

    for (const row of rows) {
      if (!row.fecha_hora_entrega) continue;

      const dayKey = toYMDLocal(row.fecha_hora_entrega);
      const hourKey = getHourKey(row.fecha_hora_entrega);
      const key = `${dayKey}|${hourKey}`;

      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    }

    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          new Date(a.fecha_hora_entrega).getTime() -
          new Date(b.fecha_hora_entrega).getTime()
      );
    }

    return map;
  }, [rows]);

  const outOfScheduleRows = useMemo(() => {
    return rows.filter((row) => {
      if (!row.fecha_hora_entrega) return true;

      const hour = getHourKey(row.fecha_hora_entrega);

      return !HOURS.includes(hour);
    });
  }, [rows]);

  const gridStyle = useMemo(
    () => ({
      gridTemplateColumns: `60px repeat(${HOURS.length}, minmax(0, 1fr))`,
    }),
    []
  );

  const goPrevWeek = () => setCurrentWeekDate((prev) => addDays(prev, -7));
  const goNextWeek = () => setCurrentWeekDate((prev) => addDays(prev, 7));
  const goToday = () => setCurrentWeekDate(new Date());

  return (
    <div className="hidden lg:block">
      <div className="mb-3 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500">Semana</div>

          <div className="truncate text-sm font-black text-[#131E5C]">
            {formatWeekTitle(weekStart, weekEnd)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goPrevWeek}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#131E5C] hover:bg-slate-50"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={goToday}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-xs font-black text-[#131E5C] hover:bg-[#131E5C] hover:text-white"
          >
            Semana
          </button>

          <button
            type="button"
            onClick={goNextWeek}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#131E5C] hover:bg-slate-50"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid w-full" style={gridStyle}>
          <div className="border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
            Día / Hora
          </div>

          {HOURS.map((hour) => (
            <div
              key={hour}
              className="border-b border-l border-slate-200 bg-slate-50 px-2 py-3 text-center"
            >
              <span className="inline-flex rounded-lg bg-[#131E5C]/10 px-2.5 py-1 text-[12px] font-black text-[#131E5C]">
                {hour}
              </span>
            </div>
          ))}

          {loading ? (
            <>
              {weekDays.map((day) => {
                const dayKey = toYMDLocal(day);

                return (
                  <div key={`loader-${dayKey}`} className="contents">
                    <div className="border-b border-r border-dashed border-slate-200 bg-white px-3 py-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="mt-2 h-3 w-14" />
                    </div>

                    {HOURS.map((hour) => (
                      <div
                        key={`${dayKey}-${hour}`}
                        className="min-h-[130px] border-b border-l border-dashed border-slate-200 p-1.5"
                      >
                        <Skeleton className="h-28 w-full rounded-lg" />
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ) : (
            weekDays.map((day) => {
              const dayKey = toYMDLocal(day);
              const isToday = dayKey === todayIso;

              return (
                <div key={dayKey} className="contents">
                  <div
                    className={[
                      "border-b border-r border-dashed border-slate-200 px-3 py-4"
                    ].join(" ")}
                  >

                    <div
                      className={[
                        "mt-1 text-[11px] font-bold capitalize",
                        isToday ? "text-blue-500" : "text-black-500",
                      ].join(" ")}
                    >
                      {day.toLocaleDateString("es-MX", {
                        weekday: "long",
                      })}
                    </div>

                    <div className="mt-1 text-sm font-black">
                      {day.toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </div>
                  </div>

                  {HOURS.map((hour) => {
                    const slotKey = `${dayKey}|${hour}`;
                    const items = rowsBySlot.get(slotKey) || [];
                    const visibleItems = items.slice(0, 1);
                    const hiddenCount = items.length - visibleItems.length;

                    return (
                      <div
                        key={slotKey}
                        className="relative min-h-[130px] border-b border-l border-dashed border-slate-200 bg-white/80 p-1.5 transition hover:bg-slate-50"
                      >
                        <div className="grid gap-1.5">
                          {visibleItems.map((row) => (
                            <EntregaAgendaCard
                              key={row.id}
                              row={row}
                              compact
                            />
                          ))}

                          {hiddenCount > 0 ? (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-[10px] font-black text-[#131E5C]">
                              +{hiddenCount} entrega
                              {hiddenCount === 1 ? "" : "s"}
                            </div>
                          ) : null}
                        </div>

                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>

      {!loading && outOfScheduleRows.length ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="mb-2 text-xs font-black uppercase tracking-wide text-amber-800">
            Entregas sin hora o fuera del rango 10:00 - 18:00
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {outOfScheduleRows.map((row) => (
              <EntregaAgendaCard key={row.id} row={row} compact />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GraphCard({ title, icon: Icon, children, className = "" }) {
  return (
    <div
      className={[
        "min-w-0 overflow-hidden rounded-xl border border-black/10 bg-white p-3 shadow-sm",
        "transition-all duration-200 hover:-translate-y-[2px] hover:shadow-lg",
        "sm:p-4",
        className,
      ].join(" ")}
    >
      <div className="mb-3 flex min-w-0 items-center gap-2 text-xs font-extrabold text-[#131E5C] sm:text-sm">
        {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
        <span className="truncate">{title}</span>
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

function KpiCard({ label, value, color, bg, detail }) {
  return (
    <div
      className={[
        "cursor-default select-none rounded-xl border border-black/10 p-4",
        "transition-all duration-200 hover:-translate-y-[2px] hover:shadow-lg",
        bg,
      ].join(" ")}
    >
      <div className="mb-1 text-xs font-bold text-slate-500">{label}</div>

      <div className={`text-3xl font-extrabold ${color}`}>{value}</div>

      {detail ? (
        <div className="mt-2 text-xs font-bold text-blue-500">{detail}</div>
      ) : null}
    </div>
  );
}

function GraphBar({ label, value, max, color, total }) {
  const [hovered, setHovered] = useState(false);
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const pctTotal = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div
      className="relative flex cursor-default items-center gap-2 rounded-lg px-2 py-1 transition-colors duration-150"
      style={{ background: hovered ? "rgba(19,30,92,0.05)" : "transparent" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered ? (
        <div className="pointer-events-none absolute left-1/2 -top-9 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#131E5C] px-3 py-1.5 text-xs font-bold text-white shadow-xl">
          {label ? <span className="mr-1">{label}:</span> : null}
          {value} entrega{value !== 1 ? "s" : ""}{" "}
          {total > 0 ? `(${pctTotal}%)` : ""}
          <div className="absolute left-1/2 -bottom-1.5 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-[#131E5C]" />
        </div>
      ) : null}

      <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%`, opacity: hovered ? 1 : 0.85 }}
        />
      </div>

      <span
        className={[
          "w-8 text-right text-xs font-bold transition-colors",
          hovered ? "text-[#131E5C]" : "text-slate-500",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function GraphColBar({ dia, cnt, pct, hovered, onEnter, onLeave }) {
  return (
    <div
      className="flex flex-1 cursor-default flex-col items-center gap-1"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <span
        className={[
          "text-xs font-bold transition-colors",
          hovered ? "text-[#131E5C]" : "text-transparent",
        ].join(" ")}
      >
        {cnt}
      </span>

      <div
        className="relative flex w-full items-end rounded-t-md bg-[#131E5C]/10"
        style={{ height: "82px" }}
      >
        <div
          className="w-full rounded-t-md transition-all duration-500"
          style={{
            height: `${pct}%`,
            minHeight: cnt > 0 ? "4px" : "0",
            background: hovered ? "#131E5C" : "rgba(19,30,92,0.6)",
          }}
        />

        {hovered && cnt > 0 ? (
          <div className="pointer-events-none absolute -top-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#131E5C] px-2 py-1 text-xs font-bold text-white shadow-xl">
            {cnt} entrega{cnt !== 1 ? "s" : ""}
            <div className="absolute left-1/2 -bottom-1.5 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-[#131E5C]" />
          </div>
        ) : null}
      </div>

      <span
        className={[
          "text-xs font-semibold transition-colors",
          hovered ? "font-extrabold text-[#131E5C]" : "text-slate-500",
        ].join(" ")}
      >
        {dia}
      </span>
    </div>
  );
}

function ReconocimientoGraph({ chartData, highlights }) {
  const topAsesor = chartData?.porAsesor?.[0];
  const asesor = topAsesor?.asesor || "Sin datos";
  const total = topAsesor?.total || 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#131E5C]/10 p-5 text-white shadow-xl md:col-span-2 xl:col-span-3">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 left-10 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="pointer-events-none absolute right-5 top-5">
        <span className="absolute h-3 w-3 animate-ping rounded-full bg-yellow-300" />
        <span className="relative block h-3 w-3 rounded-full bg-yellow-300" />
      </div>

      <div className="pointer-events-none absolute right-20 top-12 h-2 w-2 animate-bounce rounded-full bg-emerald-300" />
      <div className="pointer-events-none absolute right-32 top-7 h-2 w-2 animate-pulse rounded-full bg-sky-300" />
      <div className="pointer-events-none absolute bottom-8 right-16 h-2 w-2 animate-bounce rounded-full bg-pink-300" />

      <div className="relative grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-[#131E5C] shadow-lg">
          <Trophy className="h-9 w-9 animate-bounce text-yellow-300" />
        </div>

        <div className="min-w-0">

          <h2 className="mt-3 text-2xl text-[#131E5C] font-black leading-tight sm:text-3xl">
            {asesor}
          </h2>

          <p className="mt-1 text-base font-bold text-[#131E5C]">
            Lidera con{" "}
            <span className="font-black bg-[#131E5C] rounded-full pl-3 pr-3 text-yellow-300">
              {total} entrega{total !== 1 ? "s" : ""}
            </span>
            . Excelente seguimiento comercial y compromiso operativo.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/10 p-3">
            <div className="text-[11px] font-bold text-[#131E5C]">Top modelo</div>
            <div className="mt-1 line-clamp-1 text-sm text-[#131E5C] font-black">
              {highlights.topModelo}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/10 p-3">
            <div className="text-[11px] font-bold text-[#131E5C]">Hora pico</div>
            <div className="mt-1 text-sm text-[#131E5C] font-black">{highlights.horaPico}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/10 p-3">
            <div className="text-[11px] font-bold text-[#131E5C]">Día pico</div>
            <div className="mt-1 text-sm text-[#131E5C] font-black">{highlights.diaPico}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/10 p-3">
            <div className="text-[11px] font-bold text-[#131E5C]">Top asesor</div>
            <div className="mt-1 line-clamp-1 text-sm text-[#131E5C] font-black">
              {highlights.topAsesor}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GraphList({
  title,
  icon: Icon,
  items,
  labelKey,
  colors,
  total,
  emptyText = "Sin datos",
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const visibleItems = items || [];
  const max = Math.max(...visibleItems.map((item) => item.total || 0), 1);

  return (
    <GraphCard title={title} icon={Icon}>
      {visibleItems.length ? (
        <div className="w-full max-w-full overflow-x-auto overflow-y-visible overscroll-x-contain pb-2 [scrollbar-width:thin]">
          <div
            className="flex min-h-[175px] items-end gap-2 pr-2 sm:min-h-[195px] sm:gap-3"
            style={{
              minWidth: `max(100%, ${visibleItems.length * 52}px)`,
            }}
          >
            {visibleItems.map((item, index) => {
              const label = item?.[labelKey] || "Sin capturar";
              const value = item.total || 0;
              const pct = max > 0 ? Math.round((value / max) * 100) : 0;
              const pctTotal =
                total > 0 ? Math.round((value / total) * 100) : 0;
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={`${title}-${label}-${index}`}
                  className="relative flex w-[42px] shrink-0 cursor-default flex-col items-center gap-2 sm:w-[56px]"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {isHovered ? (
                    <div className="pointer-events-none absolute -top-10 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#131E5C] px-3 py-1.5 text-xs font-bold text-white shadow-xl">
                      {label}: {value} entrega{value !== 1 ? "s" : ""}{" "}
                      {total > 0 ? `(${pctTotal}%)` : ""}
                      <div className="absolute left-1/2 -bottom-1.5 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-[#131E5C]" />
                    </div>
                  ) : null}

                  <span
                    className={[
                      "text-[11px] font-black transition-colors sm:text-xs",
                      isHovered ? "text-[#131E5C]" : "text-slate-500",
                    ].join(" ")}
                  >
                    {value}
                  </span>

                  <div className="flex h-[105px] w-full items-end rounded-t-lg bg-slate-100 sm:h-[125px]">
                    <div
                      className={[
                        "w-full rounded-t-lg transition-all duration-500",
                        colors[index % colors.length],
                      ].join(" ")}
                      style={{
                        height: `${pct}%`,
                        minHeight: value > 0 ? "6px" : "0px",
                        opacity: isHovered ? 1 : 0.85,
                      }}
                    />
                  </div>

                  <span
                    className={[
                      "line-clamp-2 min-h-[28px] w-full text-center text-[9px] font-bold leading-tight transition-colors sm:text-[10px]",
                      isHovered ? "text-[#131E5C]" : "text-slate-500",
                    ].join(" ")}
                    title={label}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="px-2 text-xs text-slate-400">{emptyText}</div>
      )}
    </GraphCard>
  );
}
function EstadoGraph({ stats }) {
  const estados = [
    {
      label: "Entregadas",
      value: stats.entregadas,
      dot: "bg-emerald-500",
      bar: "bg-emerald-500",
    },
    {
      label: "Pendientes",
      value: stats.pendientes,
      dot: "bg-red-500",
      bar: "bg-red-500",
    },
  ];

  return (
    <GraphCard title="Entregadas / pendientes" icon={CalendarCheck2}>
      <div className="grid gap-3">
        {estados.map((item) => {
          const pct =
            stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;

          return (
            <div
              key={item.label}
              className="group rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                  <span className="text-xs font-black text-[#131E5C]">
                    {item.label}
                  </span>
                </div>

                <span className="text-lg font-black text-[#131E5C]">
                  {item.value}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <span className="w-10 text-right text-xs font-black text-slate-500">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </GraphCard>
  );
}

function DiaSemanaGraph({ chartData }) {
  const [hoveredDia, setHoveredDia] = useState(null);

  const dias = [
    { short: "Lun", long: "lunes" },
    { short: "Mar", long: "martes" },
    { short: "Mié", long: "miércoles" },
    { short: "Jue", long: "jueves" },
    { short: "Vie", long: "viernes" },
    { short: "Sáb", long: "sábado" },
    { short: "Dom", long: "domingo" },
  ];

  const rows = dias.map((dia) => {
    const match = (chartData.porDiaSemana || []).find((item) =>
      normalizeKey(item.dia).startsWith(normalizeKey(dia.long))
    );

    return {
      dia: dia.short,
      total: match?.total || 0,
    };
  });

  const maxDia = Math.max(...rows.map((item) => item.total), 1);

  return (
    <GraphCard title="Por día de la semana" icon={CalendarDays}>
      <div className="mt-2 flex items-end gap-2" style={{ height: "145px" }}>
        {rows.map((item) => {
          const pct = maxDia > 0 ? (item.total / maxDia) * 100 : 0;

          return (
            <GraphColBar
              key={item.dia}
              dia={item.dia}
              cnt={item.total}
              pct={pct}
              hovered={hoveredDia === item.dia}
              onEnter={() => setHoveredDia(item.dia)}
              onLeave={() => setHoveredDia(null)}
            />
          );
        })}
      </div>
    </GraphCard>
  );
}

function GraficosView({ stats, chartData, highlights }) {
  const MODELO_COLORS = [
    "bg-[#131E5C]",
    "bg-blue-600",
    "bg-blue-400",
    "bg-blue-300",
    "bg-sky-300",
    "bg-cyan-300",
    "bg-teal-300",
  ];

  const ASESOR_COLORS = [
    "bg-emerald-600",
    "bg-emerald-500",
    "bg-emerald-400",
    "bg-emerald-300",
    "bg-teal-400",
    "bg-teal-300",
    "bg-cyan-400",
    "bg-cyan-300",
  ];

  const HORA_COLORS = [
    "bg-violet-600",
    "bg-violet-500",
    "bg-violet-400",
    "bg-violet-300",
    "bg-purple-300",
    "bg-purple-200",
    "bg-indigo-300",
    "bg-indigo-200",
    "bg-blue-300",
    "bg-sky-300",
  ];

  const COLOR_COLORS = [
    "bg-slate-700",
    "bg-slate-600",
    "bg-slate-500",
    "bg-slate-400",
    "bg-blue-400",
    "bg-sky-300",
    "bg-cyan-300",
    "bg-teal-300",
  ];

  return (
    <div className="space-y-4">
      <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Total entregas"
          value={stats.total}
          color="text-[#131E5C]"
          bg="bg-[#131E5C]/5"
          detail={`Registros de ${DEFAULT_DEALER}`}
        />

        <KpiCard
          label="Entregadas"
          value={stats.entregadas}
          color="text-emerald-700"
          bg="bg-emerald-50"
          detail={`${stats.porcentaje}% de cumplimiento`}
        />

        <KpiCard
          label="Pendientes"
          value={stats.pendientes}
          color="text-red-600"
          bg="bg-red-50"
          detail={`${stats.proximas} próximas`}
        />

        <KpiCard
          label="% Entrega"
          value={`${stats.porcentaje}%`}
          color="text-blue-700"
          bg="bg-blue-50"
          detail={`${stats.entregadas} de ${stats.total}`}
        />
      </div>
      <ReconocimientoGraph chartData={chartData} highlights={highlights} />

      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-2">
        <EstadoGraph stats={stats} />

        <GraphList
          title="Por modelo"
          icon={CarFront}
          items={chartData.porModelo}
          labelKey="modelo"
          colors={MODELO_COLORS}
          total={stats.total}
          maxItems={5}
        />

        <DiaSemanaGraph chartData={chartData} />

        <GraphList
          title="Por asesor de ventas"
          icon={UserStar}
          items={chartData.porAsesor}
          labelKey="asesor"
          colors={ASESOR_COLORS}
          total={stats.total}
          maxItems={5}
        />

        <GraphList
          title="Por hora"
          icon={Timer}
          items={chartData.porHora}
          labelKey="hora"
          colors={HORA_COLORS}
          total={stats.total}
          maxItems={5}
        />

        <GraphList
          title="Por color"
          icon={Palette}
          items={chartData.porColor}
          labelKey="color"
          colors={COLOR_COLORS}
          total={stats.total}
          maxItems={5}
        />

        <GraphList
          title="Por versión"
          icon={ClipboardList}
          items={chartData.porVersion}
          labelKey="version"
          colors={MODELO_COLORS}
          total={stats.total}
          maxItems={5}
        />

        <GraphList
          title="Últimos días"
          icon={Activity}
          items={chartData.porDia}
          labelKey="dia"
          colors={HORA_COLORS}
          total={stats.total}
          maxItems={5}
        />
      </div>
    </div>
  );
}
export default function App() {
  const [entregas, setEntregas] = useState([]);
  const [ctxError, setCtxError] = useState("");
  const [viewMode, setViewMode] = useState("agenda");
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
  const [sort, setSort] = useState({
    key: "fecha_hora_entrega",
    dir: "desc",
  });

  const [filters, setFilters] = useState({
    q: "",
    rangoDesde: "",
    rangoHasta: "",
  });

  const [loadingList, setLoadingList] = useState(false);

  function toggleSort(key) {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };

      return {
        key,
        dir: prev.dir === "asc" ? "desc" : "asc",
      };
    });
  }

  const refreshList = async () => {
    setLoadingList(true);
    setCtxError("");

    try {
      const data = await apiEntregas.list();

      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      setEntregas(rows);
    } catch (error) {
      console.error(error);
      setEntregas([]);
      setCtxError(
        error?.message ||
        "No se pudieron cargar las entregas. Revisa permisos del backend."
      );
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    refreshList();
  }, []);

  const dealerRows = useMemo(() => {
    return (entregas || []).filter((item) => sameDealer(item.agencia));
  }, [entregas]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const desdeInt = ymdToInt(filters.rangoDesde);
    const hastaInt = ymdToInt(filters.rangoHasta);

    return dealerRows.filter((item) => {
      const nombreCliente = normalizeStr(item?.cliente?.nombre);
      const telCliente = normalizeStr(item?.cliente?.telefono);

      const matchQ =
        !q ||
        normalizeStr(item.agencia).toLowerCase().includes(q) ||
        nombreCliente.toLowerCase().includes(q) ||
        telCliente.toLowerCase().includes(q) ||
        normalizeStr(item.vin).toLowerCase().includes(q) ||
        normalizeStr(item.modelo_version).toLowerCase().includes(q) ||
        normalizeStr(item.version).toLowerCase().includes(q) ||
        normalizeStr(item.color).toLowerCase().includes(q) ||
        normalizeStr(item.asesor_ventas).toLowerCase().includes(q) ||
        normalizeStr(item.preparada_por).toLowerCase().includes(q) ||
        normalizeStr(item.id_cliente_sf_nadin).toLowerCase().includes(q) ||
        normalizeStr(item.id_cliente_sf_dms).toLowerCase().includes(q) ||
        normalizeStr(item.comentarios).toLowerCase().includes(q);

      let matchRango = true;

      if (desdeInt !== null || hastaInt !== null) {
        const ymdEntrega = item.fecha_hora_entrega
          ? toYMDLocal(item.fecha_hora_entrega)
          : "";
        const ymdInt = ymdToInt(ymdEntrega);

        if (!ymdInt) return false;

        if (desdeInt !== null && ymdInt < desdeInt) matchRango = false;
        if (hastaInt !== null && ymdInt > hastaInt) matchRango = false;
      }

      return matchQ && matchRango;
    });
  }, [dealerRows, filters]);

  const sorted = useMemo(() => {
    const data = [...filtered];
    const { key, dir } = sort || {};

    if (!key) return data;

    const mult = dir === "asc" ? 1 : -1;

    return data.sort((a, b) => {
      if (key === "fecha_hora_entrega") {
        const ta = a.fecha_hora_entrega
          ? new Date(a.fecha_hora_entrega).getTime()
          : 0;
        const tb = b.fecha_hora_entrega
          ? new Date(b.fecha_hora_entrega).getTime()
          : 0;

        return (ta - tb) * mult;
      }

      if (key === "cliente") {
        const va = normalizeStr(a?.cliente?.nombre).toLowerCase();
        const vb = normalizeStr(b?.cliente?.nombre).toLowerCase();

        if (va < vb) return -1 * mult;
        if (va > vb) return 1 * mult;

        return 0;
      }

      const va = normalizeStr(a?.[key]).toLowerCase();
      const vb = normalizeStr(b?.[key]).toLowerCase();

      if (va < vb) return -1 * mult;
      if (va > vb) return 1 * mult;

      return 0;
    });
  }, [filtered, sort]);

  const agendaRows = useMemo(() => {
    const weekStart = startOfWeekMonday(currentWeekDate);
    const weekEnd = addDays(weekStart, 5);
    const minInt = ymdToInt(toYMDLocal(weekStart));
    const maxInt = ymdToInt(toYMDLocal(weekEnd));

    return [...filtered]
      .filter((row) => {
        if (!row.fecha_hora_entrega) return true;

        const ymd = toYMDLocal(row.fecha_hora_entrega);
        const ymdInt = ymdToInt(ymd);

        if (!ymdInt) return false;

        return ymdInt >= minInt && ymdInt <= maxInt;
      })
      .sort((a, b) => {
        const ta = a.fecha_hora_entrega
          ? new Date(a.fecha_hora_entrega).getTime()
          : 0;
        const tb = b.fecha_hora_entrega
          ? new Date(b.fecha_hora_entrega).getTime()
          : 0;

        return ta - tb;
      });
  }, [filtered, currentWeekDate]);

  const stats = useMemo(() => {
    const total = sorted.length;
    const entregadas = sorted.filter((row) =>
      entregaFisicaActiva(row.entrega_reportada)
    ).length;
    const pendientes = total - entregadas;
    const porcentaje = total ? Math.round((entregadas / total) * 100) : 0;
    const hoy = toYMDLocal(new Date());
    const mesActual = getMonthKey(new Date());

    const entregasHoy = sorted.filter(
      (row) => toYMDLocal(row.fecha_hora_entrega) === hoy
    ).length;

    const entregasMes = sorted.filter(
      (row) => getMonthKey(row.fecha_hora_entrega) === mesActual
    ).length;

    const sinFecha = sorted.filter((row) => !row.fecha_hora_entrega).length;

    const proximas = sorted.filter((row) => {
      if (!row.fecha_hora_entrega) return false;

      return (
        new Date(row.fecha_hora_entrega).getTime() >= Date.now() &&
        !entregaFisicaActiva(row.entrega_reportada)
      );
    }).length;

    const diasConEntrega = new Set(
      sorted.map((row) => toYMDLocal(row.fecha_hora_entrega)).filter(Boolean)
    );

    const promedioDiario =
      diasConEntrega.size > 0 ? (total / diasConEntrega.size).toFixed(1) : "0";

    return {
      total,
      entregadas,
      pendientes,
      porcentaje,
      entregasHoy,
      entregasMes,
      sinFecha,
      proximas,
      promedioDiario,
    };
  }, [sorted]);

  const chartData = useMemo(() => {
    const entregasEstado = [
      { name: "Entregadas", value: stats.entregadas },
      { name: "Pendientes", value: stats.pendientes },
    ];

    const porDiaMap = {};

    for (const row of sorted) {
      const ymd = toYMDLocal(row.fecha_hora_entrega) || "sin-fecha";
      const label = ymd === "sin-fecha" ? "Sin fecha" : formatShortDate(ymd);

      if (!porDiaMap[ymd]) {
        porDiaMap[ymd] = {
          ymd,
          dia: label,
          total: 0,
          entregadas: 0,
          pendientes: 0,
        };
      }

      porDiaMap[ymd].total += 1;

      if (entregaFisicaActiva(row.entrega_reportada)) {
        porDiaMap[ymd].entregadas += 1;
      } else {
        porDiaMap[ymd].pendientes += 1;
      }
    }

    const porDia = Object.values(porDiaMap)
      .sort((a, b) => {
        if (a.ymd === "sin-fecha") return 1;
        if (b.ymd === "sin-fecha") return -1;

        return a.ymd.localeCompare(b.ymd);
      })
      .slice(-14);

    const porHoraMap = Object.fromEntries(
      HOURS.map((hora) => [hora, { hora, total: 0 }])
    );

    for (const row of sorted) {
      const hora = getHourKey(row.fecha_hora_entrega);

      if (!hora) continue;
      if (!porHoraMap[hora]) porHoraMap[hora] = { hora, total: 0 };

      porHoraMap[hora].total += 1;
    }

    const porHora = Object.values(porHoraMap).sort((a, b) =>
      a.hora.localeCompare(b.hora)
    );

    const porAsesor = countBy(
      sorted,
      (row) => row.asesor_ventas,
      "asesor"
    ).slice(0, 10);

    const porModelo = countBy(
      sorted,
      (row) => row.modelo_version,
      "modelo"
    ).slice(0, 10);

    const porVersion = countBy(sorted, (row) => row.version, "version").slice(
      0,
      10
    );

    const porColor = countBy(sorted, (row) => row.color, "color").slice(0, 10);

    const porDiaSemana = countBy(
      sorted,
      (row) => getWeekdayName(row.fecha_hora_entrega),
      "dia"
    );

    return {
      entregasEstado,
      porDia,
      porHora,
      porAsesor,
      porModelo,
      porVersion,
      porColor,
      porDiaSemana,
    };
  }, [sorted, stats]);

  const highlights = useMemo(() => {
    const topAsesor = chartData.porAsesor[0];
    const topModelo = chartData.porModelo[0];

    const horaPico = chartData.porHora[0]
      ? [...chartData.porHora].sort((a, b) => b.total - a.total)[0]
      : null;

    const diaPico = chartData.porDia[0]
      ? [...chartData.porDia].sort((a, b) => b.total - a.total)[0]
      : null;

    return {
      topAsesor: topAsesor
        ? `${topAsesor.asesor} (${topAsesor.total})`
        : "Sin datos",
      topModelo: topModelo
        ? `${topModelo.modelo} (${topModelo.total})`
        : "Sin datos",
      horaPico: horaPico ? `${horaPico.hora} (${horaPico.total})` : "Sin datos",
      diaPico: diaPico ? `${diaPico.dia} (${diaPico.total})` : "Sin datos",
    };
  }, [chartData]);

  const resetFilters = () => {
    setFilters({
      q: "",
      rangoDesde: "",
      rangoHasta: "",
    });

    setCurrentWeekDate(new Date());
  };

  const setHoy = () => {
    const hoy = toYMDLocal(new Date());

    setCurrentWeekDate(new Date());
    setFilters((prev) => ({ ...prev, rangoDesde: hoy, rangoHasta: hoy }));
  };

  const onChangeDateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));

    if (value) setCurrentWeekDate(parseYMDLocal(value));
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-100 p-3 sm:p-5 lg:p-7">
      <div className="mx-auto w-full max-w-[1800px] min-w-0">
        <header className="mb-5 rounded-lg bg-[#131E5C] px-5 py-6 shadow-lg sm:px-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black text-white sm:text-3xl">
                Entregas {DEFAULT_DEALER}
              </h1>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <div className="inline-flex overflow-hidden rounded-lg bg-white p-1">
                <ViewButton
                  active={viewMode === "agenda"}
                  onClick={() => setViewMode("agenda")}
                  icon={CalendarDays}
                  label="Agenda"
                />

                <ViewButton
                  active={viewMode === "tabla"}
                  onClick={() => setViewMode("tabla")}
                  icon={TableProperties}
                  label="Tabla"
                />

                <ViewButton
                  active={viewMode === "graficas"}
                  onClick={() => setViewMode("graficas")}
                  icon={BarChart3}
                  label="Gráficas"
                />
              </div>

              <button
                type="button"
                onClick={refreshList}
                disabled={loadingList}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-black text-[#131E5C] shadow-sm transition hover:bg-slate-100 disabled:opacity-60"
              >
                {loadingList ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}

                Actualizar
              </button>
            </div>
          </div>
        </header>

        {ctxError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {ctxError}
          </div>
        ) : null}

        <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-6">
              <FilterBlock label="Búsqueda">
                <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 transition focus-within:border-[#131E5C] focus-within:bg-white">
                  <Search className="h-4 w-4 text-[#131E5C]" />

                  <input
                    value={filters.q}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, q: e.target.value }))
                    }
                    placeholder="Buscar por cliente, teléfono, VIN, modelo, versión, color, asesor..."
                    className="w-full bg-transparent text-sm font-semibold text-[#131E5C] outline-none placeholder:text-slate-400"
                  />

                  {filters.q ? (
                    <button
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, q: "" }))
                      }
                      className="rounded-lg p-1 text-[#131E5C] hover:bg-slate-100 hover:text-red-500"
                      aria-label="Limpiar búsqueda"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </FilterBlock>
            </div>

            <div className="md:col-span-3">
              <FilterBlock label="Desde">
                <input
                  type="date"
                  value={filters.rangoDesde}
                  onChange={(e) =>
                    onChangeDateFilter("rangoDesde", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-[#131E5C] outline-none transition focus:border-[#131E5C] focus:bg-white"
                />
              </FilterBlock>
            </div>

            <div className="md:col-span-3">
              <FilterBlock label="Hasta">
                <input
                  type="date"
                  value={filters.rangoHasta}
                  onChange={(e) =>
                    onChangeDateFilter("rangoHasta", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-[#131E5C] outline-none transition focus:border-[#131E5C] focus:bg-white"
                />
              </FilterBlock>
            </div>

            <div className="md:col-span-12">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={setHoy}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <CalendarDays className="h-4 w-4" />
                  Hoy
                </button>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] bg-white px-4 py-2.5 text-sm font-bold text-[#131E5C] hover:bg-[#131E5C] hover:text-white"
                >
                  <X className="h-4 w-4" />
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>
        </section>

        {viewMode === "agenda" ? (
          <>
            <AgendaMobileList rows={agendaRows} loading={loadingList} />

            <AgendaWeekView
              rows={agendaRows}
              loading={loadingList}
              currentWeekDate={currentWeekDate}
              setCurrentWeekDate={setCurrentWeekDate}
            />
          </>
        ) : null}

        {viewMode === "tabla" ? (
          <div className="overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-slate-200">
            <div className="border-b border-slate-200 p-4">
              <h2 className="text-sm font-black uppercase tracking-wide text-[#131E5C]">
                Tabla de entregas
              </h2>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                Mostrando registros de {DEFAULT_DEALER}.
              </p>
            </div>

            <div className="overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#131E5C] text-xs text-white">
                  <tr>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("fecha_hora_entrega")}
                        className="inline-flex items-center gap-1 text-xs font-bold"
                      >
                        Fecha y hora
                        <span className="opacity-60">
                          {sort.key === "fecha_hora_entrega" ? (
                            sort.dir === "asc" ? (
                              <ChevronUp className="h-4" />
                            ) : (
                              <ChevronDown className="h-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4" />
                          )}
                        </span>
                      </button>
                    </th>

                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSort("cliente")}
                        className="inline-flex items-center gap-1 text-xs font-bold"
                      >
                        Cliente
                        <span className="opacity-60">
                          {sort.key === "cliente" ? (
                            sort.dir === "asc" ? (
                              <ChevronUp className="h-4" />
                            ) : (
                              <ChevronDown className="h-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4" />
                          )}
                        </span>
                      </button>
                    </th>

                    <th className="px-4 py-3">Teléfono</th>
                    <th className="px-4 py-3">VIN</th>
                    <th className="px-4 py-3">Modelo</th>
                    <th className="px-4 py-3">Versión</th>
                    <th className="px-4 py-3">Color</th>
                    <th className="px-4 py-3">Asesor ventas</th>
                    <th className="px-4 py-3">Entrega física</th>
                    <th className="px-4 py-3">Preparada por</th>
                    <th className="px-4 py-3">Comentarios</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loadingList ? (
                    <>
                      {Array.from({ length: 8 }).map((_, index) => (
                        <SkeletonRow key={index} />
                      ))}
                    </>
                  ) : (
                    <>
                      {sorted.map((row) => {
                        const nombreCliente = row?.cliente?.nombre || "—";
                        const telefonoCliente = row?.cliente?.telefono || "—";

                        return (
                          <tr key={row.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-[#131E5C]">
                              {formatDateTime(row.fecha_hora_entrega)}
                            </td>

                            <td className="px-4 py-3 font-bold text-[#131E5C]">
                              {nombreCliente}
                            </td>

                            <td className="px-4 py-3 text-[#131E5C]">
                              {telefonoCliente}
                            </td>

                            <td className="px-4 py-3 text-[#131E5C]">
                              {row.vin || "—"}
                            </td>

                            <td className="px-4 py-3 text-[#131E5C]">
                              {row.modelo_version || "—"}
                            </td>

                            <td className="px-4 py-3 text-[#131E5C]">
                              {row.version || "—"}
                            </td>

                            <td className="px-4 py-3 text-[#131E5C]">
                              {row.color || "—"}
                            </td>

                            <td className="px-4 py-3 text-[#131E5C]">
                              {row.asesor_ventas || "—"}
                            </td>

                            <td className="px-4 py-3">
                              <StatusBadge row={row} />
                            </td>

                            <td className="px-4 py-3 text-[#131E5C]">
                              {row.preparada_por || "—"}
                            </td>

                            <td className="px-4 py-3 text-[#131E5C]">
                              <span className="line-clamp-2">
                                {row.comentarios || "—"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {sorted.length === 0 ? (
                        <tr>
                          <td
                            colSpan={11}
                            className="px-4 py-10 text-center text-sm font-semibold text-[#131E5C]"
                          >
                            No hay resultados con esos filtros.
                          </td>
                        </tr>
                      ) : null}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {viewMode === "graficas" ? (
          <GraficosView
            stats={stats}
            chartData={chartData}
            highlights={highlights}
          />
        ) : null}
      </div>
    </div>
  );
}