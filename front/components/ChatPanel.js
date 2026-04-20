import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchApi } from '../lib/api';

const ROLE_LABEL = { MEDECIN: 'Medecin', PATIENT: 'Patient', SECRETAIRE: 'Secretariat', ADMIN: 'Admin' };
const ROLE_COLOR = {
  MEDECIN: 'bg-sky-100 text-sky-700',
  PATIENT: 'bg-emerald-100 text-emerald-700',
  SECRETAIRE: 'bg-violet-100 text-violet-700',
  ADMIN: 'bg-slate-100 text-slate-600'
};

function Avatar({ nom, prenom, photo, size = 'md' }) {
  const s = size === 'sm' ? 'w-9 h-9 text-xs' : 'w-10 h-10 text-sm';
  if (photo) return <img src={photo} alt="" className={`${s} rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm`} />;
  const initiale = (prenom || nom || '?').charAt(0).toUpperCase();
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm`}>
      {initiale}
    </div>
  );
}

function UnreadBadge({ count, animate = true }) {
  if (!count || count <= 0) return null;
  return (
    <span className={`relative flex-shrink-0 ${animate ? 'badge-blink' : ''}`}>
      <span className="badge-ping-ring absolute inset-0 rounded-full bg-red-400"></span>
      <span className="relative w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border border-white shadow">
        {count > 9 ? '9+' : count}
      </span>
    </span>
  );
}

export default function ChatPanel({ user }) {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [unreadPerContact, setUnreadPerContact] = useState({});
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);

  const loadContacts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchApi('/messages/contacts/' + user.id);
      setContacts(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }, [user]);

  const loadUnreadData = useCallback(async () => {
    if (!user) return;
    try {
      const [countData, perContactData] = await Promise.all([
        fetchApi('/messages/unread-count/' + user.id),
        fetchApi('/messages/unread-per-contact/' + user.id),
      ]);
      const total = countData?.count || 0;
      setUnreadTotal(total);
      setUnreadPerContact(perContactData || {});

      // Mettre a jour badges sidebar
      const badges = document.querySelectorAll('.chat-sidebar-badge');
      badges.forEach(badge => {
        badge.textContent = total > 9 ? '9+' : String(total);
        badge.style.display = total > 0 ? 'flex' : 'none';
      });
    } catch { }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadContacts();
    loadUnreadData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    pollRef.current = setInterval(() => {
      loadUnreadData();
      if (selected) loadMessages(selected.id, false);
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [user, selected, loadUnreadData]);

  useEffect(() => {
    if (open && selected) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [messages]);

  useEffect(() => {
    if (open && selected && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selected, open]);

  const loadMessages = async (contactId, scroll = true) => {
    try {
      const data = await fetchApi('/messages/conversation?user1=' + user.id + '&user2=' + contactId);
      setMessages(Array.isArray(data) ? data : []);
      if (scroll) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    } catch { }
  };

  const selectContact = async (contact) => {
    setSelected(contact);
    await loadMessages(contact.id);
    // Marquer comme lu explicitement
    try {
      await fetchApi('/messages/read?receiverId=' + user.id + '&senderId=' + contact.id, { method: 'PUT' });
    } catch { }
    // Rafraichir compteurs
    loadUnreadData();
  };

  const sendMessage = async () => {
    if (!input.trim() || !selected || sending) return;
    setSending(true);
    try {
      await fetchApi('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user.id, receiverId: selected.id, contenu: input.trim() }),
      });
      setInput('');
      await loadMessages(selected.id);
    } catch (e) { console.error(e); }
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) { loadContacts(); loadUnreadData(); }
  };

  if (!user) return null;

  return (
    <>
      <style>{`
        @keyframes softBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        @keyframes pingRing {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        .badge-blink { animation: softBlink 1.4s ease-in-out infinite; }
        .badge-ping-ring { animation: pingRing 1.4s cubic-bezier(0,0,0.2,1) infinite; }
      `}</style>

      {/* Bouton flottant */}
      <button
        id="chat-toggle-btn"
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-sky-600 hover:bg-sky-700 text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Chat"
      >
        <span className="material-symbols-outlined text-[26px]">{open ? 'close' : 'chat'}</span>
        {unreadTotal > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex">
            <span className="badge-ping-ring absolute inline-flex w-5 h-5 rounded-full bg-red-400 opacity-60"></span>
            <span className="badge-blink relative w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow">
              {unreadTotal > 9 ? '9+' : unreadTotal}
            </span>
          </span>
        )}
      </button>

      {/* Panneau chat */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[740px] max-w-[96vw] h-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex overflow-hidden">

          {/* Colonne contacts */}
          <div className="w-64 flex-shrink-0 border-r border-slate-100 flex flex-col bg-slate-50">
            {/* En-tete */}
            <div className="px-4 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
              <div>
                <p className="font-black text-slate-900 text-sm">Messages</p>
                <p className="text-[11px] text-slate-400">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
              </div>
              {unreadTotal > 0 && (
                <span className="flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded-full border border-red-200 badge-blink">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                  {unreadTotal} non lu{unreadTotal > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Liste contacts */}
            <div className="flex-1 overflow-y-auto">
              {contacts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs px-4">
                  <span className="material-symbols-outlined text-3xl text-slate-200 block mb-2">person_off</span>
                  Aucun contact
                </div>
              ) : contacts.map(c => {
                const isActive = selected?.id === c.id;
                const unreadInfo = unreadPerContact[String(c.id)];
                const unread = unreadInfo?.count || 0;
                const displayName = [c.prenom, c.nom].filter(Boolean).join(' ') || 'Utilisateur';
                const lastMsgContenu = c.lastMessageContenu;
                const lastMsgDate = c.lastMessageDate;
                const lastMsgIsMine = c.lastMessageSenderId === user.id;

                return (
                  <button
                    key={c.id}
                    onClick={() => selectContact(c)}
                    className={`w-full flex items-start gap-3 px-3 py-3.5 transition-colors text-left border-b border-slate-100 ${isActive ? 'bg-sky-50 border-l-[3px] border-l-sky-500' : 'hover:bg-white'}`}
                  >
                    <div className="relative flex-shrink-0 mt-0.5">
                      <Avatar nom={c.nom} prenom={c.prenom} photo={c.photoProfil} size="sm" />
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white badge-blink"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-sm truncate ${unread > 0 ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                          {displayName}
                        </p>
                        {lastMsgDate && (
                          <span className="text-[10px] text-slate-400 flex-shrink-0">{formatTime(lastMsgDate)}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ROLE_COLOR[c.role] || 'bg-slate-100 text-slate-500'}`}>
                          {ROLE_LABEL[c.role] || c.role}
                        </span>
                        {unread > 0 && (
                          <span className="badge-blink flex-shrink-0 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center px-1 border border-white shadow">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </div>
                      {lastMsgContenu && !unread && (
                        <p className="text-[11px] text-slate-400 truncate mt-1">
                          {lastMsgIsMine ? 'Vous: ' : ''}{lastMsgContenu}
                        </p>
                      )}
                      {unread > 0 && unreadInfo?.lastContenu && (
                        <p className="text-[11px] text-slate-600 font-semibold truncate mt-1">
                          {unreadInfo.lastContenu}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zone messages */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-50/50">
                <span className="material-symbols-outlined text-6xl text-slate-200">forum</span>
                <p className="text-sm font-semibold text-slate-400">Selectionnez un contact</p>
                <p className="text-xs text-slate-300">pour commencer a discuter</p>
              </div>
            ) : (
              <>
                {/* Header conversation */}
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3 bg-white flex-shrink-0 shadow-sm">
                  <Avatar nom={selected.nom} prenom={selected.prenom} photo={selected.photoProfil} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{[selected.prenom, selected.nom].filter(Boolean).join(' ')}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ROLE_COLOR[selected.role] || ''}`}>
                      {ROLE_LABEL[selected.role] || selected.role}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-slate-50/30">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-slate-300 text-sm">Aucun message — dites bonjour !</p>
                    </div>
                  ) : messages.map((m, i) => {
                    const isMine = m.senderId === user.id;
                    const prevMsg = i > 0 ? messages[i - 1] : null;
                    const showTime = !prevMsg || (new Date(m.dateEnvoi) - new Date(prevMsg.dateEnvoi)) > 300000;
                    return (
                      <div key={m.id}>
                        {showTime && (
                          <div className="text-center my-2">
                            <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                              {formatTime(m.dateEnvoi)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
                          <div className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${isMine ? 'bg-sky-600 text-white rounded-br-sm shadow-sm' : 'bg-white text-slate-800 rounded-bl-sm shadow-sm border border-slate-100'}`}>
                            {m.contenu}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-slate-100 flex items-end gap-2 bg-white flex-shrink-0">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Ecrire un message... (Entree pour envoyer)"
                    className="flex-1 resize-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 max-h-24"
                    style={{ lineHeight: '1.5' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="w-10 h-10 rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
