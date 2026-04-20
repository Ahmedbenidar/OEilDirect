import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { fetchApi } from '../../lib/api';
import { getUser, logout } from '../../lib/useAuth';
import NotificationBell from '../../components/NotificationBell';

// ── Unique professional doctor photos (Unsplash) ──────────────────────────────
const DOCTOR_PHOTOS = [
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=400&h=500&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1643297654416-05795d62e39c?w=400&h=500&fit=crop&crop=face',
];

// ── Professional metadata pool (assigned by index, deterministic) ─────────────
const METADATA_POOL = [
    { specialite: 'Ophtalmologiste',                        experience: '12 ans exp.', rating: 4.9, reviews: 120, disponibilite: "Disponible aujourd'hui", disponibiliteType: 'today',    lieu: 'Clinique Al Amal, Casablanca',       horaires: 'Lun – Ven, 09:00 – 17:00',     tarif: '1500', langues: 'Français & Arabe',          videoConsult: true  },
    { specialite: 'Ophtalmologiste',                        experience: '18 ans exp.', rating: 4.8, reviews: 215, disponibilite: 'Prochain : Demain',        disponibiliteType: 'tomorrow', lieu: 'Centre de la Vision, Rabat',         horaires: 'Mar – Sam, 08:30 – 16:30',     tarif: '1600', langues: 'Français & Anglais',         videoConsult: false },
    { specialite: 'Ophtalmologiste · Spécialiste Rétine',   experience: '10 ans exp.', rating: 5.0, reviews: 89,  disponibilite: "Disponible aujourd'hui", disponibiliteType: 'today',    lieu: 'Clinique Universitaire, Marrakech',  horaires: 'Lun, Mer, Ven, 10:00 – 18:00', tarif: '1700', langues: 'Français, Arabe & Anglais',  videoConsult: true  },
    { specialite: 'Ophtalmologiste · Chirurgie Réfractive', experience: '15 ans exp.', rating: 4.7, reviews: 67,  disponibilite: 'Prochain : Mercredi',      disponibiliteType: 'later',    lieu: 'Centre Laser Vision, Fès',           horaires: 'Lun – Jeu, 09:00 – 18:00',     tarif: '2000', langues: 'Français',                   videoConsult: false },
    { specialite: 'Ophtalmologiste · Glaucome',             experience: '8 ans exp.',  rating: 4.9, reviews: 143, disponibilite: "Disponible aujourd'hui", disponibiliteType: 'today',    lieu: 'Polyclinique du Parc, Agadir',       horaires: 'Mar – Sam, 09:00 – 17:00',     tarif: '1450', langues: 'Français & Arabe',          videoConsult: true  },
    { specialite: 'Ophtalmologiste · Pédiatrique',          experience: '20 ans exp.', rating: 4.6, reviews: 312, disponibilite: 'Prochain : Lundi',         disponibiliteType: 'later',    lieu: 'CHU Ibn Rochd, Casablanca',          horaires: 'Lun – Ven, 08:00 – 16:00',     tarif: '1550', langues: 'Arabe & Français',           videoConsult: false },
    { specialite: 'Ophtalmologiste',                        experience: '6 ans exp.',  rating: 4.8, reviews: 54,  disponibilite: 'Prochain : Demain',        disponibiliteType: 'tomorrow', lieu: 'Cabinet Médical Ryad, Meknès',       horaires: 'Lun – Ven, 09:00 – 16:00',     tarif: '1350', langues: 'Arabe & Français',           videoConsult: true  },
    { specialite: 'Ophtalmologiste · Urgences Oculaires',   experience: '14 ans exp.', rating: 4.7, reviews: 198, disponibilite: "Disponible aujourd'hui", disponibiliteType: 'today',    lieu: 'Clinique Al Inbiath, Tanger',        horaires: 'Lun – Sam, 08:00 – 18:00',     tarif: '1800', langues: 'Arabe, Français & Espagnol', videoConsult: false },
];

const JOUR_SHORT = { 0: 'Dim', 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Jeu', 5: 'Ven', 6: 'Sam' };
const JOUR_ORDER = [1, 2, 3, 4, 5, 6, 0];

function formatJoursConsultationHebdo(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return null;
    const uniq = [...new Set(ids.map((n) => Number(n)).filter((n) => n >= 0 && n <= 6))];
    if (uniq.length === 0) return null;
    uniq.sort((a, b) => JOUR_ORDER.indexOf(a) - JOUR_ORDER.indexOf(b));
    return uniq.map((d) => JOUR_SHORT[d]).join(', ');
}

// Enrich a raw API doctor (id, nom, email, role) with photo + professional metadata
function enrichMedecin(apiDoctor, index) {
    const meta = METADATA_POOL[index % METADATA_POOL.length];
    const apiPhoto = apiDoctor?.photoProfil;
    const fallbackPhoto = DOCTOR_PHOTOS[index % DOCTOR_PHOTOS.length];
    const joursLib = formatJoursConsultationHebdo(apiDoctor?.joursConsultationHebdo);
    const datesOff = Array.isArray(apiDoctor?.datesJoursOff) ? apiDoctor.datesJoursOff.filter(Boolean) : [];
    const datesDispo = Array.isArray(apiDoctor?.datesDisponibles) ? apiDoctor.datesDisponibles.filter(Boolean) : [];
    return {
        ...meta,
        id: apiDoctor.id,
        nom: apiDoctor.nom,
        prenom: apiDoctor.prenom,
        email: apiDoctor.email,
        photo: apiPhoto && String(apiPhoto).trim() ? apiPhoto : fallbackPhoto,
        horaires: datesDispo.length > 0 ? 'Disponibilites definies par calendrier' : (joursLib ? `Consultation : ${joursLib}` : meta.horaires),
        datesJoursOffPatient: datesOff,
        datesDisponiblesPatient: datesDispo,
    };
}

function getBadgeStyle(type) {
    if (type === 'today') return 'bg-green-100 text-green-700';
    if (type === 'tomorrow') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-500';
}

function StarRating({ rating }) {
    return (
        <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-3.5 h-3.5 ${i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
            <span className="text-sm font-bold text-slate-800 ml-0.5">{rating}</span>
        </div>
    );
}

export default function MedecinDirectory() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [medecins, setMedecins] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDisponible, setFilterDisponible] = useState(false);
    const [filterVideoConsult, setFilterVideoConsult] = useState(false);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(false);

    useEffect(() => {
        const u = getUser();
        if (!u || u.role !== 'PATIENT') { router.push('/connexion'); return; }
        setUser(u);
        chargerMedecins();
    }, []);

    const chargerMedecins = async () => {
        setLoading(true);
        setApiError(false);
        try {
            const data = await fetchApi('/medecins');
            if (Array.isArray(data) && data.length > 0) {
                // Use real doctors from DB, enrich each with unique photo + metadata
                setMedecins(data.map((m, idx) => enrichMedecin(m, idx)));
            } else {
                setApiError(true);
                setMedecins([]);
            }
        } catch (err) {
            console.error('Impossible de charger les médecins depuis l\'API:', err);
            setApiError(true);
            setMedecins([]);
        } finally {
            setLoading(false);
        }
    };

    const medecinsFiltres = medecins.filter(m => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !q ||
            m.nom.toLowerCase().includes(q) ||
            m.specialite.toLowerCase().includes(q) ||
            m.lieu.toLowerCase().includes(q);
        const matchDispo = !filterDisponible || m.disponibiliteType === 'today';
        const matchVideo = !filterVideoConsult || m.videoConsult;
        return matchSearch && matchDispo && matchVideo;
    });

    if (!user) return null;

    return (
        <>
            <Head>
                <title>Trouver un Ophtalmologiste – ŒilDirect</title>
                <meta name="description" content="Trouvez et réservez un rendez-vous avec un ophtalmologiste certifié." />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-slate-50 antialiased" style={{ fontFamily: 'Inter, sans-serif' }}>

                {/* ── HEADER ── */}
                <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

                        {/* LEFT — Logo */}
                        <div className="shrink-0" style={{ minWidth: '160px', overflow: 'visible' }}>
                            <img
                                src="/logos/logo_cabinet.png"
                                alt="ŒilDirect"
                                className="h-14 w-auto object-contain scale-[3.5] origin-left"
                                style={{ mixBlendMode: 'multiply' }}
                            />
                        </div>

                        {/* CENTER — Nav links */}
                        <nav className="hidden md:flex items-center gap-1">
                            <span className="px-4 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-bold cursor-default">
                                Trouver un médecin
                            </span>
                            <Link href="/patient" className="px-4 py-2 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-100 hover:text-blue-600 transition-all">
                                Mon Espace
                            </Link>
                            <Link href="/patient/rendez-vous" className="px-4 py-2 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-100 hover:text-blue-600 transition-all">
                                Mes Rendez-vous
                            </Link>
                            <Link href="/patient/documents" className="px-4 py-2 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-100 hover:text-blue-600 transition-all">
                                Documents
                            </Link>
                        </nav>

                        {/* RIGHT — Search + icons */}
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="hidden sm:flex items-center bg-slate-100 rounded-xl px-3 py-2 w-52 border border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all">
                                <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
                                <input
                                    className="bg-transparent border-none focus:outline-none text-sm w-full placeholder:text-slate-400 ml-2"
                                    placeholder="Médecin, spécialité..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <NotificationBell user={user} />
                            <Link href="/patient/profil" className="block">
                                {user?.photoProfil ? (
                                    <img
                                        src={user.photoProfil}
                                        alt="Profil"
                                        className="w-9 h-9 rounded-full object-cover border-2 border-blue-200 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        {user?.nom?.charAt(0)?.toUpperCase() || 'P'}
                                    </div>
                                )}
                            </Link>
                            <button onClick={() => logout(router)} className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 transition-colors font-medium">
                                <span className="material-symbols-outlined text-base">logout</span>
                                Déconnexion
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── MAIN ── */}
                <main className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
                    <div className="flex flex-col md:flex-row gap-8">

                        {/* ── SIDEBAR ── */}
                        <aside className="w-full md:w-60 shrink-0 space-y-6">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Catégories</h3>
                                <div className="space-y-1">
                                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200 text-sm font-semibold">
                                        <span className="material-symbols-outlined text-lg">visibility</span>
                                        Ophtalmologistes
                                    </button>
                                    {[
                                        { icon: 'biotech', label: 'Spécialistes Rétine' },
                                        { icon: 'child_care', label: 'Ophtalmologie Pédiatrique' },
                                        { icon: 'content_cut', label: 'Chirurgie Réfractive' },
                                    ].map(c => (
                                        <button key={c.label} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 cursor-not-allowed opacity-60 text-sm font-medium">
                                            <span className="material-symbols-outlined text-lg">{c.icon}</span>
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-slate-200" />

                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Filtres Rapides</h3>
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold text-slate-500">Disponibilité</p>
                                    {[
                                        { label: "Disponible aujourd'hui", state: filterDisponible, setState: setFilterDisponible },
                                        { label: 'Consultation vidéo', state: filterVideoConsult, setState: setFilterVideoConsult },
                                    ].map(f => (
                                        <label key={f.label} className="flex items-center gap-2.5 cursor-pointer group">
                                            <div
                                                onClick={() => f.setState(v => !v)}
                                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${f.state ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}
                                            >
                                                {f.state && <span className="material-symbols-outlined text-white text-xs">check</span>}
                                            </div>
                                            <span className="text-sm text-slate-700">{f.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Tarif range info */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <p className="text-xs font-bold text-blue-800 mb-1">Tarifs en MAD</p>
                                <p className="text-xs text-blue-600 leading-relaxed">Les consultations sont tarifées entre 1 350 et 2 000 MAD selon le spécialiste.</p>
                            </div>
                        </aside>

                        {/* ── LISTE ── */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900">Ophtalmologistes Certifiés</h1>
                                    <p className="text-slate-500 text-sm mt-0.5">
                                        {loading ? 'Chargement…' : apiError ? 'Erreur de connexion' : `${medecinsFiltres.length} médecin${medecinsFiltres.length !== 1 ? 's' : ''} disponible${medecinsFiltres.length !== 1 ? 's' : ''}`}
                                    </p>
                                </div>
                                <button className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                                    Meilleure note
                                    <span className="material-symbols-outlined text-lg">expand_more</span>
                                </button>
                            </div>

                            {/* Mobile search */}
                            <div className="sm:hidden flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 mb-4 focus-within:border-blue-400 transition-all">
                                <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
                                <input
                                    className="bg-transparent border-none focus:outline-none text-sm w-full placeholder:text-slate-400 ml-2"
                                    placeholder="Rechercher un médecin..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* States */}
                            {loading ? (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="bg-white rounded-2xl border border-slate-100 h-52 animate-pulse" />
                                    ))}
                                </div>
                            ) : apiError ? (
                                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <span className="material-symbols-outlined text-5xl text-red-300 mb-3 block">wifi_off</span>
                                    <p className="text-lg font-bold text-slate-700">Impossible de contacter le serveur</p>
                                    <p className="text-sm text-slate-400 mt-1">Vérifiez que le backend est démarré sur le port 8081.</p>
                                    <button
                                        onClick={chargerMedecins}
                                        className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors"
                                    >
                                        Réessayer
                                    </button>
                                </div>
                            ) : medecins.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">person_off</span>
                                    <p className="text-lg font-bold text-slate-700">Aucun médecin en base de données</p>
                                    <p className="text-sm text-slate-400 mt-1">Aucun compte médecin n'a encore été créé.</p>
                                </div>
                            ) : medecinsFiltres.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">search_off</span>
                                    <p className="text-lg font-bold text-slate-700">Aucun résultat</p>
                                    <p className="text-sm text-slate-400 mt-1">Essayez de modifier vos filtres.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                    {medecinsFiltres.map((m) => (
                                        <div
                                            key={m.id}
                                            className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:border-blue-100 transition-all duration-300 group cursor-pointer"
                                            onClick={() => router.push(`/patient/reserver/${m.id}`)}
                                        >
                                            <div className="flex h-full">
                                                {/* Photo */}
                                                <div className="w-36 shrink-0 overflow-hidden bg-gradient-to-br from-blue-50 to-slate-100 relative">
                                                    <img
                                                        src={m.photo}
                                                        alt={m.nom}
                                                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                                        onError={(e) => {
                                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.nom)}&background=0071c2&color=fff&size=300`;
                                                        }}
                                                    />
                                                    {/* Dispo badge on photo */}
                                                    {m.disponibiliteType === 'today' && (
                                                        <div className="absolute bottom-2 left-2 right-2">
                                                            <span className="block text-center bg-green-500 text-white text-[9px] font-black uppercase tracking-wide px-2 py-1 rounded-lg shadow-lg">
                                                                Disponible
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Infos */}
                                                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getBadgeStyle(m.disponibiliteType)}`}>
                                                                {m.disponibilite}
                                                            </span>
                                                            <StarRating rating={m.rating} />
                                                        </div>

                                                        <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                                                            {m.nom}
                                                        </h3>
                                                        <p className="text-blue-600 text-xs font-semibold mt-0.5">{m.specialite}</p>
                                                        <p className="text-slate-400 text-xs">{m.experience}</p>

                                                        <div className="mt-3 space-y-1.5">
                                                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                                                <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                                                                <span className="truncate">{m.lieu}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs">
                                                                <span className={`material-symbols-outlined text-sm shrink-0 ${String(m.horaires || '').startsWith('Consultation :') ? 'text-emerald-600' : 'text-slate-400'}`}>schedule</span>
                                                                <span className={String(m.horaires || '').startsWith('Consultation :') ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>{m.horaires}</span>
                                                            </div>
                                                            {m.videoConsult && (
                                                                <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                                                                    <span className="material-symbols-outlined text-sm">video_camera_front</span>
                                                                    Consultation vidéo disponible
                                                                </div>
                                                            )}
                                                            {m.datesJoursOffPatient?.length > 0 && (
                                                                <div className="flex items-start gap-1.5 text-red-700 text-xs font-medium">
                                                                    <span className="material-symbols-outlined text-sm shrink-0 text-red-600">event_busy</span>
                                                                    <span className="leading-snug">
                                                                        Day off : {m.datesJoursOffPatient.slice(0, 4).join(', ')}
                                                                        {m.datesJoursOffPatient.length > 4 ? '…' : ''}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                                                <span className="material-symbols-outlined text-sm text-slate-400">language</span>
                                                                {m.langues}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex items-center justify-between gap-3">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Tarif</span>
                                                            <span className="text-lg font-black text-slate-900">{m.tarif} <span className="text-sm font-bold text-slate-500">MAD</span></span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); router.push(`/patient/reserver/${m.id}`); }}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-md shadow-blue-100 flex items-center gap-1.5"
                                                        >
                                                            <span className="material-symbols-outlined text-base">calendar_add_on</span>
                                                            Prendre RDV
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {medecinsFiltres.length > 0 && (
                                <div className="mt-10 flex items-center justify-center gap-2">
                                    <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors">
                                        <span className="material-symbols-outlined">chevron_left</span>
                                    </button>
                                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-200">1</button>
                                    <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 font-bold transition-colors">2</button>
                                    <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors">
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* ── FOOTER ── */}
                <footer className="mt-12 bg-white border-t border-slate-200 py-8 px-8">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                        <img
                            src="/logos/logo_cabinet.png"
                            alt="ŒilDirect"
                            className="h-10 w-auto object-contain opacity-50"
                            style={{ mixBlendMode: 'multiply' }}
                        />
                        <div className="flex gap-6 text-sm text-slate-400 font-medium flex-wrap justify-center">
                            <a href="#" className="hover:text-blue-600 transition-colors">Politique de confidentialité</a>
                            <a href="#" className="hover:text-blue-600 transition-colors">Conditions d'utilisation</a>
                            <a href="#" className="hover:text-blue-600 transition-colors">Aide</a>
                            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
                        </div>
                        <p className="text-xs text-slate-400">© 2025 ŒilDirect. Tous droits réservés.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
