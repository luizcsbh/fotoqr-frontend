import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Tag,
  Music2,
  ShieldCheck,
  MessageSquareHeart,
  QrCode,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { Event } from '../../types';
import { eventService } from '../../services/event.service';
import toast from 'react-hot-toast';

interface EditEventModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updated: Event) => void;
}

const CATEGORIES = [
  'Casamento',
  'Aniversário',
  'Corporativo',
  'Formatura',
  'Balada / Festa',
  'Escolar / Acadêmico',
  'Personalizado',
];

const formatToDateTimeLocal = (dateString?: string | null): string => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${y}-${m}-${day}T${hh}:${mm}`;
  } catch {
    return '';
  }
};

export const EditEventModal: React.FC<EditEventModalProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(event.title || '');
  const [description, setDescription] = useState(event.description || '');
  const [category, setCategory] = useState(event.category || 'Personalizado');
  const [location, setLocation] = useState(event.location || '');
  const [capacity, setCapacity] = useState<number | ''>(event.capacity ?? '');
  const [maxEntries, setMaxEntries] = useState(event.max_entries_per_invitation || 1);
  const [isActive, setIsActive] = useState(event.is_active ?? true);
  const [enableDjPlaylist, setEnableDjPlaylist] = useState(event.enable_dj_playlist ?? false);
  const [requirePhotoApproval, setRequirePhotoApproval] = useState(event.require_photo_approval ?? false);
  const [enableMessageWall, setEnableMessageWall] = useState(event.enable_message_wall ?? false);

  const [startDateTime, setStartDateTime] = useState(() =>
    formatToDateTimeLocal(event.start_date || event.event_date)
  );
  const [endDateTime, setEndDateTime] = useState(() =>
    formatToDateTimeLocal(event.end_date)
  );

  const [errors, setErrors] = useState<{ title?: string; startDateTime?: string; endDateTime?: string }>({});

  // Reset state whenever modal opens or event prop changes
  useEffect(() => {
    if (isOpen) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setCategory(event.category || 'Personalizado');
      setLocation(event.location || '');
      setCapacity(event.capacity ?? '');
      setMaxEntries(event.max_entries_per_invitation || 1);
      setIsActive(event.is_active ?? true);
      setEnableDjPlaylist(event.enable_dj_playlist ?? false);
      setRequirePhotoApproval(event.require_photo_approval ?? false);
      setEnableMessageWall(event.enable_message_wall ?? false);
      setStartDateTime(formatToDateTimeLocal(event.start_date || event.event_date));
      setEndDateTime(formatToDateTimeLocal(event.end_date));
      setErrors({});
    }
  }, [isOpen, event]);

  const validate = (): boolean => {
    const newErrors: { title?: string; startDateTime?: string; endDateTime?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'O título do evento é obrigatório.';
    } else if (title.trim().length < 2) {
      newErrors.title = 'O título deve ter pelo menos 2 caracteres.';
    }

    if (startDateTime && endDateTime) {
      if (new Date(endDateTime) <= new Date(startDateTime)) {
        newErrors.endDateTime = 'O término deve ser posterior ao início do evento.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateMutation = useMutation({
    mutationFn: (payload: any) => eventService.updateEvent(event.id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['event', event.id] });
      queryClient.invalidateQueries({ queryKey: ['event', event.uuid] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Evento atualizado! O QR Code permanece o mesmo.');
      if (onSuccess) onSuccess(updated);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao atualizar evento.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    updateMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      location: location.trim() || undefined,
      capacity: capacity ? Number(capacity) : undefined,
      max_entries_per_invitation: maxEntries,
      is_active: isActive,
      enable_dj_playlist: enableDjPlaylist,
      require_photo_approval: requirePhotoApproval,
      enable_message_wall: enableMessageWall,
      start_date: startDateTime ? new Date(startDateTime).toISOString() : undefined,
      end_date: endDateTime ? new Date(endDateTime).toISOString() : undefined,
      start_at: startDateTime ? new Date(startDateTime).toISOString() : undefined,
      end_at: endDateTime ? new Date(endDateTime).toISOString() : undefined,
      event_date: startDateTime ? startDateTime.split('T')[0] : undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Evento"
      description="Altere os detalhes do evento. O QR Code e link público permanecerão exatamente os mesmos."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        {/* QR Code Safety Notice Banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs">
          <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="font-bold text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              QR Code e Link 100% Preservados
            </p>
            <p className="text-emerald-800 leading-relaxed">
              Você pode alterar título, horários, local e recursos. Todos os convites impressos, placas de mesa e links compartilhados continuarão funcionando sem precisar reimprimir nada.
            </p>
          </div>
        </div>

        {/* Informações Básicas */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Informações Gerais
          </h4>

          {/* Título */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Título do Evento <span className="text-brand-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Casamento de Maria & João"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-hidden transition-all ${
                errors.title
                  ? 'border-red-300 bg-red-50 text-red-900'
                  : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Categoria e Local */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                <Tag className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-hidden hover:border-slate-300 transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                <MapPin className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                Local do Evento
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Villa Bisutti, São Paulo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-hidden hover:border-slate-300 transition-all"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Descrição ou Instruções aos Convidados
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Instruções para os convidados, hashtag do evento, recados..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-hidden hover:border-slate-300 transition-all resize-y"
            />
          </div>
        </div>

        {/* Datas e Horários */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Data e Horário
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                Início do Evento
              </label>
              <input
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-hidden transition-all ${
                  errors.startDateTime
                    ? 'border-red-300 bg-red-50 text-red-900'
                    : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                }`}
              />
              {errors.startDateTime && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {errors.startDateTime}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                Término do Evento
              </label>
              <input
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-hidden transition-all ${
                  errors.endDateTime
                    ? 'border-red-300 bg-red-50 text-red-900'
                    : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                }`}
              />
              {errors.endDateTime && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {errors.endDateTime}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Capacidade e Convites */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Capacidade e Portaria
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                <Users className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                Capacidade Estimada
              </label>
              <input
                type="number"
                min="1"
                max="50000"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ex: 150 convidados"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-hidden hover:border-slate-300 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Entradas por Convite Individual
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={maxEntries}
                onChange={(e) => setMaxEntries(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-hidden hover:border-slate-300 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Configurações de Recursos */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recursos do Evento
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Status Ativo/Pausado */}
            <div
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer select-none transition-all ${
                isActive
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div>
                <p className="text-xs font-bold text-slate-800">Recebimento de Fotos</p>
                <p className="text-[11px] text-slate-500">
                  {isActive ? 'Ativo (convidados podem enviar fotos)' : 'Pausado (envios bloqueados)'}
                </p>
              </div>
              {isActive ? (
                <ToggleRight className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-slate-400 shrink-0" />
              )}
            </div>

            {/* Playlist do DJ */}
            <div
              onClick={() => setEnableDjPlaylist(!enableDjPlaylist)}
              className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer select-none transition-all ${
                enableDjPlaylist
                  ? 'border-violet-200 bg-violet-50/60'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Music2 className={`w-4 h-4 ${enableDjPlaylist ? 'text-violet-600' : 'text-slate-400'}`} />
                <div>
                  <p className="text-xs font-bold text-slate-800">Playlist do DJ</p>
                  <p className="text-[11px] text-slate-500">
                    {enableDjPlaylist ? 'Convidados podem pedir músicas' : 'Desativado'}
                  </p>
                </div>
              </div>
              {enableDjPlaylist ? (
                <ToggleRight className="w-5 h-5 text-violet-600 shrink-0" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-slate-400 shrink-0" />
              )}
            </div>

            {/* Moderação de Fotos */}
            <div
              onClick={() => setRequirePhotoApproval(!requirePhotoApproval)}
              className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer select-none transition-all ${
                requirePhotoApproval
                  ? 'border-amber-200 bg-amber-50/60'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-4 h-4 ${requirePhotoApproval ? 'text-amber-600' : 'text-slate-400'}`} />
                <div>
                  <p className="text-xs font-bold text-slate-800">Moderação de Fotos</p>
                  <p className="text-[11px] text-slate-500">
                    {requirePhotoApproval ? 'Fotos dependem de aprovação' : 'Publicação instantânea'}
                  </p>
                </div>
              </div>
              {requirePhotoApproval ? (
                <ToggleRight className="w-5 h-5 text-amber-600 shrink-0" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-slate-400 shrink-0" />
              )}
            </div>

            {/* Mural de Recados */}
            <div
              onClick={() => setEnableMessageWall(!enableMessageWall)}
              className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer select-none transition-all ${
                enableMessageWall
                  ? 'border-rose-200 bg-rose-50/60'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquareHeart className={`w-4 h-4 ${enableMessageWall ? 'text-rose-500' : 'text-slate-400'}`} />
                <div>
                  <p className="text-xs font-bold text-slate-800">Mural de Recados</p>
                  <p className="text-[11px] text-slate-500">
                    {enableMessageWall ? 'Ativo no Telão' : 'Desativado'}
                  </p>
                </div>
              </div>
              {enableMessageWall ? (
                <ToggleRight className="w-5 h-5 text-rose-500 shrink-0" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-slate-400 shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={updateMutation.isPending}
          >
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
};
