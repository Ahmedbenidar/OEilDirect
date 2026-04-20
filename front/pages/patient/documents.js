import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';
import { getUser, logout } from '../../lib/useAuth';
import { generateOrdonnancePdf } from '../../lib/generateOrdonnancePdf';
import NotificationBell from '../../components/NotificationBell';
import ChatPanel from '../../components/ChatPanel';
import SameRouteScrollLink from '../../components/SameRouteScrollLink';

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

function buildOrdonnanceData(ord) {
    const scoreVal = ord?.score ?? 0;
    const dateStr = ord?.dateCreation
        ? new Date(ord.dateCreation).toLocaleDateString('fr-FR')
        : new Date().toLocaleDateString('fr-FR');

    let label, title, diag, reco, corr, color;
    if (scoreVal >= 14) {
        label = 'Excellent'; title = 'Acuité visuelle excellente';
        diag = 'Score 14–15/15 — résultat très satisfaisant.';
        reco = 'Examen de contrôle recommandé dans 2 ans.';
        corr = null; color = 'emerald';
    } else if (scoreVal >= 10) {
        label = 'Bon'; title = 'Bonne acuité visuelle';
        diag = 'Score 10–13/15 — bon niveau de réponses.';
        reco = 'Consultation ophtalmologique conseillée si symptômes. Correction possible.';
        corr = 'Correction estimée : sphère -0.50 à -1.00 dioptrie'; color = 'blue';
    } else if (scoreVal >= 7) {
        label = 'Moyen'; title = 'Acuité visuelle moyenne';
        diag = 'Score 7–9/15 — niveau moyen.';
        reco = 'Consultation ophtalmologique dans les 3 mois.';
        corr = 'Correction estimée : sphère -1.00 à -2.50 dioptries'; color = 'amber';
    } else {
        label = 'Faible'; title = 'Acuité visuelle insuffisante';
        diag = 'Score sous 7/15 — résultat faible.';
        reco = 'Consultation ophtalmologique URGENTE.';
        corr = 'Correction estimée : sphère au-delà de -2,50 dioptries'; color = 'red';
    }
    return { score: scoreVal, label, title, diag, reco, corr, color, date: dateStr };
}

function ScoreBadge({ score }) {
    if (score >= 14) return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Excellent</span>;
    if (score >= 10) return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Bon</span>;
    if (score >= 7) return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Moyen</span>;
    return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Faible</span>;
}

function ScoreBar({ score }) {
    const pct = Math.min(100, (score / 15) * 100);
    let barColor = 'bg-red-400';
    if (score >= 14) barColor = 'bg-emerald-500';
    else if (score >= 10) barColor = 'bg-blue-500';
    else if (score >= 7) barColor = 'bg-amber-400';
    return (
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div className={`${barColor} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }}></div>
        </div>
    );
}

export default function DocumentsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [ordonnances, setOrdonnances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pdfLoadingId, setPdfLoadingId] = useState(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const u = getUser();
        if (!u || u.role !== 'PATIENT') { router.push('/connexion'); return; }
        setUser(u);
        chargerOrdonnances(u.id);
    }, []);

    const chargerOrdonnances = async (patientId) => {
        setLoading(true);
        try {
            const data = await fetchApi(`/patients/${patientId}/ordonnances`);
            if (Array.isArray(data)) setOrdonnances(data);
        } catch (err) {
            console.error('Erreur chargement ordonnances', err);
            try {
                const ord = localStorage.getItem('derniere_ordonnance');
                if (ord) setOrdonnances([{ _local: true, ...JSON.parse(ord) }]);
            } catch (e) { }
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (ord) => {
        const id = ord._local ? 'local' : ord.id;
        setPdfLoadingId(id);
        try {
            const data = ord._local ? ord : buildOrdonnanceData(ord);
            await generateOrdonnancePdf(data, user);
        } catch (e) {
            console.error('Erreur PDF:', e);
            alert('Erreur lors de la génération du PDF.');
        } finally {
            setPdfLoadingId(null);
        }
    };

    const ordonnancesFiltrees = ordonnances.filter(ord => {
        const score = ord.score ?? 0;
        const dateStr = ord.dateCreation
            ? new Date(ord.dateCreation).toLocaleDateString('fr-FR')
            : (ord.date || '');
        const label = score >= 14 ? 'excellent' : score >= 10 ? 'bon' : score >= 7 ? 'moyen' : 'faible';
        const matchSearch = search === '' ||
            label.includes(search.toLowerCase()) ||
            dateStr.includes(search) ||
            String(score).includes(search);
        const matchFilter =
            filter === 'all' ||
            (filter === 'excellent' && score >= 14) ||
            (filter === 'bon' && score >= 10 && score <= 13) ||
            (filter === 'moyen' && score >= 7 && score <= 9) ||
            (filter === 'faible' && score < 7);
        return matchSearch && matchFilter;
    });

    if (!user) return null;

    return (
        <>
            <Head>
                <title>Mes Documents – ŒilDirect</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;500;700;900&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </Head>

            <div className="bg-slate-50 min-h-screen antialiased" style={{ fontFamily: 'Inter, sans-serif' }}>

                {/* ── TOP NAV ── */}
                <header className="bg-white/50 backdrop-blur-md shadow-sm sticky top-0 z-50 flex items-center justify-between px-8 h-16 w-full">
                    <div className="flex items-center gap-4">
                        <img src="/logos/logo_cabinet.png" alt="ŒilDirect" className="h-14 w-auto object-contain scale-[3.5] origin-left" style={{ mixBlendMode: 'multiply' }} />
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <nav className="flex gap-6">
                            <SameRouteScrollLink href="/patient" className="text-slate-500 font-medium hover:text-sky-600 transition-colors text-sm">Tableau de bord</SameRouteScrollLink>
                            <Link href="/patient/rendez-vous" className="text-slate-500 font-medium hover:text-sky-600 transition-colors text-sm">Rendez-vous</Link>
                            <Link href="/patient/medecins" className="text-slate-500 font-medium hover:text-sky-600 transition-colors text-sm">Trouver un médecin</Link>
                            <span className="text-sky-700 font-bold border-b-2 border-sky-700 pb-0.5 text-sm cursor-default">Documents</span>
                        </nav>
                        <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
                            <NotificationBell user={user} />
                            <span className="material-symbols-outlined text-slate-500 cursor-pointer hover:text-blue-600 transition-colors text-xl">help_outline</span>
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
                    {/* ── SIDEBAR ── */}
                    <aside className="hidden md:flex h-[calc(100vh-4rem)] w-64 fixed left-0 top-16 flex-col gap-2 p-4 bg-slate-100/80 border-r border-slate-200 z-40 pointer-events-auto">
                        <nav className="space-y-1">
                            <SidebarLink href="/patient" icon="dashboard" label="Tableau de bord" />
                            <SidebarLink href="/patient/rendez-vous" icon="calendar_today" label="Rendez-vous" />
                            <SidebarLink href="/patient/medecins" icon="local_hospital" label="Trouver un médecin" />
                            <SidebarLink href="/patient/documents" icon="folder_open" label="Documents" active />
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
                            <button
                                onClick={() => logout(router)}
                                className="w-full flex items-center gap-3 py-3 px-4 text-red-500 hover:bg-red-50 mx-2 rounded-lg hover:translate-x-1 duration-200 transition-all text-sm font-medium"
                            >
                                <span className="material-symbols-outlined text-xl">logout</span>
                                Déconnexion
                            </button>
                        </div>
                    </aside>

                    {/* ── MAIN ── */}
                    <main className="md:ml-64 p-8 pt-6 w-full">
                        <div className="max-w-5xl mx-auto space-y-8">

                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Espace Patient</span>
                                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-1">Mes Documents</h1>
                                    <p className="text-slate-500 mt-2">
                                        {loading ? 'Chargement…' : `${ordonnances.length} ordonnance${ordonnances.length !== 1 ? 's' : ''} disponible${ordonnances.length !== 1 ? 's' : ''}`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => chargerOrdonnances(user.id)}
                                    className="flex items-center gap-2 border border-slate-300 hover:border-blue-400 text-slate-600 hover:text-blue-600 font-bold px-5 py-2.5 rounded-xl transition-all text-sm"
                                >
                                    <span className="material-symbols-outlined text-base">refresh</span>
                                    Actualiser
                                </button>
                            </div>

                            {/* Filters & Search */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                    <input
                                        type="text"
                                        placeholder="Rechercher une ordonnance…"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    />
                                </div>
                                <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex-wrap">
                                    {[
                                        { key: 'all', label: 'Tous' },
                                        { key: 'excellent', label: 'Excellent' },
                                        { key: 'bon', label: 'Bon' },
                                        { key: 'moyen', label: 'Moyen' },
                                        { key: 'faible', label: 'Faible' },
                                    ].map(f => (
                                        <button
                                            key={f.key}
                                            onClick={() => setFilter(f.key)}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f.key
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-slate-500 hover:bg-slate-100'
                                                }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Stats row */}
                            {!loading && ordonnances.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Total', value: ordonnances.length, icon: 'description', color: 'blue' },
                                        { label: 'Bon ou excellent', value: ordonnances.filter(o => (o.score ?? 0) >= 10).length, icon: 'check_circle', color: 'emerald' },
                                        { label: 'Résultat faible', value: ordonnances.filter(o => (o.score ?? 0) < 7).length, icon: 'warning', color: 'amber' },
                                        {
                                            label: 'Score moyen',
                                            value: ordonnances.length
                                                ? (ordonnances.reduce((s, o) => s + (o.score ?? 0), 0) / ordonnances.length).toFixed(1) + '/15'
                                                : '—',
                                            icon: 'bar_chart', color: 'sky'
                                        },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 flex items-center justify-center text-${stat.color}-600 flex-shrink-0`}>
                                                <span className="material-symbols-outlined text-xl">{stat.icon}</span>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                                                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Content */}
                            {loading ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                    <p className="text-slate-400 text-sm font-medium">Chargement de vos ordonnances…</p>
                                </div>
                            ) : ordonnancesFiltrees.length === 0 ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 flex flex-col items-center gap-4 text-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-3xl text-slate-400">folder_open</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-700 text-lg">
                                            {ordonnances.length === 0 ? 'Aucune ordonnance disponible' : 'Aucun résultat'}
                                        </p>
                                        <p className="text-slate-400 text-sm mt-1">
                                            {ordonnances.length === 0
                                                ? 'Vos ordonnances apparaîtront ici après un test visuel.'
                                                : 'Modifiez vos critères de recherche.'}
                                        </p>
                                    </div>
                                    {ordonnances.length === 0 && (
                                        <Link href="/patient/medecins">
                                            <button className="mt-2 bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm">
                                                Prendre un rendez-vous
                                            </button>
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {ordonnancesFiltrees.map((ord, idx) => {
                                        const isLocal = ord._local;
                                        const score = ord.score ?? 0;
                                        const dateStr = isLocal
                                            ? (ord.date || '—')
                                            : (ord.dateCreation ? new Date(ord.dateCreation).toLocaleDateString('fr-FR') : '—');
                                        const id = isLocal ? 'local' : ord.id;
                                        const isDownloading = pdfLoadingId === id;
                                        const ordNum = ordonnances.length - ordonnancesFiltrees.indexOf(ord);

                                        return (
                                            <div
                                                key={id || idx}
                                                className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 overflow-hidden"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center gap-0">

                                                    {/* Left accent */}
                                                    <div className={`w-full md:w-1.5 h-1.5 md:h-auto self-stretch flex-shrink-0 ${score >= 14 ? 'bg-emerald-500' : score >= 10 ? 'bg-blue-500' : score >= 7 ? 'bg-amber-400' : 'bg-red-400'}`}></div>

                                                    <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center gap-4">
                                                        {/* Icon + number */}
                                                        <div className="flex-shrink-0 w-14 h-14 bg-blue-50 border-2 border-blue-100 rounded-xl flex flex-col items-center justify-center">
                                                            <span className="material-symbols-outlined text-blue-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                                                            <span className="text-[9px] font-black text-blue-400">#{ordNum}</span>
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                <h3 className="font-bold text-slate-900 text-base">Ordonnance – Test Visuel IA</h3>
                                                                <ScoreBadge score={score} />
                                                                {isLocal && (
                                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded">LOCAL</span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
                                                                <span className="flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-xs">event</span>
                                                                    {dateStr}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-xs">visibility</span>
                                                                    Score acuité : {score}/15
                                                                </span>
                                                                {ord.demande?.praticien?.nom && (
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="material-symbols-outlined text-xs">person</span>
                                                                        {ord.demande.praticien.nom}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <ScoreBar score={score} />
                                                        </div>

                                                        {/* Contenu médical (si disponible) */}
                                                        {ord.contenuMedical && (
                                                            <div className="hidden lg:block max-w-xs">
                                                                <p className="text-xs text-slate-400 line-clamp-2 italic">{ord.contenuMedical}</p>
                                                            </div>
                                                        )}

                                                        {/* Download button */}
                                                        <div className="flex-shrink-0">
                                                            <button
                                                                onClick={() => handleDownload(isLocal ? ord : { ...buildOrdonnanceData(ord), id: ord.id })}
                                                                disabled={isDownloading}
                                                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${isDownloading
                                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200'
                                                                    }`}
                                                            >
                                                                <span className="material-symbols-outlined text-base">
                                                                    {isDownloading ? 'hourglass_empty' : 'download'}
                                                                </span>
                                                                {isDownloading ? 'Génération…' : 'Télécharger PDF'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Info banner */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-4 items-start">
                                <span className="material-symbols-outlined text-blue-500 text-xl flex-shrink-0 mt-0.5">info</span>
                                <div>
                                    <p className="text-sm font-bold text-blue-800">À propos de vos ordonnances</p>
                                    <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                                        Les ordonnances générées par ŒilDirect sont basées sur votre test visuel IA. Elles sont indicatives et ne remplacent pas une consultation médicale en cabinet. Valables 3 mois.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </main>
                </div>

                {/* ── BOTTOM MOBILE NAV ── */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 flex justify-around items-center z-50">
                    <Link href="/patient" className="flex flex-col items-center gap-1 text-slate-400">
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-[10px] font-bold">Accueil</span>
                    </Link>
                    <Link href="/patient/rendez-vous" className="flex flex-col items-center gap-1 text-slate-400">
                        <span className="material-symbols-outlined">calendar_today</span>
                        <span className="text-[10px] font-bold">RDV</span>
                    </Link>
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
                    <Link href="/patient/documents" className="flex flex-col items-center gap-1 text-blue-600">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>folder_open</span>
                        <span className="text-[10px] font-bold">Docs</span>
                    </Link>
                </nav>
            </div>
            <ChatPanel user={user} />
        </>
    );
}
