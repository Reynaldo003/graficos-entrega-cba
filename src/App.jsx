// src/pages/Entregas/RegistroEntregas.jsx
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
  Building2,
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
} from "recharts";

import { apiEntregas } from "./lib/apiEntregas";

const BRAND_BLUE = "#131E5C";
const HOURS = Array.from(
  { length: 13 },
  (_, index) => `${String(index + 8).padStart(2, "0")}:00`
);

const CHART_COLORS = ["#131E5C", "#0EA5E9"];

function normalizeStr(value) {
  return String(value ?? "").trim();
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
      {Array.from({ length: 14 }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <div className="h-4 w-28 rounded bg-slate-200/60" />
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

function FilterBlock({ label, children }) {
  return (
    <div className="rounded-lg">
      <div className="mb-2 text-xs font-extrabold tracking-wide text-[#131E5C]">
        {label}
      </div>

      {children}
    </div>
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

  return (
    <div
      className={[
        "relative w-full overflow-hidden rounded-md border text-left shadow-sm",
        compact ? "p-3" : "p-2.5",
        entregada ? "border-emerald-300 bg-emerald-50/95" : "border-sky-200 bg-sky-50/95",
      ].join(" ")}
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
              <span className="truncate">{row.agencia || "Sin dealer"}</span>
            </div>

            <div className="mt-1 truncate text-xs font-black uppercase tracking-wide text-[#131E5C]">
              {nombreCliente}
            </div>
          </div>

          <StatusBadge row={row} compact />
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
    () => ({ gridTemplateColumns: "58px repeat(6, minmax(210px, 1fr))" }),
    []
  );

  const goPrevWeek = () => setCurrentWeekDate((prev) => addDays(prev, -7));
  const goNextWeek = () => setCurrentWeekDate((prev) => addDays(prev, 7));
  const goToday = () => setCurrentWeekDate(new Date());

  return (
    <div className="hidden lg:block">
      <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm xl:flex-row xl:items-center xl:justify-between">
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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-auto">
          <div className="min-w-[1320px]">
            <div
              className="sticky top-0 z-20 grid border-b border-slate-200 bg-slate-50"
              style={gridStyle}
            >
              <div className="px-3 py-3 text-xs font-bold text-slate-500">
                Hora
              </div>

              {weekDays.map((day) => {
                const iso = toYMDLocal(day);
                const isToday = iso === todayIso;

                return (
                  <div
                    key={iso}
                    className="border-l border-slate-200 px-3 py-3 text-center"
                  >
                    <div
                      className={[
                        "mx-auto inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black",
                        isToday ? "bg-[#131E5C] text-white" : "text-[#131E5C]",
                      ].join(" ")}
                    >
                      <span>{weekdayShortEs(day)}</span>

                      <span>
                        {day.toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {loading ? (
              <div className="grid" style={gridStyle}>
                {Array.from({ length: 42 }).map((_, index) => (
                  <div
                    key={index}
                    className="min-h-[116px] border-b border-l border-slate-100 p-2"
                  >
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            ) : (
              HOURS.map((hour) => (
                <div
                  key={hour}
                  className="grid border-b border-dashed border-slate-300"
                  style={gridStyle}
                >
                  <div className="bg-slate-50 px-3 py-3 text-xs font-bold text-slate-500">
                    {hour}
                  </div>

                  {weekDays.map((day) => {
                    const dayKey = toYMDLocal(day);
                    const slotKey = `${dayKey}|${hour}`;
                    const items = rowsBySlot.get(slotKey) || [];

                    return (
                      <div
                        key={slotKey}
                        className="relative min-h-[116px] border-l border-slate-200 bg-white/80 p-1.5"
                      >
                        <div className="grid gap-1.5 pr-1">
                          {items.map((row) => (
                            <EntregaAgendaCard key={row.id} row={row} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {!loading && outOfScheduleRows.length ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="mb-2 text-xs font-black uppercase tracking-wide text-amber-800">
            Entregas sin hora o fuera del rango 08:00 - 20:00
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
    agencia: "Todos",
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

  const dealers = useMemo(() => {
    const set = new Set(
      (entregas || [])
        .map((item) => normalizeStr(item.agencia))
        .filter(Boolean)
    );

    return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [entregas]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    const desdeInt = ymdToInt(filters.rangoDesde);
    const hastaInt = ymdToInt(filters.rangoHasta);

    return (entregas || []).filter((item) => {
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

      const matchAgencia =
        filters.agencia === "Todos" ||
        normalizeStr(item.agencia) === normalizeStr(filters.agencia);

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

      return matchQ && matchAgencia && matchRango;
    });
  }, [entregas, filters]);

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

  const entregadas = sorted.filter((row) =>
    entregaFisicaActiva(row.entrega_reportada)
  ).length;

  const noEntregadas = sorted.length - entregadas;

  const entregasEstado = [
    { name: "Entregadas", value: entregadas },
    { name: "No entregadas", value: noEntregadas },
  ];

  const entregasPorDealer = Object.values(
    sorted.reduce((acc, item) => {
      const dealer = item.agencia || "Sin dealer";

      if (!acc[dealer]) acc[dealer] = { dealer, total: 0 };

      acc[dealer].total += 1;

      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const entregasPorAsesor = Object.values(
    sorted.reduce((acc, item) => {
      const asesor = item.asesor_ventas || "Sin asesor";

      if (!acc[asesor]) acc[asesor] = { asesor, total: 0 };

      acc[asesor].total += 1;

      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const resetFilters = () => {
    setFilters({
      q: "",
      agencia: "Todos",
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
    <div className="w-full p-20">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-extrabold text-[#131E5C]">
              Entregas
            </h2>

            <span className="rounded-full border border-[#131E5C]/20 bg-[#131E5C]/5 px-3 py-1 text-xs font-bold text-[#131E5C]">
              Vista pública
            </span>
          </div>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Consulta de agenda, tabla y gráficas sin iniciar sesión.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="inline-flex overflow-hidden rounded-lg border border-[#131E5C] bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode("agenda")}
              className={[
                "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-black transition",
                viewMode === "agenda"
                  ? "bg-[#131E5C] text-white"
                  : "text-[#131E5C] hover:bg-slate-50",
              ].join(" ")}
            >
              <CalendarDays className="h-4 w-4" />
              Agenda
            </button>

            <button
              type="button"
              onClick={() => setViewMode("tabla")}
              className={[
                "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-black transition",
                viewMode === "tabla"
                  ? "bg-[#131E5C] text-white"
                  : "text-[#131E5C] hover:bg-slate-50",
              ].join(" ")}
            >
              <TableProperties className="h-4 w-4" />
              Tabla
            </button>

            <button
              type="button"
              onClick={() => setViewMode("graficas")}
              className={[
                "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-black transition",
                viewMode === "graficas"
                  ? "bg-[#131E5C] text-white"
                  : "text-[#131E5C] hover:bg-slate-50",
              ].join(" ")}
            >
              <BarChart3 className="h-4 w-4" />
              Gráficas
            </button>
          </div>

          <button
            type="button"
            onClick={refreshList}
            disabled={loadingList}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#131E5C]/80 disabled:opacity-60"
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

      {ctxError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {ctxError}
        </div>
      ) : null}

      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-6">
            <FilterBlock label="Búsqueda">
              <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                <Search className="h-4 w-4 text-[#131E5C]" />

                <input
                  value={filters.q}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      q: e.target.value,
                    }))
                  }
                  placeholder="Buscar por dealer, cliente, teléfono, VIN, modelo, versión, color, asesor…"
                  className="w-full text-sm text-[#131E5C] outline-none placeholder:text-[#131E5C]/60"
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
                    className="rounded-lg bg-white p-1 text-[#131E5C] hover:bg-white/80 hover:text-red-500"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </FilterBlock>
          </div>

          <div className="md:col-span-3">
            <FilterBlock label="Dealer">
              <select
                value={filters.agencia}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    agencia: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
              >
                {dealers.map((dealer) => (
                  <option key={dealer} value={dealer}>
                    {dealer}
                  </option>
                ))}
              </select>
            </FilterBlock>
          </div>

          <div className="md:col-span-3">
            <FilterBlock label="Acciones">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={setHoy}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  title="Mostrar solo registros del día de hoy"
                >
                  <CalendarDays className="h-4 w-4" />
                  Hoy
                </button>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] hover:bg-[#131E5C] hover:text-white"
                >
                  <X className="h-4 w-4" />
                  Limpiar
                </button>
              </div>
            </FilterBlock>
          </div>

          <div className="md:col-span-6">
            <FilterBlock label="Desde">
              <input
                type="date"
                value={filters.rangoDesde}
                onChange={(e) =>
                  onChangeDateFilter("rangoDesde", e.target.value)
                }
                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
              />
            </FilterBlock>
          </div>

          <div className="md:col-span-6">
            <FilterBlock label="Hasta">
              <input
                type="date"
                value={filters.rangoHasta}
                onChange={(e) =>
                  onChangeDateFilter("rangoHasta", e.target.value)
                }
                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none"
              />
            </FilterBlock>
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
        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border border-black bg-[#131E5C] text-xs text-white">
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
                      onClick={() => toggleSort("agencia")}
                      className="inline-flex items-center gap-1 text-xs font-bold"
                    >
                      Dealer
                      <span className="opacity-60">
                        {sort.key === "agencia" ? (
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
                  <th className="px-4 py-3">ID SF-NADIN</th>
                  <th className="px-4 py-3">ID SF-DMS</th>
                  <th className="px-4 py-3">Comentarios</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-black/10">
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
                          <td className="px-4 py-3 text-[#131E5C]">
                            {formatDateTime(row.fecha_hora_entrega)}
                          </td>

                          <td className="px-4 py-3 font-semibold text-[#131E5C]">
                            {row.agencia || "—"}
                          </td>

                          <td className="px-4 py-3 text-[#131E5C]">
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

                          <td className="px-4 py-3 text-[#131E5C]">
                            <StatusBadge row={row} />
                          </td>

                          <td className="px-4 py-3 text-[#131E5C]">
                            {row.preparada_por || "—"}
                          </td>

                          <td className="px-4 py-3 text-[#131E5C]">
                            {row.id_cliente_sf_nadin || "—"}
                          </td>

                          <td className="px-4 py-3 text-[#131E5C]">
                            {row.id_cliente_sf_dms || "—"}
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
                          colSpan={14}
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#131E5C]/15 bg-white p-5 shadow-lg">
              <p className="text-sm font-bold uppercase tracking-wide text-[#131E5C]/60">
                Total entregas
              </p>

              <h2 className="mt-2 text-3xl font-black text-[#131E5C]">
                {sorted.length}
              </h2>
            </div>

            <div className="rounded-xl border border-emerald-500/15 bg-white p-5 shadow-lg">
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700/70">
                Entregadas
              </p>

              <h2 className="mt-2 text-3xl font-black text-emerald-700">
                {entregadas}
              </h2>
            </div>

            <div className="rounded-xl border border-amber-500/15 bg-white p-5 shadow-lg">
              <p className="text-sm font-bold uppercase tracking-wide text-amber-700/70">
                No entregadas
              </p>

              <h2 className="mt-2 text-3xl font-black text-amber-700">
                {noEntregadas}
              </h2>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="h-[420px] rounded-2xl border border-[#131E5C]/15 bg-white p-6 shadow-xl">
              <h2 className="mb-4 border-l-4 border-[#131E5C] pl-3 text-base font-bold tracking-wide text-[#131E5C]">
                Entregas por dealer
              </h2>

              <ResponsiveContainer width="100%" height="88%">
                <BarChart
                  data={entregasPorDealer}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 0,
                    bottom: 40,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />

                  <XAxis
                    dataKey="dealer"
                    angle={-10}
                    textAnchor="end"
                    interval={0}
                    tick={{
                      fill: BRAND_BLUE,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />

                  <YAxis
                    tick={{
                      fill: BRAND_BLUE,
                      fontSize: 11,
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "rgba(255,255,255,0.98)",
                      fontSize: "12px",
                      color: BRAND_BLUE,
                      fontWeight: 600,
                    }}
                  />

                  <Bar
                    dataKey="total"
                    fill={BRAND_BLUE}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[420px] rounded-2xl border border-[#131E5C]/15 bg-white p-6 shadow-xl">
              <h2 className="mb-4 border-l-4 border-[#131E5C] pl-3 text-base font-bold tracking-wide text-[#131E5C]">
                Entregadas / no entregadas
              </h2>

              <ResponsiveContainer width="100%" height="88%">
                <PieChart>
                  <Pie
                    data={entregasEstado}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={105}
                    label
                  >
                    {entregasEstado.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "rgba(255,255,255,0.98)",
                      fontSize: "12px",
                      color: BRAND_BLUE,
                    }}
                  />

                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: BRAND_BLUE,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="h-[700px] rounded-2xl border border-[#131E5C]/15 bg-white p-6 shadow-xl">
            <h2 className="mb-4 border-l-4 border-[#131E5C] pl-3 text-base font-bold tracking-wide text-[#131E5C]">
              Entregas por asesor
            </h2>

            <ResponsiveContainer width="100%" height="92%">
              <BarChart
                layout="vertical"
                data={entregasPorAsesor.slice(0, 10)}
                margin={{
                  top: 20,
                  right: 30,
                  left: 80,
                  bottom: 20,
                }}
                barCategoryGap={16}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />

                <XAxis
                  type="number"
                  tick={{
                    fill: BRAND_BLUE,
                    fontSize: 11,
                  }}
                />

                <YAxis
                  type="category"
                  dataKey="asesor"
                  width={160}
                  tick={{
                    fill: BRAND_BLUE,
                    fontSize: 11,
                  }}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "rgba(255,255,255,0.98)",
                    fontSize: "12px",
                    color: BRAND_BLUE,
                  }}
                />

                <Bar
                  dataKey="total"
                  fill={BRAND_BLUE}
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </div>
  );
}