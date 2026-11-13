import React, { useState } from 'react';
import { CreateEventData } from '../../types';
import { Button } from '../UI/Button';
import { Calendar, Clock, MapPin, Users, Tag } from 'lucide-react';

interface CreateEventFormProps {
  onSubmit: (data: CreateEventData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
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

const formatToDateTimeLocal = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
};

export const CreateEventForm: React.FC<CreateEventFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personalizado');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [maxEntries, setMaxEntries] = useState(1);

  const [startDateTime, setStartDateTime] = useState(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    return formatToDateTimeLocal(now);
  });
  const [endDateTime, setEndDateTime] = useState(() => {
    const end = new Date();
    end.setMinutes(0, 0, 0);
    end.setHours(end.getHours() + 5);
    return formatToDateTimeLocal(end);
  });
  const [errors, setErrors] = useState<{ title?: string; startDateTime?: string; endDateTime?: string }>({});

  const validate = (): boolean => {
    const newErrors: { title?: string; startDateTime?: string; endDateTime?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'O título do evento é obrigatório.';
    } else if (title.trim().length < 3) {
      newErrors.title = 'O título deve ter pelo menos 3 caracteres.';
    }

    if (!startDateTime) {
      newErrors.startDateTime = 'Informe a data e hora de início.';
    }

    if (!endDateTime) {
      newErrors.endDateTime = 'Informe a data e hora de término.';
    } else if (startDateTime && new Date(endDateTime) <= new Date(startDateTime)) {
      newErrors.endDateTime = 'O término deve ser posterior ao início do evento.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      location: location.trim() || undefined,
      capacity: capacity ? Number(capacity) : undefined,
      max_entries_per_invitation: maxEntries,
      start_date: new Date(startDateTime).toISOString(),
      end_date: new Date(endDateTime).toISOString(),
      start_at: new Date(startDateTime).toISOString(),
      end_at: new Date(endDateTime).toISOString(),
      event_date: startDateTime.split('T')[0],
      storage_mode: 'fallback',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-left">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-slate-800 mb-1.5">
          Nome do Evento <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            placeholder="Ex: Casamento de Ana e Lucas, Aniversário de 30 anos..."
            className={`w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${
              errors.title ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'
            }`}
          />
        </div>
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
      </div>

      {/* Category & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-brand-600" />
            <span>Categoria / Tipo</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-600" />
            <span>Local ou Endereço</span>
          </label>
          <input
            id="location"
            type="text"
            placeholder="Ex: Espaço Villa Real, Salão de Festas..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Capacity & Max Entries per Invitation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="capacity" className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-brand-600" />
            <span>Capacidade Máxima (Opcional)</span>
          </label>
          <input
            id="capacity"
            type="number"
            min="1"
            placeholder="Ex: 250"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label htmlFor="max_entries" className="block text-sm font-semibold text-slate-800 mb-1.5">
            Entradas por Convite (Padrão: 1)
          </label>
          <input
            id="max_entries"
            type="number"
            min="1"
            max="10"
            value={maxEntries}
            onChange={(e) => setMaxEntries(Math.max(1, Number(e.target.value)))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-slate-800 mb-1.5">
          Descrição ou Mensagem aos Convidados (Opcional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Sejam bem-vindos! Apresentem o QR Code individual na entrada."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors resize-none"
        />
      </div>

      {/* Start and End Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-brand-600" />
            <span>Início do Evento <span className="text-red-500">*</span></span>
          </label>
          <input
            id="start_date"
            name="start_date"
            type="datetime-local"
            value={startDateTime}
            onChange={(e) => {
              setStartDateTime(e.target.value);
              if (errors.startDateTime) setErrors((prev) => ({ ...prev, startDateTime: undefined }));
              if (endDateTime && new Date(e.target.value) >= new Date(endDateTime)) {
                const newEnd = new Date(e.target.value);
                newEnd.setHours(newEnd.getHours() + 4);
                setEndDateTime(formatToDateTimeLocal(newEnd));
              }
            }}
            className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${
              errors.startDateTime ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'
            }`}
          />
          {errors.startDateTime && <p className="mt-1 text-xs text-red-600">{errors.startDateTime}</p>}
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>Término do Evento <span className="text-red-500">*</span></span>
          </label>
          <input
            id="end_date"
            name="end_date"
            type="datetime-local"
            value={endDateTime}
            min={startDateTime}
            onChange={(e) => {
              setEndDateTime(e.target.value);
              if (errors.endDateTime) setErrors((prev) => ({ ...prev, endDateTime: undefined }));
            }}
            className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${
              errors.endDateTime ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'
            }`}
          />
          {errors.endDateTime && <p className="mt-1 text-xs text-red-600">{errors.endDateTime}</p>}
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-3 flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isLoading}>
          Criar Evento e Painel de Convites
        </Button>
      </div>
    </form>
  );
};
