import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { fetchApi } from '../lib/api';

export default function Inscription() {
    const router = useRouter();
    const [form, setForm] = useState({ nom: '', email: '', motDePasse: '', confirmer: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.motDePasse !== form.confirmer) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        if (form.motDePasse.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }

        setLoading(true);
        try {
            await fetchApi('/auth/inscription', {
                method: 'POST',
                body: JSON.stringify({ nom: form.nom, email: form.email, motDePasse: form.motDePasse }),
            });
            router.push('/connexion?inscrit=1');
        } catch (err) {
            setError(err.message || "Erreur lors de l'inscription.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
            <Head>
                <title>Inscription | ŒilDirect Healthcare</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </Head>

            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 md:px-10 py-4 bg-white dark:bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3 text-primary">
                    <div className="w-8 h-8 rounded-lg bg-[#0071c2] flex items-center justify-center text-white font-black text-sm">Œ</div>
                    <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">ŒilDirect</h2>
                </div>
                <div className="flex items-center gap-4">
                    <span className="hidden md:inline text-sm text-slate-500 dark:text-slate-400">Déjà inscrit ?</span>
                    <Link href="/connexion">
                        <button className="flex min-w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#0071c2] text-white text-sm font-bold leading-normal tracking-wide transition-all hover:bg-[#0071c2]/90">
                            Se connecter
                        </button>
                    </Link>
                </div>
            </header>

            {/* Main */}
            <main className="flex-grow flex items-stretch">
                {/* Panneau gauche */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0071c2]/5">
                    <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0071c2] via-transparent to-transparent"></div>
                    <div className="relative z-10 w-full flex flex-col justify-center px-20">
                        <div className="max-w-md">
                            <div className="mb-8 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-xl shadow-[#0071c2]/5 inline-block border border-slate-100 dark:border-slate-800">
                                <span className="material-symbols-outlined text-[#0071c2] text-4xl">health_and_safety</span>
                            </div>
                            <h1 className="text-5xl font-black text-slate-900 dark:text-slate-100 leading-[1.1] mb-6 tracking-tight">
                                Rejoignez <span className="text-[#0071c2]">ŒilDirect</span> et prenez soin de votre vision.
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-10">
                                Créez votre compte patient en quelques secondes et accédez à des spécialistes de l'ophtalmologie près de chez vous.
                            </p>

                            {/* Avantages */}
                            <div className="space-y-4">
                                {[
                                    { icon: 'calendar_month', text: 'Prise de rendez-vous simplifiée' },
                                    { icon: 'visibility', text: 'Tests visuels IA à domicile' },
                                    { icon: 'description', text: 'Ordonnances et dossier en ligne' },
                                ].map(item => (
                                    <div key={item.icon} className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-[#0071c2]/10 flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-[#0071c2] text-[18px]">{item.icon}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-700">{item.text}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Social proof */}
                            <div className="flex gap-4 mt-10">
                                <div className="flex -space-x-3">
                                    {[
                                        'https://lh3.googleusercontent.com/aida-public/AB6AXuDmtyqPQqZrqej9l1o96kiHG6oIJ_EXHT7gvjEX8slLffJgei2BWmglzEPXfANWjqub-aYom5MqTWoiBNzRy4GPo6qqCP854ERyx3RmMxlTGTAcSH_Me2ThF6mvEuVdOJ7frIRIFOhpintkWx-4CrAhw0F40V__7_04SARp0dTLhWWzclGl6bEXYP5lha_HQcMYxdTHOUntVM2GB5Y76Yt4-4bLnSftNRTdJfV4Z0MHhtK2Z_KNXJ54ajtvHShV0Zmuw8qu4aSdWUU',
                                        'https://lh3.googleusercontent.com/aida-public/AB6AXuDy6ih9mYf07t08gyB_usM7L_KKPaLxcEvmsykqmca3KhDfr8_oYRFZbXEleWn_8B54IheToHY_Er2QbDU-c1dfbKALK1dB4l1XUd5ZP4LIEK581G2oNYenoRJYt7MxLX__YBwhDBnKqlKlx7nsnuDD__CV_RKiWKqh81NopW81YRKvhyStVpmP8S7E2Z9WPFLFW1CnQbNe3qQNop7kBbM6Foav_VDA5qiREuCT_Bki2pOS_ihxawcsuMCYaSmTKNm7pRZOdqp41YM',
                                        'https://lh3.googleusercontent.com/aida-public/AB6AXuCE0EeF63JBFEjsNx59vgAMuNZwurdFZEUuZjpI7ST3geEXRqDiiEEipsPiH9Yzsz6EdiO4rpH-AKJxTJg3Q6UBJeikuNiPWusRybrfHhz4Rk52_mEK8axCHV1J5S66zPw1nGj-HBV-PSvXvHjgbykCcSY8aujEBhi5MeJG0IqcmF3MPQ8roH6ZfcHldtIrcepk3HABI5m1hBEOKlmsqsDEkBo1_hAuBDy9OMRVFtA912pHog0XdIQHXeGI4ak88iMsnZGAPVOUqC0',
                                    ].map((src, i) => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 overflow-hidden">
                                            <img alt={`user ${i}`} src={src} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col justify-center">
                                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Fait confiance à plus de 10 000</p>
                                    <p className="text-[10px] text-slate-500">Professionnels de santé</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panneau droit : formulaire */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-20">
                    <div className="w-full max-w-[440px] flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Créer un compte</h2>
                            <p className="text-slate-500 dark:text-slate-400">Inscrivez-vous gratuitement pour accéder à votre espace patient.</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {error}
                            </div>
                        )}

                        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                            {/* Nom */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="nom">Nom complet</label>
                                <div className="relative flex items-center group">
                                    <div className="absolute left-4 text-slate-400 group-focus-within:text-[#0071c2] transition-colors">
                                        <span className="material-symbols-outlined text-lg">person</span>
                                    </div>
                                    <input
                                        className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-[#0071c2]/10 focus:border-[#0071c2] outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                        id="nom" name="nom" type="text" required
                                        placeholder="Jean Dupont"
                                        value={form.nom} onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="email">Adresse email</label>
                                <div className="relative flex items-center group">
                                    <div className="absolute left-4 text-slate-400 group-focus-within:text-[#0071c2] transition-colors">
                                        <span className="material-symbols-outlined text-lg">mail</span>
                                    </div>
                                    <input
                                        className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-[#0071c2]/10 focus:border-[#0071c2] outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                        id="email" name="email" type="email" required
                                        placeholder="votre@email.com"
                                        value={form.email} onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Mot de passe */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="motDePasse">Mot de passe</label>
                                <div className="relative flex items-center group">
                                    <div className="absolute left-4 text-slate-400 group-focus-within:text-[#0071c2] transition-colors">
                                        <span className="material-symbols-outlined text-lg">lock</span>
                                    </div>
                                    <input
                                        className="w-full h-12 pl-12 pr-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-[#0071c2]/10 focus:border-[#0071c2] outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                        id="motDePasse" name="motDePasse" type={showPass ? 'text' : 'password'} required
                                        placeholder="••••••••"
                                        value={form.motDePasse} onChange={handleChange}
                                    />
                                    <button type="button" onClick={() => setShowPass(v => !v)}
                                        className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors">
                                        <span className="material-symbols-outlined text-lg">{showPass ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                                {form.motDePasse && (
                                    <div className="flex gap-1 mt-1">
                                        {[6, 8, 12].map((len, i) => (
                                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${form.motDePasse.length >= len ? (i === 0 ? 'bg-red-400' : i === 1 ? 'bg-orange-400' : 'bg-green-500') : 'bg-slate-200'}`}></div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Confirmer mot de passe */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="confirmer">Confirmer le mot de passe</label>
                                <div className="relative flex items-center group">
                                    <div className="absolute left-4 text-slate-400 group-focus-within:text-[#0071c2] transition-colors">
                                        <span className="material-symbols-outlined text-lg">lock_reset</span>
                                    </div>
                                    <input
                                        className={`w-full h-12 pl-12 pr-12 bg-white dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-[#0071c2]/10 focus:border-[#0071c2] outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400
                                            ${form.confirmer && form.confirmer !== form.motDePasse ? 'border-red-300' : 'border-slate-200 dark:border-slate-800'}`}
                                        id="confirmer" name="confirmer" type={showConfirm ? 'text' : 'password'} required
                                        placeholder="••••••••"
                                        value={form.confirmer} onChange={handleChange}
                                    />
                                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                                        className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors">
                                        <span className="material-symbols-outlined text-lg">{showConfirm ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                                {form.confirmer && form.confirmer !== form.motDePasse && (
                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">error</span>
                                        Les mots de passe ne correspondent pas
                                    </p>
                                )}
                            </div>

                            <button
                                className={`w-full h-12 mt-2 bg-[#0071c2] text-white font-bold rounded-lg shadow-lg shadow-[#0071c2]/20 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#0071c2]/90 active:scale-[0.98]'}`}
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                        Création en cours...
                                    </span>
                                ) : 'Créer mon compte'}
                            </button>
                        </form>

                        {/* Lien connexion */}
                        <div className="text-center text-sm text-slate-500">
                            Vous avez déjà un compte ?{' '}
                            <Link href="/connexion" className="text-[#0071c2] font-semibold hover:underline">
                                Se connecter
                            </Link>
                        </div>

                        {/* Conditions */}
                        <p className="text-xs text-slate-400 text-center leading-relaxed">
                            En créant un compte, vous acceptez nos{' '}
                            <span className="text-[#0071c2] cursor-pointer hover:underline">Conditions d'utilisation</span>
                            {' '}et notre{' '}
                            <span className="text-[#0071c2] cursor-pointer hover:underline">Politique de confidentialité</span>.
                        </p>
                    </div>
                </div>
            </main>

            <footer className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-900">
                © 2024 ŒilDirect Healthcare Systems. All rights reserved. Secure 256-bit SSL Encrypted.
            </footer>

            <style jsx global>{`
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                    display: inline-flex;
                    align-items: center;
                }
            `}</style>
        </div>
    );
}
