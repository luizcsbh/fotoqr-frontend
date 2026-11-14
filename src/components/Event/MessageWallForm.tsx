import React, { FormEvent, useState } from 'react';
import { MessageSquareHeart, Send, CheckCircle2, UserRound, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { messageWallService, maskWhatsApp, MESSAGE_MAX_LENGTH } from '../../services/messageWall.service';

interface MessageWallFormProps {
  eventUuid: string;
}

const STORAGE_KEY = 'fotoqr_wall_guest';

/** Name and WhatsApp are remembered on this phone so a second message is quicker to send. */
const loadGuest = (): { name: string; phone: string } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { name: String(parsed.name ?? ''), phone: String(parsed.phone ?? '') };
    }
  } catch {
    // storage unavailable (private mode): start empty
  }
  return { name: '', phone: '' };
};

/** Guest form for the message wall: name, WhatsApp and message are all required. */
export const MessageWallForm: React.FC<MessageWallFormProps> = ({ eventUuid }) => {
  const [guest] = useState(loadGuest);
  const [name, setName] = useState(guest.name);
  const [phone, setPhone] = useState(guest.phone);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const phoneDigits = phone.replace(/\D/g, '');
  const canSend = name.trim().length >= 2 && phoneDigits.length >= 10 && message.trim().length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSend) {
      toast.error('Preencha nome, WhatsApp com DDD e a mensagem.');
      return;
    }
    setSending(true);
    try {
      await messageWallService.send(eventUuid, { name: name.trim(), phone, message: message.trim() });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: name.trim(), phone }));
      } catch {
        // not critical
      }
      setMessage('');
      setSent(true);
      toast.success('Recado enviado! Fique de olho no telão.');
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível enviar o recado. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6 space-y-4 border-rose-100">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
          <MessageSquareHeart className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Mural de Recados</h2>
          <p className="text-sm text-slate-500">Deixe uma mensagem para os anfitriões. Ela pode aparecer no telão!</p>
        </div>
      </div>

      {sent ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-sm font-semibold text-emerald-800">Recado enviado com carinho!</p>
          <Button variant="outline" size="sm" onClick={() => setSent(false)} leftIcon={<MessageSquareHeart className="w-4 h-4" />}>
            Escrever outro recado
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div>
            <label htmlFor="wall-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Seu nome <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="wall-name"
                type="text"
                autoComplete="name"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como você quer aparecer no telão"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="wall-phone" className="block text-sm font-semibold text-slate-700 mb-1.5">
              WhatsApp <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="wall-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                required
                value={phone}
                onChange={(e) => setPhone(maskWhatsApp(e.target.value))}
                placeholder="(31) 99999-8888"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Visível só para os anfitriões, nunca no telão.</p>
          </div>

          <div>
            <label htmlFor="wall-message" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Mensagem <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="wall-message"
              required
              rows={4}
              maxLength={MESSAGE_MAX_LENGTH}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva seu recado..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {message.length}/{MESSAGE_MAX_LENGTH}
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            isLoading={sending}
            disabled={!canSend}
            leftIcon={<Send className="w-4 h-4" />}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold"
          >
            Enviar recado
          </Button>
        </form>
      )}
    </Card>
  );
};
