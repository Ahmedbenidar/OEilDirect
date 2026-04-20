import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { fetchApi } from '../../lib/api';
import { getUser } from '../../lib/useAuth';

const MOTIFS = [
    'Baisse de vision progressive',
    'Douleur oculaire',
    'Vision floue de près ou de loin',
    'Renouvellement ordonnance lunettes/lentilles',
    'Contrôle annuel de vue',
    'Corps flottants (mouches volantes)',
    'Autre motif',
];

export default function NouveauRdv() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [etape, setEtape] = useState(1);

    // Formulaire
    const [motif, setMotif] = useState('');
    const [autreMotif, setAutreMotif] = useState('');
    const [medecins, setMedecins] = useState([]);
    const [medecinChoisi, setMedecinChoisi] = useState(null);
    const [infos, setInfos] = useState({ prenom: '', nom: '', telephone: '' });
    const [paiement, setPaiement] = useState({ carte: '', expiry: '', cvv: '' });
    const [loading, setLoading] = useState(false);
    const [erreur, setErreur] = useState('');

    useEffect(() => {
        const u = getUser();
        if (!u || u.role !== 'PATIENT') { router.push('/connexion'); return; }
        setUser(u);
        chargerMedecins();
    }, []);

    const chargerMedecins = async () => {
        try {
            const data = await fetchApi('/medecins');
            setMedecins(data);
        } catch (err) { console.error(err); }
    };

    const motifFinal = motif === 'Autre motif' ? autreMotif : motif;

    const confirmerDemande = async () => {
        setLoading(true);
        setErreur('');
        try {
            const params = new URLSearchParams({
                praticienId: medecinChoisi.id,
                motif: motifFinal,
            });
            await fetchApi(`/patients/${user.id}/demandes?${params}`, { method: 'POST' });
            setEtape(4); // Succès
        } catch (err) {
            setErreur(err.message || 'Erreur lors de la création de la demande');
        } finally {
            setLoading(false);
        }
    };

    const steps = ['Motif', 'Médecin', 'Paiement'];

    if (!user) return null;

    return (
        <Layout title="Nouveau rendez-vous - ŒilDirect">
            <div className="max-w-2xl mx-auto">

                {etape < 4 && (
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Demande de consultation</h1>
                        {/* Progress steps */}
                        <div className="flex items-center">
                            {steps.map((s, i) => (
                                <div key={s} className="flex items-center flex-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                                        etape > i + 1 ? 'bg-blue-600 border-blue-600 text-white' :
                                        etape === i + 1 ? 'border-blue-600 text-blue-600 bg-white' :
                                        'border-gray-200 text-gray-400 bg-white'
                                    }`}>
                                        {etape > i + 1 ? '✓' : i + 1}
                                    </div>
                                    <span className={`ml-2 text-sm font-medium ${etape === i + 1 ? 'text-blue-600' : 'text-gray-400'}`}>{s}</span>
                                    {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-4 ${etape > i + 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white shadow rounded-xl overflow-hidden">
                    {/* ETAPE 1: MOTIF */}
                    {etape === 1 && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-1">Quel est le motif de votre consultation ?</h2>
                            <p className="text-sm text-gray-500 mb-5">Sélectionnez le motif qui correspond le mieux à votre situation.</p>
                            <div className="grid grid-cols-1 gap-2">
                                {MOTIFS.map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setMotif(m)}
                                        className={`text-left px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                                            motif === m
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 text-gray-700 hover:border-blue-300'
                                        }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                            {motif === 'Autre motif' && (
                                <textarea
                                    className="mt-3 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    rows={2}
                                    placeholder="Décrivez votre motif..."
                                    value={autreMotif}
                                    onChange={(e) => setAutreMotif(e.target.value)}
                                />
                            )}
                            <div className="mt-6">
                                <button
                                    onClick={() => setEtape(2)}
                                    disabled={!motifFinal}
                                    className={`w-full py-3 rounded-xl text-white font-semibold transition-colors ${!motifFinal ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    Continuer →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ETAPE 2: CHOISIR MEDECIN */}
                    {etape === 2 && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-1">Choisissez votre médecin</h2>
                            <p className="text-sm text-gray-500 mb-5">Sélectionnez le praticien avec qui vous souhaitez consulter.</p>
                            <div className="space-y-3">
                                {medecins.length === 0 && (
                                    <p className="text-gray-400 text-sm">Aucun médecin disponible pour l'instant.</p>
                                )}
                                {medecins.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMedecinChoisi(m)}
                                        className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 text-left transition-colors ${
                                            medecinChoisi?.id === m.id
                                                ? 'border-blue-600 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                    >
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-lg">
                                            {m.nom.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{m.nom}</p>
                                            <p className="text-sm text-gray-500">Ophtalmologue – Consultation en ligne</p>
                                        </div>
                                        {medecinChoisi?.id === m.id && (
                                            <div className="ml-auto text-blue-600">
                                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-6 flex gap-3">
                                <button onClick={() => setEtape(1)} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">
                                    ← Retour
                                </button>
                                <button
                                    onClick={() => setEtape(3)}
                                    disabled={!medecinChoisi}
                                    className={`flex-1 py-3 rounded-xl text-white font-semibold transition-colors ${!medecinChoisi ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    Continuer →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ETAPE 3: INFORMATIONS + PAIEMENT */}
                    {etape === 3 && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-1">Informations & Paiement</h2>
                            <p className="text-sm text-gray-500 mb-5">Vérifiez vos informations et complétez le paiement pour valider la demande.</p>

                            {/* Récapitulatif */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                                <h3 className="text-sm font-semibold text-blue-900 mb-2">Récapitulatif</h3>
                                <p className="text-sm text-blue-800">🩺 Médecin : <strong>{medecinChoisi?.nom}</strong></p>
                                <p className="text-sm text-blue-800">📋 Motif : <strong>{motifFinal}</strong></p>
                                <p className="text-sm text-blue-800">💳 Tarif : <strong>20,00 €</strong> (consultation à distance)</p>
                            </div>

                            {/* Paiement simulé */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Informations de paiement (Simulé)</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Numéro de carte</label>
                                        <input
                                            type="text" placeholder="1234 5678 9012 3456" maxLength={19}
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            value={paiement.carte}
                                            onChange={(e) => setPaiement({ ...paiement, carte: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Date d'expiration</label>
                                            <input
                                                type="text" placeholder="MM/AA" maxLength={5}
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                value={paiement.expiry}
                                                onChange={(e) => setPaiement({ ...paiement, expiry: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">CVV</label>
                                            <input
                                                type="password" placeholder="•••" maxLength={4}
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                value={paiement.cvv}
                                                onChange={(e) => setPaiement({ ...paiement, cvv: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {erreur && <p className="text-sm text-red-600 mb-4">{erreur}</p>}

                            <div className="flex gap-3">
                                <button onClick={() => setEtape(2)} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">
                                    ← Retour
                                </button>
                                <button
                                    onClick={confirmerDemande}
                                    disabled={loading || !paiement.carte}
                                    className={`flex-1 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-colors ${loading || !paiement.carte ? 'bg-gray-300' : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    {loading ? 'Traitement...' : '🔒 Payer 20,00 € et confirmer'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ETAPE 4: SUCCES */}
                    {etape === 4 && (
                        <div className="p-10 text-center">
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                                <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Demande envoyée !</h2>
                            <p className="text-gray-600 max-w-sm mx-auto mb-2">
                                Votre demande de rendez-vous avec <strong>{medecinChoisi?.nom}</strong> a bien été transmise au secrétariat.
                            </p>
                            <p className="text-sm text-gray-400 mb-8">Vous serez notifié dès que votre dossier sera validé.</p>
                            <button
                                onClick={() => router.push('/patient')}
                                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
                            >
                                Retour à mon espace →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
