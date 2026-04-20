import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getUser, logout } from '../../lib/useAuth';
import NotificationBell from '../../components/NotificationBell';
import MedecinDisponibilitesForm from '../../components/MedecinDisponibilitesForm';
import SameRouteScrollLink from '../../components/SameRouteScrollLink';

export default function MedecinDisponibilite() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'MEDECIN') { router.push('/connexion'); return; }
    setUser(u);
  }, []);

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Disponibilite - OeilDirect</title>
      </Head>
      <div className="bg-slate-50 min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
        <aside className="h-screen w-64 fixed left-0 top-0 z-40 bg-slate-100 flex flex-col gap-y-2 py-8 px-4 font-medium tracking-tight overflow-y-auto border-r border-slate-200">
          <div className="mb-8 px-4 flex items-center gap-3">
            <img src="/logos/logo_cabinet.png" alt="OeilDirect" className="h-14 w-auto object-contain scale-[3.5] origin-left" style={{ mixBlendMode: 'multiply' }} />
          </div>
          <nav className="flex-1 space-y-1">
            <SameRouteScrollLink href="/medecin" className="text-slate-500 px-4 py-3 flex items-center gap-3 hover:bg-slate-200 transition-colors rounded-lg">
              <span className="material-symbols-outlined text-[22px]">dashboard</span>Dashboard
            </SameRouteScrollLink>
            <div className="text-slate-500 px-4 py-3 flex items-center gap-3 hover:bg-slate-200 transition-colors cursor-pointer rounded-lg">
              <span className="material-symbols-outlined text-[22px]">group</span>Patients
            </div>
            <div className="text-slate-500 px-4 py-3 flex items-center gap-3 hover:bg-slate-200 transition-colors cursor-pointer rounded-lg">
              <span className="material-symbols-outlined text-[22px]">description</span>Dossiers Medicaux
            </div>
            <div className="bg-white text-sky-700 font-bold px-4 py-3 flex items-center gap-3 rounded-lg shadow-sm cursor-default">
              <span className="material-symbols-outlined text-[22px]">event_available</span>Disponibilite
            </div>
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
          <div className="mb-8 space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Gestion</p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Disponibilite</h1>
            <p className="text-slate-500">Gerez vos jours de consultation et jours off.</p>
          </div>
          <MedecinDisponibilitesForm />
        </main>
      </div>
    </>
  );
}