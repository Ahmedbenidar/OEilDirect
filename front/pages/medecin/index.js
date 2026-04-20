import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';
import { getUser, logout } from '../../lib/useAuth';
import NotificationBell from '../../components/NotificationBell';
import { getMessageAnalyseIA, getDiagnosticPropose } from '../../lib/scoreTestVisuel';
import ChatPanel from '../../components/ChatPanel';
import SameRouteScrollLink from '../../components/SameRouteScrollLink';

export default function MedecinDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [demandesAValider, setDemandesAValider] = useState([]);
    const [testsTermines, setTestsTermines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ aValider: 0, testsEnAttente: 0 });
    const [notification, setNotification] = useState(null);

    const [selectedDemande, setSelectedDemande] = useState(null);
    const [resultatTest, setResultatTest] = useState(null);
    const [loadingResultat, setLoadingResultat] = useState(false);
    const [diagnostic, setDiagnostic] = useState('');
    const [medicaments, setMedicaments] = useState('');
    const [submittingOrdo, setSubmittingOrdo] = useState(false);

    useEffect(() => {
        const u = getUser();
        if (!u || u.role !== 'MEDECIN') { router.push('/connexion'); return; }
        setUser(u);
    }, []);

    useEffect(() => { if (user) chargerDonnees(); }, [user]);

    const chargerDonnees = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let aValider = await fetchApi(`/medecins/${user.id}/demandes/a-valider`);
            if (aValider.length === 0) aValider = await fetchApi(`/medecins/demandes/en-attente-medecin`);
            const aValiderSorted = (Array.isArray(aValider) ? aValider : []).slice().sort((a, b) => {
                const ta = a?.dateCreation ? new Date(a.dateCreation).getTime() : 0;
                const tb = b?.dateCreation ? new Date(b.dateCreation).getTime() : 0;
                return tb - ta;
            });
            setDemandesAValider(aValiderSorted);
            const termines = await fetchApi(`/medecins/${user.id}/tests/termines`);
            const terminesSorted = (Array.isArray(termines) ? termines : []).slice().sort((a, b) => {
                const ta = a?.dateCreation ? new Date(a.dateCreation).getTime() : 0;
                const tb = b?.dateCreation ? new Date(b.dateCreation).getTime() : 0;
                return tb - ta;
            });
            setTestsTermines(terminesSorted);
            setStats({ aValider: aValiderSorted.length, testsEnAttente: terminesSorted.length });
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const prescrireTest = async (demandeId) => {
        try {
            await fetchApi(`/medecins/demandes/${demandeId}/prescrire-test`, { method: 'POST' });
            showNotif('success', 'Test visuel envoye au patient !');
            chargerDonnees();
        } catch (err) { showNotif('error', 'Erreur: ' + err.message); }
    };

    const ouvrirModalResultat = async (demande) => {
        setSelectedDemande(demande);
        setDiagnostic('');
        setMedicaments('');
        setResultatTest(null);
        setLoadingResultat(true);
        try {
            const res = await fetchApi(`/medecins/demandes/${demande.id}/resultat-test`);
            setResultatTest(res);
            const sc = res?.score;
            if (sc !== null && sc !== undefined && !Number.isNaN(Number(sc))) {
                setDiagnostic(getDiagnosticPropose(Number(sc)));
            } else {
                setDiagnostic('');
            }
        } catch (err) { setResultatTest(null); }
        finally { setLoadingResultat(false); }
    };

    const genererOrdonnance = async (e) => {
        e.preventDefault();
        setSubmittingOrdo(true);
        try {
            const params = new URLSearchParams({ diagnostic, medicaments });
            await fetchApi(`/medecins/demandes/${selectedDemande.id}/ordonnance?${params.toString()}`, { method: 'POST' });
            showNotif('success', 'Ordonnance generee et envoyee au patient !');
            setSelectedDemande(null);
            chargerDonnees();
        } catch (err) { showNotif('error', 'Erreur: ' + err.message); }
        finally { setSubmittingOrdo(false); }
    };

    const showNotif = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const getScoreColor = (score) => {
        if (!score) return 'slate';
        if (score >= 14) return 'emerald';
        if (score >= 10) return 'blue';
        if (score >= 7) return 'amber';
        return 'red';
    };

    const getScoreLabel = (score) => {
        if (!score) return '—';
        if (score >= 14) return 'Vision excellente';
        if (score >= 10) return 'Bonne vision';
        if (score >= 7) return 'Vision moyenne';
        return 'Vision faible';
    };

    const getTodayFormatted = () => new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (!user) return null;

    return (
        <>
            <Head>
                <title>Espace Medecin – OeilDirect</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
            </Head>

            <div className="bg-slate-50 text-slate-900 font-sans min-h-screen">
                <aside className="h-screen w-64 fixed left-0 top-0 z-40 bg-slate-100 flex flex-col gap-y-2 py-8 px-4 font-medium tracking-tight overflow-y-auto border-r border-slate-200">
                    <div className="mb-8 px-4 flex items-center gap-3">
                        <img src="/logos/logo_cabinet.png" alt="OeilDirect" className="h-14 w-auto object-contain scale-[3.5] origin-left" style={{mixBlendMode:'multiply'}}/>
                    </div>
                    <nav className="flex-1 space-y-1">
                        <SameRouteScrollLink href="/medecin" className="bg-white text-sky-700 font-bold rounded-lg shadow-sm px-4 py-3 flex items-center gap-3">
                            <span className="material-symbols-outlined text-[22px]" style={{fontVariationSettings:"'FILL' 1"}}>dashboard</span>Dashboard
                        </SameRouteScrollLink>
                        <Link href="/medecin/patients" className="text-slate-500 px-4 py-3 flex items-center gap-3 hover:bg-slate-200 transition-colors rounded-lg">
                            <span className="material-symbols-outlined text-[22px]">group</span>Patients
                        </Link>
                        <Link href="/medecin/dossiers" className="text-slate-500 px-4 py-3 flex items-center gap-3 hover:bg-slate-200 transition-colors rounded-lg">
                            <span className="material-symbols-outlined text-[22px]">description</span>Dossiers Medicaux
                        </Link>
                        <Link href="/medecin/disponibilite" className="text-slate-500 px-4 py-3 flex items-center gap-3 hover:bg-slate-200 transition-colors rounded-lg">
                            <span className="material-symbols-outlined text-[22px]">event_available</span>Disponibilite
                        </Link>
                        <button onClick={() => document.getElementById('chat-toggle-btn')?.click()} className="w-full text-slate-500 px-4 py-3 flex items-center gap-3 hover:bg-slate-200 transition-colors rounded-lg">
                            <span className="material-symbols-outlined text-[22px]">chat</span>
                            <span className="flex-1 text-left">Chat</span>
                            <span className="chat-sidebar-badge badge-blink w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black items-center justify-center border border-white shadow hidden" style={{display:'none'}}></span>
                        </button>
                    </nav>
                    <div className="mt-auto pt-6 border-t border-slate-200 space-y-1">
                        <button onClick={() => logout(router)} className="w-full text-slate-500 px-4 py-3 flex items-center gap-3 hover:bg-red-50 hover:text-red-600 transition-colors rounded-lg">
                            <span className="material-symbols-outlined text-[22px]">logout</span>Deconnexion
                        </button>
                    </div>
                </aside>

                <header className="fixed top-0 right-0 left-64 h-20 z-30 bg-white/80 backdrop-blur-md flex items-center justify-between px-10 border-b border-slate-200">
                    <h2 className="text-lg font-black text-slate-900">Portail OeilDirect</h2>
                    <div className="flex items-center gap-4">
                        <NotificationBell user={user}/>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden xl:block">
                                <p className="text-xs font-bold text-slate-900 leading-none">Dr. {user.nom}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{user.specialite || 'Ophtalmologue'}</p>
                            </div>
                            <Link href="/medecin/profil" className="block">
                                {user.photoProfil ? (
                                    <img
                                        src={user.photoProfil}
                                        alt="Profil"
                                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold border-2 border-white shadow-sm">
                                        {user.nom?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="ml-64 pt-24 p-10 space-y-10 min-h-screen">
                    <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Tableau de bord</p>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Bonjour, <span className="text-sky-700">Dr. {user.nom}</span></h1>
                            <p className="text-slate-500">Consultez les resultats de tests et generez les ordonnances.</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                            <span className="material-symbols-outlined text-sky-700 bg-sky-50 p-2 rounded-lg">calendar_month</span>
                            <div className="pr-4">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Aujourd hui</p>
                                <p className="text-sm font-bold text-slate-900 capitalize">{getTodayFormatted()}</p>
                            </div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border-l-4 border-sky-600 shadow-sm flex flex-col justify-between h-36">
                            <span className="material-symbols-outlined text-sky-700">inbox</span>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900">{stats.aValider}</h3>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Demandes a valider</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border-l-4 border-amber-500 shadow-sm flex flex-col justify-between h-36">
                            <span className="material-symbols-outlined text-amber-500">assignment_late</span>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900">{stats.testsEnAttente}</h3>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Resultats a analyser</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-sky-600 to-sky-800 p-6 rounded-xl shadow-lg text-white flex flex-col justify-between h-36">
                            <span className="material-symbols-outlined opacity-80">verified</span>
                            <div>
                                <h3 className="text-3xl font-black">98%</h3>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mt-1">Disponibilite</p>
                            </div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Demandes a valider */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Demandes a Valider</h2>
                                    <p className="text-sm text-slate-500">Transmises par le secretariat</p>
                                </div>
                                <button onClick={chargerDonnees} className="text-sky-700 text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">refresh</span>Actualiser
                                </button>
                            </div>
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="py-10 text-center text-slate-400 text-sm">Chargement...</div>
                                ) : demandesAValider.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <span className="material-symbols-outlined text-5xl text-slate-200 block mb-3">inbox</span>
                                        <p className="text-slate-500">Aucune demande en attente</p>
                                    </div>
                                ) : demandesAValider.map(demande => (
                                    <div key={demande.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                                                    {demande.patient?.nom?.charAt(0) || 'P'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{demande.patient?.nom}</p>
                                                    <p className="text-xs text-slate-500 truncate max-w-[180px]">{demande.motif}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-400">#{demande.id}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => prescrireTest(demande.id)} className="flex-1 px-3 py-2 bg-sky-100 text-sky-700 rounded-lg text-xs font-bold hover:bg-sky-200 transition-colors">
                                                Envoyer Test Visuel
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resultats de tests a analyser */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Resultats de Tests</h2>
                                    <p className="text-sm text-slate-500">Analyses en attente d ordonnance</p>
                                </div>
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">{stats.testsEnAttente} en attente</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {loading ? (
                                    <div className="py-10 text-center text-slate-400 text-sm">Chargement...</div>
                                ) : testsTermines.length === 0 ? (
                                    <div className="py-10 text-center">
                                        <span className="material-symbols-outlined text-5xl text-slate-200 block mb-3">assignment_turned_in</span>
                                        <p className="text-slate-500">Aucun resultat en attente</p>
                                    </div>
                                ) : testsTermines.map(demande => (
                                    <div key={demande.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-amber-600">assignment</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{demande.patient?.nom}</p>
                                                <p className="text-xs text-slate-500 truncate max-w-[180px]">{demande.motif}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => ouvrirModalResultat(demande)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-sky-700 text-white rounded-lg text-xs font-bold hover:bg-sky-800 transition-colors">
                                            <span className="material-symbols-outlined text-sm">visibility</span>
                                            Voir & Ordonner
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </main>

                {/* MODAL RESULTAT + ORDONNANCE */}
                {selectedDemande && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedDemande(null)}></div>
                        <div className="bg-white rounded-2xl shadow-2xl relative w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
                            
                            {/* Header */}
                            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
                                        <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings:"'FILL' 1"}}>assignment</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">Resultat & Ordonnance</h3>
                                        <p className="text-xs text-slate-500">Patient : {selectedDemande.patient?.nom} — Dossier #{selectedDemande.id}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedDemande(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Resultat du test */}
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Resultat du test visuel</h4>
                                    {loadingResultat ? (
                                        <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-400">
                                            <span className="material-symbols-outlined animate-spin block mb-2">progress_activity</span>
                                            Chargement du resultat...
                                        </div>
                                    ) : resultatTest ? (
                                        <div className={`p-6 rounded-xl border-2 ${
                                            resultatTest.score >= 14 ? 'bg-emerald-50 border-emerald-200' :
                                            resultatTest.score >= 10 ? 'bg-blue-50 border-blue-200' :
                                            resultatTest.score >= 7 ? 'bg-amber-50 border-amber-200' :
                                            'bg-red-50 border-red-200'
                                        }`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <p className={`text-4xl font-black ${
                                                        resultatTest.score >= 14 ? 'text-emerald-700' :
                                                        resultatTest.score >= 10 ? 'text-blue-700' :
                                                        resultatTest.score >= 7 ? 'text-amber-700' : 'text-red-700'
                                                    }`}>{resultatTest.score}/15</p>
                                                    <p className="text-sm font-bold text-slate-700 mt-1">{getScoreLabel(resultatTest.score)}</p>
                                                </div>
                                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                                    resultatTest.score >= 14 ? 'bg-emerald-100' :
                                                    resultatTest.score >= 10 ? 'bg-blue-100' :
                                                    resultatTest.score >= 7 ? 'bg-amber-100' : 'bg-red-100'
                                                }`}>
                                                    <span className={`material-symbols-outlined text-3xl ${
                                                        resultatTest.score >= 14 ? 'text-emerald-600' :
                                                        resultatTest.score >= 10 ? 'text-blue-600' :
                                                        resultatTest.score >= 7 ? 'text-amber-600' : 'text-red-600'
                                                    }`} style={{fontVariationSettings:"'FILL' 1"}}>
                                                        {resultatTest.score >= 7 ? 'visibility' : 'visibility_off'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-3 p-3 bg-white/60 rounded-lg">
                                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Analyse IA</p>
                                                <p className="text-sm text-slate-700">
                                                    {resultatTest.score != null && !Number.isNaN(Number(resultatTest.score))
                                                        ? getMessageAnalyseIA(Number(resultatTest.score))
                                                        : (resultatTest.recommandationsIA || '—')}
                                                </p>
                                            </div>
                                            {resultatTest.dateRealisation && (
                                                <p className="text-xs text-slate-500 mt-3">
                                                    Test realise le {new Date(resultatTest.dateRealisation).toLocaleDateString('fr-FR')}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-500">
                                            Resultat non disponible.
                                        </div>
                                    )}
                                </div>

                                {/* Formulaire ordonnance */}
                                {resultatTest && (
                                    <form onSubmit={genererOrdonnance} className="space-y-5">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 pt-2 border-t border-slate-100">Rediger l ordonnance</h4>
                                        
                                        <div>
                                            <label className="block text-sm font-bold text-slate-900 mb-2">Diagnostic *</label>
                                            <textarea rows={3} required value={diagnostic} onChange={e => setDiagnostic(e.target.value)}
                                                className="w-full text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-700/20 focus:border-sky-700 p-4 bg-slate-50 focus:bg-white transition-all resize-none"
                                                placeholder="Ex: Le patient presente une myopie moderee. Consultation approfondie recommandee..." />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-900 mb-2">
                                                Medicaments & Prescriptions
                                                {resultatTest.score >= 14 && <span className="ml-2 text-emerald-600 font-normal text-xs">(vision excellente — probablement inutile)</span>}
                                                {resultatTest.score < 7 && <span className="ml-2 text-amber-600 font-normal text-xs">(correction recommandee)</span>}
                                            </label>
                                            <textarea rows={4} value={medicaments} onChange={e => setMedicaments(e.target.value)}
                                                className="w-full text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-700/20 focus:border-sky-700 p-4 bg-slate-50 focus:bg-white transition-all resize-none"
                                                placeholder={"Ex:\n- Lunettes correctrices: Sphere -1.50 OD, -1.00 OG\n- Collyres lubrifiants: Hyabak 0.15% — 3x/jour\n- Controle dans 6 mois"} />
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button type="button" onClick={() => setSelectedDemande(null)}
                                                className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors">
                                                Annuler
                                            </button>
                                            <button type="submit" disabled={submittingOrdo}
                                                className="flex-[2] py-3 bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-700/20 flex items-center justify-center gap-2 disabled:opacity-60">
                                                <span className="material-symbols-outlined text-base">send</span>
                                                {submittingOrdo ? 'Envoi...' : 'Generer & Envoyer au patient'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* NOTIFICATION */}
                {notification && (
                    <div className={`fixed bottom-10 right-10 p-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 border ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        <span className="material-symbols-outlined text-2xl">{notification.type === 'success' ? 'check_circle' : 'error'}</span>
                        <p className="font-bold text-sm pr-4">{notification.message}</p>
                        <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                )}
            </div>
            <ChatPanel user={user} />
        </>
    );
}