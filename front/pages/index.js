import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
    return (
        <>
            <Head>
                <title>ŒilDirect – Consultation ophtalmologique en ligne</title>
                <meta name="description" content="Trouvez un ophtalmologiste, prenez rendez-vous et réalisez votre test visuel guidé par IA, tout en ligne." />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-slate-50 font-display flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>

                {/* ── HEADER ── */}
                <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 md:px-12 py-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src="/logos/logo_cabinet.png" alt="ŒilDirect" className="h-14 w-auto object-contain scale-[3.5] origin-left" style={{mixBlendMode:'multiply'}}/>
                        </div>
                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Fonctionnalités</a>
                            <a href="#portals" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Espaces</a>
                            <a href="#how" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Comment ça marche</a>
                        </nav>
                        <div className="flex items-center gap-3">
                            <Link href="/connexion">
                                <button className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    Se connecter
                                </button>
                            </Link>
                            <Link href="/inscription">
                                <button className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-200 transition-all active:scale-95">
                                    S'inscrire gratuitement
                                </button>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* ── HERO ── */}
                <section className="flex-1 relative overflow-hidden">
                    {/* Fond décoratif */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-br from-blue-100/60 via-indigo-50/40 to-transparent rounded-full blur-3xl" />
                        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-gradient-to-tl from-teal-100/40 to-transparent rounded-full blur-3xl" />
                    </div>

                    <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-28 text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 shadow-sm">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            Plateforme ophtalmologique n°1 en France
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.05] mb-6">
                            Votre vision,{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
                                notre priorité
                            </span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-xl text-slate-500 mb-10 leading-relaxed">
                            Trouvez un ophtalmologiste certifié, prenez rendez-vous en ligne et réalisez votre bilan visuel guidé par intelligence artificielle — sans attendre.
                        </p>

                        {/* CTA principal */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                            <Link href="/inscription">
                                <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xl shadow-blue-200 transition-all active:scale-95 text-base">
                                    Trouver un ophtalmologiste →
                                </button>
                            </Link>
                            <Link href="/connexion">
                                <button className="px-8 py-4 bg-white border-2 border-slate-200 hover:border-blue-300 text-slate-700 font-bold rounded-xl transition-all text-base hover:bg-blue-50">
                                    J'ai déjà un compte
                                </button>
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
                            {[
                                { value: '500+', label: 'Ophtalmologistes' },
                                { value: '50k+', label: 'Patients' },
                                { value: '4.9★', label: 'Note moyenne' },
                            ].map(stat => (
                                <div key={stat.label} className="text-center">
                                    <p className="text-2xl font-black text-blue-600">{stat.value}</p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── FONCTIONNALITÉS ── */}
                <section id="features" className="bg-white py-20 px-6 md:px-12">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-14">
                            <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-2">Pourquoi ŒilDirect ?</p>
                            <h2 className="text-4xl font-black text-slate-900">Tout ce dont vous avez besoin</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { icon: 'search', title: 'Trouvez un médecin', desc: 'Parcourez notre annuaire d\'ophtalmologistes certifiés et filtrez par disponibilité.', color: 'bg-blue-50 text-blue-600' },
                                { icon: 'calendar_month', title: 'Prenez rendez-vous', desc: 'Réservez en ligne 24h/7j, choisissez votre créneau et payez en toute sécurité.', color: 'bg-indigo-50 text-indigo-600' },
                                { icon: 'visibility', title: 'Test visuel IA', desc: 'Effectuez un bilan visuel complet à distance guidé par notre intelligence artificielle.', color: 'bg-teal-50 text-teal-600' },
                                { icon: 'receipt_long', title: 'Recevez votre ordonnance', desc: 'Votre médecin analyse les résultats et délivre votre ordonnance directement en ligne.', color: 'bg-green-50 text-green-600' },
                            ].map(f => (
                                <div key={f.title} className="p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow group">
                                    <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <span className="material-symbols-outlined text-2xl">{f.icon}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── PORTAILS ── */}
                <section id="portals" className="py-20 px-6 md:px-12 bg-slate-50">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-14">
                            <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-2">Accès rapide</p>
                            <h2 className="text-4xl font-black text-slate-900">Choisissez votre espace</h2>
                            <p className="text-slate-500 mt-3">Une plateforme unifiée pour patients, secrétaires et médecins.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Patient */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                                <div className="bg-gradient-to-br from-blue-500 to-blue-700 px-8 py-10 text-center text-white">
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-3xl">person</span>
                                    </div>
                                    <h3 className="text-2xl font-bold">Patient</h3>
                                    <p className="text-blue-100 text-sm mt-1">Gérez votre santé visuelle</p>
                                </div>
                                <div className="px-8 py-6">
                                    <ul className="space-y-2.5 text-sm text-slate-600 mb-6">
                                        {['Trouver un ophtalmologiste', 'Prendre rendez-vous en ligne', 'Réaliser un test visuel IA', 'Recevoir votre ordonnance'].map(item => (
                                            <li key={item} className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="space-y-2">
                                        <Link href="/inscription">
                                            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-100 active:scale-95">
                                                Créer mon compte
                                            </button>
                                        </Link>
                                        <Link href="/connexion">
                                            <button className="w-full py-3 border-2 border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl font-semibold text-sm transition-all">
                                                Se connecter
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Secrétaire */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-8 py-10 text-center text-white">
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-3xl">assignment</span>
                                    </div>
                                    <h3 className="text-2xl font-bold">Secrétariat</h3>
                                    <p className="text-indigo-100 text-sm mt-1">Personnel administratif</p>
                                </div>
                                <div className="px-8 py-6">
                                    <ul className="space-y-2.5 text-sm text-slate-600 mb-6">
                                        {['Gérer les demandes patients', 'Vérifier les dossiers', 'Valider et transmettre', 'Gérer le planning du cabinet'].map(item => (
                                            <li key={item} className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/connexion">
                                        <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-100 active:scale-95">
                                            Connexion Secrétariat
                                        </button>
                                    </Link>
                                </div>
                            </div>

                            {/* Médecin */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                                <div className="bg-gradient-to-br from-teal-500 to-emerald-600 px-8 py-10 text-center text-white">
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-3xl">stethoscope</span>
                                    </div>
                                    <h3 className="text-2xl font-bold">Médecin</h3>
                                    <p className="text-teal-100 text-sm mt-1">Praticiens ophtalmologues</p>
                                </div>
                                <div className="px-8 py-6">
                                    <ul className="space-y-2.5 text-sm text-slate-600 mb-6">
                                        {['Consulter les dossiers patients', 'Prescrire des tests IA', 'Analyser les résultats', 'Délivrer des ordonnances'].map(item => (
                                            <li key={item} className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href="/connexion">
                                        <button className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-teal-100 active:scale-95">
                                            Connexion Médecin
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── COMMENT ÇA MARCHE ── */}
                <section id="how" className="bg-white py-20 px-6 md:px-12">
                    <div className="max-w-4xl mx-auto text-center">
                        <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-2">Simple & rapide</p>
                        <h2 className="text-4xl font-black text-slate-900 mb-14">Comment ça marche ?</h2>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {[
                                { step: '1', icon: 'how_to_reg', title: 'Inscrivez-vous', desc: 'Créez votre compte patient en 2 minutes.' },
                                { step: '2', icon: 'search', title: 'Choisissez', desc: 'Trouvez l\'ophtalmologiste qui vous convient.' },
                                { step: '3', icon: 'visibility', title: 'Testez', desc: 'Réalisez votre bilan visuel guidé par IA.' },
                                { step: '4', icon: 'receipt_long', title: 'Recevez', desc: 'Obtenez votre ordonnance en ligne.' },
                            ].map((s, i) => (
                                <div key={s.step} className="flex flex-col items-center relative">
                                    {i < 3 && <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-200 to-blue-100" />}
                                    <div className="relative w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-blue-200 mb-4 z-10">
                                        {s.step}
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                                        <span className="material-symbols-outlined text-blue-500">{s.icon}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 mb-1">{s.title}</h4>
                                    <p className="text-sm text-slate-500">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA FINAL ── */}
                <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16 px-6 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-black mb-4">Prenez soin de votre vision dès aujourd'hui</h2>
                    <p className="text-blue-100 mb-8 max-w-xl mx-auto">Rejoignez plus de 50 000 patients qui font confiance à ŒilDirect pour leur santé ophtalmologique.</p>
                    <Link href="/inscription">
                        <button className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-xl active:scale-95 text-base">
                            Commencer gratuitement →
                        </button>
                    </Link>
                </section>

                {/* ── FOOTER ── */}
                <footer className="bg-slate-900 text-slate-400 py-10 px-6">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <img src="/logos/logo_cabinet.png" alt="ŒilDirect" className="h-12 w-auto object-contain scale-[1.9] origin-left brightness-0 invert"/>
                        </div>
                        <div className="flex gap-8 text-sm">
                            <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
                            <a href="#" className="hover:text-white transition-colors">CGU</a>
                            <a href="#" className="hover:text-white transition-colors">Aide</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
                        </div>
                        <p className="text-xs">© 2024 ŒilDirect. Tous droits réservés.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
