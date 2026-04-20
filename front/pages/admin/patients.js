import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth, getUser, logout } from '../../lib/useAuth';
import { fetchApi } from '../../lib/api';

const emptyForm = { nom:'', prenom:'', age:'', cin:'', telephone:'', email:'', motDePasse:'' };

export default function AdminPatients() {
    useAuth('ADMIN');
    const router = useRouter();
    const currentUser = getUser();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const load = () => {
        setLoading(true);
        fetchApi('/admin/patients')
            .then(data => { setUsers(data); setLoading(false); })
            .catch(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const openAdd = () => { setForm(emptyForm); setError(''); setModal('add'); };
    const openEdit = (u) => {
        setSelected(u);
        setForm({ nom: u.nom||'', prenom: u.prenom||'', age: u.age!=null?String(u.age):'',
                  cin: u.cin||'', telephone: u.telephone||'', email: u.email||'', motDePasse:'' });
        setError(''); setModal('edit');
    };
    const openDelete = (u) => { setSelected(u); setError(''); setModal('delete'); };
    const closeModal = () => { setModal(null); setSelected(null); setError(''); };

    const handleAdd = async (e) => {
        e.preventDefault(); setSubmitting(true); setError('');
        try {
            await fetchApi('/admin/utilisateurs', { method:'POST', body: JSON.stringify({...form, role:'PATIENT'}) });
            closeModal(); load();
        } catch (err) { setError(err.message||'Erreur.'); } finally { setSubmitting(false); }
    };
    const handleEdit = async (e) => {
        e.preventDefault(); setSubmitting(true); setError('');
        try {
            const payload = { nom:form.nom, prenom:form.prenom, email:form.email,
                              age:form.age, cin:form.cin, telephone:form.telephone };
            if (form.motDePasse) payload.motDePasse = form.motDePasse;
            await fetchApi(`/admin/utilisateurs/${selected.id}`, { method:'PUT', body: JSON.stringify(payload) });
            closeModal(); load();
        } catch (err) { setError(err.message||'Erreur.'); } finally { setSubmitting(false); }
    };
    const handleDelete = async () => {
        setSubmitting(true); setError('');
        try {
            await fetchApi(`/admin/utilisateurs/${selected.id}`, { method:'DELETE' });
            closeModal(); load();
        } catch (err) { setError(err.message||'Erreur.'); } finally { setSubmitting(false); }
    };

    const filtered = users.filter(u =>
        (u.nom||'').toLowerCase().includes(search.toLowerCase()) ||
        (u.prenom||'').toLowerCase().includes(search.toLowerCase()) ||
        (u.email||'').toLowerCase().includes(search.toLowerCase()) ||
        (u.cin||'').toLowerCase().includes(search.toLowerCase())
    );

    const inp = (name, label, opts={}) => (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</label>
            <input {...opts} value={form[name]} onChange={e => setForm({...form,[name]:e.target.value})}
                className="h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 dark:text-slate-100 text-sm transition-all" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
            <Head>
                <title>Patients | Admin OeilDirect</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
            </Head>

            <header className="sticky top-0 z-50 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin">
                            <button className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors">
                                <span className="material-symbols-outlined text-base">arrow_back</span>
                                <span className="text-sm font-medium hidden sm:inline">Tableau de bord</span>
                            </button>
                        </Link>
                        <span className="text-slate-300 dark:text-slate-700">/</span>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-500 text-base">person</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Patients</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="hidden sm:block text-sm text-slate-500">{currentUser?.nom}</span>
                        <button onClick={() => logout(router)} className="text-slate-500 hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined text-base">logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Gestion des <span className="text-blue-600">Patients</span></h1>
                        <p className="text-slate-500 text-sm mt-1">{users.length} patient{users.length!==1?'s':''} inscrit{users.length!==1?'s':''}</p>
                    </div>
                    <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md shadow-blue-200 dark:shadow-none">
                        <span className="material-symbols-outlined text-base">person_add</span>Ajouter un patient
                    </button>
                </div>

                <div className="relative mb-6">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-base">search</span>
                    <input type="text" placeholder="Rechercher par nom, CIN ou email..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"/>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-16 text-center"><span className="material-symbols-outlined text-4xl text-slate-400 animate-spin">progress_activity</span></div>
                    ) : filtered.length === 0 ? (
                        <div className="p-16 text-center">
                            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700">person_off</span>
                            <p className="mt-3 text-slate-500">Aucun patient trouve.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400">Patient</th>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400 hidden md:table-cell">CIN</th>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400 hidden lg:table-cell">Email</th>
                                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400 hidden lg:table-cell">Tel</th>
                                    <th className="text-right px-5 py-3.5 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filtered.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">{(u.prenom||u.nom||'?').charAt(0).toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                        {u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.nom}
                                                    </p>
                                                    {u.age && <p className="text-xs text-slate-400">{u.age} ans</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 hidden md:table-cell">
                                            {u.cin ? <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">{u.cin}</span>
                                                   : <span className="text-slate-400 text-xs">—</span>}
                                        </td>
                                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 hidden lg:table-cell">{u.email}</td>
                                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 hidden lg:table-cell">{u.telephone||'—'}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEdit(u)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                    <span className="material-symbols-outlined text-sm">edit</span>Modifier
                                                </button>
                                                <button onClick={() => openDelete(u)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                    <span className="material-symbols-outlined text-sm">delete</span>Supprimer
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {(modal==='add'||modal==='edit') && (
                            <form onSubmit={modal==='add'?handleAdd:handleEdit} className="p-6 flex flex-col gap-4">
                                <div className="flex items-center justify-between mb-1">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                        {modal==='add'?'Ajouter un patient':'Modifier le patient'}
                                    </h2>
                                    <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
                                </div>
                                {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>}
                                <div className="grid grid-cols-2 gap-3">
                                    {inp('prenom', 'Prenom *', {required:true, placeholder:'Mohamed'})}
                                    {inp('nom', 'Nom *', {required:true, placeholder:'Dupont'})}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {inp('age', 'Age', {type:'number', min:0, max:120, placeholder:'35'})}
                                    {inp('cin', 'CIN', {placeholder:'123456789'})}
                                </div>
                                {inp('telephone', 'Numero de telephone', {placeholder:'+213 6XX XXX XXX'})}
                                {inp('email', 'Email *', {required:true, type:'email', placeholder:'patient@exemple.com'})}
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                        Mot de passe {modal==='edit' && <span className="font-normal text-slate-400">(laisser vide pour ne pas changer)</span>}{modal==='add'&&' *'}
                                    </label>
                                    <input type="password" required={modal==='add'} value={form.motDePasse}
                                        onChange={e=>setForm({...form,motDePasse:e.target.value})} placeholder="••••••••"
                                        className="h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 dark:text-slate-100 text-sm"/>
                                </div>
                                <div className="flex gap-3 mt-2">
                                    <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 text-sm">Annuler</button>
                                    <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm disabled:opacity-60">
                                        {submitting?'Enregistrement...':modal==='add'?'Ajouter':'Enregistrer'}
                                    </button>
                                </div>
                            </form>
                        )}
                        {modal==='delete' && (
                            <div className="p-6 flex flex-col gap-5">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Supprimer le patient</h2>
                                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
                                    Etes-vous sur de vouloir supprimer <strong>{selected?.prenom} {selected?.nom}</strong> ? Cette action est irreversible.
                                </div>
                                {error && <div className="text-red-600 text-sm">{error}</div>}
                                <div className="flex gap-3">
                                    <button onClick={closeModal} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 text-sm">Annuler</button>
                                    <button onClick={handleDelete} disabled={submitting} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm disabled:opacity-60">
                                        {submitting?'Suppression...':'Supprimer'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}