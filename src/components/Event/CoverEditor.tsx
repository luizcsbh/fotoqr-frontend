import React, { useMemo, useRef, useState } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import {
  Palette,
  Sparkles,
  Image as ImageIcon,
  Save,
  CheckCircle2,
  Upload,
  X,
  FileImage,
  MapPin,
  Calendar,
  Wand2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { invitationService } from '../../services/invitation.service';
import { isImageUrl } from '../../utils/cssImage';
import {
  INVITATION_CATEGORIES,
  INVITATION_TEMPLATES,
  InvitationCategory,
  getInvitationTemplate,
  guessInvitationCategory,
  resolveInvitationLook,
} from '../../utils/invitationTemplates';

interface CoverEditorProps {
  eventId: string | number;
  eventTitle: string;
  eventDescription?: string;
  eventLocation?: string;
  eventDate?: string;
  initialCoverImage?: string;
  initialBgImage?: string;
  initialTemplate?: string;
  onSave?: (coverImage: string, bgImage: string, template: string) => void;
}

const formatToDateTimeLocal = (dateStr?: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const CoverEditor: React.FC<CoverEditorProps> = ({
  eventId,
  eventTitle,
  eventDescription,
  eventLocation: initialLocation = '',
  eventDate: initialDate = '',
  initialCoverImage,
  initialBgImage,
  initialTemplate,
  onSave,
}) => {
  const savedTemplate = getInvitationTemplate(initialTemplate);
  const suggestedCategory = useMemo(
    () => guessInvitationCategory(eventTitle, eventDescription),
    [eventTitle, eventDescription]
  );

  // A brand-new invitation starts from the first design of the guessed event type
  const hasSavedDesign = Boolean(savedTemplate || initialCoverImage || initialBgImage);
  const [templateId, setTemplateId] = useState<string>(
    savedTemplate?.id ||
      (hasSavedDesign ? '' : INVITATION_TEMPLATES.find((t) => t.category === (suggestedCategory ?? 'geral'))?.id ?? '')
  );
  const [category, setCategory] = useState<InvitationCategory | 'todos'>(
    savedTemplate?.category ?? suggestedCategory ?? 'todos'
  );

  // Only real images go into the URL fields; an old color/gradient background is kept as is
  const [coverImageUrl, setCoverImageUrl] = useState(isImageUrl(initialCoverImage) ? initialCoverImage : '');
  const [bgImageUrl, setBgImageUrl] = useState(isImageUrl(initialBgImage) ? initialBgImage : '');
  const legacyBg = !isImageUrl(initialBgImage) && initialBgImage ? initialBgImage : '';
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [location, setLocation] = useState(initialLocation);
  const [startAt, setStartAt] = useState(() => formatToDateTimeLocal(initialDate));
  const [saving, setSaving] = useState(false);

  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const visibleTemplates = INVITATION_TEMPLATES.filter((t) => category === 'todos' || t.category === category);
  const look = resolveInvitationLook({
    templateId,
    coverImage: coverImageUrl,
    backgroundImage: bgImageUrl || (templateId ? '' : legacyBg),
  });

  const pickFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    label: string,
    setFile: (f: File) => void,
    setUrl: (u: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`A ${label} deve ter no máximo 10MB.`);
      return;
    }
    setFile(file);
    setUrl(URL.createObjectURL(file));
  };

  const clearCoverFile = () => {
    setCoverFile(null);
    setCoverImageUrl('');
    if (coverFileInputRef.current) coverFileInputRef.current.value = '';
  };

  const clearBgFile = () => {
    setBgFile(null);
    setBgImageUrl('');
    if (bgFileInputRef.current) bgFileInputRef.current.value = '';
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const keptCover = coverImageUrl && !coverImageUrl.startsWith('blob:') ? coverImageUrl : '';
      const keptBg = bgImageUrl && !bgImageUrl.startsWith('blob:') ? bgImageUrl : '';
      // Without a custom image the template provides logo and background ('' clears the old ones)
      const result = await invitationService.updateEventCover(eventId, {
        coverImage: coverFile ? undefined : keptCover,
        backgroundImage: bgFile ? undefined : keptBg || (templateId ? '' : legacyBg),
        invitationTemplate: templateId,
        coverFile: coverFile || undefined,
        bgFile: bgFile || undefined,
        location: location.trim(),
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
      });

      toast.success('Convite salvo! Seus convidados já veem o novo visual.');
      onSave?.(result?.coverImage || '', result?.backgroundImage || '', result?.invitationTemplate || templateId);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar o convite.');
    } finally {
      setSaving(false);
    }
  };

  const formattedDate = startAt
    ? new Date(startAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '28 de nov de 2026 às 21:00';

  const suggestedLabel = INVITATION_CATEGORIES.find((c) => c.id === suggestedCategory)?.label;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] gap-6">
      <div className="space-y-6 min-w-0">
        {/* 1. Ready-made templates */}
        <Card className="p-6 space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-indigo-600" />
              Modelos de convite prontos
            </h3>
            <p className="text-sm text-slate-600">
              Escolha um modelo com logo, fundo e cores do tema do seu evento. Depois, se quiser, troque o logo ou o
              fundo por imagens suas.
            </p>
            {suggestedLabel && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <Sparkles className="w-3.5 h-3.5" />
                Sugestão para este evento: {suggestedLabel}
              </p>
            )}
          </div>

          {/* Event type filter */}
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tipo de evento">
            {[{ id: 'todos' as const, label: 'Todos', emoji: '🗂️' }, ...INVITATION_CATEGORIES].map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={category === c.id}
                onClick={() => setCategory(c.id)}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  category === c.id
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span aria-hidden="true">{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          {/* Template gallery */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {visibleTemplates.map((t) => {
              const selected = templateId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  aria-pressed={selected}
                  className={`group relative overflow-hidden rounded-2xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    selected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div
                    className="flex h-28 items-center justify-center"
                    style={{ background: `url("${t.background}") center/cover no-repeat` }}
                  >
                    <div className="flex w-[70%] flex-col items-center gap-1 rounded-xl bg-white/95 px-2 py-2 shadow-sm">
                      <img src={t.logo} alt="" className="h-11 w-11" />
                      <span
                        className="w-full truncate text-center text-[11px] font-extrabold leading-tight"
                        style={{ color: t.titleColor }}
                      >
                        {eventTitle || t.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-white px-3 py-2">
                    <span className="truncate text-xs font-semibold text-slate-700">{t.name}</span>
                    {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* 2. Date & place */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            Data, horário e local
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="invite-start" className="block text-xs font-semibold text-slate-600 mb-1">
                Data e hora do evento
              </label>
              <input
                id="invite-start"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="h-11 w-full text-sm rounded-xl border border-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="invite-location" className="block text-xs font-semibold text-slate-600 mb-1">
                Endereço (um local por linha)
              </label>
              <textarea
                id="invite-location"
                rows={2}
                placeholder={'Cerimônia: Igreja Matriz\nRecepção: Salão Nobre, Rua das Flores, 120'}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </Card>

        {/* 3. Own images (optional) */}
        <Card className="p-6 space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-600" />
              Usar imagens próprias (opcional)
            </h3>
            <p className="text-sm text-slate-600">Substituem o logo ou o fundo do modelo escolhido.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                key: 'cover',
                title: 'Logo / imagem do topo',
                file: coverFile,
                url: coverImageUrl,
                setUrl: setCoverImageUrl,
                inputRef: coverFileInputRef,
                onFile: (e: React.ChangeEvent<HTMLInputElement>) => pickFile(e, 'imagem do logo', setCoverFile, setCoverImageUrl),
                clear: clearCoverFile,
                placeholder: 'Ou cole a URL do logo (https://...)',
                Icon: ImageIcon,
              },
              {
                key: 'bg',
                title: 'Imagem de fundo da página',
                file: bgFile,
                url: bgImageUrl,
                setUrl: setBgImageUrl,
                inputRef: bgFileInputRef,
                onFile: (e: React.ChangeEvent<HTMLInputElement>) => pickFile(e, 'imagem de fundo', setBgFile, setBgImageUrl),
                clear: clearBgFile,
                placeholder: 'Ou cole a URL do fundo (https://...)',
                Icon: Sparkles,
              },
            ].map((f) => (
              <div key={f.key} className="space-y-2 min-w-0">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">{f.title}</p>
                <input
                  ref={f.inputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={f.onFile}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => f.inputRef.current?.click()}
                  className="w-full border-dashed border-2 border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 text-indigo-700"
                  leftIcon={<Upload className="w-4 h-4 text-indigo-600" />}
                >
                  Importar do computador
                </Button>
                {f.file || f.url ? (
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs text-slate-700 min-w-0">
                    <FileImage className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate">{f.file ? f.file.name : 'Imagem própria em uso'}</span>
                    <button
                      type="button"
                      onClick={f.clear}
                      className="ml-auto inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-semibold text-slate-500 hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Usar do modelo</span>
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="url"
                      placeholder={f.placeholder}
                      defaultValue=""
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (!v) return;
                        if (isImageUrl(v)) f.setUrl(v);
                        else toast.error('Cole o endereço de uma imagem (começando com https://).');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                      className="h-11 w-full text-sm rounded-xl border border-slate-200 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <f.Icon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            variant="success"
            size="md"
            onClick={handleSave}
            isLoading={saving}
            leftIcon={<Save className="w-4 h-4 text-white" />}
            className="font-semibold px-6 rounded-xl shadow-emerald-600/20"
          >
            Salvar convite
          </Button>
        </div>
      </div>

      {/* Live preview: same look the guest gets on the invitation page */}
      <div className="min-w-0">
        <div className="sticky top-24 space-y-3">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Prévia do convite</h4>
          <div
            className="rounded-3xl p-5 sm:p-6 shadow-xl text-center relative overflow-hidden transition-all duration-300 border border-slate-200"
            style={{ background: look.backgroundCss ?? '#eef2f6' }}
          >
            <div className={`bg-white rounded-3xl p-6 shadow-md border border-slate-100 max-w-md mx-auto text-center space-y-4 ${look.fontClass}`}>
              {look.logoSrc ? (
                <img src={look.logoSrc} alt="Logo do convite" className="mx-auto h-24 w-24 rounded-full object-contain" />
              ) : (
                <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 border border-amber-200 flex flex-col items-center justify-center text-[10px] text-amber-800 font-serif p-1">
                  <span className="italic text-[11px]">Vamos celebrar!</span>
                  <span className="font-bold uppercase tracking-wider text-[8px] mt-0.5">CONVITE OFICIAL</span>
                </div>
              )}

              <div>
                {look.tagline && <p className="text-xs font-semibold text-slate-500 mb-1">{look.tagline}</p>}
                <h2 className="text-2xl font-extrabold tracking-tight leading-tight" style={{ color: look.titleColor }}>
                  {eventTitle || 'Nome do evento'}
                </h2>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 font-medium inline-block text-left">
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 shrink-0" style={{ color: look.accentColor }} />
                  <span>{formattedDate}</span>
                </p>
                {(location ? location.split('\n').filter(Boolean) : ['Local do evento']).map((line, idx) => (
                  <p key={idx} className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: look.accentColor }} />
                    <span>{line}</span>
                  </p>
                ))}
              </div>

              <p className="border-t border-slate-100 pt-3 text-xs text-slate-600">
                Aqui está o QR Code do convite de{' '}
                <strong style={{ color: look.accentColor }}>Nome do Convidado</strong>, que deve ser apresentado na
                recepção do evento.
              </p>

              <div className="p-3 bg-white rounded-2xl border-2 border-slate-800 inline-block">
                <div className="w-28 h-28 bg-slate-900 rounded-lg flex items-center justify-center text-white text-[10px] font-mono">
                  QR CODE
                </div>
              </div>

              <div
                className="rounded-xl py-2.5 text-xs font-bold text-white"
                style={{ backgroundColor: look.buttonColor }}
              >
                Baixar Imagem do QR Code
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
