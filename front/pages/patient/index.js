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
import { getMessageAnalyseIA } from '../../lib/scoreTestVisuel';

const getStatusInfo = (statut) => {
    const map = {
        'EN_ATTENTE_SECRETAIRE': { label: 'En attente – Secretariat', cls: 'bg-yellow-100 text-yellow-800', step: 1 },
        'EN_ATTENTE_MEDECIN': { label: 'En attente – Medecin', cls: 'bg-orange-100 text-orange-800', step: 2 },
        'TEST_PRESCRIT': { label: 'Test visuel requis', cls: 'bg-blue-100 text-blue-800', step: 3 },
        'TEST_TERMINE': { label: 'Resultat disponible', cls: 'bg-purple-100 text-purple-800', step: 4 },
        'ORDONNANCE_DELIVREE': { label: 'Ordonnance disponible', cls: 'bg-emerald-100 text-emerald-700', step: 5 },
    };
    return map[statut] || { label: statut, cls: 'bg-slate-100 text-slate-500', step: 0 };
};

const getScoreColor = (s) => s >= 14 ? 'emerald' : s >= 10 ? 'blue' : s >= 7 ? 'amber' : 'red';
const getScoreLabel = (s) => s >= 14 ? 'Excellent' : s >= 10 ? 'Bon' : s >= 7 ? 'Moyen' : 'Faible';

export default function PatientDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [demandes, setDemandes] = useState([]);
    const [resultatsTests, setResultatsTests] = useState([]);
    const [ordonnances, setOrdonnances] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const u = getUser();
        if (!u || u.role !== 'PATIENT') { router.push('/connexion'); return; }
        setUser(u);
        chargerDonnees(u.id);
    }, []);

    const chargerDonnees = async (patientId) => {
        setLoading(true);
        try {
            const [d, r, o] = await Promise.all([
                fetchApi(`/patients/${patientId}/demandes`),
                fetchApi(`/patients/${patientId}/resultats-tests`).catch(() => []),
                fetchApi(`/patients/${patientId}/ordonnances`).catch(() => []),
            ]);
            const demandesSorted = (Array.isArray(d) ? d : []).slice().sort((a, b) => {
                const ta = a?.dateCreation ? new Date(a.dateCreation).getTime() : 0;
                const tb = b?.dateCreation ? new Date(b.dateCreation).getTime() : 0;
                return tb - ta;
            });
            const resultatsSorted = (Array.isArray(r) ? r : []).slice().sort((a, b) => {
                const ta = a?.dateRealisation ? new Date(a.dateRealisation).getTime() : 0;
                const tb = b?.dateRealisation ? new Date(b.dateRealisation).getTime() : 0;
                return tb - ta;
            });
            const ordSorted = (Array.isArray(o) ? o : []).slice().sort((a, b) => {
                const ta = a?.dateCreation ? new Date(a.dateCreation).getTime() : 0;
                const tb = b?.dateCreation ? new Date(b.dateCreation).getTime() : 0;
                return tb - ta;
            });

            setDemandes(demandesSorted);
            setResultatsTests(resultatsSorted);
            setOrdonnances(ordSorted);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const telechargerOrdonnance = async (ord) => {
        try {
            const scoreVal = ord?.score ?? 0;
            const dateStr = ord?.dateCreation
                ? new Date(ord.dateCreation).toLocaleDateString('fr-FR')
                : new Date().toLocaleDateString('fr-FR');
            const praticien = ord?.demande?.praticien;
            const prescripteurNom = praticien
                ? `Dr. ${[praticien.prenom, praticien.nom].filter(Boolean).join(' ') || praticien.nom || '—'}`
                : 'Dr. —';

            // Try to extract doctor diagnostic / reco from contenuMedical
            const contenu = ord?.contenuMedical || '';
            const lines = contenu.split('\n');
            const scoreIdx = lines.findIndex(l => l.toLowerCase().includes('score obtenu'));
            const diag = scoreIdx >= 0 ? lines.slice(0, scoreIdx).join('\n').trim() : contenu.trim();
            const reco = scoreIdx >= 0 ? lines.slice(scoreIdx + 1).join('\n').trim() : '';

            let label, title, corr, color;
            if (scoreVal >= 14) { label = 'Excellent'; title = 'Acuité visuelle excellente'; corr = null; color = 'emerald'; }
            else if (scoreVal >= 10) { label = 'Bon'; title = 'Bonne acuité visuelle'; corr = 'Correction estimée : sphère -0.50 à -1.00 dioptrie'; color = 'blue'; }
            else if (scoreVal >= 7) { label = 'Moyen'; title = 'Acuité visuelle moyenne'; corr = 'Correction estimée : sphère -1.00 à -2.50 dioptries'; color = 'amber'; }
            else { label = 'Faible'; title = 'Acuité visuelle insuffisante'; corr = 'Correction estimée : sphère au-delà de -2,50 dioptries'; color = 'red'; }

            await generateOrdonnancePdf({
                score: scoreVal,
                label,
                title,
                diag: diag || '—',
                reco: reco || '—',
                corr,
                color,
                date: dateStr,
                medicaments: ord?.medicaments || '',
                prescripteurNom,
            }, user);
        } catch (e) {
            console.error('Erreur PDF:', e);
            alert('Erreur lors de la génération du PDF.');
        }
    };

    const prochainRdv = demandes.find(d => d.statut !== 'ORDONNANCE_DELIVREE');

    if (!user) return null;

    return (
        <>
            <Head>
                <title>Tableau de bord – OeilDirect</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;500;700;900&display=swap" rel="stylesheet"/>
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
            </Head>

            <div className="bg-slate-50 min-h-screen" style={{fontFamily:'Inter, sans-serif'}}>
                <header className="bg-white/50 backdrop-blur-md shadow-sm sticky top-0 z-50 flex items-center justify-between px-8 h-16 w-full">
                    <img src="/logos/logo_cabinet.png" alt="OeilDirect" className="h-14 w-auto object-contain scale-[3.5] origin-left" style={{mixBlendMode:'multiply'}}/>
                    <div className="hidden md:flex items-center gap-8">
                        <nav className="flex gap-6">
                            <SameRouteScrollLink href="/patient" className="text-sky-700 font-bold border-b-2 border-sky-700 pb-0.5 text-sm">Tableau de bord</SameRouteScrollLink>
                            <Link href="/patient/medecins" className="text-slate-500 font-medium hover:text-sky-600 text-sm">Trouver un medecin</Link>
                            <Link href="/patient/documents" className="text-slate-500 font-medium hover:text-sky-600 text-sm">Documents</Link>
                        </nav>
                        <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
                            <NotificationBell user={user}/>
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
                    <aside className="hidden md:flex h-[calc(100vh-4rem)] w-64 fixed left-0 top-16 flex-col gap-2 p-4 bg-slate-100/80 border-r border-slate-200 z-40 pointer-events-auto">
                        <nav className="space-y-1">
                            <SameRouteScrollLink href="/patient" className="flex items-center gap-3 py-3 px-4 bg-white text-sky-700 shadow-sm rounded-lg mx-2 cursor-pointer text-sm font-medium hover:bg-sky-50 transition-all">
                                <span className="material-symbols-outlined text-xl">dashboard</span>Tableau de bord
                            </SameRouteScrollLink>
                            <Link href="/patient/medecins" className="flex items-center gap-3 py-3 px-4 text-slate-600 hover:bg-slate-200/50 mx-2 rounded-lg text-sm font-medium" style={{animation:'none',transition:'background-color 0.15s'}}>
                                <span className="material-symbols-outlined text-xl">local_hospital</span>Trouver un médecin
                            </Link>
                            <Link href="/patient/documents" className="flex items-center gap-3 py-3 px-4 text-slate-600 hover:bg-slate-200/50 mx-2 rounded-lg transition-all text-sm font-medium">
                                <span className="material-symbols-outlined text-xl">folder_open</span>Documents
                            </Link>
                                            <button onClick={() => document.getElementById('chat-toggle-btn')?.click()} className="w-full flex items-center gap-3 py-3 px-4 text-slate-600 hover:bg-slate-200/50 mx-2 rounded-lg transition-all text-sm font-medium">
                                <span className="material-symbols-outlined text-xl">chat</span>
                                <span className="flex-1 text-left">Chat</span>
                                <span className="chat-sidebar-badge badge-blink w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black items-center justify-center border border-white shadow" style={{display:'none'}}></span>
                            </button>
                            {ordonnances.length > 0 && (
                                <Link href="/patient/lunettes" className="flex items-center gap-3 py-3 px-4 text-slate-600 hover:bg-slate-200/50 mx-2 rounded-lg transition-all text-sm font-medium">
                                    <span className="material-symbols-outlined text-xl">visibility</span>
                                    <span className="flex-1">Trouver vos lunettes</span>
                                </Link>
                            )}
                        </nav>
                        <div className="mt-8 px-2">
                            <Link href="/patient/medecins">
                                <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm">
                                    <span className="material-symbols-outlined text-sm">add</span>Prendre RDV
                                </button>
                            </Link>
                        </div>
                        <div className="mt-auto pb-4">
                            <button onClick={() => logout(router)} className="w-full flex items-center gap-3 py-3 px-4 text-red-500 hover:bg-red-50 mx-2 rounded-lg transition-all text-sm font-medium">
                                <span className="material-symbols-outlined text-xl">logout</span>Deconnexion
                            </button>
                        </div>
                    </aside>

                    <main className="md:ml-64 p-8 pt-6 w-full">
                        <div className="max-w-7xl mx-auto space-y-8">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Tableau de bord patient</span>
                                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-1">Bonjour, {user.prenom || user.nom} !</h1>
                                    <p className="text-slate-500 mt-2">Voici un apercu de votre suivi ophtalmologique.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Prochain RDV */}
                                <div className="lg:col-span-8 bg-blue-600 rounded-xl overflow-hidden shadow-xl flex flex-col md:flex-row relative group">
                                    <div className="p-8 relative z-10 flex-1">
                                        <div className="inline-block px-3 py-1 bg-white/20 rounded-lg text-white text-[10px] font-bold tracking-wider uppercase mb-6">
                                            Prochain rendez-vous
                                        </div>
                                        {loading ? (
                                            <div className="text-white/60 text-sm">Chargement...</div>
                                        ) : prochainRdv ? (
                                            <>
                                                <div className="flex items-center gap-6 text-white">
                                                    <div className="text-center bg-white/10 p-4 rounded-xl min-w-[90px]">
                                                        <p className="text-xs uppercase font-bold opacity-80">RDV</p>
                                                        <p className="text-3xl font-black">#{demandes.indexOf(prochainRdv) + 1}</p>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-bold">Consultation ophtalmologique</h3>
                                                        <p className="opacity-90 flex items-center gap-2 mt-1 text-sm">
                                                            <span className="material-symbols-outlined text-sm">person</span>
                                                            Dr. {prochainRdv.praticien?.nom || 'Medecin assigne'}
                                                        </p>
                                                        <p className="opacity-70 text-sm mt-1">{prochainRdv.motif}</p>
                                                        <div className="mt-2">
                                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white">
                                                                {getStatusInfo(prochainRdv.statut).label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {prochainRdv.statut === 'TEST_PRESCRIT' && (
                                                    <div className="mt-6">
                                                        <Link href={`/patient/test/${prochainRdv.id}`}>
                                                            <button className="bg-white text-blue-700 font-bold px-6 py-3 rounded-lg hover:scale-105 active:scale-95 transition-all text-sm">
                                                                Demarrer le test visuel
                                                            </button>
                                                        </Link>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-white">
                                                <h3 className="text-2xl font-bold mb-2">Aucun RDV en cours</h3>
                                                <Link href="/patient/medecins">
                                                    <button className="mt-4 bg-white text-blue-700 font-bold px-6 py-3 rounded-lg text-sm">Prendre un RDV</button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:w-1/3 h-48 md:h-auto hidden md:block relative overflow-hidden">
                                        <img alt="Consultation" className="absolute inset-0 w-full h-full object-cover grayscale brightness-75 group-hover:scale-110 transition-transform duration-700"
                                            src="https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=600&q=80"/>
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-transparent to-transparent"></div>
                                    </div>
                                </div>

                                {/* Actions rapides */}
                                <div className="lg:col-span-4 bg-white rounded-xl p-6 shadow-sm space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Actions Rapides</h3>
                                    <Link href="/patient/medecins" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 rounded-lg group transition-all block">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <span className="material-symbols-outlined">calendar_add_on</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">Prendre rendez-vous</p>
                                                <p className="text-xs text-slate-500">Trouver un specialiste</p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                                    </Link>
                                </div>

                                {/* Historique */}
                                <div className="lg:col-span-7 bg-white rounded-xl p-8 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Historique Recent</h3>
                                        <button onClick={() => chargerDonnees(user.id)} className="text-xs font-bold text-blue-600 hover:underline">Actualiser</button>
                                    </div>
                                    {loading ? (
                                        <div className="text-center py-8 text-slate-400 text-sm">Chargement...</div>
                                    ) : demandes.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 text-sm">Aucune demande.</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {demandes.slice(0, 5).map((d, idx) => {
                                                const { label, cls } = getStatusInfo(d.statut);
                                                return (
                                                    <div key={d.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                                                <span className="material-symbols-outlined text-lg">assignment</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 text-sm">RDV #{idx + 1}</p>
                                                                <p className="text-xs text-slate-500">Dr. {d.praticien?.nom || '—'} &bull; {d.motif?.slice(0, 30)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase ${cls}`}>{label}</span>
                                                            {d.statut === 'TEST_PRESCRIT' && (
                                                                <Link href={`/patient/test/${d.id}`}>
                                                                    <button className="block mt-1 text-xs text-blue-600 font-bold hover:underline">Demarrer</button>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Resultats de tests + Ordonnances */}
                                <div className="lg:col-span-5 space-y-6">
                                    {/* Resultats de test */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Mes Resultats de Test</h3>
                                            <span className="material-symbols-outlined text-slate-400">visibility</span>
                                        </div>
                                        {loading ? (
                                            <div className="text-center py-4 text-slate-400 text-sm">Chargement...</div>
                                        ) : resultatsTests.length === 0 ? (
                                            <div className="text-center py-6 text-slate-400 text-sm">
                                                <span className="material-symbols-outlined text-3xl block mb-2">visibility</span>
                                                Aucun test effectue.
                                            </div>
                                        ) : resultatsTests.map((test, idx) => {
                                            const score = test.score ?? 0;
                                            const color = getScoreColor(score);
                                            const label = getScoreLabel(score);
                                            const date = test.dateRealisation ? new Date(test.dateRealisation).toLocaleDateString('fr-FR') : '—';
                                            const colorMap = { emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700', blue: 'bg-blue-50 border-blue-200 text-blue-700', amber: 'bg-amber-50 border-amber-200 text-amber-700', red: 'bg-red-50 border-red-200 text-red-700' };
                                            return (
                                                <div key={idx} className={`p-4 rounded-xl border-2 ${colorMap[color]} flex items-center gap-3 mb-3`}>
                                                    <div className="text-center min-w-[60px]">
                                                        <p className="text-2xl font-black">{score}/15</p>
                                                        <p className="text-[10px] font-bold uppercase">{label}</p>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold">Test visuel – {date}</p>
                                                        {(test.score != null && !Number.isNaN(Number(test.score)) || test.recommandationsIA) && (
                                                            <p className="text-xs mt-1 opacity-80 truncate" title={test.score != null && !Number.isNaN(Number(test.score)) ? getMessageAnalyseIA(Number(test.score)) : test.recommandationsIA}>
                                                                {test.score != null && !Number.isNaN(Number(test.score)) ? getMessageAnalyseIA(Number(test.score)) : test.recommandationsIA}
                                                            </p>
                                                        )}
                                                        <p className="text-[10px] mt-1 font-bold uppercase opacity-60">
                                                            {test.demande?.statut === 'ORDONNANCE_DELIVREE' ? 'Ordonnance generee' : 'En attente du medecin'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Ordonnances */}
                                    <div className="bg-white rounded-xl p-6 shadow-sm">
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Mes Ordonnances</h3>
                                            <span className="material-symbols-outlined text-slate-400">description</span>
                                        </div>
                                        {loading ? (
                                            <div className="text-center py-4 text-slate-400 text-sm">Chargement...</div>
                                        ) : ordonnances.length === 0 ? (
                                            <div className="text-center py-6 text-slate-400 text-sm">
                                                <span className="material-symbols-outlined text-3xl block mb-2">description</span>
                                                Aucune ordonnance disponible.
                                            </div>
                                        ) : ordonnances.map((ord, idx) => {
                                            const score = ord.score ?? 0;
                                            const date = ord.dateCreation ? new Date(ord.dateCreation).toLocaleDateString('fr-FR') : '—';
                                            return (
                                                <div key={idx} className="p-4 rounded-xl border-2 border-blue-100 bg-blue-50 flex items-center gap-3 mb-3 group hover:border-blue-300 transition-colors">
                                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <span className="material-symbols-outlined" style={{fontVariationSettings:"'FILL' 1"}}>description</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-900">Ordonnance – Score {score}/15</p>
                                                        <p className="text-[10px] text-blue-600 font-bold uppercase">Dr. {ord.demande?.praticien?.nom} &bull; {date}</p>
                                                        {ord.medicaments && (
                                                            <p className="text-xs text-slate-600 mt-1 truncate">Medicaments: {ord.medicaments.split('\n')[0]}</p>
                                                        )}
                                                    </div>
                                                    <button onClick={() => telechargerOrdonnance(ord)}
                                                        className="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">
                                                        <span className="material-symbols-outlined text-base">print</span>PDF
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
            <ChatPanel user={user} />
        </>
    );
}