import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getUser, logout } from '../../lib/useAuth';
import NotificationBell from '../../components/NotificationBell';
import SameRouteScrollLink from '../../components/SameRouteScrollLink';
import { fetchApi } from '../../lib/api';
import { generateOrdonnancePdf } from '../../lib/generateOrdonnancePdf';

function buildOrdonnanceData(ord, medecinNom) {
  const scoreVal = ord?.score ?? 0;
  const dateStr = ord?.dateCreation
    ? new Date(ord.dateCreation).toLocaleDateString('fr-FR')
    : new Date().toLocaleDateString('fr-FR');
  let label, title, diag, reco, corr;
  if (scoreVal >= 14) {
    label = 'Excellent'; title = 'Acuite visuelle excellente';
    diag = ord.contenuMedical || 'Score 14-15/15 - resultat tres satisfaisant.';
    reco = 'Examen de controle recommande dans 2 ans.'; corr = null;
  } else if (scoreVal >= 10) {
    label = 'Bon'; title = 'Bonne acuite visuelle';
    diag = ord.contenuMedical || 'Score 10-13/15 - bon niveau de reponses.';
    reco = 'Consultation ophtalmologique conseillee si symptomes.';
    corr = 'Correction estimee : sphere -0.50 a -1.00 dioptrie';
  } else if (scoreVal >= 7) {
    label = 'Moyen'; title = 'Acuite visuelle moyenne';
    diag = ord.contenuMedical || 'Score 7-9/15 - niveau moyen.';
    reco = 'Consultation ophtalmologique dans les 3 mois.';
    corr = 'Correction estimee : sphere -1.00 a -2.50 dioptries';
  } else {
    label = 'Faible'; title = 'Acuite visuelle insuffisante';
    diag = ord.contenuMedical || 'Score sous 7/15 - resultat faible.';
    reco = 'Consultation ophtalmologique URGENTE.';
    corr = 'Correction estimee : sphere au-dela de -2,50 dioptries';
  }
  return {
    score: scoreVal, label, title, diag, reco, corr,
    medicaments: ord.medicaments || '',
    date: dateStr,
    prescripteurNom: medecinNom || 'Dr. Medecin',
  };
}

export default function MedecinDossiers() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ordonnances, setOrdonnances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'MEDECIN') { router.push('/connexion'); return; }
    setUser(u);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchApi('/medecins/' + user.id + '/ordonnances')
      .then(data => setOrdonnances(Array.isArray(data) ? data : []))
      .catch(() => setOrdonnances([]))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = ordonnances.filter(o =>
    ((o.patientNom || '') + ' ' + (o.patientPrenom || '')).toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const getScoreInfo = (score) => {
    if (score === null || score === undefined) return { label: '-', colorClass: 'bg-slate-100 text-slate-500' };
    if (score >= 14) return { label: 'Excellent', colorClass: 'bg-emerald-50 text-emerald-700' };
    if (score >= 10) return { label: 'Bon', colorClass: 'bg-blue-50 text-blue-700' };
    if (score >= 7) return { label: 'Moyen', colorClass: 'bg-amber-50 text-amber-700' };
    return { label: 'Faible', colorClass: 'bg-red-50 text-red-700' };
  };

  const handleDownload = async (ord) => {
    setDownloading(ord.id);
    try {
      const data = buildOrdonnanceData(ord, 'Dr. ' + (user?.nom || ''));
      const patient = { nom: (ord.patientPrenom || '') + ' ' + (ord.patientNom || ''), email: '', id: ord.demandeId };
      await generateOrdonnancePdf(data, patient);
    } catch (e) { console.error(e); }
    setDownloading(null);
  };

  if (!user) return null;

  return (
    <>
      <Head><title>Dossiers Medicaux - OeilDirect</title></Head>
      <div className="bg-slate-50 min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>

        {/* MODAL VISUALISATION */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-7 py-5 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Ordonnance #{selected.id}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{selected.patientPrenom} {selected.patientNom} &bull; {formatDate(selected.dateCreation)}</p>
                </div>
                <button onClick={() => setSelected(null)} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="px-7 py-6 space-y-5">
                {/* Score */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className={"w-16 h-16 rounded-xl flex flex-col items-center justify-center font-black text-2xl " + (selected.score >= 14 ? 'bg-emerald-100 text-emerald-700' : selected.score >= 10 ? 'bg-blue-100 text-blue-700' : selected.score >= 7 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
                    {selected.score ?? '-'}
                    <span className="text-xs font-medium">/15</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg">{getScoreInfo(selected.score).label}</p>
                    <p className="text-sm text-slate-500">{selected.score >= 14 ? 'Vision excellente' : selected.score >= 10 ? 'Bonne vision' : selected.score >= 7 ? 'Vision moyenne' : 'Vision faible'}</p>
                  </div>
                </div>

                {/* Diagnostic */}
                {selected.contenuMedical && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Contenu Medical / Diagnostic</p>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {selected.contenuMedical}
                    </div>
                  </div>
                )}

                {/* Medicaments */}
                {selected.medicaments && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Traitement / Medicaments</p>
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {selected.medicaments}
                    </div>
                  </div>
                )}

                {/* Info demande */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="text-xs text-slate-400 font-bold uppercase">Patient</p>
                    <p className="font-semibold text-slate-800 mt-1">{selected.patientPrenom} {selected.patientNom}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="text-xs text-slate-400 font-bold uppercase">Date</p>
                    <p className="font-semibold text-slate-800 mt-1">{formatDate(selected.dateCreation)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-7 py-5 border-t border-slate-200">
                <button onClick={() => setSelected(null)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Fermer
                </button>
                <button
                  onClick={() => handleDownload(selected)}
                  disabled={downloading === selected.id}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-sky-600 to-sky-800 text-white text-sm font-bold flex items-center gap-2 shadow hover:shadow-md transition-all disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  {downloading === selected.id ? 'Generation...' : 'Telecharger PDF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIDEBAR */}
        <aside className="h-screen w-64 fixed left-0 top-0 z-40 bg-slate-100 flex flex-col gap-y-2 py-8 px-4 font-medium tracking-tight overflow-y-auto border-r border-slate-200">
          <div className="mb-8 px-4 flex items-center gap-3">
            <img src="/logos/logo_cabinet.png" alt="OeilDirect" className="h-14 w-auto object-contain scale-[3.5] origin-left" style={{ mixBlendMode: 'multiply' }} />
          </div>
          <nav className="flex-1 space-y-1">
            <SameRouteScrollLink href="/medecin" className="text-slate-500 px-4 py-3 flex items-center gap-3 hover:bg-slate-200 transition-colors rounded-lg">
              <span className="material-symbols-outlined text-[22px]">dashboard</span>Dashboard
            </SameRouteScrollLink>
            <Link href="/medecin/patients" className="text-slate-500 px-4 py-3 flex items-center gap-3 hover:bg-slate-200 transition-colors rounded-lg">
              <span className="material-symbols-outlined text-[22px]">group</span>Patients
            </Link>
            <div className="bg-white text-sky-700 font-bold px-4 py-3 flex items-center gap-3 rounded-lg shadow-sm cursor-default">
              <span className="material-symbols-outlined text-[22px]">description</span>Dossiers Medicaux
            </div>
            <Link href="/medecin/disponibilite" className="text-slate-500 px-4 py-3 flex items-center gap-3 hover:bg-slate-200 transition-colors rounded-lg">
              <span className="material-symbols-outlined text-[22px]">event_available</span>Disponibilite
            </Link>
          </nav>
          <div className="mt-auto pt-6 border-t border-slate-200 space-y-1">
            <button onClick={() => logout(router)} className="w-full text-slate-500 px-4 py-3 flex items-center gap-3 hover:bg-red-50 hover:text-red-600 transition-colors rounded-lg">
              <span className="material-symbols-outlined text-[22px]">logout</span>Deconnexion
            </button>
          </div>
        </aside>

        {/* HEADER */}
        <header className="fixed top-0 right-0 left-64 h-20 z-30 bg-white/80 backdrop-blur-md flex items-center justify-between px-10 border-b border-slate-200">
          <h2 className="text-lg font-black text-slate-900">Portail OeilDirect</h2>
          <div className="flex items-center gap-4">
            <NotificationBell user={user} />
            <div className="flex items-center gap-3">
              <div className="text-right hidden xl:block">
                <p className="text-xs font-bold text-slate-900 leading-none">Dr. {user.nom}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{user.specialite || 'Ophtalmologue'}</p>
              </div>
              <Link href="/medecin/profil" className="block">
                {user.photoProfil ? (
                  <img src={user.photoProfil} alt="Profil" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold border-2 border-white shadow-sm">
                    {user.nom?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="ml-64 pt-24 p-10 min-h-screen">
          <div className="mb-8 flex items-end justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Archives</p>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dossiers Medicaux</h1>
              <p className="text-slate-500">{ordonnances.length} ordonnance{ordonnances.length !== 1 ? 's' : ''} generee{ordonnances.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input
                type="text"
                placeholder="Rechercher un patient..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 w-72"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-200 block mb-4">folder_off</span>
              <p className="text-slate-500 text-lg font-medium">Aucune ordonnance trouvee</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(o => {
                const { label, colorClass } = getScoreInfo(o.score);
                return (
                  <div key={o.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-sky-600 text-[26px]">description</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-base">{o.patientPrenom} {o.patientNom}</p>
                          <p className="text-sm text-slate-500 mt-0.5">Ordonnance #{o.id} &bull; {formatDate(o.dateCreation)}</p>
                          {o.contenuMedical && (
                            <p className="text-sm text-slate-600 mt-2 line-clamp-2 max-w-xl">{o.contenuMedical}</p>
                          )}
                          {o.medicaments && (
                            <p className="text-xs text-slate-400 mt-1 italic line-clamp-1">{o.medicaments}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {o.score !== null && o.score !== undefined && (
                          <span className={"text-xs font-bold px-3 py-1.5 rounded-full " + colorClass}>
                            {o.score}/15 &mdash; {label}
                          </span>
                        )}
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => setSelected(o)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px]">visibility</span>
                            Voir
                          </button>
                          <button
                            onClick={() => handleDownload(o)}
                            disabled={downloading === o.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-colors disabled:opacity-60"
                          >
                            <span className="material-symbols-outlined text-[15px]">download</span>
                            {downloading === o.id ? '...' : 'PDF'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
