import { useEffect, useRef } from "react";

function chipLabel(day) {
  const parts = day.split("-");
  return String(Number(parts[2]));
}

export default function DayScrubber({ days, day, onSelect, dayLabel, dayMeta }) {
  const trackRef = useRef(null);
  const activeRef = useRef(null);
  const index = days.indexOf(day);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [day]);

  useEffect(() => {
    const onKey = (e) => {
      if (!days.length) return;
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const dir = e.key === "ArrowLeft" ? -1 : 1;
        const next = Math.min(Math.max(index + dir, 0), days.length - 1);
        if (days[next] && days[next] !== day) onSelect(days[next]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [days, day, index, onSelect]);

  const go = (dir) => {
    const next = Math.min(Math.max(index + dir, 0), days.length - 1);
    if (days[next]) onSelect(days[next]);
  };

  return (
    <div className="scrubber">
      <div className="scrubber-bar">
        <button
          type="button"
          className="scrubber-nav"
          aria-label="Previous day"
          disabled={index <= 0}
          onClick={() => go(-1)}
        >
          ‹
        </button>
        <div className="scrubber-current">
          <div className="day-label">{dayLabel || day}</div>
          {dayMeta && <span className="day-meta">{dayMeta}</span>}
        </div>
        <div className="scrubber-kbd" aria-hidden="true">
          <span className="kbd">←</span>
          <span className="kbd">→</span>
        </div>
        <button
          type="button"
          className="scrubber-nav"
          aria-label="Next day"
          disabled={index < 0 || index >= days.length - 1}
          onClick={() => go(1)}
        >
          ›
        </button>
      </div>
      <div
        className="day-track"
        ref={trackRef}
        role="listbox"
        aria-label="Delivery day"
        tabIndex={0}
      >
        {days.map((d) => {
          const active = d === day;
          return (
            <button
              key={d}
              type="button"
              role="option"
              aria-selected={active}
              ref={active ? activeRef : null}
              className={`day-tick${active ? " active" : ""}`}
              onClick={() => onSelect(d)}
              title={d}
            >
              {chipLabel(d)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
