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
  Layers3,
  TrendingUp,
  Activity,
  CalendarCheck2,
  Timer,
  Trophy,
  Gauge,
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

function sameDealer(value) {
  return normalizeStr(value).toLowerCase() === DEFAULT_DEALER.toLowerCase();
}

function entregaFisicaActiva(value) {
  if (value === true || value === 1) return true;

  const v = String(value ?? "").trim().toLowerCase();

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
  const map = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

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
    <div>
      <div className="mb-2 text-xs font-black uppercase tracking-wide text-[#131E5C]/75">
        {label}
      </div>

      {children}
    </div>
  );
}

function StatusButton({ row, compact = false }) {
  const entregada = entregaFisicaActiva(row?.entrega_reportada);

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border font-extrabold transition",
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

function ViewButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-black transition",
        active
          ? "bg-[#131E5C] text-white shadow-sm"
          : "text-[#131E5C] hover:bg-[#131E5C]/5",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function EntregaAgendaCard({ row, compact = false }) {
  const entregada = entregaFisicaActiva(row?.entrega_reportada);
  const nombreCliente = row?.cliente?.nombre || "Sin nombre";
  const telefonoCliente = row?.cliente?.telefono || "—";

  return (
    <div
      className={[
        "relative w-full overflow-hidden rounded-md border text-left shadow-sm transition hover:-translate-y-[1px] hover:shadow-md",
        compact ? "p-3" : "p-2.5",
        entregada
          ? "border-emerald-300 bg-emerald-50/95"
          : "border-sky-200 bg-sky-50/95",
      ].join(" ")}
      title="Entrega"
    >
      {entregada ? (
        <span className="absolute bottom-0 left-0 top-0 flex w-3 items-center justify-center rounded-l-md bg-emerald-500">
          <CheckCircle2 className="h-3 w-3 text-white" />
        </span>
      ) : null}

      <div className={entregada ? "pl-3" : ""}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#131E5C]">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{formatCardTime(row.fecha_hora_entrega)}</span>
              <span className="text-slate-400">•</span>
              <span className="truncate">{row.agencia || DEFAULT_DEALER || "Sin dealer"}</span>
            </div>

            <div className="mt-1 truncate text-xs font-black uppercase tracking-wide text-[#131E5C]">
              {nombreCliente}
            </div>
          </div>

          <StatusButton row={row} compact />
        </div>

        <div className="mt-2 grid gap-1 text-[10px] font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <CarFront className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
            <span className="truncate">
              {row.modelo_version || "Modelo sin capturar"}
              {row.version ? ` • ${row.version}` : ""}
            </span>
          </div>

          {row.color ? (
            <div className="flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
              <span className="truncate">{row.color}</span>
            </div>
          ) : null}

          <div className="flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
            <span className="truncate">{row.vin || "VIN sin capturar"}</span>
          </div>

          {!compact ? (
            <>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
                <span className="truncate">{telefonoCliente}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <UserStar className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
                <span className="truncate">
                  {row.asesor_ventas || "Asesor sin capturar"}
                </span>
              </div>
            </>
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

      if (!map.has(key)) {
        map.set(key, []);
      }

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
      gridTemplateColumns: `150px repeat(${HOURS.length}, minmax(170px, 1fr))`
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
            Hoy
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
        <div className="overflow-auto">
          <div className="min-w-[2350px]">
            <div
              className="sticky top-0 z-30 grid border-b border-slate-200 bg-slate-50"
              style={gridStyle}
            >
              <div className="sticky left-0 z-40 border-r border-slate-200 bg-slate-50 px-3 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                Día / Hora
              </div>

              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="border-l border-slate-200 px-3 py-3 text-center"
                >
                  <span className="inline-flex rounded-lg bg-[#131E5C]/10 px-3 py-1 text-xs font-black text-[#131E5C]">
                    {hour}
                  </span>
                </div>
              ))}
            </div>

            {loading ? (
              <>
                {weekDays.map((day) => {
                  const dayKey = toYMDLocal(day);

                  return (
                    <div
                      key={dayKey}
                      className="grid border-b border-dashed border-slate-300"
                      style={gridStyle}
                    >
                      <div className="sticky left-0 z-20 border-r border-slate-200 bg-white px-3 py-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="mt-2 h-3 w-16" />
                      </div>

                      {HOURS.map((hour) => (
                        <div
                          key={`${dayKey}-${hour}`}
                          className="min-h-[132px] border-l border-slate-100 p-2"
                        >
                          <Skeleton className="h-20 w-full rounded-lg" />
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
                  <div
                    key={dayKey}
                    className="grid border-b border-dashed border-slate-300"
                    style={gridStyle}
                  >
                    <div
                      className={[
                        "sticky left-0 z-20 border-r border-slate-200 px-3 py-4",
                        isToday ? "bg-[#131E5C] text-white" : "bg-white text-[#131E5C]",
                      ].join(" ")}
                    >
                      <div className="text-xs font-black uppercase tracking-wide">
                        {weekdayShortEs(day)}
                      </div>

                      <div className="mt-1 text-lg font-black">
                        {day.toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </div>

                      <div
                        className={[
                          "mt-1 text-[10px] font-semibold",
                          isToday ? "text-white/75" : "text-slate-500",
                        ].join(" ")}
                      >
                        {day.toLocaleDateString("es-MX", {
                          weekday: "long",
                        })}
                      </div>
                    </div>

                    {HOURS.map((hour) => {
                      const slotKey = `${dayKey}|${hour}`;
                      const items = rowsBySlot.get(slotKey) || [];

                      return (
                        <div
                          key={slotKey}
                          className="relative min-h-[132px] border-l border-slate-200 bg-white/80 p-1.5 transition hover:bg-slate-50"
                        >
                          {items.length ? (
                            <div className="grid gap-1.5">
                              {items.map((row) => (
                                <EntregaAgendaCard
                                  key={row.id}
                                  row={row}
                                  compact
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="flex h-full min-h-[118px] items-center justify-center rounded-lg border border-dashed border-slate-200 text-[10px] font-bold text-slate-300">
                              Sin entrega
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {!loading && outOfScheduleRows.length ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="mb-2 text-xs font-black uppercase tracking-wide text-amber-800">
            Entregas sin hora o fuera del rango 10:00 - 17:00
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

export default function RegistroEntregas() {
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
        error.message ||
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
      sorted
        .map((row) => toYMDLocal(row.fecha_hora_entrega))
        .filter(Boolean)
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

    const porHoraMap = {};

    for (const row of sorted) {
      const hora = getHourKey(row.fecha_hora_entrega) || "Sin hora";

      if (!porHoraMap[hora]) {
        porHoraMap[hora] = {
          hora,
          total: 0,
        };
      }

      porHoraMap[hora].total += 1;
    }

    const porHora = Object.values(porHoraMap).sort((a, b) =>
      a.hora.localeCompare(b.hora)
    );

    const porAsesor = countBy(sorted, (row) => row.asesor_ventas, "asesor").slice(
      0,
      10
    );

    const porModelo = countBy(sorted, (row) => row.modelo_version, "modelo").slice(
      0,
      10
    );

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
    const topColor = chartData.porColor[0];
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
      topColor: topColor ? `${topColor.color} (${topColor.total})` : "Sin datos",
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

    setFilters((prev) => ({
      ...prev,
      rangoDesde: hoy,
      rangoHasta: hoy,
    }));
  };

  const onChangeDateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));

    if (value) setCurrentWeekDate(parseYMDLocal(value));
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-5 lg:p-7">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-5 overflow-hidden rounded-lg bg-[#131E5C] shadow-xl">
          <div className="relative p-5 sm:p-7">

            <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Entregas {DEFAULT_DEALER}
                </h1>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="inline-flex overflow-hidden rounded-lg border border-white/20 bg-white p-1 shadow-sm">
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
          </div>
        </div>

        {ctxError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {ctxError}
          </div>
        ) : null}
        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-6">
              <FilterBlock label="Búsqueda">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-[#131E5C] focus-within:bg-white">
                  <Search className="h-4 w-4 text-[#131E5C]" />

                  <input
                    value={filters.q}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        q: e.target.value,
                      }))
                    }
                    placeholder="Buscar por cliente, teléfono, VIN, modelo, versión, color, asesor…"
                    className="w-full bg-transparent text-sm font-semibold text-[#131E5C] outline-none placeholder:text-slate-400"
                  />

                  {filters.q ? (
                    <button
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          q: "",
                        }))
                      }
                      className="rounded-lg bg-white p-1 text-[#131E5C] hover:text-red-500"
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
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-[#131E5C] outline-none focus:border-[#131E5C] focus:bg-white"
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
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-[#131E5C] outline-none focus:border-[#131E5C] focus:bg-white"
                />
              </FilterBlock>
            </div>

            <div className="md:col-span-12">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={setHoy}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Hoy
                  </button>

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] bg-white px-4 py-2 text-sm font-bold text-[#131E5C] hover:bg-[#131E5C] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                Mostrando únicamente registros de {DEFAULT_DEALER}.
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
                            <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#131E5C]">
                              {formatDateTime(row.fecha_hora_entrega)}
                            </td>

                            <td className="px-4 py-3 font-bold text-[#131E5C]">
                              {nombreCliente}
                            </td>

                            <td className="px-4 py-3 text-slate-700">
                              {telefonoCliente}
                            </td>

                            <td className="px-4 py-3 font-semibold text-slate-700">
                              {row.vin || "—"}
                            </td>

                            <td className="px-4 py-3 text-slate-700">
                              {row.modelo_version || "—"}
                            </td>

                            <td className="px-4 py-3 text-slate-700">
                              {row.version || "—"}
                            </td>

                            <td className="px-4 py-3 text-slate-700">
                              {row.color || "—"}
                            </td>

                            <td className="px-4 py-3 text-slate-700">
                              {row.asesor_ventas || "—"}
                            </td>

                            <td className="px-4 py-3">
                              <StatusBadge row={row} />
                            </td>

                            <td className="px-4 py-3 text-slate-700">
                              {row.preparada_por || "—"}
                            </td>

                            <td className="max-w-[260px] px-4 py-3 text-slate-700">
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
                            className="px-4 py-10 text-center text-[#131E5C]"
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
          <div className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-5">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#131E5C]/10 p-3 text-[#131E5C]">
                    <Trophy className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wide text-[#131E5C]">
                      Resumen operativo
                    </h2>

                    <div className="mt-4 grid gap-3 text-sm">
                      <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                        <span className="font-semibold text-slate-500">
                          Asesor con más entregas
                        </span>
                        <span className="text-right font-black text-[#131E5C]">
                          {highlights.topAsesor}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                        <span className="font-semibold text-slate-500">
                          Modelo más entregado
                        </span>
                        <span className="text-right font-black text-[#131E5C]">
                          {highlights.topModelo}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                        <span className="font-semibold text-slate-500">
                          Color más frecuente
                        </span>
                        <span className="text-right font-black text-[#131E5C]">
                          {highlights.topColor}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                        <span className="font-semibold text-slate-500">
                          Hora pico
                        </span>
                        <span className="text-right font-black text-[#131E5C]">
                          {highlights.horaPico}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="font-semibold text-slate-500">
                          Día con más entregas
                        </span>
                        <span className="text-right font-black text-[#131E5C]">
                          {highlights.diaPico}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-[310px] rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3">
                <h2 className="mb-4 border-l-4 border-[#131E5C] pl-3 text-sm font-black uppercase tracking-wide text-[#131E5C]">
                  Tendencia diaria
                </h2>

                <ResponsiveContainer width="100%" height="82%">
                  <LineChart data={chartData.porDia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />

                    <XAxis
                      dataKey="dia"
                      tick={{ fill: BRAND_BLUE, fontSize: 11 }}
                    />

                    <YAxis tick={{ fill: BRAND_BLUE, fontSize: 11 }} />

                    <Tooltip
                      contentStyle={{
                        borderRadius: "14px",
                        border: "1px solid #CBD5E1",
                        backgroundColor: "rgba(255,255,255,0.98)",
                        fontSize: "12px",
                        color: BRAND_BLUE,
                        fontWeight: 600,
                      }}
                    />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total"
                      stroke={BRAND_BLUE}
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="entregadas"
                      name="Entregadas"
                      stroke={EMERALD}
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="pendientes"
                      name="Pendientes"
                      stroke={AMBER}
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="h-[420px] rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 border-l-4 border-[#131E5C] pl-3 text-sm font-black uppercase tracking-wide text-[#131E5C]">
                  Entregadas / pendientes
                </h2>

                <ResponsiveContainer width="100%" height="88%">
                  <PieChart>
                    <Pie
                      data={chartData.entregasEstado}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={105}
                      label
                    >
                      {chartData.entregasEstado.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="h-[420px] rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 border-l-4 border-[#131E5C] pl-3 text-sm font-black uppercase tracking-wide text-[#131E5C]">
                  Entregas por hora
                </h2>

                <ResponsiveContainer width="100%" height="88%">
                  <BarChart data={chartData.porHora}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />

                    <XAxis
                      dataKey="hora"
                      tick={{ fill: BRAND_BLUE, fontSize: 11 }}
                    />

                    <YAxis tick={{ fill: BRAND_BLUE, fontSize: 11 }} />

                    <Tooltip />

                    <Bar dataKey="total" fill={SKY} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="h-[520px] rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 border-l-4 border-[#131E5C] pl-3 text-sm font-black uppercase tracking-wide text-[#131E5C]">
                  Top asesores
                </h2>

                <ResponsiveContainer width="100%" height="90%">
                  <BarChart
                    layout="vertical"
                    data={chartData.porAsesor}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 90,
                      bottom: 20,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />

                    <XAxis
                      type="number"
                      tick={{ fill: BRAND_BLUE, fontSize: 11 }}
                    />

                    <YAxis
                      type="category"
                      dataKey="asesor"
                      width={170}
                      tick={{ fill: BRAND_BLUE, fontSize: 11 }}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="total"
                      fill={BRAND_BLUE}
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="h-[520px] rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 border-l-4 border-[#131E5C] pl-3 text-sm font-black uppercase tracking-wide text-[#131E5C]">
                  Top modelos
                </h2>

                <ResponsiveContainer width="100%" height="90%">
                  <BarChart
                    layout="vertical"
                    data={chartData.porModelo}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 70,
                      bottom: 20,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />

                    <XAxis
                      type="number"
                      tick={{ fill: BRAND_BLUE, fontSize: 11 }}
                    />

                    <YAxis
                      type="category"
                      dataKey="modelo"
                      width={140}
                      tick={{ fill: BRAND_BLUE, fontSize: 11 }}
                    />

                    <Tooltip />

                    <Bar dataKey="total" fill={SKY} radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="h-[420px] rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 border-l-4 border-[#131E5C] pl-3 text-sm font-black uppercase tracking-wide text-[#131E5C]">
                  Versiones
                </h2>

                <ResponsiveContainer width="100%" height="88%">
                  <BarChart data={chartData.porVersion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />

                    <XAxis
                      dataKey="version"
                      angle={-15}
                      textAnchor="end"
                      interval={0}
                      tick={{ fill: BRAND_BLUE, fontSize: 10 }}
                    />

                    <YAxis tick={{ fill: BRAND_BLUE, fontSize: 11 }} />

                    <Tooltip />

                    <Bar dataKey="total" fill={BRAND_BLUE} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="h-[420px] rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 border-l-4 border-[#131E5C] pl-3 text-sm font-black uppercase tracking-wide text-[#131E5C]">
                  Colores
                </h2>

                <ResponsiveContainer width="100%" height="88%">
                  <BarChart data={chartData.porColor}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />

                    <XAxis
                      dataKey="color"
                      angle={-15}
                      textAnchor="end"
                      interval={0}
                      tick={{ fill: BRAND_BLUE, fontSize: 10 }}
                    />

                    <YAxis tick={{ fill: BRAND_BLUE, fontSize: 11 }} />

                    <Tooltip />

                    <Bar dataKey="total" fill={SLATE} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="h-[420px] rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 border-l-4 border-[#131E5C] pl-3 text-sm font-black uppercase tracking-wide text-[#131E5C]">
                  Días con mayor actividad
                </h2>

                <ResponsiveContainer width="100%" height="88%">
                  <BarChart data={chartData.porDiaSemana}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />

                    <XAxis
                      dataKey="dia"
                      tick={{ fill: BRAND_BLUE, fontSize: 10 }}
                    />

                    <YAxis tick={{ fill: BRAND_BLUE, fontSize: 11 }} />

                    <Tooltip />

                    <Bar dataKey="total" fill={EMERALD} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}