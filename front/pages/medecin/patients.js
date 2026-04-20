import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getUser, logout } from '../../lib/useAuth';
import NotificationBell from '../../components/NotificationBell';
import { fetchApi } from '../../lib/api';
import SameRouteScrollLink from '../../components/SameRouteScrollLink';

export default function MedecinPatients() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'MEDECIN') { router.push('/connexion'); return; }
    setUser(u);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchApi('/medecins/' + user.id + '/patients')
      .then(data => setPatients(Array.isArray(data) ? data : []))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = patients.filter(p =>
    (p.nom + ' ' + p.prenom + ' ' + p.email).toLowerCase().includes(search.toLowerCase())
  );

  if (!user) return null;

  return (
    <>
      <Head><title>Patients - OeilDirect</title></Head>
      <div className="bg-slate-50 min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
        <aside className="h-screen w-64 fixed left-0 top-0 z-40 bg-slate-100 flex flex-col gap-y-2 py-8 px-4 font-medium tracking-tight overflow-y-auto border-r border-slate-200">
          <div className="mb-8 px-4 flex items-center gap-3">
            <img src="/logos/logo_cabinet.png" alt="OeilDirect" className="h-14 w-auto object-contain scale-[3.5] origin-left" style={{ mixBlendMode: 'multiply' }} />
          </div>
          <nav className="flex-1 space-y-1">
            <SameRouteScrollLink href="/medecin" className="text-slate-500 px-4 py-3 flex items-center gap-3 hover:bg-slate-200 transition-colors rounded-lg">
              <span className="material-symbols-outlined text-[22px]">dashboard</span>Dashboard
            </SameRouteScrollLink>
            <div className="bg-white text-sky-700 font-bold px-4 py-3 flex items-center gap-3 rounded-lg shadow-sm cursor-default">
              <span className="material-symbols-outlined text-[22px]">group</span>Patients
            </div>
            <Link href="/medecin/dossiers" className="text-slate-500 px-4 py-3 flex items-center gap-3 hover:bg-slate-200 transition-colors rounded-lg">
              <span className="material-symbols-outlined text-[22px]">description</span>Dossiers Medicaux
            </Link>
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

        <main className="ml-64 pt-24 p-10 min-h-screen">
          <div className="mb-8 flex items-end justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Gestion</p>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mes Patients</h1>
              <p className="text-slate-500">{patients.length} patient{patients.length !== 1 ? 's' : ''} au total</p>
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
              <span className="material-symbols-outlined text-6xl text-slate-200 block mb-4">group_off</span>
              <p className="text-slate-500 text-lg font-medium">Aucun patient trouve</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(p => (
                <div key={p.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {p.nom?.charAt(0)?.toUpperCase() || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-base">{p.prenom} {p.nom}</p>
                    <p className="text-sm text-slate-500 truncate">{p.email}</p>
                    {p.telephone && <p className="text-sm text-slate-400">{p.telephone}</p>}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 text-xs font-bold px-3 py-1 rounded-full">
                        <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                        {p.nombreRdv} rendez-vous
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
