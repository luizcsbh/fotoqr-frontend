import React, { useState } from 'react';
import { CreateEventData } from '../../types';
import { Button } from '../UI/Button';
import { Calendar, Clock } from 'lucide-react';

interface CreateEventFormProps {
  onSubmit: (data: CreateEventData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

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
      start_date: new Date(startDateTime).toISOString(),
      end_date: new Date(endDateTime).toISOString(),
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

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-slate-800 mb-1.5">
          Descrição ou Mensagem aos Convidados (Opcional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Tirem muitas fotos e compartilhem aqui nossos momentos inesquecíveis!"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors resize-none"
        />
      </div>

      {/* Start and End Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Start Date & Time */}
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
              // Auto-adjust end time if it became before start time
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

        {/* End Date & Time */}
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
          Criar Álbum e Gerar QR Code
        </Button>
      </div>
    </form>
  );
};
