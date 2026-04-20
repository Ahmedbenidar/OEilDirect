import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { fetchApi } from '../../lib/api';

export default function ConnexionMedecin() {
    const router = useRouter();
    const [form, setForm] = useState({ email: '', motDePasse: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

            if (user.role !== 'MEDECIN') {
                setError('Accès refusé. Ce portail est réservé aux médecins.');
                return;
            }

            localStorage.setItem('oeildirect_user', JSON.stringify(user));
            router.push('/medecin');
        } catch (err) {
            setError(err.message || 'Email ou mot de passe incorrect.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Connexion Médecin - ŒilDirect">
            <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-teal-100 mb-4">
                            <svg className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900">Portail Médecin</h2>
                        <p className="mt-2 text-sm text-gray-500">Espace dédié aux praticiens ophtalmologues</p>
                    </div>

                    <div className="bg-white py-8 px-6 shadow rounded-xl border-t-4 border-t-teal-500">
                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email professionnel</label>
                                <input
                                    id="email" name="email" type="email" required
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                    placeholder="dr.nom@cabinet.com"
                                    value={form.email} onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="motDePasse" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                                <input
                                    id="motDePasse" name="motDePasse" type="password" required
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                    placeholder="••••••••"
                                    value={form.motDePasse} onChange={handleChange}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Connexion...' : 'Accéder à mon espace clinique'}
                            </button>
                        </form>

                        {/* Compte démo */}
                        <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                            <p className="text-xs text-gray-400 mb-2">Compte de démonstration</p>
                            <button
                                onClick={() => setForm({ email: 'doc@test.com', motDePasse: 'password' })}
                                className="text-xs py-1.5 px-4 border border-teal-200 text-teal-600 rounded-md hover:bg-teal-50"
                            >
                                Dr House (Médecin de démonstration)
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-xs text-gray-400">
                        <Link href="/"><span className="hover:underline cursor-pointer">← Retour à l'accueil</span></Link>
                    </p>
                </div>
            </div>
        </Layout>
    );
}
