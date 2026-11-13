import React, { useState, useRef } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import {
  Palette,
  Sparkles,
  Image as ImageIcon,
  Save,
  Upload,
  X,
  FileImage,
  MapPin,
  Calendar,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { invitationService } from '../../services/invitation.service';

interface CoverEditorProps {
  eventId: string | number;
  eventTitle: string;
  eventLocation?: string;
  eventDate?: string;
  initialCoverImage?: string;
  initialBgImage?: string;
  onSave?: (coverImage: string, bgImage: string) => void;
}

const TEMPLATES = [
  { id: 'wedding', name: 'Casamento', bg: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', text: '#2d3748', accent: '#d4af37' },
  { id: 'birthday', name: 'Aniversário', bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', text: '#ffffff', accent: '#ff4b2b' },
  { id: 'corporate', name: 'Corporativo', bg: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', text: '#ffffff', accent: '#00d2ff' },
  { id: 'graduation', name: 'Formatura', bg: 'linear-gradient(135deg, #09203f 0%, #537895 100%)', text: '#ffffff', accent: '#f6d365' },
  { id: 'party', name: 'Balada', bg: 'linear-gradient(135deg, #434343 0%, #000000 100%)', text: '#00ffcc', accent: '#ff007f' },
  { id: 'school', name: 'Escolar', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', text: '#ffffff', accent: '#f093fb' },
  { id: 'custom', name: 'Personalizado', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#ffffff', accent: '#a18cd1' },
];

const formatToDateTimeLocal = (dateStr?: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
};

export const CoverEditor: React.FC<CoverEditorProps> = ({
  eventId,
  eventTitle,
  eventLocation: initialLocation = '',
  eventDate: initialDate = '',
  initialCoverImage,
  initialBgImage,
  onSave,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [coverImageUrl, setCoverImageUrl] = useState(initialCoverImage || '');
  const [bgImageUrl, setBgImageUrl] = useState(initialBgImage || '');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [location, setLocation] = useState(initialLocation);
  const [startAt, setStartAt] = useState(() => formatToDateTimeLocal(initialDate));
  const [saving, setSaving] = useState(false);

  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const activeTemplate = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[6];

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('A imagem de capa deve ter no máximo 10MB.');
        return;
      }
      setCoverFile(file);
      const previewUrl = URL.createObjectURL(file);
      setCoverImageUrl(previewUrl);
    }
  };

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('A imagem de fundo deve ter no máximo 10MB.');
        return;
      }
      setBgFile(file);
      const previewUrl = URL.createObjectURL(file);
      setBgImageUrl(previewUrl);
    }
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

      const result = await invitationService.updateEventCover(eventId, {
        coverImage: coverFile ? undefined : (coverImageUrl || activeTemplate.bg),
        backgroundImage: bgFile ? undefined : (bgImageUrl || activeTemplate.bg),
        coverFile: coverFile || undefined,
        bgFile: bgFile || undefined,
        location: location.trim(),
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
      });

      toast.success('Identidade visual e dados do convite salvos com sucesso!');
      if (onSave) {
        onSave(
          result?.coverImage || coverImageUrl || activeTemplate.bg,
          result?.backgroundImage || bgImageUrl || activeTemplate.bg
        );
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao salvar capa do evento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-600" />
                Modelos de Capa e Convite
              </h3>
              <p className="text-sm text-slate-600">
                Escolha um tema pré-definido, configure o endereço, data e importe imagens para o convite.
              </p>
            </div>

            {/* Template Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedTemplate === tmpl.id
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm bg-indigo-50/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="h-10 rounded-lg mb-2 shadow-inner" style={{ background: tmpl.bg }} />
                  <span className="text-xs font-semibold text-slate-700 block">{tmpl.name}</span>
                </button>
              ))}
            </div>

            {/* Event Date & Location Fields for the Invitation */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Informações do Convite (Endereço, Data e Hora)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Data e Hora do Evento
                  </label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" /> Endereço / Local
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Espaço Villa Real, Salão Imperial"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Upload Option 1: Imagem de Capa do Convite */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Imagem da Capa / Arte do Convite
              </label>

              {/* File Upload Button / Area */}
              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleCoverFileChange}
                className="hidden"
                id="coverFileInput"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => coverFileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 border-dashed border-2 border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 text-indigo-700"
                >
                  <Upload className="w-4 h-4 text-indigo-600" />
                  Importar Imagem do Computador
                </Button>

                {coverFile && (
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs text-slate-700 truncate max-w-xs">
                    <FileImage className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate">{coverFile.name}</span>
                    <button
                      type="button"
                      onClick={clearCoverFile}
                      className="text-slate-400 hover:text-rose-600 ml-auto"
                      title="Remover"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* URL fallback */}
              <div className="relative">
                <input
                  type="url"
                  placeholder="Ou cole a URL da imagem (https://...)"
                  value={coverFile ? '' : coverImageUrl}
                  disabled={Boolean(coverFile)}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                />
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Upload Option 2: Imagem de Fundo (Background) */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Imagem de Fundo do Convite Digital (Opcional)
              </label>

              <input
                ref={bgFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleBgFileChange}
                className="hidden"
                id="bgFileInput"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => bgFileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 border-dashed border-2 border-slate-200 hover:border-slate-400 text-slate-700"
                >
                  <Upload className="w-4 h-4 text-slate-600" />
                  Importar Imagem de Fundo
                </Button>

                {bgFile && (
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs text-slate-700 truncate max-w-xs">
                    <FileImage className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="truncate">{bgFile.name}</span>
                    <button
                      type="button"
                      onClick={clearBgFile}
                      className="text-slate-400 hover:text-rose-600 ml-auto"
                      title="Remover"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* URL fallback */}
              <div className="relative">
                <input
                  type="url"
                  placeholder="Ou cole a URL do fundo (https://...)"
                  value={bgFile ? '' : bgImageUrl}
                  disabled={Boolean(bgFile)}
                  onChange={(e) => setBgImageUrl(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                />
                <Sparkles className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                {saving ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar Identidade Visual</>}
              </Button>
            </div>
          </Card>
        </div>

        {/* Live Preview */}
        <div>
          <div className="sticky top-6 space-y-3">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Visualização Prévia do Convite
            </h4>
            <div
              className="rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden transition-all duration-300 border border-slate-200"
              style={{
                background: bgImageUrl ? `url(${bgImageUrl}) center/cover no-repeat` : activeTemplate.bg,
                color: activeTemplate.text,
                minHeight: '440px',
              }}
            >
              <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                <div>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: '#fff' }}
                  >
                    {activeTemplate.name}
                  </span>
                  <h2 className="text-3xl font-extrabold tracking-tight drop-shadow-md">
                    {eventTitle || 'Nome do Seu Evento'}
                  </h2>
                  <p className="text-sm opacity-90 mt-2 font-medium">Convite Individual com QR Code</p>
                </div>

                {coverImageUrl && (
                  <div className="max-w-[260px] mx-auto rounded-2xl overflow-hidden shadow-lg border-2 border-white/80 bg-white">
                    <img src={coverImageUrl} alt="Capa / Arte do Convite" className="w-full h-auto object-cover max-h-48" />
                  </div>
                )}

                <div className="bg-white/95 backdrop-blur-md text-slate-800 rounded-2xl p-4 max-w-sm mx-auto shadow-md space-y-2 text-left">
                  <div className="text-center pb-1 border-b border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Convidado(a)</span>
                    <p className="font-bold text-base text-indigo-700">Maria Oliveira</p>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 pt-1">
                    <p className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{startAt ? new Date(startAt).toLocaleString('pt-BR') : 'Data e Hora a definir'}</span>
                    </p>
                    <p className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{location || 'Local a ser confirmado'}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs opacity-80 font-medium">Validação por QR Code Exclusivo na Portaria</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
