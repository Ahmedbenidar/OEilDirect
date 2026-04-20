import { useState } from 'react';

const MOIS = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DEFAULT_JOURS_HEBDO = [1, 2, 3, 4, 5];

export function toISODateLocal(y, m, d) {
  const mm = String(m + 1).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

export function normalizeJoursHebdoDispo(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return [...DEFAULT_JOURS_HEBDO];
  return [...new Set(arr.map((n) => Number(n)).filter((n) => n >= 0 && n <= 6))];
}

function normalizeDatesOff(arr) {
  if (!Array.isArray(arr)) return [];
  const re = /^\d{4}-\d{2}-\d{2}$/;
  return arr.filter((s) => typeof s === 'string' && re.test(s));
}

export function normalizeDatesDispo(arr) {
  return normalizeDatesOff(arr);
}

export function normalizeDatesOff2(arr) {
  return normalizeDatesOff(arr);
}

export default function CalendrierDispo({
  selectedDate,
  onSelect,
  joursConsultationHebdo,
  datesJoursOff,
  datesDisponibles,
  selectionMode = 'booking',
}) {
  const today = new Date();
  const jourOk = normalizeJoursHebdoDispo(joursConsultationHebdo);
  const offSet = new Set(normalizeDatesOff(datesJoursOff));
  const dispoSet = new Set(normalizeDatesOff(datesDisponibles));
  const hasCalendarPlanning = dispoSet.size > 0;

  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600">
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>
        <h3 className="text-sm font-bold text-slate-800">{MOIS[viewMonth]} {viewYear}</h3>
        <button type="button" onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600">
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {JOURS.map((j) => (
          <div key={j} className="text-center text-[10px] font-semibold text-slate-400 py-1">{j}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />;
          const dateObj = new Date(viewYear, viewMonth, d);
          const isPast = dateObj < startOfToday;
          const iso = toISODateLocal(viewYear, viewMonth, d);
          const wd = dateObj.getDay();

          const isDateOff = offSet.has(iso);
          const isJourTravail = jourOk.includes(wd);

          const dispo = (selectionMode === 'toggleOff' && hasCalendarPlanning)
            ? (!isPast && dispoSet.has(iso) && !isDateOff)
            : (hasCalendarPlanning
                ? (!isPast && dispoSet.has(iso) && !isDateOff)
                : (!isPast && isJourTravail && !isDateOff));

          const isSelected = selectedDate &&
            selectedDate.getDate() === d &&
            selectedDate.getMonth() === viewMonth &&
            selectedDate.getFullYear() === viewYear;

          const isToday = today.getDate() === d && today.getMonth() === viewMonth && today.getFullYear() === viewYear;

          const clickableToggle = selectionMode === 'toggleOff' && !isPast;
          const clickableBooking = selectionMode === 'booking' && dispo;
          const canClick = clickableToggle || clickableBooking;

          let cellClass = 'w-full aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ';
          if (isPast) {
            cellClass += 'text-slate-300 cursor-not-allowed ';
          } else if (!dispo) {
            cellClass += 'bg-red-50 text-red-700 border border-red-200 ';
            cellClass += canClick ? 'hover:bg-red-100 cursor-pointer ' : 'cursor-default ';
          } else {
            cellClass += 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 cursor-pointer ';
          }

          if (selectionMode === 'booking' && isSelected) {
            cellClass = 'w-full aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all bg-blue-600 text-white border-2 border-blue-700 shadow-md z-10 ';
          }

          if (selectionMode === 'toggleOff' && !isPast && isDateOff) {
            cellClass = 'w-full aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all bg-red-200 text-red-900 border-2 border-red-500 ring-1 ring-red-400 cursor-pointer ';
          }

          if (isToday && !isSelected && dispo && selectionMode === 'booking') {
            cellClass += 'ring-2 ring-emerald-500 ring-offset-1 ';
          }

          return (
            <button
              key={d}
              type="button"
              disabled={!canClick}
              onClick={() => canClick && onSelect(dateObj)}
              className={cellClass}
            >
              {d}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-slate-500 border-t border-slate-100 pt-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
          Disponible
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-50 border border-red-200" />
          Non disponible
        </span>
        {selectionMode === 'booking' && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600" />
            Selection
          </span>
        )}
      </div>
    </div>
  );
}
