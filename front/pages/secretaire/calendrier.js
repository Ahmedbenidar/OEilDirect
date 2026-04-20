import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';
import { getUser, logout } from '../../lib/useAuth';
import SameRouteScrollLink from '../../components/SameRouteScrollLink';

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function SecSidebar({ user, router, active }) {
    const links = [
        { icon: 'dashboard',       label: 'Tableau de bord', href: '/secretaire'            },
        { icon: 'assignment_late', label: 'Demandes',        href: '/secretaire'            },
        { icon: 'calendar_today',  label: 'Calendrier',      href: '/secretaire/calendrier' },
        { icon: 'group',           label: 'Patients',        href: '/secretaire/patients'   },
        { icon: 'analytics',       label: 'Rapports',        href: '#'                      },
    ];
    return (
        <aside className="w-64 bg-white border-r border-[#005bbd]/10 flex flex-col flex-shrink-0">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#005bbd] flex items-center justify-center text-white font-black text-lg">Œ</div>
                <h2 className="text-xl font-bold tracking-tight text-[#005bbd]">ŒilDirect</h2>
            </div>
            <nav className="flex-1 px-4 space-y-1">
                {links.map(item => (
                    <SameRouteScrollLink key={item.label} href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${item.href === active ? 'bg-[#005bbd] text-white' : 'text-slate-600 hover:bg-[#005bbd]/5 hover:text-[#005bbd]'}`}>
                        <span className="material-symbols-outlined">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                    </SameRouteScrollLink>
                ))}
            </nav>
            <div className="p-4 border-t border-[#005bbd]/10">
                <div className="flex items-center gap-3 p-2">
                    <Link href="/secretaire/profil" className="block flex-shrink-0">
                        {user?.photoProfil ? (
                            <img
                                src={user.photoProfil}
                                alt="Profil"
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-[#005bbd]/15 flex items-center justify-center text-[#005bbd] font-bold text-sm">
                                {user?.nom?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                        )}
                    </Link>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{user?.nom || 'Secrétariat'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                    </div>
                    <button onClick={() => logout(router)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-sm">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}

// ─── Helpers calendrier ──────────────────────────────────────────────────────

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function startOfMonth(year, month) {
    const d = new Date(year, month, 1);
    // Ajuster pour que la semaine commence lundi
    const dow = d.getDay(); // 0=dim
    return dow === 0 ? 6 : dow - 1;
}

function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

const STATUT_COLOR = {
    EN_ATTENTE_SECRETAIRE: 'bg-orange-500',
    EN_ATTENTE_MEDECIN:    'bg-green-500',
    TEST_PRESCRIT:         'bg-blue-500',
    TEST_TERMINE:          'bg-purple-500',
    ORDONNANCE_DELIVREE:   'bg-slate-400',
    REJETEE:               'bg-red-500',
};
const STATUT_LABEL = {
    EN_ATTENTE_SECRETAIRE: 'En attente secrétaire',
    EN_ATTENTE_MEDECIN:    'En attente médecin',
    TEST_PRESCRIT:         'Test prescrit',
    TEST_TERMINE:          'Test terminé',
    ORDONNANCE_DELIVREE:   'Clôturé',
    REJETEE:               'Rejeté',
};

// ─── Page Calendrier ─────────────────────────────────────────────────────────
export default function CalendrierPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [demandes, setDemandes] = useState([]);
    const [loading, setLoading]   = useState(true);

    const today = new Date();
    const [viewYear,  setViewYear]  = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selectedDay, setSelectedDay] = useState(null); // date string "YYYY-MM-DD"
    const [sideFilter, setSideFilter] = useState('toutes');

    useEffect(() => {
        const u = getUser();
        if (!u || u.role !== 'SECRETAIRE') { router.push('/connexion'); return; }
        setUser(u);
        fetchApi('/secretaire/demandes').then(d => { setDemandes(d); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    // Grouper les demandes par date de création (YYYY-MM-DD)
    const demandesParJour = useMemo(() => {
        const map = {};
        demandes.forEach(d => {
            if (!d.dateCreation) return;
            const key = d.dateCreation.substring(0, 10);
            if (!map[key]) map[key] = [];
            map[key].push(d);
        });
        return map;
    }, [demandes]);

    // Demandes du jour sélectionné (filtrées)
    const demandesJourSelect = useMemo(() => {
        if (!selectedDay) return [];
        const list = demandesParJour[selectedDay] || [];
        if (sideFilter === 'toutes') return list;
        return list.filter(d => d.statut === sideFilter);
    }, [selectedDay, demandesParJour, sideFilter]);

    // Stats du mois courant
    const statsMonth = useMemo(() => {
        const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
        const mdm = demandes.filter(d => d.dateCreation?.startsWith(prefix));
        return {
            total:   mdm.length,
            attente: mdm.filter(d => d.statut === 'EN_ATTENTE_SECRETAIRE').length,
            valides: mdm.filter(d => d.statut === 'EN_ATTENTE_MEDECIN').length,
        };
    }, [demandes, viewYear, viewMonth]);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
        else setViewMonth(m => m - 1);
        setSelectedDay(null);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
        else setViewMonth(m => m + 1);
        setSelectedDay(null);
    };

    const firstDow = startOfMonth(viewYear, viewMonth); // 0=lun
    const nbDays   = daysInMonth(viewYear, viewMonth);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    const dayKey = (d) => `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

    return (
        <>
            <Head>
                <title>Calendrier — ŒilDirect Secrétaire</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </Head>

            <div className="flex h-screen overflow-hidden bg-[#f8f9fa]" style={{ fontFamily: "'Inter', sans-serif" }}>
                <SecSidebar user={user} router={router} active="/secretaire/calendrier" />

                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <header className="h-16 bg-white border-b border-[#005bbd]/10 flex items-center justify-between px-8 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <h1 className="text-lg font-black text-slate-800 w-44 text-center">
                                {MOIS_FR[viewMonth]} {viewYear}
                            </h1>
                            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                            <button onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setSelectedDay(todayStr); }}
                                className="ml-2 text-xs font-bold px-3 py-1.5 bg-[#005bbd]/10 text-[#005bbd] rounded-lg hover:bg-[#005bbd]/20 transition-colors">
                                Aujourd'hui
                            </button>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span><span className="text-slate-500">En attente</span></div>
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span><span className="text-slate-500">Validé</span></div>
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span><span className="text-slate-500">Test prescrit</span></div>
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span><span className="text-slate-500">Rejeté</span></div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-hidden flex">

                        {/* ── Calendrier ─────────────────────────────────────── */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Stats mois */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                {[
                                    { label: 'Demandes ce mois', value: statsMonth.total,   bg: 'bg-[#005bbd]/10', text: 'text-[#005bbd]' },
                                    { label: 'En attente',       value: statsMonth.attente,  bg: 'bg-orange-100',   text: 'text-orange-600' },
                                    { label: 'Validées',         value: statsMonth.valides,  bg: 'bg-green-100',    text: 'text-green-600' },
                                ].map(s => (
                                    <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex items-center justify-between`}>
                                        <p className={`text-sm font-medium ${s.text}`}>{s.label}</p>
                                        <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            {loading ? (
                                <div className="bg-white rounded-2xl h-96 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-slate-200 animate-spin">progress_activity</span>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    {/* Header jours */}
                                    <div className="grid grid-cols-7 border-b border-slate-100">
                                        {JOURS.map(j => (
                                            <div key={j} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">{j}</div>
                                        ))}
                                    </div>

                                    {/* Grille */}
                                    <div className="grid grid-cols-7">
                                        {/* Cases vides avant le 1er */}
                                        {Array.from({ length: firstDow }).map((_, i) => (
                                            <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-slate-50 bg-slate-50/50"></div>
                                        ))}

                                        {/* Jours du mois */}
                                        {Array.from({ length: nbDays }, (_, i) => i + 1).map(day => {
                                            const key  = dayKey(day);
                                            const dem  = demandesParJour[key] || [];
                                            const isToday   = key === todayStr;
                                            const isSelected = key === selectedDay;
                                            const col = (firstDow + day - 1) % 7;
                                            const isLastCol = col === 6;
                                            return (
                                                <div
                                                    key={day}
                                                    onClick={() => setSelectedDay(key === selectedDay ? null : key)}
                                                    className={`min-h-[90px] p-2 border-b border-slate-50 cursor-pointer transition-colors flex flex-col
                                                        ${isLastCol ? '' : 'border-r'}
                                                        ${isSelected ? 'bg-[#005bbd]/5 ring-2 ring-inset ring-[#005bbd]/20' : 'hover:bg-slate-50'}`}
                                                >
                                                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ml-auto mb-1
                                                        ${isToday ? 'bg-[#005bbd] text-white' : 'text-slate-600'}`}>
                                                        {day}
                                                    </span>
                                                    <div className="space-y-0.5">
                                                        {dem.slice(0, 3).map((d, idx) => (
                                                            <div key={idx} className={`w-full h-1.5 rounded-full ${STATUT_COLOR[d.statut] || 'bg-slate-300'}`}></div>
                                                        ))}
                                                        {dem.length > 3 && (
                                                            <p className="text-[9px] text-slate-400 font-medium pl-0.5">+{dem.length - 3} autre{dem.length - 3 > 1 ? 's' : ''}</p>
                                                        )}
                                                    </div>
                                                    {dem.length > 0 && (
                                                        <span className="mt-auto text-[9px] font-bold text-slate-400">{dem.length} dem.</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Panneau latéral : détails du jour sélectionné ── */}
                        <div className={`w-80 bg-white border-l border-slate-100 flex flex-col transition-all ${selectedDay ? 'translate-x-0' : 'translate-x-full'} flex-shrink-0`}>
                            {selectedDay ? (
                                <>
                                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Demandes du</p>
                                            <p className="font-black text-slate-800">
                                                {new Date(selectedDay + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </p>
                                        </div>
                                        <button onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-slate-600">
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    </div>

                                    {/* Filtre rapide */}
                                    <div className="px-4 py-3 border-b border-slate-100">
                                        <select
                                            value={sideFilter}
                                            onChange={e => setSideFilter(e.target.value)}
                                            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005bbd]/30 bg-white"
                                        >
                                            <option value="toutes">Tous les statuts</option>
                                            {Object.entries(STATUT_LABEL).map(([k, v]) => (
                                                <option key={k} value={k}>{v}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {demandesJourSelect.length === 0 ? (
                                            <div className="text-center py-12">
                                                <span className="material-symbols-outlined text-4xl text-slate-200">event_busy</span>
                                                <p className="text-slate-400 text-sm mt-2">Aucune demande ce jour.</p>
                                            </div>
                                        ) : (
                                            demandesJourSelect.map(d => (
                                                <div key={d.id} className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 hover:border-[#005bbd]/20 transition-colors">
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-[#005bbd]/10 flex items-center justify-center text-[#005bbd] font-bold text-xs flex-shrink-0">
                                                                {d.patient?.nom?.charAt(0)?.toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-xs text-slate-800">{d.patient?.nom}</p>
                                                                <p className="text-[10px] text-slate-400">Dr. {d.praticien?.nom || '—'}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-1 ${STATUT_COLOR[d.statut] || 'bg-slate-300'}`}></span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 line-clamp-2">{d.motif || '—'}</p>
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className="text-[10px] font-medium text-slate-400">#{d.id}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            d.statut === 'EN_ATTENTE_SECRETAIRE' ? 'bg-orange-100 text-orange-600' :
                                                            d.statut === 'EN_ATTENTE_MEDECIN'    ? 'bg-green-100 text-green-600'   :
                                                            d.statut === 'REJETEE'               ? 'bg-red-100 text-red-500'       :
                                                            'bg-blue-100 text-blue-600'
                                                        }`}>{STATUT_LABEL[d.statut] || d.statut}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="p-4 border-t border-slate-100">
                                        <p className="text-xs text-slate-400 text-center font-medium">
                                            {(demandesParJour[selectedDay] || []).length} demande{(demandesParJour[selectedDay] || []).length !== 1 ? 's' : ''} ce jour
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                                    <span className="material-symbols-outlined text-5xl text-slate-200 mb-3">touch_app</span>
                                    <p className="text-slate-400 font-medium text-sm">Cliquez sur un jour pour voir les demandes</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            <style jsx global>{`
                .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; display: inline-flex; align-items: center; }
            `}</style>
        </>
    );
}
