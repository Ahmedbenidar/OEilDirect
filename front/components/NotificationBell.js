import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchApi } from '../lib/api';

// ── Derive notifications from API data based on user role ─────────────────────
async function fetchNotificationsForUser(user) {
    const notifs = [];
    try {
        if (user.role === 'PATIENT') {
            const [demandes, ordonnances] = await Promise.allSettled([
                fetchApi(`/patients/${user.id}/demandes`),
                fetchApi(`/patients/${user.id}/ordonnances`),
            ]);

            const dem = demandes.status === 'fulfilled' && Array.isArray(demandes.value) ? demandes.value : [];
            const ords = ordonnances.status === 'fulfilled' && Array.isArray(ordonnances.value) ? ordonnances.value : [];

            dem.forEach(d => {
                const ts = d.dateCreation ? new Date(d.dateCreation).getTime() : 0;
                if (d.statut === 'ORDONNANCE_DELIVREE') {
                    notifs.push({
                        id: `ord_rdv_${d.id}`,
                        type: 'success',
                        icon: 'description',
                        title: 'Ordonnance disponible',
                        message: `Votre ordonnance est prête — Dr. ${d.praticien?.nom || 'votre médecin'}`,
                        link: '/patient/documents',
                        ts,
                    });
                }
                if (d.statut === 'TEST_PRESCRIT') {
                    notifs.push({
                        id: `test_${d.id}`,
                        type: 'info',
                        icon: 'visibility',
                        title: 'Test visuel requis',
                        message: `Dr. ${d.praticien?.nom || 'votre médecin'} vous a prescrit un test visuel`,
                        link: `/patient/test/${d.id}`,
                        ts,
                    });
                }
                if (d.statut === 'EN_ATTENTE_MEDECIN') {
                    notifs.push({
                        id: `rdv_medecin_${d.id}`,
                        type: 'warning',
                        icon: 'schedule',
                        title: 'Demande transmise au médecin',
                        message: `Votre RDV #${d.id} est en cours d'examen par Dr. ${d.praticien?.nom || 'le médecin'}`,
                        link: '/patient/rendez-vous',
                        ts,
                    });
                }
                if (d.statut === 'TEST_TERMINE') {
                    notifs.push({
                        id: `testok_${d.id}`,
                        type: 'info',
                        icon: 'fact_check',
                        title: 'Test terminé — en attente d\'ordonnance',
                        message: `Votre test visuel du RDV #${d.id} a été enregistré`,
                        link: '/patient/rendez-vous',
                        ts,
                    });
                }
            });

            ords.forEach(o => {
                const ts = o.dateCreation ? new Date(o.dateCreation).getTime() : 0;
                notifs.push({
                    id: `ord_${o.id}`,
                    type: 'success',
                    icon: 'download',
                    title: 'Ordonnance téléchargeable',
                    message: `Score ${o.score}/15 — ${o.dateCreation ? new Date(o.dateCreation).toLocaleDateString('fr-FR') : ''}`,
                    link: '/patient/documents',
                    ts,
                });
            });

        } else if (user.role === 'MEDECIN') {
            const [aValider, termines] = await Promise.allSettled([
                fetchApi(`/medecins/${user.id}/demandes/a-valider`),
                fetchApi(`/medecins/${user.id}/tests/termines`),
            ]);

            const dem = aValider.status === 'fulfilled' && Array.isArray(aValider.value) ? aValider.value : [];
            const tests = termines.status === 'fulfilled' && Array.isArray(termines.value) ? termines.value : [];

            dem.forEach(d => {
                const ts = d.dateCreation ? new Date(d.dateCreation).getTime() : 0;
                notifs.push({
                    id: `med_val_${d.id}`,
                    type: 'warning',
                    icon: 'assignment_ind',
                    title: 'Nouvelle demande à traiter',
                    message: `${d.patient?.nom || 'Un patient'} — ${(d.motif || '').slice(0, 45)}`,
                    link: null,
                    ts,
                });
            });

            tests.forEach(d => {
                const ts = d.dateCreation ? new Date(d.dateCreation).getTime() : 0;
                notifs.push({
                    id: `med_test_${d.id}`,
                    type: 'info',
                    icon: 'fact_check',
                    title: 'Test visuel complété',
                    message: `${d.patient?.nom || 'Un patient'} a terminé son test — ordonnance requise`,
                    link: null,
                    ts,
                });
            });

        } else if (user.role === 'SECRETAIRE') {
            const result = await fetchApi('/secretaire/demandes/en-attente');
            const dem = Array.isArray(result) ? result : [];

            dem.forEach(d => {
                const ts = d.dateCreation ? new Date(d.dateCreation).getTime() : 0;
                notifs.push({
                    id: `sec_${d.id}`,
                    type: 'warning',
                    icon: 'pending_actions',
                    title: 'Nouvelle demande à valider',
                    message: `${d.patient?.nom || 'Patient'} → Dr. ${d.praticien?.nom || '—'} — ${(d.motif || '').slice(0, 40)}`,
                    link: null,
                    ts,
                });
            });
        }
    } catch (e) {
        // silently ignore fetch errors
    }
    // newest first
    return notifs.sort((a, b) => (b.ts || 0) - (a.ts || 0));
}

// ── NotificationBell Component ────────────────────────────────────────────────
export default function NotificationBell({ user }) {
    const [notifications, setNotifications] = useState([]);
    const [readIds, setReadIds] = useState(new Set());
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const storageKey = `notif_read_${user?.id}_${user?.role}`;

    // Load persisted read ids
    useEffect(() => {
        if (!user) return;
        try {
            const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
            setReadIds(new Set(stored));
        } catch { }
    }, [storageKey]);

    // Fetch notifications on mount and every 30s
    const load = useCallback(async () => {
        if (!user) return;
        const notifs = await fetchNotificationsForUser(user);
        setNotifications(notifs);
    }, [user]);

    useEffect(() => {
        load();
        const timer = setInterval(load, 30000);
        return () => clearInterval(timer);
    }, [load]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

    const persistReadIds = (set) => {
        try { localStorage.setItem(storageKey, JSON.stringify([...set])); } catch { }
    };

    const markAllRead = () => {
        const all = new Set(notifications.map(n => n.id));
        setReadIds(all);
        persistReadIds(all);
    };

    const markOneRead = (id) => {
        setReadIds(prev => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            persistReadIds(next);
            return next;
        });
    };

    const handleOpen = () => {
        setOpen(v => !v);
    };

    const TYPE_COLORS = {
        success: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
        info:    { bg: 'bg-blue-100',    text: 'text-blue-600'    },
        warning: { bg: 'bg-amber-100',   text: 'text-amber-600'   },
        error:   { bg: 'bg-red-100',     text: 'text-red-600'     },
    };

    return (
        <div className="relative" ref={ref}>
            {/* Bell button */}
            <button
                onClick={handleOpen}
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                title="Notifications"
            >
                <span
                    className="material-symbols-outlined text-xl"
                    style={{ fontVariationSettings: unreadCount > 0 ? "'FILL' 1" : "'FILL' 0" }}
                >
                    notifications
                </span>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[9999] overflow-hidden"
                    style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                            {notifications.length > 0 && (
                                <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                    {notifications.length}
                                </span>
                            )}
                        </div>
                        {notifications.length > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                            >
                                Tout marquer lu
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                            <div className="py-10 text-center text-slate-400">
                                <span className="material-symbols-outlined text-4xl block mb-2 opacity-40">notifications_off</span>
                                <p className="text-sm font-medium">Aucune notification</p>
                                <p className="text-xs mt-1 opacity-60">Vous êtes à jour !</p>
                            </div>
                        ) : (
                            (() => {
                                const unread = notifications.filter(n => !readIds.has(n.id));
                                const latestUnreadId = unread.length > 0
                                    ? unread.reduce((best, cur) => ((cur.ts || 0) > (best.ts || 0) ? cur : best), unread[0]).id
                                    : null;

                                return notifications.map(n => {
                                const wasUnread = !readIds.has(n.id);
                                const isLatestUnread = wasUnread && latestUnreadId && n.id === latestUnreadId;
                                const c = TYPE_COLORS[n.type] || TYPE_COLORS.info;
                                return (
                                    <div
                                        key={n.id}
                                        onClick={() => {
                                            markOneRead(n.id);
                                            setOpen(false);
                                            if (n.link) window.location.href = n.link;
                                        }}
                                        className={[
                                            'flex gap-3 px-4 py-3 cursor-pointer transition-colors',
                                            isLatestUnread ? 'bg-blue-100/70 ring-2 ring-blue-500/60 ring-inset' : (wasUnread ? 'bg-blue-50/50' : ''),
                                            'hover:bg-slate-50',
                                        ].join(' ')}
                                    >
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${c.bg} ${c.text}`}>
                                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                {n.icon}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className={`text-sm text-slate-800 leading-tight ${wasUnread ? 'font-bold' : 'font-semibold'}`}>
                                                    {n.title}
                                                </p>
                                                {isLatestUnread ? (
                                                    <span className="text-[10px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                        Nouveau
                                                    </span>
                                                ) : (
                                                    wasUnread && <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                                        </div>
                                    </div>
                                );
                                });
                            })()
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50 flex items-center justify-between">
                            <p className="text-xs text-slate-400">
                                {unreadCount > 0
                                    ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
                                    : 'Tout est lu ✓'}
                            </p>
                            <span className="text-[10px] text-slate-300 font-medium">Mis à jour toutes les 30s</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
