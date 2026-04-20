import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';
import { getUser, logout } from '../../lib/useAuth';
import SameRouteScrollLink from '../../components/SameRouteScrollLink';

// ─── Sidebar Layout (partagé) ────────────────────────────────────────────────
function SecSidebar({ user, router, active }) {
    const links = [
        { icon: 'dashboard',       label: 'Tableau de bord', href: '/secretaire'           },
        { icon: 'assignment_late', label: 'Demandes',        href: '/secretaire'           },
        { icon: 'calendar_today',  label: 'Calendrier',      href: '/secretaire/calendrier'},
        { icon: 'group',           label: 'Patients',        href: '/secretaire/patients'  },
        { icon: 'analytics',       label: 'Rapports',        href: '#'                     },
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

// ─── Modal Détails Patient ───────────────────────────────────────────────────
function ModalPatient({ patient, demandes, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="bg-[#005bbd] px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <h3 className="text-white font-bold text-lg">Dossier patient</h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Infos */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#005bbd]/10 flex items-center justify-center text-[#005bbd] font-black text-2xl">
                            {patient.nom?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                            <p className="font-black text-xl text-slate-800">{patient.nom}</p>
                            <p className="text-sm text-slate-500">{patient.email}</p>
                            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                {patient.role}
                            </span>
                        </div>
                    </div>
                    {/* Demandes */}
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Historique des demandes</p>
                        {demandes.length === 0 ? (
                            <p className="text-slate-400 text-sm text-center py-4">Aucune demande.</p>
                        ) : (
                            <div className="space-y-2">
                                {demandes.map(d => (
                                    <div key={d.id} className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-sm text-slate-800">#{d.id} — {d.motif || '—'}</p>
                                            <p className="text-xs text-slate-400">Dr. {d.praticien?.nom || '—'}</p>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            d.statut === 'EN_ATTENTE_SECRETAIRE' ? 'bg-orange-100 text-orange-600' :
                                            d.statut === 'EN_ATTENTE_MEDECIN'    ? 'bg-green-100 text-green-600'   :
                                            d.statut === 'REJETEE'               ? 'bg-red-100 text-red-600'       :
                                            'bg-blue-100 text-blue-600'
                                        }`}>{d.statut?.replace(/_/g, ' ')}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="px-6 pb-6 flex-shrink-0">
                    <button onClick={onClose} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page Patients ───────────────────────────────────────────────────────────
export default function PatientsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [patients, setPatients] = useState([]);
    const [toutesLesDemandes, setToutesLesDemandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;

    useEffect(() => {
        const u = getUser();
        if (!u || u.role !== 'SECRETAIRE') { router.push('/connexion'); return; }
        setUser(u);
        charger();
    }, []);

    const charger = async () => {
        setLoading(true);
        setError(null);
        try {
            // Récupérer toutes les demandes pour extraire les patients uniques
            const demandes = await fetchApi('/secretaire/demandes');
            setToutesLesDemandes(demandes);

            // Dédupliquer les patients depuis les demandes
            const patientsMap = new Map();
            demandes.forEach(d => {
                if (d.patient?.id && !patientsMap.has(d.patient.id)) {
                    patientsMap.set(d.patient.id, d.patient);
                }
            });
            setPatients(Array.from(patientsMap.values()));
        } catch (err) {
            setError("Impossible de charger les patients.");
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = useMemo(() => {
        if (!search.trim()) return patients;
        const q = search.toLowerCase();
        return patients.filter(p =>
            p.nom?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
        );
    }, [patients, search]);

    const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PER_PAGE));
    const paginated = filteredPatients.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    useEffect(() => { setPage(1); }, [search]);

    const getDemandesPatient = (patientId) => toutesLesDemandes.filter(d => d.patient?.id === patientId);

    return (
        <>
            <Head>
                <title>Patients — ŒilDirect Secrétaire</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </Head>

            {selectedPatient && (
                <ModalPatient
                    patient={selectedPatient}
                    demandes={getDemandesPatient(selectedPatient.id)}
                    onClose={() => setSelectedPatient(null)}
                />
            )}

            <div className="flex h-screen overflow-hidden bg-[#f8f9fa]" style={{ fontFamily: "'Inter', sans-serif" }}>
                <SecSidebar user={user} router={router} active="/secretaire/patients" />

                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <header className="h-16 bg-white border-b border-[#005bbd]/10 flex items-center justify-between px-8 flex-shrink-0">
                        <div className="relative w-96">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#f8f9fa] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005bbd]/30 text-sm"
                                placeholder="Rechercher par nom ou email..."
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            )}
                        </div>
                        <button onClick={charger} className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#005bbd] transition-colors font-medium">
                            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                            Actualiser
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="max-w-6xl mx-auto space-y-6">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-slate-900">Liste des patients</h1>
                                <p className="text-slate-500 mt-1">{patients.length} patient{patients.length !== 1 ? 's' : ''} enregistré{patients.length !== 1 ? 's' : ''} dans le système.</p>
                            </div>

                            {error && (
                                <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-red-500">error</span>
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            <div className="bg-white rounded-2xl border border-[#005bbd]/5 shadow-sm overflow-hidden">
                                {loading ? (
                                    <div className="p-16 flex flex-col items-center gap-3">
                                        <span className="material-symbols-outlined text-5xl text-slate-200 animate-spin">progress_activity</span>
                                        <p className="text-slate-400 font-medium">Chargement...</p>
                                    </div>
                                ) : paginated.length === 0 ? (
                                    <div className="p-16 flex flex-col items-center gap-3">
                                        <span className="material-symbols-outlined text-5xl text-slate-200">person_off</span>
                                        <p className="text-slate-500 font-bold">Aucun patient trouvé</p>
                                        {search && <button onClick={() => setSearch('')} className="text-[#005bbd] text-sm underline">Effacer la recherche</button>}
                                    </div>
                                ) : (
                                    <>
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">Patient</th>
                                                    <th className="px-6 py-4">Email</th>
                                                    <th className="px-6 py-4 text-center">Nb demandes</th>
                                                    <th className="px-6 py-4 text-center">Dernière demande</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {paginated.map(patient => {
                                                    const dem = getDemandesPatient(patient.id);
                                                    const derniere = dem.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))[0];
                                                    return (
                                                        <tr key={patient.id} className="hover:bg-[#005bbd]/[0.03] transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-[#005bbd]/10 flex items-center justify-center text-[#005bbd] font-bold text-sm flex-shrink-0">
                                                                        {patient.nom?.charAt(0)?.toUpperCase()}
                                                                    </div>
                                                                    <p className="font-bold text-sm text-slate-800">{patient.nom}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-slate-500">{patient.email}</td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#005bbd]/10 text-[#005bbd] font-bold text-xs">
                                                                    {dem.length}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-center text-slate-500">
                                                                {derniere ? new Date(derniere.dateCreation).toLocaleDateString('fr-FR') : '—'}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button
                                                                    onClick={() => setSelectedPatient(patient)}
                                                                    className="flex items-center gap-1.5 ml-auto text-xs font-medium text-[#005bbd] hover:bg-[#005bbd]/10 px-3 py-1.5 rounded-lg transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                                    Voir dossier
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>

                                        {/* Pagination */}
                                        <div className="px-6 py-4 bg-slate-50 flex items-center justify-between">
                                            <p className="text-xs text-slate-500 font-medium">
                                                {filteredPatients.length === 0 ? '0 patient' : `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filteredPatients.length)} sur ${filteredPatients.length}`}
                                            </p>
                                            {totalPages > 1 && (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-30 transition-colors">
                                                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                                                    </button>
                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                                        <button key={p} onClick={() => setPage(p)}
                                                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${p === page ? 'bg-[#005bbd] text-white' : 'border border-slate-200 text-slate-600 hover:bg-white'}`}>
                                                            {p}
                                                        </button>
                                                    ))}
                                                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-30 transition-colors">
                                                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
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
