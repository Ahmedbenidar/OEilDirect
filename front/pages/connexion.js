import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { fetchApi } from '../lib/api';

export default function Connexion() {
    const router = useRouter();
    const [form, setForm] = useState({ email: '', motDePasse: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (router.query.inscrit) {
            setSuccess('Compte créé avec succès ! Connectez-vous maintenant.');
        }
    }, [router.query]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await fetchApi('/auth/connexion', {
                method: 'POST',
                body: JSON.stringify(form),
            });

            localStorage.setItem('oeildirect_user', JSON.stringify(user));

            // Redirection selon le rôle
            if (user.role === 'PATIENT') router.push('/patient');
            else if (user.role === 'SECRETAIRE') router.push('/secretaire');
            else if (user.role === 'MEDECIN') router.push('/medecin');
            else if (user.role === 'ADMIN') router.push('/admin');
            else router.push('/');
        } catch (err) {
            setError(err.message || 'Email ou mot de passe incorrect.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
            <Head>
                <title>Login | ŒilDirect Healthcare</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </Head>

            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 md:px-10 py-4 bg-white dark:bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4 text-primary">
                    <div className="h-8 w-auto">
                        <img src="/logos/logo_cabinet.png" alt="ŒilDirect" className="h-14 w-auto object-contain scale-[3.5] origin-left" style={{mixBlendMode:'multiply'}}/>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="hidden md:inline text-sm text-slate-500 dark:text-slate-400">Nouveau sur ŒilDirect?</span>
                    <Link href="/inscription">
                        <button className="flex min-w-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-wide transition-all hover:bg-primary/90">
                            S'inscrire
                        </button>
                    </Link>
                </div>
            </header>

            <main className="flex-grow flex items-stretch">
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary/5">
                    <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
                    <div className="relative z-10 w-full flex flex-col justify-center px-20">
                        <div className="max-w-md">
                            <div className="mb-8 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-xl shadow-primary/5 inline-block border border-slate-100 dark:border-slate-800">
                                <span className="material-symbols-outlined text-primary text-4xl">verified_user</span>
                            </div>
                            <h1 className="text-5xl font-black text-slate-900 dark:text-slate-100 leading-[1.1] mb-6 tracking-tight">
                                Gérez votre <span className="text-primary">parcours de santé</span> en toute sécurité.
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-10">
                                Accédez à vos dossiers, planifiez des rendez-vous et contactez des professionnels de santé en un seul endroit.
                            </p>
                            <div className="flex gap-4">
                                <div className="flex -space-x-3">
                                    <div className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 overflow-hidden">
                                        <img alt="Doctor 1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmtyqPQqZrqej9l1o96kiHG6oIJ_EXHT7gvjEX8slLffJgei2BWmglzEPXfANWjqub-aYom5MqTWoiBNzRy4GPo6qqCP854ERyx3RmMxlTGTAcSH_Me2ThF6mvEuVdOJ7frIRIFOhpintkWx-4CrAhw0F40V__7_04SARp0dTLhWWzclGl6bEXYP5lha_HQcMYxdTHOUntVM2GB5Y76Yt4-4bLnSftNRTdJfV4Z0MHhtK2Z_KNXJ54ajtvHShV0Zmuw8qu4aSdWUU" />
                                    </div>
                                    <div className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 overflow-hidden">
                                        <img alt="Doctor 2" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDy6ih9mYf07t08gyB_usM7L_KKPaLxcEvmsykqmca3KhDfr8_oYRFZbXEleWn_8B54IheToHY_Er2QbDU-c1dfbKALK1dB4l1XUd5ZP4LIEK581G2oNYenoRJYt7MxLX__YBwhDBnKqlKlx7nsnuDD__CV_RKiWKqh81NopW81YRKvhyStVpmP8S7E2Z9WPFLFW1CnQbNe3qQNop7kBbM6Foav_VDA5qiREuCT_Bki2pOS_ihxawcsuMCYaSmTKNm7pRZOdqp41YM" />
                                    </div>
                                    <div className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 overflow-hidden">
                                        <img alt="Doctor 3" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCE0EeF63JBFEjsNx59vgAMuNZwurdFZEUuZjpI7ST3geEXRqDiiEEipsPiH9Yzsz6EdiO4rpH-AKJxTJg3Q6UBJeikuNiPWusRybrfHhz4Rk52_mEK8axCHV1J5S66zPw1nGj-HBV-PSvXvHjgbykCcSY8aujEBhi5MeJG0IqcmF3MPQ8roH6ZfcHldtIrcepk3HABI5m1hBEOKlmsqsDEkBo1_hAuBDy9OMRVFtA912pHog0XdIQHXeGI4ak88iMsnZGAPVOUqC0" />
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Fait confiance à plus de 10 000</p>
                                    <p className="text-[10px] text-slate-500">Professionnels de santé</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-3/4 h-2/3 bg-cover bg-center opacity-40 translate-x-1/4 translate-y-1/4 rounded-tl-[100px]" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDOpcLJUQc0rIWZJHecL1wZ3P3lSLFw2F61jYPGTlrCt03W091sFiEdGPOHhmHh8zDX6wjbun0H_N9ngr6Ks7peoSiYNvtsxkEH6wkyUJvFL3Two-k3ycq85hnCY47-uzIzrIDAjPBR3jTITKk9PThXjzNNquuMjmFHvknPj1s5uN3wpOaaTc_rV8rSKTk67AthiHT5kGlhbIyaGyRFuOiCNMZ-Sxr4d67TKHT3r_-b2xe7-IZWBzliyNyOhsFvd9FAnHIKWLKLVxw")' }}>
                    </div>
                </div>

                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-20">
                    <div className="w-full max-w-[440px] flex flex-col gap-8">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Bon retour</h2>
                            <p className="text-slate-500 dark:text-slate-400">Veuillez entrer vos informations pour accéder à votre tableau de bord.</p>
                        </div>

                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                                {success}
                            </div>
                        )}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="email">Adresse email</label>
                                <div className="relative flex items-center group">
                                    <div className="absolute left-4 text-slate-400 group-focus-within:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-lg">mail</span>
                                    </div>
                                    <input 
                                        className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400" 
                                        id="email" 
                                        name="email" 
                                        placeholder="votre@email.com" 
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="motDePasse">Mot de passe</label>
                                </div>
                                <div className="relative flex items-center group">
                                    <div className="absolute left-4 text-slate-400 group-focus-within:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-lg">lock</span>
                                    </div>
                                    <input 
                                        className="w-full h-12 pl-12 pr-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400" 
                                        id="motDePasse" 
                                        name="motDePasse" 
                                        placeholder="••••••••" 
                                        type="password"
                                        required
                                        value={form.motDePasse}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <button 
                                className={`w-full h-12 mt-4 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90 active:scale-[0.98]'}`} 
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Connexion en cours...' : 'Se connecter'}
                            </button>
                        </form>
                        
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <p className="text-xs text-slate-400 text-center mb-3">Comptes de démonstration</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setForm({ email: 'doc@test.com', motDePasse: 'password' })}
                                    className="text-xs py-2 px-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Dr House (Médecin)
                                </button>
                                <button
                                    onClick={() => setForm({ email: 'sophie@test.com', motDePasse: 'password' })}
                                    className="text-xs py-2 px-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Sophie (Secrétaire)
                                </button>
                                <button
                                    onClick={() => setForm({ email: 'jean@test.com', motDePasse: 'password' })}
                                    className="text-xs py-2 px-3 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors font-semibold"
                                >
                                    Jean (Patient)
                                </button>
                                <button
                                    onClick={() => setForm({ email: 'admin@test.com', motDePasse: 'admin123' })}
                                    className="text-xs py-2 px-3 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-300 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900 transition-colors font-semibold"
                                >
                                    Admin (Administrateur)
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            <footer className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-900">
                © 2024 ŒilDirect Healthcare Systems. All rights reserved. Secure 256-bit SSL Encrypted.
            </footer>
        </div>
    );
}
