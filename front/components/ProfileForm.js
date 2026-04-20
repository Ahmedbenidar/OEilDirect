import { useEffect, useMemo, useState } from 'react';
import { fetchApi } from '../lib/api';
import { getUser } from '../lib/useAuth';

export default function ProfileForm({ roleRequis }) {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [initialForm, setInitialForm] = useState(null);
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', age: '',
    telephone: '', cin: '', specialite: '', photoProfil: '',
  });

  const isMedecin = useMemo(() => roleRequis === 'MEDECIN', [roleRequis]);

  useEffect(() => {
    const u = getUser();
    if (!u) { setLoading(false); return; }
    setUser(u);
    const prefill = {
      nom: u.nom || '', prenom: u.prenom || '', email: u.email || '',
      age: u.age ?? '', telephone: u.telephone || '', cin: u.cin || '',
      specialite: u.specialite || '', photoProfil: u.photoProfil || '',
    };
    setForm(prefill);
    setInitialForm(prefill);
    (async () => {
      try {
        const p = await fetchApi(`/utilisateurs/${u.id}`);
        const next = {
          nom: p.nom || '', prenom: p.prenom || '', email: p.email || '',
          age: p.age ?? '', telephone: p.telephone || '', cin: p.cin || '',
          specialite: p.specialite || '', photoProfil: p.photoProfil || '',
        };
        setForm(next);
        setInitialForm(next);
      } catch (e) {
        setErr(e.message || 'Erreur lors de la requete API');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onPickPhoto = (file) => {
    if (!file) return;
    setErr(''); setOkMsg('');
    if (!file.type.startsWith('image/')) { setErr('Image invalide (PNG/JPG/WebP).'); return; }
    if (file.size > 1500000) { setErr('Image trop volumineuse (max 1.5MB).'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((p) => ({ ...p, photoProfil: String(reader.result || '') }));
    reader.onerror = () => setErr('Impossible de lire le fichier.');
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true); setErr(''); setOkMsg('');
    try {
      const payload = {
        nom: form.nom, prenom: form.prenom, email: form.email,
        age: form.age === '' ? null : Number(form.age),
        telephone: form.telephone, cin: form.cin,
        specialite: isMedecin ? form.specialite : null,
        photoProfil: form.photoProfil || null,
      };
      const saved = await fetchApi(`/utilisateurs/${user.id}`, {
        method: 'PUT', body: JSON.stringify(payload),
      });
      try {
        const current = getUser();
        localStorage.setItem('oeildirect_user', JSON.stringify({ ...(current || {}), ...(saved || {}) }));
      } catch {}
      setOkMsg('Profil mis a jour.');
      setInitialForm({ ...form });
    } catch (e) {
      setErr(e.message || 'Erreur sauvegarde profil');
    } finally {
      setSaving(false);
    }
  };

  const disabled = loading || saving;
  const initial = (form.nom || 'U').trim().charAt(0).toUpperCase();
  const displayName = isMedecin
    ? ('Dr. ' + (form.nom || '') + ' ' + (form.prenom || '')).trim()
    : ((form.nom || '') + ' ' + (form.prenom || '')).trim();
  const roleLabel = isMedecin
    ? (form.specialite || 'Medecin')
    : (roleRequis === 'SECRETAIRE' ? 'Secretaire' : 'Patient');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-[#191c1e] tracking-tight mb-2">Mon profil</h1>
        <p className="text-[#43474e] text-sm">Gerez vos informations personnelles.</p>
      </div>

      {err && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold">
          {err}
        </div>
      )}
      {okMsg && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-semibold">
          {okMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-8 flex flex-col items-center shadow-[0_4px_40px_-10px_rgba(25,28,30,0.06)] border border-slate-200/60">
            <div className="relative mb-6">
              {form.photoProfil ? (
                <img src={form.photoProfil} alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-sm" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-[#e6e8ea] border-4 border-white shadow-sm flex items-center justify-center text-[#0061a7] font-black text-4xl">
                  {initial}
                </div>
              )}
              <label className={`absolute bottom-0 right-0 cursor-pointer ${disabled ? 'pointer-events-none' : ''}`}>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => onPickPhoto(e.target.files?.[0])} disabled={disabled} />
                <span className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors ${disabled ? 'bg-slate-300 text-slate-400 cursor-not-allowed' : 'bg-[#0061a7] text-white hover:bg-[#004e86]'}`}>
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                </span>
              </label>
            </div>

            <h2 className="font-medium text-lg text-[#191c1e] mb-1 text-center">{displayName || 'Utilisateur'}</h2>
            <p className="text-sm text-[#43474e] mb-6 text-center">{roleLabel}</p>

            <label className={`w-full py-2 px-4 bg-[#e0e3e5] text-[#0061a7] rounded-md font-semibold uppercase tracking-wider text-xs text-center cursor-pointer transition-colors hover:bg-[#d0d3d5] block ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => onPickPhoto(e.target.files?.[0])} disabled={disabled} />
              Changer la photo
            </label>

            {form.photoProfil && (
              <button type="button" disabled={disabled}
                className="mt-3 text-xs font-semibold text-[#43474e] hover:text-red-600 underline disabled:opacity-60"
                onClick={() => setForm((p) => ({ ...p, photoProfil: '' }))}>
                Supprimer la photo
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-8 shadow-[0_4px_40px_-10px_rgba(25,28,30,0.06)] border border-slate-200/60">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <F label="Nom" value={form.nom} onChange={(v) => setForm((p) => ({ ...p, nom: v }))} disabled={disabled} />
              <F label="Prenom" value={form.prenom} onChange={(v) => setForm((p) => ({ ...p, prenom: v }))} disabled={disabled} />
              <div className="md:col-span-2">
                <F label="Email" type="email" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} disabled={disabled} />
              </div>
              <F label="Telephone" type="tel" value={form.telephone} onChange={(v) => setForm((p) => ({ ...p, telephone: v }))} disabled={disabled} />
              <F label="CIN" value={form.cin} onChange={(v) => setForm((p) => ({ ...p, cin: v }))} disabled={disabled} />
              <div className="md:col-span-2">
                <F label="Age" type="number" value={String(form.age ?? '')} onChange={(v) => setForm((p) => ({ ...p, age: v }))} disabled={disabled} />
              </div>
              {isMedecin && (
                <div className="md:col-span-2">
                  <F label="Specialite" value={form.specialite} onChange={(v) => setForm((p) => ({ ...p, specialite: v }))} disabled={disabled} />
                </div>
              )}
            </div>

            <div className="pt-8 flex justify-end gap-4 border-t border-[#e0e3e5] mt-8">
              <button type="button"
                disabled={disabled || !initialForm}
                className="py-2.5 px-6 bg-transparent text-[#0061a7] font-semibold text-xs uppercase tracking-wide hover:bg-[#f2f4f6] rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={() => { if (initialForm) { setForm(initialForm); setErr(''); setOkMsg(''); } }}>
                Annuler
              </button>
              <button type="button"
                disabled={disabled}
                className="py-2.5 px-8 bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white rounded-md font-semibold text-xs uppercase tracking-wide shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={save}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function F({ label, value, onChange, type = 'text', disabled = false }) {
  return (
    <div className="relative group">
      <label className="block font-semibold text-xs uppercase tracking-wide text-[#43474e] mb-2">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-[#e6e8ea] border-none rounded-md py-2.5 px-4 text-[#191c1e] text-sm focus:bg-white focus:ring-2 focus:ring-[#0061a7]/20 focus:outline-none transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
    </div>
  );
}
