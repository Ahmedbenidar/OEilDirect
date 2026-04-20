import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { fetchApi } from '../../lib/api';

export default function ConnexionSecretaire() {
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

            if (user.role !== 'SECRETAIRE') {
                setError('Accès refusé. Ce portail est réservé aux secrétaires.');
                return;
            }

            localStorage.setItem('oeildirect_user', JSON.stringify(user));
            router.push('/secretaire');
        } catch (err) {
            setError(err.message || 'Email ou mot de passe incorrect.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Connexion Secrétaire - ŒilDirect">
            <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-4">
                            <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900">Portail Secrétariat</h2>
                        <p className="mt-2 text-sm text-gray-500">Accès réservé au personnel administratif</p>
                    </div>

                    <div className="bg-white py-8 px-6 shadow rounded-xl border-t-4 border-t-indigo-500">
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
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="votre@cabinet.com"
                                    value={form.email} onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="motDePasse" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                                <input
                                    id="motDePasse" name="motDePasse" type="password" required
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="••••••••"
                                    value={form.motDePasse} onChange={handleChange}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Connexion...' : 'Accéder au tableau de bord'}
                            </button>
                        </form>

                        {/* Compte démo */}
                        <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                            <p className="text-xs text-gray-400 mb-2">Compte de démonstration</p>
                            <button
                                onClick={() => setForm({ email: 'sophie@test.com', motDePasse: 'password' })}
                                className="text-xs py-1.5 px-4 border border-indigo-200 text-indigo-600 rounded-md hover:bg-indigo-50"
                            >
                                Sophie Martin (Secrétaire de démonstration)
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
