import React, { useState } from 'react';
import {
  MessageSquare,
  Mail,
  Send,
  Phone,
  Search,
  ExternalLink,
  CheckCheck,
  Clock,
  Sparkles,
  Paperclip,
  User as UserIcon,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { CRMCard } from '../types/crm';
import { formatTimeAgo, formatDate, getWhatsAppDirectUrl } from '../utils/formatters';

export const OmnichannelView: React.FC = () => {
  const { cards, currentUser, sendCardMessage, setSelectedCard } = useCRM();

  // Filter cards with contact phone or email
  const [selectedLeadId, setSelectedLeadId] = useState<string>(cards[0]?.id || '');
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'email'>('all');
  const [chatSearch, setChatSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [activeTabChannel, setActiveTabChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [emailSubject, setEmailSubject] = useState('');

  const leadCards = cards.filter((c) => {
    if (chatSearch.trim()) {
      const q = chatSearch.toLowerCase();
      return (
        c.contactName.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCard = cards.find((c) => c.id === selectedLeadId) || leadCards[0];

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeCard) return;

    sendCardMessage(activeCard.id, {
      channel: activeTabChannel,
      sender: 'consultant',
      senderName: currentUser.name,
      content: messageInput.trim(),
      subject: activeTabChannel === 'email' ? (emailSubject || `A/C ${activeCard.contactName} - PipeCRM`) : undefined,
      status: 'sent',
    });

    setMessageInput('');
  };

  const filteredMessages = activeCard
    ? activeCard.messages.filter((m) => channelFilter === 'all' || m.channel === channelFilter)
    : [];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-red-600 dark:text-red-500" />
            <span>Central Omnichannel WhatsApp & E-mail</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Centralize todos os contatos com clientes em um único lugar</p>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex overflow-hidden">
        {/* Left Sidebar: Leads List */}
        <div className="w-72 sm:w-80 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-neutral-50/50 dark:bg-neutral-950/50 shrink-0">
          {/* Search & Channel Filter */}
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                placeholder="Buscar conversa ou cliente..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => setChannelFilter('all')}
                className={`flex-1 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  channelFilter === 'all'
                    ? 'bg-neutral-900 dark:bg-neutral-800 text-white'
                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setChannelFilter('whatsapp')}
                className={`flex-1 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  channelFilter === 'whatsapp'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                WhatsApp
              </button>
              <button
                onClick={() => setChannelFilter('email')}
                className={`flex-1 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  channelFilter === 'email'
                    ? 'bg-red-600 dark:bg-red-700 text-white'
                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                E-mail
              </button>
            </div>
          </div>

          {/* Leads Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
            {leadCards.map((card) => {
              const isSelected = card.id === activeCard?.id;
              const lastMsg = card.messages[card.messages.length - 1];

              return (
                <button
                  key={card.id}
                  onClick={() => setSelectedLeadId(card.id)}
                  className={`w-full p-3 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-red-50/70 dark:bg-red-950/40 border-l-4 border-red-600 dark:border-red-500'
                      : 'hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {card.contactName[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">{card.contactName}</p>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0">
                        {lastMsg ? formatTimeAgo(lastMsg.timestamp) : ''}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium truncate">{card.companyName}</p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                      {lastMsg ? lastMsg.content : 'Nenhuma mensagem recente'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Main Chat Area */}
        {activeCard ? (
          <div className="flex-1 flex flex-col bg-white dark:bg-neutral-900">
            {/* Chat Top Header */}
            <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-950/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-sm">
                  {activeCard.contactName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{activeCard.contactName}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                      {activeCard.phaseId}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    🏢 {activeCard.companyName} • 📞 {activeCard.contactPhone || 'Sem telefone'} • ✉️{' '}
                    {activeCard.contactEmail || 'Sem e-mail'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeCard.contactPhone && (
                  <a
                    href={getWhatsAppDirectUrl(
                      activeCard.contactPhone,
                      `Olá ${activeCard.contactName}, tudo bem? Sou ${currentUser.name}.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    <span>Abrir WhatsApp Web</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <button
                  onClick={() => setSelectedCard(activeCard)}
                  className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Ver Card Completo
                </button>
              </div>
            </div>

            {/* Channel Tabs */}
            <div className="px-4 py-2 bg-neutral-100/70 dark:bg-neutral-950/70 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
              <button
                onClick={() => setActiveTabChannel('whatsapp')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeTabChannel === 'whatsapp'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
                }`}
              >
                <span>💬 WhatsApp</span>
              </button>
              <button
                onClick={() => setActiveTabChannel('email')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeTabChannel === 'email'
                    ? 'bg-red-600 dark:bg-red-700 text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800'
                }`}
              >
                <span>✉️ E-mail</span>
              </button>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-neutral-50 dark:bg-neutral-950">
              {filteredMessages.map((msg) => {
                const isMe = msg.sender === 'consultant';
                const isSystem = msg.sender === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center my-2">
                      <span className="px-3 py-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full text-[10px] font-medium">
                        {msg.content} • {formatDate(msg.timestamp)}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] p-3.5 rounded-2xl text-xs shadow-2xs ${
                        isMe
                          ? msg.channel === 'whatsapp'
                            ? 'bg-emerald-700 text-white dark:bg-emerald-800 rounded-tr-none'
                            : 'bg-red-600 text-white dark:bg-red-700 rounded-tr-none'
                          : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-tl-none border border-neutral-200 dark:border-neutral-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-[10px] opacity-80">{msg.senderName}</span>
                        <span className="text-[9px] opacity-70">{formatTimeAgo(msg.timestamp)}</span>
                      </div>
                      {msg.subject && <p className="font-bold mb-1 underline">{msg.subject}</p>}
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                );
              })}

              {filteredMessages.length === 0 && (
                <div className="h-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 text-xs">
                  Nenhuma mensagem neste canal com {activeCard.contactName}.
                </div>
              )}
            </div>

            {/* Quick Templates Toolbar */}
            <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider shrink-0">Modelos:</span>
              <button
                onClick={() =>
                  setMessageInput(
                    `Olá ${activeCard.contactName}! Tudo bem? Gostaria de alinhar os próximos passos do projeto com a ${activeCard.companyName}.`
                  )
                }
                className="px-2.5 py-1 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 border border-neutral-200 dark:border-neutral-700 rounded text-[11px] text-neutral-700 dark:text-neutral-300 whitespace-nowrap cursor-pointer"
              >
                👋 Agendar Call de Alinhamento
              </button>
              <button
                onClick={() =>
                  setMessageInput(
                    `Oi ${activeCard.contactName}! Conseguiu avaliar o escopo e os valores apresentados na proposta?`
                  )
                }
                className="px-2.5 py-1 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750 border border-neutral-200 dark:border-neutral-700 rounded text-[11px] text-neutral-700 dark:text-neutral-300 whitespace-nowrap cursor-pointer"
              >
                📊 Follow-up Proposta
              </button>
            </div>

            {/* Message Input Bar */}
            <div className="p-3.5 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
              {activeTabChannel === 'email' && (
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Assunto do e-mail..."
                  className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none"
                />
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={
                    activeTabChannel === 'whatsapp'
                      ? 'Escreva uma mensagem no WhatsApp...'
                      : 'Escreva o e-mail...'
                  }
                  className="flex-1 px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl focus:bg-white dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />

                <button
                  onClick={handleSendMessage}
                  className={`p-2.5 rounded-xl text-white font-semibold transition-colors cursor-pointer ${
                    activeTabChannel === 'whatsapp'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-400 dark:text-neutral-500 text-xs">
            Selecione uma conversa ao lado para visualizar.
          </div>
        )}
      </div>
    </div>
  );
};
