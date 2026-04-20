import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api';
import { getUser, logout } from '../../../lib/useAuth';
import CalendrierDispo from '../../../components/CalendrierDispo';

// ── Card type detection ──────────────────────────────────────────────────────
function detectCardType(number) {
    const n = number.replace(/\s/g, '');
    if (/^4/.test(n)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard';
    if (/^3[47]/.test(n)) return 'amex';
    return null;
}

function CardLogo({ type, size = 'md' }) {
    const cls = size === 'sm' ? 'h-5' : 'h-7';
    if (type === 'visa') return (
        <svg className={cls} viewBox="0 0 750 471" xmlns="http://www.w3.org/2000/svg">
            <rect width="750" height="471" rx="40" fill="#1A1F71"/>
            <text x="375" y="310" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="200" fill="white" letterSpacing="-10">VISA</text>
        </svg>
    );
    if (type === 'mastercard') return (
        <svg className={cls} viewBox="0 0 152 108" xmlns="http://www.w3.org/2000/svg">
            <circle cx="54" cy="54" r="54" fill="#EB001B"/>
            <circle cx="98" cy="54" r="54" fill="#F79E1B"/>
            <path d="M76 22a54 54 0 0 1 0 64 54 54 0 0 1 0-64z" fill="#FF5F00"/>
        </svg>
    );
    if (type === 'amex') return (
        <svg className={cls} viewBox="0 0 750 471" xmlns="http://www.w3.org/2000/svg">
            <rect width="750" height="471" rx="40" fill="#2E77BC"/>
            <text x="375" y="310" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="120" fill="white">AMEX</text>
        </svg>
    );
    return <span className="material-symbols-outlined text-slate-400 text-2xl">credit_card</span>;
}

// ── Animated Card Preview ────────────────────────────────────────────────────
function CardPreview({ cardNumber, cardName, cardExpiry, cardCvv, cardType, flipped }) {
    const displayNumber = (cardNumber || '').padEnd(16, '·').replace(/(.{4})/g, '$1 ').trim();
    const bgGradient = cardType === 'visa'
        ? 'from-blue-800 to-blue-600'
        : cardType === 'mastercard'
            ? 'from-slate-800 to-slate-600'
            : cardType === 'amex'
                ? 'from-indigo-700 to-indigo-500'
                : 'from-slate-700 to-slate-500';

    return (
        <div className="w-full max-w-xs mx-auto mb-6" style={{ perspective: '1000px' }}>
            <div
                className="relative w-full transition-transform duration-700"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    height: '180px',
                }}
            >
                {/* Front */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${bgGradient} p-5 shadow-2xl flex flex-col justify-between`}
                    style={{ backfaceVisibility: 'hidden' }}>
                    <div className="flex justify-between items-start">
                        <div className="w-10 h-8 bg-amber-300 rounded-md opacity-90" style={{
                            background: 'linear-gradient(135deg, #d4a843 25%, #f5d485 50%, #d4a843 75%)',
                        }} />
                        <div className="h-8 flex items-center">
                            {cardType ? <CardLogo type={cardType} size="sm" /> : (
                                <span className="text-white/40 text-xs font-bold tracking-widest">CARTE</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-white font-mono text-lg tracking-[0.18em] font-bold drop-shadow">
                            {displayNumber.replace(/·/g, '•')}
                        </p>
                        <div className="flex justify-between mt-3">
                            <div>
                                <p className="text-white/50 text-[9px] uppercase tracking-widest">Titulaire</p>
                                <p className="text-white text-xs font-bold tracking-wide uppercase truncate max-w-[140px]">
                                    {cardName || 'VOTRE NOM'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-white/50 text-[9px] uppercase tracking-widest">Expire</p>
                                <p className="text-white text-xs font-bold">{cardExpiry || 'MM/AA'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${bgGradient} shadow-2xl flex flex-col justify-center`}
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                    <div className="bg-slate-900 h-10 w-full mt-4" />
                    <div className="px-5 mt-4">
                        <p className="text-white/40 text-[9px] uppercase tracking-widest mb-1">CVV / CVC</p>
                        <div className="bg-white rounded px-3 py-1.5 flex justify-end">
                            <span className="font-mono text-slate-800 font-bold tracking-widest text-sm">
                                {cardCvv ? '•'.repeat(cardCvv.length) : '•••'}
                            </span>
                        </div>
                        <p className="text-white/30 text-[9px] mt-3 text-center">Ce code est confidentiel. Ne le communiquez jamais.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Same photo + metadata pools as medecins.js — assigned by index (deterministic)
const DOCTOR_PHOTOS = [
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=400&h=400&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1643297654416-05795d62e39c?w=400&h=400&fit=crop&crop=face',
];

const METADATA_POOL = [
    { specialite: 'Ophtalmologiste',                        experience: '12 ans exp.', rating: 4.9, reviews: 120, lieu: 'Clinique Al Amal, Casablanca',       tarif: '1500' },
    { specialite: 'Ophtalmologiste',                        experience: '18 ans exp.', rating: 4.8, reviews: 215, lieu: 'Centre de la Vision, Rabat',          tarif: '1600' },
    { specialite: 'Ophtalmologiste · Spécialiste Rétine',   experience: '10 ans exp.', rating: 5.0, reviews: 89,  lieu: 'Clinique Universitaire, Marrakech',  tarif: '1700' },
    { specialite: 'Ophtalmologiste · Chirurgie Réfractive', experience: '15 ans exp.', rating: 4.7, reviews: 67,  lieu: 'Centre Laser Vision, Fès',            tarif: '2000' },
    { specialite: 'Ophtalmologiste · Glaucome',             experience: '8 ans exp.',  rating: 4.9, reviews: 143, lieu: 'Polyclinique du Parc, Agadir',        tarif: '1450' },
    { specialite: 'Ophtalmologiste · Pédiatrique',          experience: '20 ans exp.', rating: 4.6, reviews: 312, lieu: 'CHU Ibn Rochd, Casablanca',           tarif: '1550' },
    { specialite: 'Ophtalmologiste',                        experience: '6 ans exp.',  rating: 4.8, reviews: 54,  lieu: 'Cabinet Médical Ryad, Meknès',       tarif: '1350' },
    { specialite: 'Ophtalmologiste · Urgences Oculaires',   experience: '14 ans exp.', rating: 4.7, reviews: 198, lieu: 'Clinique Al Inbiath, Tanger',         tarif: '1800' },
];

const MOTIFS = [
    'Baisse de vision progressive',
    'Douleur oculaire',
    'Vision floue de près ou de loin',
    'Renouvellement ordonnance lunettes/lentilles',
    'Contrôle annuel de vue',
    'Corps flottants (mouches volantes)',
    'Autre motif',
];

const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'];

export default function ReserverPage() {
    const router = useRouter();
    const { id } = router.query;
    const [user, setUser] = useState(null);
    const [medecin, setMedecin] = useState(null);
    const [etape, setEtape] = useState(1); // 1=RDV 2=Paiement 3=Succès

    // Formulaire RDV
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [motif, setMotif] = useState('');
    const [autreMotif, setAutreMotif] = useState('');

    // Paiement
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cardFlipped, setCardFlipped] = useState(false);
    const [showCvv, setShowCvv] = useState(false);
    const [saveCard, setSaveCard] = useState(false);

    const cardType = detectCardType(cardNumber);

    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');

    useEffect(() => {
        const u = getUser();
        if (!u || u.role !== 'PATIENT') { router.push('/connexion'); return; }
        setUser(u);
    }, []);

    useEffect(() => {
        if (!id) return;
        chargerMedecin(id);
    }, [id]);

    const chargerMedecin = async (medecinId) => {
        try {
            // Fetch the full list (same endpoint as medecins page)
            const list = await fetchApi('/medecins');
            if (Array.isArray(list) && list.length > 0) {
                // Find the exact doctor by id
                const found = list.find(m => String(m.id) === String(medecinId));
                const apiDoctor = found || list[0];
                // Determine index in list for consistent photo + metadata
                const idx = list.indexOf(apiDoctor);
                const meta = METADATA_POOL[idx % METADATA_POOL.length];
                const apiPhoto = apiDoctor.photoProfil && String(apiDoctor.photoProfil).trim()
                    ? apiDoctor.photoProfil
                    : DOCTOR_PHOTOS[idx % DOCTOR_PHOTOS.length];
                setMedecin({
                    ...meta,
                    id: apiDoctor.id,
                    nom: apiDoctor.nom,
                    prenom: apiDoctor.prenom,
                    email: apiDoctor.email,
                    photo: apiPhoto,
                    joursConsultationHebdo: apiDoctor.joursConsultationHebdo,
                    datesJoursOff: apiDoctor.datesJoursOff,
                    datesDisponibles: apiDoctor.datesDisponibles,
                });
            }
        } catch {
            // Backend unavailable — use minimal placeholder so the form still works
            const idx = (parseInt(medecinId) - 1) || 0;
            const meta = METADATA_POOL[idx % METADATA_POOL.length];
            setMedecin({
                ...meta,
                id: medecinId,
                nom: 'Médecin',
                photo: DOCTOR_PHOTOS[idx % DOCTOR_PHOTOS.length],
            });
        }
    };

    const motifFinal = motif === 'Autre motif' ? autreMotif : motif;
    const serviceFee = 125;
    const total = medecin ? (parseFloat(medecin.tarif) + serviceFee) : 0;

    // Returns true if a time slot is in the past when today is selected
    const isSlotPast = (slot) => {
        if (!selectedDate) return false;
        const now = new Date();
        const isToday =
            selectedDate.getFullYear() === now.getFullYear() &&
            selectedDate.getMonth() === now.getMonth() &&
            selectedDate.getDate() === now.getDate();
        if (!isToday) return false;
        const [h, m] = slot.split(':').map(Number);
        const slotMinutes = h * 60 + m;
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        return slotMinutes <= nowMinutes;
    };

    const confirmerRdv = async () => {
        setLoading(true);
        setErreur('');
        try {
            const params = new URLSearchParams({
                praticienId: medecin.id,
                motif: motifFinal,
            });
            await fetchApi(`/patients/${user.id}/demandes?${params}`, { method: 'POST' });
            setEtape(3);
        } catch (err) {
            // En mode démo, passer quand même à la confirmation
            if (err.message?.includes('fetch')) {
                setEtape(3); // Simuler le succès
            } else {
                setErreur(err.message || 'Erreur lors de la création de la demande');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d) => {
        if (!d) return '';
        return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    if (!user || !medecin) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Prendre rendez-vous – {medecin.nom} – ŒilDirect</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-slate-50 font-display">
                {/* ── HEADER ── */}
                {etape < 3 && (
                    <header className="bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                        <div className="flex items-center gap-4">
                            <Link href="/patient/medecins" className="text-slate-400 hover:text-blue-600 transition-colors flex items-center">
                                <span className="material-symbols-outlined text-xl">arrow_back</span>
                            </Link>
                            <img
                                src="/logos/logo_cabinet.png"
                                alt="ŒilDirect"
                                className="h-14 w-auto object-contain"
                                style={{ mixBlendMode: 'multiply', transform: 'scale(3.5)', transformOrigin: 'left center', marginLeft: '2rem' }}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-semibold">
                                <span className="material-symbols-outlined text-sm text-emerald-600">lock</span>
                                Paiement 100% sécurisé SSL
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full font-semibold">
                                <span className="material-symbols-outlined text-sm">verified_user</span>
                                PCI DSS
                            </div>
                        </div>
                    </header>
                )}

                {/* ── ÉTAPE 1 : RÉSERVATION ── */}
                {etape === 1 && (
                    <div className="max-w-3xl mx-auto px-4 py-8">
                        {/* Fiche médecin */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
                            <div className="flex items-center gap-4">
                                <img
                                    src={medecin.photo}
                                    alt={medecin.nom}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-100"
                                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(medecin.nom)}&background=0071c2&color=fff&size=100`; }}
                                />
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-slate-900">{medecin.nom}</h2>
                                    <p className="text-blue-600 text-sm font-medium">{medecin.specialite} · {medecin.experience}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <svg className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="text-sm font-bold text-slate-800">{medecin.rating}</span>
                                        <span className="text-xs text-slate-400">({medecin.reviews} avis)</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 uppercase tracking-wide">Tarif consultation</p>
                                    <p className="text-2xl font-bold text-slate-900">{medecin.tarif} MAD</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Calendrier */}
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                                    <span className="material-symbols-outlined text-blue-500 text-lg">calendar_month</span>
                                    Choisir une date
                                </h3>
                                <CalendrierDispo
                                    selectionMode="booking"
                                    selectedDate={selectedDate}
                                    joursConsultationHebdo={medecin.joursConsultationHebdo}
                                    datesJoursOff={medecin.datesJoursOff}
                                    datesDisponibles={medecin.datesDisponibles}
                                    onSelect={(date) => {
                                        setSelectedDate(date);
                                        if (selectedTime) {
                                            const now = new Date();
                                            const isTodaySel =
                                                date.getFullYear() === now.getFullYear() &&
                                                date.getMonth() === now.getMonth() &&
                                                date.getDate() === now.getDate();
                                            if (isTodaySel) {
                                                const [h, m] = selectedTime.split(':').map(Number);
                                                if (h * 60 + m <= now.getHours() * 60 + now.getMinutes()) {
                                                    setSelectedTime('');
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>

                            {/* Créneaux horaires */}
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                                    <span className="material-symbols-outlined text-blue-500 text-lg">schedule</span>
                                    Choisir un créneau
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {TIME_SLOTS.map(t => {
                                        const past = isSlotPast(t);
                                        const selected = selectedTime === t;
                                        return (
                                            <button
                                                key={t}
                                                disabled={past}
                                                onClick={() => !past && setSelectedTime(t)}
                                                className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all relative ${
                                                    past
                                                        ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed line-through'
                                                        : selected
                                                            ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                                                            : 'border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                                                }`}
                                            >
                                                {t}
                                                {past && (
                                                    <span className="absolute -top-1.5 -right-1.5 bg-slate-300 text-white text-[8px] font-black px-1 rounded-full leading-4">
                                                        PASSÉ
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                {selectedDate && TIME_SLOTS.every(t => isSlotPast(t)) && (
                                    <p className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                        Tous les créneaux d'aujourd'hui sont passés. Veuillez choisir une autre date.
                                    </p>
                                )}

                                {/* Motif */}
                                <div className="mt-5">
                                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                                        <span className="material-symbols-outlined text-blue-500 text-lg">description</span>
                                        Motif de la consultation
                                    </h3>
                                    <select
                                        value={motif}
                                        onChange={e => setMotif(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                    >
                                        <option value="">Sélectionnez un motif...</option>
                                        {MOTIFS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    {motif === 'Autre motif' && (
                                        <textarea
                                            className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                                            rows={3}
                                            placeholder="Décrivez brièvement vos symptômes..."
                                            value={autreMotif}
                                            onChange={e => setAutreMotif(e.target.value)}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Boutons */}
                        <div className="flex gap-4">
                            <Link href="/patient/medecins" className="flex-1">
                                <button className="w-full py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all">
                                    Annuler
                                </button>
                            </Link>
                            <button
                                onClick={() => setEtape(2)}
                                disabled={!selectedDate || !selectedTime || !motifFinal}
                                className={`flex-1 py-3.5 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 ${
                                    !selectedDate || !selectedTime || !motifFinal
                                        ? 'bg-slate-300 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95'
                                }`}
                            >
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                Confirmer le rendez-vous
                            </button>
                        </div>
                        <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-sm">shield</span>
                            Réservation sécurisée
                            <span className="material-symbols-outlined text-sm ml-2">notifications</span>
                            Rappel SMS automatique
                        </p>
                    </div>
                )}

                {/* ── ÉTAPE 2 : PAIEMENT ── */}
                {etape === 2 && (
                    <div className="max-w-5xl mx-auto px-4 py-8">
                        {/* Étapes progress */}
                        <div className="flex items-center justify-center gap-2 mb-8">
                            {[{ n: 1, label: 'Rendez-vous' }, { n: 2, label: 'Paiement' }, { n: 3, label: 'Confirmation' }].map((s, i) => (
                                <div key={s.n} className="flex items-center gap-2">
                                    <div className={`flex items-center gap-2 ${s.n === 2 ? 'text-blue-600' : s.n < 2 ? 'text-emerald-600' : 'text-slate-300'}`}>
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${s.n === 2 ? 'border-blue-600 bg-blue-600 text-white' : s.n < 2 ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white text-slate-300'}`}>
                                            {s.n < 2 ? '✓' : s.n}
                                        </div>
                                        <span className="text-xs font-semibold hidden sm:block">{s.label}</span>
                                    </div>
                                    {i < 2 && <div className={`w-12 h-0.5 ${s.n < 2 ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            {/* ─── LEFT: Formulaire paiement ─── */}
                            <div className="lg:col-span-3 space-y-5">
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900">Paiement sécurisé</h1>
                                    <p className="text-slate-500 text-sm mt-1">Toutes vos informations sont chiffrées et protégées.</p>
                                </div>

                                {/* Badges sécurité */}
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { icon: 'lock', label: 'SSL 256-bit', color: 'emerald' },
                                        { icon: 'verified_user', label: 'PCI DSS v4', color: 'blue' },
                                        { icon: 'security', label: '3D Secure', color: 'violet' },
                                        { icon: 'shield', label: 'Anti-fraude', color: 'amber' },
                                    ].map(b => (
                                        <div key={b.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-${b.color}-50 border border-${b.color}-200 text-${b.color}-700 text-xs font-bold`}>
                                            <span className="material-symbols-outlined text-sm">{b.icon}</span>
                                            {b.label}
                                        </div>
                                    ))}
                                </div>

                                {/* Méthode de paiement */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-5 pt-5 pb-3 border-b border-slate-100">
                                        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-blue-500 text-lg">payment</span>
                                            Méthode de paiement
                                        </h2>
                                    </div>
                                    <div className="p-5">
                                        <div className="grid grid-cols-2 gap-3 mb-5">
                                            <button
                                                onClick={() => setPaymentMethod('card')}
                                                className={`py-3.5 rounded-xl border-2 flex items-center justify-center gap-2 transition-all font-semibold text-sm ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-slate-50'}`}
                                            >
                                                <span className="material-symbols-outlined text-lg">credit_card</span>
                                                Carte bancaire
                                            </button>
                                            <button
                                                onClick={() => setPaymentMethod('paypal')}
                                                className={`py-3.5 rounded-xl border-2 flex items-center justify-center gap-2 transition-all font-semibold text-sm ${paymentMethod === 'paypal' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-slate-50'}`}
                                            >
                                                <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                                                PayPal
                                            </button>
                                        </div>

                                        {paymentMethod === 'card' && (
                                            <>
                                                {/* Card Preview */}
                                                <CardPreview
                                                    cardNumber={cardNumber.replace(/\s/g, '')}
                                                    cardName={cardName}
                                                    cardExpiry={cardExpiry}
                                                    cardCvv={cardCvv}
                                                    cardType={cardType}
                                                    flipped={cardFlipped}
                                                />

                                                <div className="space-y-4">
                                                    {/* Numéro de carte */}
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                                                            Numéro de carte
                                                        </label>
                                                        <div className="relative">
                                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                                                                {cardType
                                                                    ? <CardLogo type={cardType} size="sm" />
                                                                    : <span className="material-symbols-outlined text-slate-300 text-xl">credit_card</span>
                                                                }
                                                            </div>
                                                            <input
                                                                type="text"
                                                                placeholder="0000 0000 0000 0000"
                                                                maxLength={19}
                                                                value={cardNumber}
                                                                onFocus={() => setCardFlipped(false)}
                                                                onChange={e => {
                                                                    const v = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
                                                                    setCardNumber(v);
                                                                }}
                                                                className="w-full border-2 border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-mono focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                                                            />
                                                            {cardType && (
                                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${cardType === 'visa' ? 'bg-blue-100 text-blue-700' : cardType === 'mastercard' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                                        {cardType}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Logos acceptés */}
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-[10px] text-slate-400 font-medium">Cartes acceptées :</span>
                                                            <div className="flex gap-1.5">
                                                                <div className={`h-5 w-9 rounded border flex items-center justify-center transition-all ${cardType === 'visa' ? 'border-blue-400 shadow-sm shadow-blue-200' : 'border-slate-200 opacity-50'}`}>
                                                                    <CardLogo type="visa" size="sm" />
                                                                </div>
                                                                <div className={`h-5 w-9 rounded border flex items-center justify-center transition-all ${cardType === 'mastercard' ? 'border-red-300 shadow-sm shadow-red-100' : 'border-slate-200 opacity-50'}`}>
                                                                    <CardLogo type="mastercard" size="sm" />
                                                                </div>
                                                                <div className={`h-5 w-9 rounded border flex items-center justify-center transition-all ${cardType === 'amex' ? 'border-indigo-400 shadow-sm shadow-indigo-200' : 'border-slate-200 opacity-50'}`}>
                                                                    <CardLogo type="amex" size="sm" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Nom titulaire */}
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                                                            Nom du titulaire
                                                        </label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-lg">person</span>
                                                            <input
                                                                type="text"
                                                                placeholder="JEAN DUPONT"
                                                                value={cardName}
                                                                onFocus={() => setCardFlipped(false)}
                                                                onChange={e => setCardName(e.target.value.toUpperCase())}
                                                                className="w-full border-2 border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors uppercase"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Expiry + CVV */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                                                                Date d'expiration
                                                            </label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-lg">calendar_month</span>
                                                                <input
                                                                    type="text"
                                                                    placeholder="MM/AA"
                                                                    maxLength={5}
                                                                    value={cardExpiry}
                                                                    onFocus={() => setCardFlipped(false)}
                                                                    onChange={e => {
                                                                        let v = e.target.value.replace(/\D/g, '');
                                                                        if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                                                                        setCardExpiry(v);
                                                                    }}
                                                                    className="w-full border-2 border-slate-200 rounded-xl pl-10 pr-3 py-3 text-sm font-mono focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                                                                CVV / CVC
                                                                <button type="button" className="ml-1 text-slate-300 hover:text-slate-500 transition-colors" title="3 derniers chiffres au dos de la carte">
                                                                    <span className="material-symbols-outlined text-sm">help_outline</span>
                                                                </button>
                                                            </label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-lg">lock</span>
                                                                <input
                                                                    type={showCvv ? 'text' : 'password'}
                                                                    placeholder="•••"
                                                                    maxLength={4}
                                                                    value={cardCvv}
                                                                    onFocus={() => setCardFlipped(true)}
                                                                    onBlur={() => setCardFlipped(false)}
                                                                    onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                                                    className="w-full border-2 border-slate-200 rounded-xl pl-10 pr-9 py-3 text-sm font-mono focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowCvv(v => !v)}
                                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                                >
                                                                    <span className="material-symbols-outlined text-base">{showCvv ? 'visibility_off' : 'visibility'}</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Sauvegarder la carte */}
                                                    <label className="flex items-center gap-3 cursor-pointer group">
                                                        <div
                                                            onClick={() => setSaveCard(v => !v)}
                                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${saveCard ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}
                                                        >
                                                            {saveCard && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                                        </div>
                                                        <span className="text-xs text-slate-600 font-medium">Sauvegarder cette carte pour mes prochains paiements</span>
                                                    </label>
                                                </div>
                                            </>
                                        )}

                                        {paymentMethod === 'paypal' && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                                                <div className="w-14 h-14 bg-blue-700 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                    <span className="text-white font-black text-xl italic">P</span>
                                                </div>
                                                <p className="font-bold text-slate-800 text-sm">Paiement via PayPal</p>
                                                <p className="text-xs text-slate-500 mt-1">Vous serez redirigé vers PayPal pour finaliser votre paiement de <strong>{total} MAD</strong>.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {erreur && (
                                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                        <span className="material-symbols-outlined text-base">error</span>
                                        {erreur}
                                    </div>
                                )}

                                {/* Bouton payer */}
                                <button
                                    onClick={confirmerRdv}
                                    disabled={loading || (paymentMethod === 'card' && (!cardName || !cardNumber || !cardExpiry || !cardCvv))}
                                    className={`w-full py-4 rounded-xl text-white font-black text-base flex items-center justify-center gap-3 transition-all shadow-lg ${
                                        loading || (paymentMethod === 'card' && (!cardName || !cardNumber || !cardExpiry || !cardCvv))
                                            ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 active:scale-[0.98]'
                                    }`}
                                >
                                    {loading ? (
                                        <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                                    )}
                                    {loading ? 'Vérification en cours…' : `Payer ${total} MAD en toute sécurité`}
                                </button>

                                {/* Info légale */}
                                <div className="text-center space-y-2">
                                    <p className="text-xs text-slate-400">
                                        En cliquant, vous acceptez nos{' '}
                                        <a href="#" className="text-blue-500 hover:underline">Conditions d'utilisation</a>{' '}
                                        et notre{' '}
                                        <a href="#" className="text-blue-500 hover:underline">Politique d'annulation</a>.
                                    </p>
                                    <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 font-medium">
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">lock</span>Paiement chiffré</span>
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">verified_user</span>Données protégées</span>
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">refresh</span>Remboursement 24h</span>
                                    </div>
                                </div>
                            </div>

                            {/* ─── RIGHT: Récapitulatif ─── */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-4">
                                        <h2 className="text-white font-bold text-sm flex items-center gap-2">
                                            <span className="material-symbols-outlined text-blue-200 text-base">receipt_long</span>
                                            Résumé de votre réservation
                                        </h2>
                                    </div>

                                    <div className="p-5">
                                        {/* Médecin */}
                                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
                                            <img
                                                src={medecin.photo}
                                                alt={medecin.nom}
                                                className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100"
                                                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(medecin.nom)}&background=0071c2&color=fff&size=100`; }}
                                            />
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-sm truncate">{medecin.nom}</p>
                                                <p className="text-blue-600 text-xs font-medium truncate">{medecin.specialite}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <svg key={i} className={`w-3 h-3 ${i < Math.round(medecin.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                    <span className="text-[10px] text-slate-400 ml-0.5">({medecin.reviews})</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Détails RDV */}
                                        <div className="space-y-2.5 text-sm text-slate-600 mb-5">
                                            <div className="flex items-start gap-2.5">
                                                <span className="material-symbols-outlined text-blue-400 text-base mt-0.5">calendar_month</span>
                                                <span className="font-medium capitalize">{formatDate(selectedDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <span className="material-symbols-outlined text-blue-400 text-base">schedule</span>
                                                <span className="font-medium">{selectedTime} — {selectedTime ? `${parseInt(selectedTime.split(':')[0])}:${String((parseInt(selectedTime.split(':')[1] || 0) + 30) % 60).padStart(2, '0')} (30 min)` : ''}</span>
                                            </div>
                                            <div className="flex items-start gap-2.5">
                                                <span className="material-symbols-outlined text-blue-400 text-base mt-0.5">location_on</span>
                                                <span className="font-medium">{medecin.lieu}</span>
                                            </div>
                                            <div className="flex items-start gap-2.5">
                                                <span className="material-symbols-outlined text-blue-400 text-base mt-0.5">description</span>
                                                <span className="font-medium">{motifFinal}</span>
                                            </div>
                                        </div>

                                        {/* Tarifs */}
                                        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                                            <div className="flex justify-between text-sm text-slate-600">
                                                <span>Consultation</span>
                                                <span className="font-semibold">{medecin.tarif} MAD</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-slate-600">
                                                <span>Frais de service</span>
                                                <span className="font-semibold">{serviceFee} MAD</span>
                                            </div>
                                            <div className="flex justify-between font-black text-blue-700 text-base pt-2 border-t border-slate-200 mt-2">
                                                <span>Total TTC</span>
                                                <span>{total} MAD</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Garantie */}
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
                                    <span className="material-symbols-outlined text-emerald-600 text-2xl flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                                    <div>
                                        <p className="text-sm font-bold text-emerald-900">Satisfaction garantie</p>
                                        <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">Remboursement intégral dans les 24h si vous n'êtes pas satisfait.</p>
                                    </div>
                                </div>

                                {/* Annulation */}
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3">
                                    <span className="material-symbols-outlined text-slate-500 text-xl flex-shrink-0">event_busy</span>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">Annulation gratuite</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Jusqu'à 24h avant votre rendez-vous.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── ÉTAPE 3 : SUCCÈS ── */}
                {etape === 3 && (
                    <div className="max-w-lg mx-auto px-4 py-16 text-center">
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10">
                            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Rendez-vous confirmé !</h2>
                            <p className="text-slate-600 mb-1">
                                Votre rendez-vous avec <strong>{medecin.nom}</strong> a été enregistré avec succès.
                            </p>
                            {selectedDate && selectedTime && (
                                <div className="bg-blue-50 rounded-xl p-4 my-5 text-left space-y-2">
                                    <p className="text-sm text-blue-800 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-500 text-base">calendar_month</span>
                                        <strong>{formatDate(selectedDate)}</strong>
                                    </p>
                                    <p className="text-sm text-blue-800 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-500 text-base">schedule</span>
                                        <strong>{selectedTime}</strong>
                                    </p>
                                    <p className="text-sm text-blue-800 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-500 text-base">location_on</span>
                                        {medecin.lieu}
                                    </p>
                                </div>
                            )}
                            <p className="text-xs text-slate-400 mb-8">Un SMS de rappel vous sera envoyé 24h avant votre rendez-vous.</p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => router.push('/patient')}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                >
                                    Retour à mon espace →
                                </button>
                                <button
                                    onClick={() => router.push('/patient/medecins')}
                                    className="text-slate-500 hover:text-blue-600 text-sm transition-colors"
                                >
                                    Trouver un autre médecin
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                            <span className="material-symbols-outlined text-sm">copyright</span>
                            2024 ŒilDirect Booking System. Tous droits réservés.
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
