import React, { useState, useRef } from 'react';
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
  Clock,
  Building,
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
  { id: 'clean', name: 'Minimalista Assessoria (Clean)', bg: '#f8fafc', cardBg: '#ffffff', text: '#0284c7', accent: '#0284c7' },
  { id: 'wedding', name: 'Casamento', bg: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', cardBg: '#ffffff', text: '#2d3748', accent: '#d4af37' },
  { id: 'birthday', name: 'Aniversário', bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', cardBg: '#ffffff', text: '#ffffff', accent: '#ff4b2b' },
  { id: 'corporate', name: 'Corporativo', bg: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', cardBg: '#ffffff', text: '#ffffff', accent: '#00d2ff' },
  { id: 'graduation', name: 'Formatura', bg: 'linear-gradient(135deg, #09203f 0%, #537895 100%)', cardBg: '#ffffff', text: '#ffffff', accent: '#f6d365' },
  { id: 'party', name: 'Balada', bg: 'linear-gradient(135deg, #434343 0%, #000000 100%)', cardBg: '#1e293b', text: '#00ffcc', accent: '#ff007f' },
  { id: 'custom', name: 'Personalizado', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', cardBg: '#ffffff', text: '#ffffff', accent: '#a18cd1' },
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
  const [selectedTemplate, setSelectedTemplate] = useState('clean');
  const [coverImageUrl, setCoverImageUrl] = useState(initialCoverImage || '');
  const [bgImageUrl, setBgImageUrl] = useState(initialBgImage || '');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [location, setLocation] = useState(initialLocation);
  const [startAt, setStartAt] = useState(() => formatToDateTimeLocal(initialDate));
  const [saving, setSaving] = useState(false);

  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const activeTemplate = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0];

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

  const formattedDate = startAt
    ? new Date(startAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '28 de nov de 2026 às 21:00';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-600" />
                Estilo & Informações do Convite
              </h3>
              <p className="text-sm text-slate-600">
                Personalize os dados do evento, importe imagens ou escolha o layout visual no modelo oficial com QR Code.
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
                  <div className="h-10 rounded-lg mb-2 shadow-inner border border-slate-100" style={{ background: tmpl.bg }} />
                  <span className="text-xs font-semibold text-slate-700 block">{tmpl.name}</span>
                </button>
              ))}
            </div>

            {/* Event Date & Location Fields */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Endereço, Cerimônia / Recepção e Horário
              </h4>

              <div className="space-y-3">
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
                  <p className="text-[11px] text-slate-400 mt-1">
                    Exemplo no convite: <strong>28 de nov de 2026 às 21:00</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" /> Endereço do Evento (Recepção / Cerimônia)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Cerimônia: Clube Jaraguá | Recepção: Salão Nobre, Rua dos Esportes, 120"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Você pode colocar um ou múltiplos locais (Ex: <em>Cerimônia: Clube Jaraguá • Recepção: Clube Jaraguá</em>).
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Option 1: Imagem de Capa do Convite */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Logotipo / Imagem de Topo do Convite
              </label>

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
                Imagem de Fundo da Página (Opcional)
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

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <Button
                variant="success"
                size="md"
                onClick={handleSave}
                disabled={saving}
                isLoading={saving}
                leftIcon={<Save className="w-4 h-4 text-white" />}
                className="font-semibold px-6 py-2.5 rounded-xl shadow-emerald-600/20"
              >
                Salvar
              </Button>
            </div>
          </Card>
        </div>

        {/* Live Preview (Modelo Exato do Exemplo do Usuário) */}
        <div>
          <div className="sticky top-6 space-y-3">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Visualização Prévia do Convite (Modelo Oficial)
            </h4>

            {/* Container externo */}
            <div
              className="rounded-3xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden transition-all duration-300 border border-slate-200"
              style={{
                background: bgImageUrl ? `url(${bgImageUrl}) center/cover no-repeat` : activeTemplate.bg,
                minHeight: '520px',
              }}
            >
              {/* Card Branco Central (como no exemplo do PDF) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-100 max-w-md mx-auto text-center space-y-5">
                {/* Imagem / Logo no Topo */}
                {coverImageUrl ? (
                  <div className="max-w-[130px] mx-auto rounded-full overflow-hidden shadow-xs">
                    <img src={coverImageUrl} alt="Logo do Evento" className="w-full h-auto object-contain mx-auto" />
                  </div>
                ) : (
                  <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 border border-amber-200 flex flex-col items-center justify-center text-[10px] text-amber-800 font-serif shadow-xs p-1">
                    <span className="italic text-[11px]">Vamos celebrar!</span>
                    <span className="font-bold uppercase tracking-wider text-[8px] mt-0.5">FOTOQR EVENTO</span>
                  </div>
                )}

                {/* Título do Evento em destaque ciano/azul */}
                <h2 className="text-2xl sm:text-3xl font-extrabold text-cyan-500 tracking-tight leading-tight">
                  {eventTitle || 'Confraternização Rede de Ensino'}
                </h2>

                {/* Data e Endereço com ícones */}
                <div className="space-y-1.5 text-xs text-slate-600 font-medium inline-block text-left">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-700 shrink-0" />
                    <span>{formattedDate}</span>
                  </p>

                  {location ? (
                    location.split('\n').map((line, idx) => (
                      <p key={idx} className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-700 shrink-0" />
                        <span>{line}</span>
                      </p>
                    ))
                  ) : (
                    <>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-700 shrink-0" />
                        <span>Cerimônia: Clube Jaraguá</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-700 shrink-0" />
                        <span>Recepção: Clube Jaraguá</span>
                      </p>
                    </>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-600">
                    Aqui está o QR Code do convite{' '}
                    <strong className="text-rose-500 font-bold">Luiz Carlos dos Santos</strong>,
                    <br />
                    que deve ser apresentado na recepção do evento.
                  </p>
                </div>

                {/* QR Code Demo no Centro */}
                <div className="p-3 bg-white rounded-2xl border-2 border-slate-800 inline-block shadow-xs">
                  <div className="w-36 h-36 bg-slate-900 rounded-lg flex items-center justify-center text-white text-[11px] font-mono">
                    [QR CODE DO CONVITE]
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
