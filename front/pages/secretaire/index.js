import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';
import { getUser, logout } from '../../lib/useAuth';
import NotificationBell from '../../components/NotificationBell';
import ChatPanel from '../../components/ChatPanel';
import SameRouteScrollLink from '../../components/SameRouteScrollLink';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUT_LABELS = {
    EN_ATTENTE_SECRETAIRE: { label: 'En attente', color: 'bg-orange-100 text-orange-600', dot: 'bg-orange-500' },
    EN_ATTENTE_MEDECIN:    { label: 'Validé',     color: 'bg-green-100 text-green-600',   dot: 'bg-green-500'  },
    TEST_PRESCRIT:         { label: 'Test prescrit', color: 'bg-blue-100 text-blue-600',  dot: 'bg-blue-500'   },
    TEST_TERMINE:          { label: 'Test terminé',  color: 'bg-purple-100 text-purple-600', dot: 'bg-purple-500' },
    ORDONNANCE_DELIVREE:   { label: 'Clôturé',    color: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400'  },
    REJETEE:               { label: 'Rejetée',    color: 'bg-red-100 text-red-600',       dot: 'bg-red-500'    },
};

function StatutBadge({ statut }) {
    const s = STATUT_LABELS[statut] || { label: statut || 'Inconnu', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${s.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
            {s.label}
        </span>
    );
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Modal Détails ───────────────────────────────────────────────────────────

function ModalDetails({ demande, onClose }) {
    if (!demande) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-[#005bbd] px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg">Détails de la demande #{demande.id}</h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Patient</p>
                            <p className="font-bold text-slate-800">{demande.patient?.nom || '—'}</p>
                            <p className="text-xs text-slate-500">{demande.patient?.email || ''}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Médecin</p>
                            <p className="font-bold text-slate-800">Dr. {demande.praticien?.nom || '—'}</p>
                            <p className="text-xs text-slate-500">{demande.praticien?.email || ''}</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Motif</p>
                        <p className="text-slate-800">{demande.motif || '—'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Date de création</p>
                            <p className="font-medium text-slate-800">{formatDate(demande.dateCreation)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4">
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Paiement</p>
                            <p className={`font-bold ${demande.paiementEffectue ? 'text-green-600' : 'text-red-500'}`}>
                                {demande.paiementEffectue ? '✓ Effectué' : '✗ En attente'}
                            </p>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Statut</p>
                        <StatutBadge statut={demande.statut} />
                    </div>
                </div>
                <div className="px-6 pb-6">
                    <button onClick={onClose} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Modal Confirmation ───────────────────────────────────────────────────────

function ModalConfirm({ title, message, confirmLabel, confirmClass, onConfirm, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-red-600 text-2xl">warning</span>
                    </div>
                    <h3 className="font-black text-slate-800 text-lg mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm mb-6">{message}</p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors">
                            Annuler
                        </button>
                        <button onClick={onConfirm} className={`flex-1 py-2.5 font-bold rounded-xl transition-colors text-white ${confirmClass}`}>
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Composant Principal ──────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 8;

export default function SecretaireDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [demandes, setDemandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('toutes');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Modales
    const [selectedDemande, setSelectedDemande] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null); // { type: 'rejeter'|'supprimer', demandeId }
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null); // { message, type: 'success'|'error' }

    useEffect(() => {
        const u = getUser();
        if (!u || u.role !== 'SECRETAIRE') { router.push('/connexion'); return; }
        setUser(u);
        chargerDemandes();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const chargerDemandes = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchApi('/secretaire/demandes');
            setDemandes(data);
        } catch (err) {
            setError("Impossible de charger les demandes. Vérifiez la connexion.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const validerDemande = async (demandeId) => {
        setActionLoading(true);
        try {
            const updated = await fetchApi(`/secretaire/demandes/${demandeId}/valider`, { method: 'POST' });
            setDemandes(prev => prev.map(d => d.id === demandeId ? updated : d));
            showToast("Dossier validé et transmis au médecin ✓");
        } catch (err) {
            showToast("Erreur lors de la validation : " + err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const rejeterDemande = async (demandeId) => {
        setActionLoading(true);
        try {
            const updated = await fetchApi(`/secretaire/demandes/${demandeId}/rejeter`, { method: 'POST' });
            setDemandes(prev => prev.map(d => d.id === demandeId ? updated : d));
            showToast("Demande rejetée.");
            setConfirmModal(null);
        } catch (err) {
            showToast("Erreur lors du rejet : " + err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const supprimerDemande = async (demandeId) => {
        setActionLoading(true);
        try {
            await fetchApi(`/secretaire/demandes/${demandeId}`, { method: 'DELETE' });
            setDemandes(prev => prev.filter(d => d.id !== demandeId));
            showToast("Demande supprimée.");
            setConfirmModal(null);
        } catch (err) {
            showToast("Erreur lors de la suppression : " + err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Filtres ─────────────────────────────────────────────────────────────

    const filteredDemandes = useMemo(() => {
        let list = demandes;
        if (activeTab === 'attente')   list = list.filter(d => d.statut === 'EN_ATTENTE_SECRETAIRE');
        if (activeTab === 'validees')  list = list.filter(d => d.statut === 'EN_ATTENTE_MEDECIN');
        if (activeTab === 'autres')    list = list.filter(d => !['EN_ATTENTE_SECRETAIRE','EN_ATTENTE_MEDECIN'].includes(d.statut));
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(d =>
                d.patient?.nom?.toLowerCase().includes(q) ||
                d.praticien?.nom?.toLowerCase().includes(q) ||
                d.motif?.toLowerCase().includes(q) ||
                String(d.id).includes(q)
            );
        }
        return list;
    }, [demandes, activeTab, search]);

    // ─── Pagination ───────────────────────────────────────────────────────────

    const totalPages = Math.max(1, Math.ceil(filteredDemandes.length / ITEMS_PER_PAGE));
    const paginatedDemandes = filteredDemandes.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    useEffect(() => { setPage(1); }, [activeTab, search]);

    // ─── Stats ────────────────────────────────────────────────────────────────

    const stats = useMemo(() => ({
        attente: demandes.filter(d => d.statut === 'EN_ATTENTE_SECRETAIRE').length,
        valides: demandes.filter(d => d.statut === 'EN_ATTENTE_MEDECIN').length,
        autres:  demandes.filter(d => !['EN_ATTENTE_SECRETAIRE','EN_ATTENTE_MEDECIN'].includes(d.statut)).length,
    }), [demandes]);

    // ─── Rendu ────────────────────────────────────────────────────────────────

    return (
        <>
            <Head>
                <title>Espace Secrétaire — ŒilDirect</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </Head>

            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium transition-all ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
                    <span className="material-symbols-outlined text-base">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
                    {toast.message}
                </div>
            )}

            {/* Modales */}
            {selectedDemande && <ModalDetails demande={selectedDemande} onClose={() => setSelectedDemande(null)} />}
            {confirmModal?.type === 'rejeter' && (
                <ModalConfirm
                    title="Rejeter la demande ?"
                    message={`La demande #${confirmModal.demandeId} sera marquée comme rejetée. Cette action est réversible.`}
                    confirmLabel="Rejeter"
                    confirmClass="bg-orange-500 hover:bg-orange-600"
                    onConfirm={() => rejeterDemande(confirmModal.demandeId)}
                    onClose={() => setConfirmModal(null)}
                />
            )}
            {confirmModal?.type === 'supprimer' && (
                <ModalConfirm
                    title="Supprimer définitivement ?"
                    message={`La demande #${confirmModal.demandeId} sera supprimée de la base de données. Action irréversible.`}
                    confirmLabel="Supprimer"
                    confirmClass="bg-red-600 hover:bg-red-700"
                    onConfirm={() => supprimerDemande(confirmModal.demandeId)}
                    onClose={() => setConfirmModal(null)}
                />
            )}

            <div className="flex h-screen overflow-hidden bg-[#f8f9fa] text-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>

                {/* ── Sidebar ──────────────────────────────────────────────────── */}
                <aside className="w-64 bg-white border-r border-[#005bbd]/10 flex flex-col flex-shrink-0">
                    <div className="p-6 flex items-center gap-3">
                        <img src="/logos/logo_cabinet.png" alt="ŒilDirect" className="h-14 w-auto object-contain scale-[3.5] origin-left" style={{mixBlendMode:'multiply'}}/>
                    </div>
                    <nav className="flex-1 px-4 space-y-1">
                        {[
                            { icon: 'dashboard',        label: 'Tableau de bord', href: '/secretaire',            active: false },
                            { icon: 'assignment_late',  label: 'Demandes',        href: '/secretaire',            active: true  },
                            { icon: 'calendar_today',   label: 'Calendrier',      href: '/secretaire/calendrier', active: false },
                            { icon: 'group',            label: 'Patients',        href: '/secretaire/patients',   active: false },
                            { icon: 'analytics',        label: 'Rapports',        href: '#',                      active: false },
                        ].map(item => (
                            <SameRouteScrollLink key={item.label} href={item.href}
                               className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${item.active ? 'bg-[#005bbd] text-white' : 'text-slate-600 hover:bg-[#005bbd]/5 hover:text-[#005bbd]'}`}>
                                <span className="material-symbols-outlined">{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                            </SameRouteScrollLink>
                        ))}
                        <button
                            onClick={() => document.getElementById('chat-toggle-btn')?.click()}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-slate-600 hover:bg-[#005bbd]/5 hover:text-[#005bbd]"
                        >
                            <span className="material-symbols-outlined">chat</span>
                            <span className="font-medium flex-1 text-left">Chat</span>
                            <span className="chat-sidebar-badge badge-blink w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black items-center justify-center border border-white shadow" style={{display:'none'}}></span>
                        </button>
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
                                    <div className="w-10 h-10 rounded-full bg-[#005bbd]/15 flex items-center justify-center text-[#005bbd] font-bold text-sm flex-shrink-0">
                                        {user?.nom?.charAt(0)?.toUpperCase() || 'S'}
                                    </div>
                                )}
                            </Link>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{user?.nom || 'Secrétariat'}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                            </div>
                            <button onClick={() => logout(router)} title="Déconnexion"
                                    className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                                <span className="material-symbols-outlined text-sm">logout</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* ── Main ─────────────────────────────────────────────────────── */}
                <main className="flex-1 flex flex-col overflow-hidden">

                    {/* Header */}
                    <header className="h-16 bg-white border-b border-[#005bbd]/10 flex items-center justify-between px-8 flex-shrink-0">
                        <div className="relative w-96">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#f8f9fa] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005bbd]/30 text-sm"
                                placeholder="Rechercher patient, médecin, motif..."
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={chargerDemandes} className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#005bbd] transition-colors font-medium">
                                <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                                Actualiser
                            </button>
                            <NotificationBell user={user} />
                        </div>
                    </header>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="max-w-6xl mx-auto space-y-8">

                            {/* Title */}
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-slate-900">Demandes de rendez-vous</h1>
                                <p className="text-slate-500 mt-1">Gérez et validez les nouvelles sollicitations des patients en temps réel.</p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-red-500">error</span>
                                    <p className="text-sm text-red-700 font-medium">{error}</p>
                                    <button onClick={chargerDemandes} className="ml-auto text-sm text-red-600 underline">Réessayer</button>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <button onClick={() => setActiveTab('attente')} className={`text-left bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all ${activeTab === 'attente' ? 'border-orange-300 ring-2 ring-orange-100' : 'border-[#005bbd]/5'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                            <span className="material-symbols-outlined">pending_actions</span>
                                        </div>
                                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">À traiter</span>
                                    </div>
                                    <p className="text-slate-500 text-sm font-medium">En attente</p>
                                    <h3 className="text-3xl font-black mt-1">{String(stats.attente).padStart(2, '0')}</h3>
                                </button>

                                <button onClick={() => setActiveTab('validees')} className={`text-left bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all ${activeTab === 'validees' ? 'border-green-300 ring-2 ring-green-100' : 'border-[#005bbd]/5'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                            <span className="material-symbols-outlined">check_circle</span>
                                        </div>
                                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Validés</span>
                                    </div>
                                    <p className="text-slate-500 text-sm font-medium">Transmis au médecin</p>
                                    <h3 className="text-3xl font-black mt-1">{String(stats.valides).padStart(2, '0')}</h3>
                                </button>

                                <button onClick={() => setActiveTab('autres')} className={`text-left bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all ${activeTab === 'autres' ? 'border-blue-300 ring-2 ring-blue-100' : 'border-[#005bbd]/5'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                            <span className="material-symbols-outlined">edit_calendar</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Autres</span>
                                    </div>
                                    <p className="text-slate-500 text-sm font-medium">Autres statuts</p>
                                    <h3 className="text-3xl font-black mt-1">{String(stats.autres).padStart(2, '0')}</h3>
                                </button>
                            </div>

                            {/* Table */}
                            <div className="bg-white rounded-2xl border border-[#005bbd]/5 shadow-sm overflow-hidden">

                                {/* Tabs */}
                                <div className="border-b border-slate-100 px-6 pt-4">
                                    <div className="flex gap-6">
                                        {[
                                            { key: 'toutes',   label: `Toutes (${demandes.length})`         },
                                            { key: 'attente',  label: `En attente (${stats.attente})`       },
                                            { key: 'validees', label: `Validées (${stats.valides})`         },
                                            { key: 'autres',   label: `Autres (${stats.autres})`            },
                                        ].map(tab => (
                                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                                    className={`pb-4 border-b-2 text-sm transition-colors ${activeTab === tab.key ? 'border-[#005bbd] text-[#005bbd] font-bold' : 'border-transparent text-slate-400 hover:text-slate-600 font-medium'}`}>
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Body */}
                                {loading ? (
                                    <div className="p-16 flex flex-col items-center gap-3">
                                        <span className="material-symbols-outlined text-5xl text-slate-200 animate-spin">progress_activity</span>
                                        <p className="text-slate-400 font-medium">Chargement...</p>
                                    </div>
                                ) : paginatedDemandes.length === 0 ? (
                                    <div className="p-16 flex flex-col items-center gap-3">
                                        <span className="material-symbols-outlined text-5xl text-slate-200">
                                            {search ? 'search_off' : 'task_alt'}
                                        </span>
                                        <p className="text-slate-500 font-bold text-lg">
                                            {search ? 'Aucun résultat' : 'Aucune demande dans cet onglet'}
                                        </p>
                                        {search && (
                                            <button onClick={() => setSearch('')} className="text-[#005bbd] text-sm underline">
                                                Effacer la recherche
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">Patient</th>
                                                    <th className="px-6 py-4">Médecin / Motif</th>
                                                    <th className="px-6 py-4">Date demande</th>
                                                    <th className="px-6 py-4">Paiement</th>
                                                    <th className="px-6 py-4">Statut</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {paginatedDemandes.map(demande => (
                                                    <tr key={demande.id} className="hover:bg-[#005bbd]/[0.03] transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-[#005bbd]/10 flex items-center justify-center text-[#005bbd] font-bold text-sm flex-shrink-0">
                                                                    {(demande.patient?.nom || 'P').charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm text-slate-900">{demande.patient?.nom || `Patient #${demande.patient?.id}`}</p>
                                                                    <p className="text-xs text-slate-400">{demande.patient?.email || `ID #${demande.id}`}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm">
                                                            <p className="font-semibold text-slate-800">
                                                                {demande.praticien?.nom ? `Dr. ${demande.praticien.nom}` : `Dr. #${demande.praticien?.id || '?'}`}
                                                            </p>
                                                            <p className="text-xs text-slate-400 max-w-[180px] truncate" title={demande.motif}>
                                                                {demande.motif || '—'}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm">
                                                            <p className="font-medium text-slate-800">{formatDate(demande.dateCreation)}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${demande.paiementEffectue ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                {demande.paiementEffectue ? '✓ Payé' : '— Non payé'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <StatutBadge statut={demande.statut} />
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                {/* Voir détails */}
                                                                <button
                                                                    onClick={() => setSelectedDemande(demande)}
                                                                    className="p-2 text-slate-400 hover:text-[#005bbd] hover:bg-[#005bbd]/10 rounded-lg transition-colors"
                                                                    title="Voir les détails"
                                                                >
                                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                                </button>
                                                                {/* Valider */}
                                                                {demande.statut === 'EN_ATTENTE_SECRETAIRE' && (
                                                                    <button
                                                                        onClick={() => validerDemande(demande.id)}
                                                                        disabled={actionLoading}
                                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40"
                                                                        title="Valider et transmettre au médecin"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                                                    </button>
                                                                )}
                                                                {/* Rejeter */}
                                                                {demande.statut === 'EN_ATTENTE_SECRETAIRE' && (
                                                                    <button
                                                                        onClick={() => setConfirmModal({ type: 'rejeter', demandeId: demande.id })}
                                                                        disabled={actionLoading}
                                                                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-40"
                                                                        title="Rejeter la demande"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[20px]">cancel</span>
                                                                    </button>
                                                                )}
                                                                {/* Supprimer */}
                                                                <button
                                                                    onClick={() => setConfirmModal({ type: 'supprimer', demandeId: demande.id })}
                                                                    disabled={actionLoading}
                                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                                                                    title="Supprimer"
                                                                >
                                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Pagination */}
                                <div className="px-6 py-4 bg-slate-50 flex items-center justify-between">
                                    <p className="text-xs text-slate-500 font-medium">
                                        {filteredDemandes.length === 0 ? '0 demande' : `${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filteredDemandes.length)} sur ${filteredDemandes.length} demande${filteredDemandes.length > 1 ? 's' : ''}`}
                                    </p>
                                    {totalPages > 1 && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-30 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setPage(p)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${p === page ? 'bg-[#005bbd] text-white' : 'border border-slate-200 text-slate-600 hover:bg-white'}`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                disabled={page === totalPages}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-30 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <ChatPanel user={user} />

            <style jsx global>{`
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                    display: inline-flex;
                    align-items: center;
                }
            `}</style>
        </>
    );
}
