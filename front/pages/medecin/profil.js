import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { getUser, logout } from "../../lib/useAuth";
import NotificationBell from "../../components/NotificationBell";
import ProfileForm from "../../components/ProfileForm";
import SameRouteScrollLink from "../../components/SameRouteScrollLink";

export default function MedecinProfil() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== "MEDECIN") { router.push("/connexion"); return; }
    setUser(u);
  }, []);

  if (!user) return null;

  return (
    <>
      <Head><title>Mon profil - OeilDirect</title></Head>
      <div className="bg-slate-50 min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
        <header className="bg-white/50 backdrop-blur-md shadow-sm sticky top-0 z-50 flex items-center justify-between px-8 h-16 w-full">
          <img src="/logos/logo_cabinet.png" alt="OeilDirect" className="h-14 w-auto object-contain scale-[3.5] origin-left" style={{ mixBlendMode: "multiply" }} />
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex gap-6">
              <SameRouteScrollLink href="/medecin" className="text-slate-500 font-medium hover:text-sky-600 text-sm">Tableau de bord</SameRouteScrollLink>
              <span className="text-sky-700 font-bold border-b-2 border-sky-700 pb-0.5 cursor-default text-sm">Profil</span>
            </nav>
            <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
              <NotificationBell user={user} />
              <Link href="/medecin/profil" className="block">
                {user.photoProfil ? (
                  <img src={user.photoProfil} alt="Profil" className="w-9 h-9 rounded-full object-cover border-2 border-blue-200 shadow-sm" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {user.nom?.charAt(0)?.toUpperCase() || "D"}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </header>
        <div className="flex">
          <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 pt-20 flex-col gap-2 p-4 bg-slate-100/50 border-r border-slate-200 z-40">
            <nav className="space-y-1">
              <SameRouteScrollLink href="/medecin" className="flex items-center gap-3 py-3 px-4 text-slate-600 hover:bg-slate-200/50 mx-2 rounded-lg transition-all text-sm font-medium">
                <span className="material-symbols-outlined text-xl">dashboard</span>Tableau de bord
              </SameRouteScrollLink>
              <span className="flex items-center gap-3 py-3 px-4 bg-white text-sky-700 shadow-sm rounded-lg mx-2 cursor-default text-sm font-medium">
                <span className="material-symbols-outlined text-xl">person</span>Profil
              </span>
              <Link href="/medecin/disponibilite" className="flex items-center gap-3 py-3 px-4 text-slate-600 hover:bg-slate-200/50 mx-2 rounded-lg transition-all text-sm font-medium">
                <span className="material-symbols-outlined text-xl">event_available</span>Disponibilite
              </Link>
            </nav>
            <div className="mt-auto pb-4">
              <button onClick={() => logout(router)} className="w-full flex items-center gap-3 py-3 px-4 text-red-500 hover:bg-red-50 mx-2 rounded-lg transition-all text-sm font-medium">
                <span className="material-symbols-outlined text-xl">logout</span>Deconnexion
              </button>
            </div>
          </aside>
          <main className="md:ml-64 p-8 pt-6 w-full">
            <ProfileForm roleRequis="MEDECIN" />
          </main>
        </div>
      </div>
    </>
  );
}
