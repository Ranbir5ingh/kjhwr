import { useEffect, useMemo, useRef, useState } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function parseDay(day) {
  const [y, m, d] = day.split("-").map(Number);
  return { y, m, d };
}

function formatShort(day) {
  if (!day) return "";
  const { y, m, d } = parseDay(day);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function formatLong(day) {
  if (!day) return "";
  const { y, m, d } = parseDay(day);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Build a Mon-first calendar grid for January 2026 (or whatever month the days cover). */
function buildCalendarCells(days) {
  if (!days.length) return { year: 2026, month: 1, monthLabel: "January 2026", cells: [] };
  const first = parseDay(days[0]);
  const year = first.y;
  const month = first.m;
  const available = new Set(days);
  // Day-of-week for the 1st (Mon=0 … Sun=6)
  const firstDow = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) {
    cells.push({ type: "pad", key: `pad-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      type: "day",
      key: iso,
      iso,
      label: d,
      available: available.has(iso),
    });
  }
  const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return { year, month, monthLabel, cells };
}

export default function DayScrubber({ days, day, onSelect, dayLabel, dayMeta }) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef(null);
  const triggerRef = useRef(null);
  const index = days.indexOf(day);
  const calendar = useMemo(() => buildCalendarCells(days), [days]);

  useEffect(() => {
    const onKey = (e) => {
      if (!days.length) return;
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        return;
      }

      if (open) return; // let calendar handle focus when open

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const dir = e.key === "ArrowLeft" ? -1 : 1;
        const next = Math.min(Math.max(index + dir, 0), days.length - 1);
        if (days[next] && days[next] !== day) onSelect(days[next]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [days, day, index, onSelect, open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus first available / selected day button
    const focusTarget =
      sheetRef.current?.querySelector(`[data-day="${day}"]`) ||
      sheetRef.current?.querySelector(".cal-day:not(:disabled)");
    focusTarget?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, day]);

  const go = (dir) => {
    const next = Math.min(Math.max(index + dir, 0), days.length - 1);
    if (days[next]) onSelect(days[next]);
  };

  const pick = (iso) => {
    onSelect(iso);
    setOpen(false);
    // restore focus to trigger after close
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const displayLabel = dayLabel || formatLong(day) || day;

  return (
    <div className="day-picker">
      <div className="day-picker-control" role="group" aria-label="Delivery day">
        <button
          type="button"
          className="day-nav"
          aria-label="Previous day"
          disabled={index <= 0}
          onClick={() => go(-1)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          className="day-current"
          ref={triggerRef}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`Selected day ${displayLabel}. Open calendar.`}
          onClick={() => setOpen(true)}
        >
          <span className="day-current-label">{formatShort(day) || displayLabel}</span>
          <span className="day-current-full">{displayLabel}</span>
          {dayMeta && <span className="day-current-meta">{dayMeta}</span>}
          <span className="day-current-hint">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M2 6.5h12M5.5 2v2.5M10.5 2v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Pick a day
          </span>
        </button>

        <button
          type="button"
          className="day-nav"
          aria-label="Next day"
          disabled={index < 0 || index >= days.length - 1}
          onClick={() => go(1)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <p className="day-picker-kbd" aria-hidden="true">
        <span className="kbd">←</span>
        <span className="kbd">→</span>
        <span>to step days</span>
      </p>

      {open && (
        <div
          className="cal-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="cal-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={`Choose a delivery day in ${calendar.monthLabel}`}
            ref={sheetRef}
          >
            <div className="cal-handle" aria-hidden="true" />
            <div className="cal-head">
              <div>
                <p className="cal-eyebrow">Delivery day</p>
                <h3 className="cal-title">{calendar.monthLabel}</h3>
              </div>
              <button
                type="button"
                className="cal-close"
                aria-label="Close calendar"
                onClick={() => setOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="cal-weekdays" aria-hidden="true">
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>

            <div className="cal-grid" role="grid" aria-label={calendar.monthLabel}>
              {calendar.cells.map((cell) => {
                if (cell.type === "pad") {
                  return <span key={cell.key} className="cal-pad" />;
                }
                const active = cell.iso === day;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    className={`cal-day${active ? " is-active" : ""}${cell.available ? "" : " is-unavailable"}`}
                    data-day={cell.iso}
                    disabled={!cell.available}
                    aria-label={
                      cell.available
                        ? `${formatLong(cell.iso)}${active ? ", selected" : ""}`
                        : `${formatLong(cell.iso)}, no data`
                    }
                    aria-pressed={active}
                    onClick={() => pick(cell.iso)}
                  >
                    {cell.label}
                  </button>
                );
              })}
            </div>

            <p className="cal-footnote">
              Only days with January sample data are selectable. Grey days have no delivery data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
