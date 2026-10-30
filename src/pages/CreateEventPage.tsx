import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeCanvas } from 'qrcode.react';
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  Clock,
  Heart,
  Cake,
  PartyPopper,
  Briefcase,
  Palette,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { eventService } from '../services/event.service';
import { Button } from '../components/UI/Button';
import { CreateEventData } from '../types';
import {
  EVENT_THEMES,
  EventTypeCategory,
  QRColorPreset,
  getEventIconSvg,
  isContrastSafe,
  saveQRCustomization,
} from '../utils/qrThemes';
import toast from 'react-hot-toast';

const formatToDateTimeLocal = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
};

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Step 1: Event Type Choice
  const [eventType, setEventType] = useState<EventTypeCategory>('casamento');

  // Step 2: QR Code Customization
  const activeTheme = EVENT_THEMES[eventType];
  const [selectedPresetId, setSelectedPresetId] = useState<string>(activeTheme.presets[0].id);
  const [fgColor, setFgColor] = useState<string>(activeTheme.presets[0].fgColor);
  const [bgColor, setBgColor] = useState<string>(activeTheme.presets[0].bgColor);
  const [cardBg, setCardBg] = useState<string>(activeTheme.presets[0].cardBg);
  const [cardTextColor, setCardTextColor] = useState<string>(activeTheme.presets[0].cardTextColor);
  const [borderColor, setBorderColor] = useState<string>(activeTheme.presets[0].borderColor);
  const [badgeBg, setBadgeBg] = useState<string>(activeTheme.presets[0].badgeBg);
  const [badgeTextColor, setBadgeTextColor] = useState<string>(activeTheme.presets[0].badgeTextColor);

  // Step 3: Event Details
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
  const [wifiName, setWifiName] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [errors, setErrors] = useState<{ title?: string; startDateTime?: string; endDateTime?: string }>({});

  // When changing event type, sync theme defaults and icon
  const handleSelectEventType = (type: EventTypeCategory) => {
    setEventType(type);
    const theme = EVENT_THEMES[type];
    const defaultPreset = theme.presets[0];
    setSelectedPresetId(defaultPreset.id);
    setFgColor(defaultPreset.fgColor);
    setBgColor(defaultPreset.bgColor);
    setCardBg(defaultPreset.cardBg);
    setCardTextColor(defaultPreset.cardTextColor);
    setBorderColor(defaultPreset.borderColor);
    setBadgeBg(defaultPreset.badgeBg);
    setBadgeTextColor(defaultPreset.badgeTextColor);

    // If title is blank, suggest a placeholder based on type
    if (!title) {
      setTitle(theme.defaultTitlePlaceholder);
    }
  };

  // When selecting a preset
  const handleSelectPreset = (preset: QRColorPreset) => {
    setSelectedPresetId(preset.id);
    setFgColor(preset.fgColor);
    setBgColor(preset.bgColor);
    setCardBg(preset.cardBg);
    setCardTextColor(preset.cardTextColor);
    setBorderColor(preset.borderColor);
    setBadgeBg(preset.badgeBg);
    setBadgeTextColor(preset.badgeTextColor);
  };

  // Contrast validation
  const contrastInfo = useMemo(() => {
    return isContrastSafe(fgColor, bgColor);
  }, [fgColor, bgColor]);

  // Center QR Icon corresponding to the selected event type
  const qrIconSvg = useMemo(() => {
    return getEventIconSvg(eventType, fgColor);
  }, [eventType, fgColor]);

  // Validation
  const validate = (): boolean => {
    const newErrors: { title?: string; startDateTime?: string; endDateTime?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Informe o nome do evento.';
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

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateEventData) => eventService.createEvent(data),
    onSuccess: (newEvent) => {
      // Persist chosen QR Code colors and event icon
      saveQRCustomization(newEvent.uuid, {
        eventType,
        fgColor,
        bgColor,
        title: title.trim() || newEvent.title,
        subtitle: activeTheme.defaultSubtitle,
        instructions: activeTheme.defaultInstructions,
        wifiName: wifiName.trim(),
        wifiPassword: wifiPassword.trim(),
        frameStyle: 'table-card',
        iconChoice: 'theme-icon',
        presetId: selectedPresetId,
      });

      queryClient.invalidateQueries({ queryKey: ['events'] });

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore if not supported
      }

      toast.success(`Evento "${newEvent.title}" criado com sucesso!`);
      navigate(`/dashboard/evento/${newEvent.uuid}`);
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error.message || 'Erro ao criar álbum.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    await createMutation.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      start_date: new Date(startDateTime).toISOString(),
      end_date: new Date(endDateTime).toISOString(),
      event_date: startDateTime.split('T')[0],
      storage_mode: 'fallback',
    });
  };

  // Preview URL for dynamic QR canvas preview
  const previewSampleUrl = window.location.origin + '/evento/preview-novo-evento';

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* Top Breadcrumb & Header */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-slate-900"
              title="Voltar para Meus Eventos"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand-600" />
                  Novo Álbum & QR Code
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Criar Evento com QR Code Personalizado
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                Cancelar
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              isLoading={createMutation.isPending}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Criar Evento
            </Button>
          </div>
        </div>
      </div>

      {/* Main Form & Live Preview Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Configuration Steps (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* ETAPA 1: Tipo de Evento */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  1
                </span>
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                  Qual é o tipo de evento?
                </h2>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Escolha a ocasião. O QR Code receberá automaticamente o ícone temático e paletas de cores correspondentes:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'casamento' as const,
                    name: 'Casamento',
                    icon: Heart,
                    desc: 'Elegante & Romântico',
                    iconBadge: '💍 Alianças de Casamento',
                    tag: 'Mais popular',
                  },
                  {
                    id: 'aniversario' as const,
                    name: 'Aniversário',
                    icon: Cake,
                    desc: 'Festivo & Memorável',
                    iconBadge: '🎂 Bolo com Velinhas',
                    tag: 'Festas & 15 anos',
                  },
                  {
                    id: 'festa' as const,
                    name: 'Festa & Balada',
                    icon: PartyPopper,
                    desc: 'Vibrante & Moderno',
                    iconBadge: '🎉 Taças & Celebração',
                    tag: 'Confraternização',
                  },
                  {
                    id: 'corporativo' as const,
                    name: 'Evento Corporativo',
                    icon: Briefcase,
                    desc: 'Profissional & Executivo',
                    iconBadge: '💼 Maleta Institucional',
                    tag: 'Workshops & Feiras',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = eventType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectEventType(item.id)}
                      className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/20 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`p-2.5 rounded-xl border shadow-xs transition-colors ${
                            isSelected
                              ? 'bg-brand-600 text-white border-brand-500'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.tag}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`font-black text-sm sm:text-base ${
                              isSelected ? 'text-brand-900' : 'text-slate-900'
                            }`}
                          >
                            {item.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{item.desc}</p>
                        <span
                          className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-white text-brand-700 shadow-2xs'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Ícone no QR: {item.iconBadge}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ETAPA 2: Cor do QR Code e Ícone Temático */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    2
                  </span>
                  <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                    Escolha a Cor do QR Code
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  <Palette className="w-3.5 h-3.5 text-slate-600" />
                  <span>Tema {activeTheme.name}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Cada QR Code carrega no centro o ícone exclusivo de <strong>{activeTheme.name}</strong>. Escolha a cor principal para combinar com a identidade visual do evento:
              </p>

              {/* Recommended Color Presets for selected occasion */}
              <div className="space-y-2.5 mb-5">
                <label className="text-xs font-bold text-slate-700 block">
                  Paletas Harmoniosas para {activeTheme.name}:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeTheme.presets.map((preset) => {
                    const isSelected = selectedPresetId === preset.id && fgColor === preset.fgColor;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-3 rounded-2xl border flex items-center gap-3 transition-all text-left ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50/60 shadow-xs ring-2 ring-brand-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center -space-x-2 shrink-0">
                          <span
                            className="w-7 h-7 rounded-full border-2 border-white shadow-xs"
                            style={{ backgroundColor: preset.fgColor }}
                          />
                          <span
                            className="w-7 h-7 rounded-full border-2 border-slate-200 shadow-xs"
                            style={{ backgroundColor: preset.cardBg }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {preset.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-medium">
                            {preset.fgColor}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Inputs */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customFg" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Cor dos Módulos do QR Code
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="customFg"
                      type="color"
                      value={fgColor}
                      onChange={(e) => {
                        setFgColor(e.target.value);
                        setSelectedPresetId('custom');
                      }}
                      className="w-10 h-10 rounded-xl border border-slate-300 p-0.5 cursor-pointer bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={fgColor.toUpperCase()}
                      onChange={(e) => {
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                          setFgColor(e.target.value);
                          setSelectedPresetId('custom');
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="customBg" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Fundo do QR Code
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="customBg"
                      type="color"
                      value={bgColor}
                      onChange={(e) => {
                        setBgColor(e.target.value);
                        setSelectedPresetId('custom');
                      }}
                      className="w-10 h-10 rounded-xl border border-slate-300 p-0.5 cursor-pointer bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={bgColor.toUpperCase()}
                      onChange={(e) => {
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                          setBgColor(e.target.value);
                          setSelectedPresetId('custom');
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Contrast warning */}
              {contrastInfo.warning && (
                <div
                  className={`mt-4 p-3 rounded-2xl flex items-start gap-2.5 text-xs ${
                    contrastInfo.safe
                      ? 'bg-amber-50 border border-amber-200 text-amber-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      {contrastInfo.safe ? 'Aviso de Contraste' : 'Contraste Insuficiente!'}
                    </span>
                    <span>{contrastInfo.warning}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ETAPA 3: Detalhes do Evento */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  3
                </span>
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                  Informações do Evento
                </h2>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nome do Evento <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  placeholder={`Ex: ${activeTheme.defaultTitlePlaceholder}`}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${
                    errors.title ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'
                  }`}
                />
                {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mensagem aos Convidados (Opcional)
                </label>
                <textarea
                  id="description"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Tirem fotos e compartilhem aqui nossos momentos inesquecíveis!"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors resize-none"
                />
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-600" />
                    <span>Início do Evento <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    id="start_date"
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
                  <label htmlFor="end_date" className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" />
                    <span>Término do Evento <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    id="end_date"
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

              {/* Optional Wi-Fi fields */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                  <Wifi className="w-3.5 h-3.5 text-brand-600" />
                  <span>Wi-Fi do Local (Opcional - aparece na placa impressa)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="wifiName" className="block text-[11px] font-medium text-slate-600 mb-1">
                      Nome da Rede
                    </label>
                    <input
                      id="wifiName"
                      type="text"
                      value={wifiName}
                      onChange={(e) => setWifiName(e.target.value)}
                      placeholder="Ex: Espaço Festa Wi-Fi"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="wifiPassword" className="block text-[11px] font-medium text-slate-600 mb-1">
                      Senha do Wi-Fi
                    </label>
                    <input
                      id="wifiPassword"
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="Ex: festa2026"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action Card */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link to="/dashboard">
                <Button type="button" variant="secondary" size="md">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={createMutation.isPending}
                leftIcon={<Sparkles className="w-4 h-4" />}
                className="shadow-lg shadow-brand-600/20"
              >
                Criar Álbum & Gerar QR Code
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN: Real-Time Live Preview (5 cols) */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
              <span>Preview em Tempo Real</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Ícone Automático Ativo
              </span>
            </div>

            {/* Table Tent / Display Preview */}
            <div className="bg-slate-900/5 p-4 sm:p-6 rounded-3xl border border-slate-200/80 flex items-center justify-center">
              <div
                className="w-full max-w-sm rounded-3xl p-6 sm:p-7 text-center transition-all duration-300 shadow-xl border relative"
                style={{
                  backgroundColor: cardBg,
                  borderColor: borderColor,
                  color: cardTextColor,
                }}
              >
                {/* Occasion Badge with emoji */}
                <div className="flex justify-center mb-3">
                  <span
                    className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 shadow-2xs"
                    style={{
                      backgroundColor: badgeBg,
                      color: badgeTextColor,
                    }}
                  >
                    <span>{activeTheme.emoji}</span>
                    <span>{activeTheme.name}</span>
                  </span>
                </div>

                {/* Event Title */}
                <h3
                  className="text-xl sm:text-2xl font-black mb-1 tracking-tight line-clamp-2"
                  style={{ color: cardTextColor }}
                >
                  {title || activeTheme.defaultTitlePlaceholder}
                </h3>

                {/* Subtitle */}
                <p className="text-xs font-semibold mb-4" style={{ color: fgColor }}>
                  {activeTheme.defaultSubtitle}
                </p>

                {/* QR Code Container with Center Excavated Icon */}
                <div
                  className="p-4 rounded-2xl inline-block shadow-md border mb-4 transition-transform hover:scale-102"
                  style={{
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                  }}
                >
                  <QRCodeCanvas
                    value={previewSampleUrl}
                    size={220}
                    fgColor={fgColor}
                    bgColor={bgColor}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: qrIconSvg,
                      height: 52,
                      width: 52,
                      excavate: true,
                    }}
                  />
                </div>

                {/* Callout */}
                <p className="text-xs font-bold mb-0.5" style={{ color: cardTextColor }}>
                  Aponte a câmera do seu celular
                </p>
                <p className="text-[10px] text-slate-500 mb-3">
                  Não precisa baixar aplicativo • Fotos instantâneas
                </p>

                {/* Wi-Fi callout if provided */}
                {wifiName && (
                  <div className="bg-white/90 border border-slate-200/80 rounded-xl p-2 text-[11px] text-slate-700 shadow-2xs max-w-xs mx-auto mb-1">
                    <span className="font-bold">📶 Wi-Fi:</span> {wifiName}
                    {wifiPassword && <span className="ml-1 opacity-80">| Senha: {wifiPassword}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Feature Highlights Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-2.5 text-xs text-slate-600">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>O que acontece após criar o evento?</span>
              </div>
              <ul className="space-y-1.5 text-slate-500 pl-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                  <span>Você terá acesso à <strong>placa de mesa pronta para impressão</strong> (A4/A5).</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                  <span>Download do QR Code em <strong>alta resolução (300 DPI)</strong>.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                  <span><strong>Modo Telão interativo</strong> para projetores ou TVs no salão.</span>
                </li>
              </ul>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;
