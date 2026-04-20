import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';
import { getUser, logout } from '../../lib/useAuth';
import NotificationBell from '../../components/NotificationBell';
import ChatPanel from '../../components/ChatPanel';
import SameRouteScrollLink from '../../components/SameRouteScrollLink';

const STATUS_MAP = {
    'EN_ATTENTE_SECRETAIRE': { label: 'En attente – Secrétariat', bg: 'bg-yellow-100 text-yellow-800', step: 1 },
    'EN_ATTENTE_MEDECIN': { label: 'En attente – Médecin', bg: 'bg-orange-100 text-orange-800', step: 2 },
    'TEST_PRESCRIT': { label: 'Test visuel requis', bg: 'bg-blue-100 text-blue-800', step: 3 },
    'TEST_TERMINE': { label: 'Test terminé', bg: 'bg-purple-100 text-purple-800', step: 4 },
    'ORDONNANCE_DELIVREE': { label: 'Ordonnance disponible', bg: 'bg-emerald-100 text-emerald-700', step: 5 },
};

function SidebarLink({ href, icon, label, active }) {
    const cls = active
        ? 'flex items-center gap-3 py-3 px-4 bg-white text-sky-700 shadow-sm rounded-lg mx-2 text-sm font-medium'
        : 'flex items-center gap-3 py-3 px-4 text-slate-600 hover:bg-slate-200/50 mx-2 rounded-lg text-sm font-medium';
    return href ? (
        <SameRouteScrollLink href={href} className={cls}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
            {label}
        </SameRouteScrollLink>
    ) : (
        <span className={cls + ' cursor-default'}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
            {label}
        </span>
    );
}

export default function MesRendezVous() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [demandes, setDemandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const u = getUser();
        if (!u || u.role !== 'PATIENT') { router.push('/connexion'); return; }
        setUser(u);
        chargerDemandes(u.id);
    }, []);

    const chargerDemandes = async (patientId) => {
        setLoading(true);
        try {
            const data = await fetchApi(`/patients/${patientId}/demandes`);
            setDemandes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const demandesFiltrees = filter === 'all'
        ? demandes
        : filter === 'active'
            ? demandes.filter(d => d.statut !== 'ORDONNANCE_DELIVREE')
            : demandes.filter(d => d.statut === 'ORDONNANCE_DELIVREE');

    if (!user) return null;

    return (
        <>
            <Head>
                <title>Mes Rendez-vous – ŒilDirect</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </Head>

            <div className="bg-slate-50 min-h-screen antialiased" style={{ fontFamily: 'Inter, sans-serif' }}>

                {/* TOP NAV */}
                <header className="bg-white/50 backdrop-blur-md shadow-sm sticky top-0 z-50 flex items-center justify-between px-8 h-16 w-full">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-200">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-black tracking-tight text-slate-900">ŒilDirect</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <nav className="flex gap-6">
                            <SameRouteScrollLink href="/patient" className="text-slate-500 font-medium hover:text-sky-600 transition-colors text-sm">Tableau de bord</SameRouteScrollLink>
                            <span className="text-sky-700 font-bold border-b-2 border-sky-700 pb-0.5 text-sm cursor-default">Rendez-vous</span>
                            <Link href="/patient/medecins" className="text-slate-500 font-medium hover:text-sky-600 transition-colors text-sm">Trouver un médecin</Link>
                            <Link href="/patient/documents" className="text-slate-500 font-medium hover:text-sky-600 transition-colors text-sm">Documents</Link>
                        </nav>
                        <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
                            <NotificationBell user={user} />
                            <Link href="/patient/profil" className="block">
                                {user.photoProfil ? (
                                    <img
                                        src={user.photoProfil}
                                        alt="Profil"
                                        className="w-9 h-9 rounded-full object-cover border-2 border-blue-200 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
                                        {user.nom?.charAt(0)?.toUpperCase() || 'P'}
                                    </div>
                                )}
                            </Link>
                        </div>
                    </div>
                </header>

                <div className="flex">
                    {/* SIDEBAR */}
                    <aside className="hidden md:flex h-[calc(100vh-4rem)] w-64 fixed left-0 top-16 flex-col gap-2 p-4 bg-slate-100/80 border-r border-slate-200 z-40 pointer-events-auto">
                        <div className="mb-8 px-4">
                            <h2 className="text-xl font-black text-sky-700 uppercase tracking-[0.2em]">ŒilDirect</h2>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Plateforme Médicale</p>
                        </div>
                        <nav className="space-y-1">
                            <SidebarLink href="/patient" icon="dashboard" label="Tableau de bord" />
                            <SidebarLink href="/patient/rendez-vous" icon="calendar_today" label="Rendez-vous" active />
                            <SidebarLink href="/patient/medecins" icon="local_hospital" label="Trouver un médecin" />
                            <SidebarLink icon="visibility" label="Tests de vue" />
                            <SidebarLink href="/patient/documents" icon="folder_open" label="Documents" />
                            <button onClick={() => document.getElementById('chat-toggle-btn')?.click()} className="w-full flex items-center gap-3 py-3 px-4 text-slate-600 hover:bg-slate-200/50 mx-2 rounded-lg hover:translate-x-1 duration-200 transition-all text-sm font-medium">
                                <span className="material-symbols-outlined text-xl">chat</span>
                                <span className="flex-1 text-left">Chat</span>
                                <span className="chat-sidebar-badge badge-blink w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black items-center justify-center border border-white shadow" style={{display:'none'}}></span>
                            </button>
                            <Link href="/patient/lunettes" className="flex items-center gap-3 py-3 px-4 text-slate-600 hover:bg-slate-200/50 mx-2 rounded-lg transition-all text-sm font-medium">
                                <span className="material-symbols-outlined text-xl">visibility</span>
                                <span className="flex-1">Trouver vos lunettes</span>
                            </Link>
                        </nav>
                        <div className="mt-8 px-2">
                            <Link href="/patient/medecins">
                                <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-blue-700 active:scale-95 duration-200 flex items-center justify-center gap-2 text-sm">
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    Prendre RDV
                                </button>
                            </Link>
                        </div>
                        <div className="mt-auto pb-4 space-y-1">
                            <SidebarLink icon="settings" label="Paramètres" />
                            <button onClick={() => logout(router)} className="w-full flex items-center gap-3 py-3 px-4 text-red-500 hover:bg-red-50 mx-2 rounded-lg hover:translate-x-1 duration-200 transition-all text-sm font-medium">
                                <span className="material-symbols-outlined text-xl">logout</span>
                                Déconnexion
                            </button>
                        </div>
                    </aside>

                    {/* MAIN */}
                    <main className="md:ml-64 p-8 pt-6 w-full">
                        <div className="max-w-5xl mx-auto space-y-8">

                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Espace Patient</span>
                                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-1">Mes Rendez-vous</h1>
                                    <p className="text-slate-500 mt-2">{demandes.length} demande{demandes.length > 1 ? 's' : ''} au total</p>
                                </div>
                                <Link href="/patient/medecins">
                                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all text-sm">
                                        <span className="material-symbols-outlined text-base">add</span>
                                        Nouveau Rendez-vous
                                    </button>
                                </Link>
                            </div>

                            {/* Filtres */}
                            <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 w-fit shadow-sm">
                                {[
                                    { key: 'all', label: 'Tous' },
                                    { key: 'active', label: 'En cours' },
                                    { key: 'done', label: 'Terminés' },
                                ].map(f => (
                                    <button
                                        key={f.key}
                                        onClick={() => setFilter(f.key)}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === f.key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {/* Liste */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                {loading ? (
                                    <div className="flex flex-col gap-3 p-6">
                                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
                                    </div>
                                ) : demandesFiltrees.length === 0 ? (
                                    <div className="text-center py-20 text-slate-400">
                                        <span className="material-symbols-outlined text-5xl mb-3 block">calendar_today</span>
                                        <p className="font-bold text-lg">Aucun rendez-vous</p>
                                        <p className="text-sm mt-1 mb-6">Vous n'avez pas encore de rendez-vous dans cette catégorie.</p>
                                        <Link href="/patient/medecins">
                                            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all">
                                                Prendre un rendez-vous →
                                            </button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {demandesFiltrees.map((d, idx) => {
                                            const s = STATUS_MAP[d.statut] || { label: d.statut, bg: 'bg-slate-100 text-slate-500', step: 0 };
                                            return (
                                                <div key={d.id} className="px-6 py-5 hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-4 flex-1">
                                                            {/* Icône */}
                                                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                                                                <span className="material-symbols-outlined text-xl">assignment</span>
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className="text-sm font-bold text-slate-900">RDV #{idx + 1}</span>
                                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${s.bg}`}>
                                                                        {s.label}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-slate-600">
                                                                    <span className="font-semibold">Motif :</span> {d.motif}
                                                                </p>
                                                                {d.praticien?.nom && (
                                                                    <p className="text-sm text-slate-500 mt-0.5">
                                                                        <span className="material-symbols-outlined text-xs align-middle mr-1">person</span>
                                                                        {d.praticien.nom}
                                                                    </p>
                                                                )}

                                                                {/* Barre progression */}
                                                                <div className="mt-3 flex items-center gap-1">
                                                                    {[1, 2, 3, 4, 5].map(n => (
                                                                        <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= s.step ? 'bg-blue-500' : 'bg-slate-200'}`} />
                                                                    ))}
                                                                    <span className="text-xs text-slate-400 ml-2">{s.step}/5</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* CTA */}
                                                        <div className="flex-shrink-0">
                                                            {d.statut === 'TEST_PRESCRIT' && (
                                                                <Link href={`/patient/test/${d.id}`}>
                                                                    <button className="text-xs inline-flex items-center gap-1.5 px-4 py-2 font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm active:scale-95 transition-all">
                                                                        <span className="material-symbols-outlined text-sm">biotech</span>
                                                                        Démarrer le test
                                                                    </button>
                                                                </Link>
                                                            )}
                                                            {d.statut === 'ORDONNANCE_DELIVREE' && (
                                                                <button className="text-xs inline-flex items-center gap-1.5 px-4 py-2 font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-95 transition-all">
                                                                    <span className="material-symbols-outlined text-sm">download</span>
                                                                    Télécharger
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                        </div>
                    </main>
                </div>

                {/* BOTTOM MOBILE NAV */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 flex justify-around items-center z-50">
                    <Link href="/patient" className="flex flex-col items-center gap-1 text-slate-400">
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-[10px] font-bold">Accueil</span>
                    </Link>
                    <span className="flex flex-col items-center gap-1 text-blue-600">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
                        <span className="text-[10px] font-bold">RDV</span>
                    </span>
                    <div className="relative -top-5">
                        <Link href="/patient/medecins">
                            <button className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95">
                                <span className="material-symbols-outlined">add</span>
                            </button>
                        </Link>
                    </div>
                    <span className="flex flex-col items-center gap-1 text-slate-400">
                        <span className="material-symbols-outlined">visibility</span>
                        <span className="text-[10px] font-bold">Tests</span>
                    </span>
                    <span className="flex flex-col items-center gap-1 text-slate-400">
                        <span className="material-symbols-outlined">folder_open</span>
                        <span className="text-[10px] font-bold">Docs</span>
                    </span>
                </nav>
            </div>
            <ChatPanel user={user} />
        </>
    );
}
