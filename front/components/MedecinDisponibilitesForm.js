import { useEffect, useRef, useState } from "react";
import { getUser } from "../lib/useAuth";
import { fetchApi } from "../lib/api";
import CalendrierDispo, { toISODateLocal } from "./CalendrierDispo";

const DEFAULT_JOURS_HEBDO = [1, 2, 3, 4, 5];

function normalizeDates(arr) {
  if (!Array.isArray(arr)) return [];
  const re = /^\d{4}-\d{2}-\d{2}$/;
  return [...new Set(arr.filter((s) => typeof s === "string" && re.test(s)))].sort();
}

export default function MedecinDisponibilitesForm() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [datesOff, setDatesOff] = useState([]);
  const [savedDatesOff, setSavedDatesOff] = useState([]);

  const userRef = useRef(null);
  const okTimerRef = useRef(null);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== "MEDECIN") {
      setLoading(false);
      return;
    }
    setUser(u);
    userRef.current = u;
    (async () => {
      try {
        const p = await fetchApi("/utilisateurs/" + u.id);
        const dates = normalizeDates(p.datesJoursOff);
        setDatesOff(dates);
        setSavedDatesOff(dates);
      } catch (e) {
        setErr(e.message || "Erreur chargement");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      if (okTimerRef.current) clearTimeout(okTimerRef.current);
    };
  }, []);

  const hasUnsaved = JSON.stringify(datesOff) !== JSON.stringify(savedDatesOff);

  const toggleDateOffCalendrier = (date) => {
    const iso = toISODateLocal(date.getFullYear(), date.getMonth(), date.getDate());
    setDatesOff((prev) => {
      const n = normalizeDates(prev);
      return n.includes(iso)
        ? n.filter((x) => x !== iso)
        : normalizeDates([...n, iso]);
    });
  };

  const save = async () => {
    const u = userRef.current;
    if (!u) return;
    setSaving(true);
    setErr("");
    setOk("");
    try {
      const saved = await fetchApi("/utilisateurs/" + u.id, {
        method: "PUT",
        body: JSON.stringify({
          joursConsultationHebdo: DEFAULT_JOURS_HEBDO,
          datesJoursOff: normalizeDates(datesOff),
          datesDisponibles: [],
        }),
      });
      const confirmed = normalizeDates(
        saved && Array.isArray(saved.datesJoursOff) ? saved.datesJoursOff : datesOff
      );
      setDatesOff(confirmed);
      setSavedDatesOff(confirmed);
      try {
        const cur = getUser();
        localStorage.setItem("oeildirect_user", JSON.stringify({ ...(cur || {}), ...(saved || {}) }));
      } catch (_) {}
      setOk("Disponibilites enregistrees.");
      if (okTimerRef.current) clearTimeout(okTimerRef.current);
      okTimerRef.current = setTimeout(() => setOk(""), 3000);
    } catch (e) {
      setErr(e.message || "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (!user && !loading) return null;

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#191c1e] tracking-tight">Disponibilite cabinet</h2>
          <p className="text-[#43474e] text-sm mt-1">
            Par defaut, du lundi au vendredi est disponible. Cliquez sur une date pour basculer son etat, puis cliquez sur Enregistrer.
          </p>
        </div>
        {!loading && datesOff.length > 0 && (
          <span className="ml-4 mt-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-3 py-1 whitespace-nowrap">
            {datesOff.length} jour{datesOff.length > 1 ? "s" : ""} off
          </span>
        )}
      </div>

      {err && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold">{err}</div>
      )}
      {ok && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-semibold">{ok}</div>
      )}
      {hasUnsaved && !ok && !saving && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 font-semibold">
          Modifications non enregistrees — cliquez sur Enregistrer pour sauvegarder.
        </div>
      )}

      <div className="bg-white rounded-xl p-8 shadow-[0_4px_40px_-10px_rgba(25,28,30,0.06)] border border-slate-200/60">
        {loading ? (
          <p className="text-slate-500 text-sm">Chargement...</p>
        ) : (
          <>
            <div className="mb-8 pt-6 border-t border-[#e0e3e5]">
              <div className="max-w-md">
                <CalendrierDispo
                  selectionMode="toggleOff"
                  selectedDate={null}
                  joursConsultationHebdo={DEFAULT_JOURS_HEBDO}
                  datesJoursOff={datesOff}
                  datesDisponibles={[]}
                  onSelect={toggleDateOffCalendrier}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#e0e3e5]">
              {hasUnsaved && (
                <span className="text-xs text-amber-600 font-semibold">Modifications non enregistrees</span>
              )}
              <button
                type="button"
                disabled={saving || !hasUnsaved}
                onClick={save}
                className="py-2.5 px-8 bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white rounded-md font-semibold text-xs uppercase tracking-wide shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "Enregistrement..." : "Enregistrer disponibilites"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}