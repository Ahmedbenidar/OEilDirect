import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth, getUser, logout } from '../../lib/useAuth';
import { fetchApi } from '../../lib/api';

export default function AdminDashboard() {
    useAuth('ADMIN');
    const router = useRouter();
    const user = getUser();

    const [stats, setStats] = useState({ patients: 0, medecins: 0, secretaires: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApi('/admin/stats')
            .then(data => { setStats(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const cards = [
        {
            title: 'Patients',
            count: stats.patients,
            icon: 'person',
            color: 'blue',
            href: '/admin/patients',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            iconBg: 'bg-blue-100 dark:bg-blue-900/40',
            iconColor: 'text-blue-600 dark:text-blue-400',
            textColor: 'text-blue-700 dark:text-blue-300',
            btnColor: 'bg-blue-600 hover:bg-blue-700',
        },
        {
            title: 'Médecins',
            count: stats.medecins,
            icon: 'stethoscope',
            color: 'emerald',
            href: '/admin/medecins',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            border: 'border-emerald-200 dark:border-emerald-800',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            textColor: 'text-emerald-700 dark:text-emerald-300',
            btnColor: 'bg-emerald-600 hover:bg-emerald-700',
        },
        {
            title: 'Secrétaires',
            count: stats.secretaires,
            icon: 'badge',
            color: 'violet',
            href: '/admin/secretaires',
            bg: 'bg-violet-50 dark:bg-violet-900/20',
            border: 'border-violet-200 dark:border-violet-800',
            iconBg: 'bg-violet-100 dark:bg-violet-900/40',
            iconColor: 'text-violet-600 dark:text-violet-400',
            textColor: 'text-violet-700 dark:text-violet-300',
            btnColor: 'bg-violet-600 hover:bg-violet-700',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
            <Head>
                <title>Admin | ŒilDirect</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </Head>

            {/* Navbar */}
            <header className="sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-base">admin_panel_settings</span>
                        </div>
                        <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">ŒilDirect</span>
                            <span className="ml-2 text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">Admin</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="hidden sm:block text-sm text-slate-500 dark:text-slate-400">{user?.nom}</span>
                        <button
                            onClick={() => logout(router)}
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">logout</span>
                            <span className="hidden sm:inline">Déconnexion</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Hero */}
                <div className="mb-10">
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                        Tableau de bord <span className="text-purple-600">Administrateur</span>
                    </h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Gérez l'ensemble des utilisateurs du système ŒilDirect.</p>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                    {cards.map(card => (
                        <div key={card.title} className={`rounded-2xl border p-6 ${card.bg} ${card.border} flex flex-col gap-4`}>
                            <div className="flex items-center justify-between">
                                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                                    <span className={`material-symbols-outlined text-2xl ${card.iconColor}`}>{card.icon}</span>
                                </div>
                                <span className={`text-4xl font-black ${card.textColor}`}>
                                    {loading ? '—' : card.count}
                                </span>
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg ${card.textColor}`}>{card.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">inscrits dans le système</p>
                            </div>
                            <Link href={card.href}>
                                <button className={`w-full mt-2 py-2.5 rounded-xl text-white text-sm font-semibold ${card.btnColor} transition-colors`}>
                                    Gérer les {card.title.toLowerCase()}
                                </button>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Total users summary */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl text-slate-500 dark:text-slate-400">group</span>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Total des utilisateurs</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                                {loading ? '—' : stats.patients + stats.medecins + stats.secretaires}
                            </p>
                        </div>
                    </div>
                    <div className="hidden sm:flex gap-6 text-sm text-slate-500 dark:text-slate-400">
                        <span>{stats.patients} patients</span>
                        <span>·</span>
                        <span>{stats.medecins} médecins</span>
                        <span>·</span>
                        <span>{stats.secretaires} secrétaires</span>
                    </div>
                </div>

                {/* Quick nav */}
                <div className="mt-10">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Accès rapide</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {cards.map(card => (
                            <Link key={card.title} href={card.href}>
                                <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all cursor-pointer group">
                                    <span className={`material-symbols-outlined ${card.iconColor}`}>{card.icon}</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                                        Gérer les {card.title.toLowerCase()}
                                    </span>
                                    <span className="material-symbols-outlined text-slate-400 ml-auto text-base">chevron_right</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
