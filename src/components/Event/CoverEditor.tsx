import React, { useState } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Palette, Sparkles, Image as ImageIcon, Save, Check } from 'lucide-react';
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

export const CoverEditor: React.FC<CoverEditorProps> = ({
  eventId,
  eventTitle,
  eventLocation,
  eventDate,
  initialCoverImage,
  initialBgImage,
  onSave,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [coverImageUrl, setCoverImageUrl] = useState(initialCoverImage || '');
  const [bgImageUrl, setBgImageUrl] = useState(initialBgImage || '');
  const [saving, setSaving] = useState(false);

  const activeTemplate = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[6];

  const handleSave = async () => {
    try {
      setSaving(true);
      await invitationService.updateEventCover(eventId, {
        coverImage: coverImageUrl || activeTemplate.bg,
        backgroundImage: bgImageUrl || activeTemplate.bg,
      });
      toast.success('Identidade visual da capa salva com sucesso!');
      if (onSave) onSave(coverImageUrl || activeTemplate.bg, bgImageUrl || activeTemplate.bg);
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
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-600" />
              Modelos de Capa e Convite
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Escolha um tema pré-definido ou configure uma imagem de capa personalizada.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedTemplate === tmpl.id
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="h-10 rounded mb-2 shadow-inner" style={{ background: tmpl.bg }} />
                  <span className="text-xs font-semibold text-slate-700 block">{tmpl.name}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  URL da Imagem de Capa (Opcional)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://exemplo.com/minha-capa.jpg"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  URL da Imagem de Fundo (Opcional)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://exemplo.com/fundo.jpg"
                    value={bgImageUrl}
                    onChange={(e) => setBgImageUrl(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Sparkles className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
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
              className="rounded-2xl p-8 shadow-xl text-center relative overflow-hidden transition-all duration-300 border border-slate-200"
              style={{
                background: bgImageUrl ? `url(${bgImageUrl}) center/cover no-repeat` : activeTemplate.bg,
                color: activeTemplate.text,
                minHeight: '380px',
              }}
            >
              <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
                <div>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff' }}
                  >
                    {activeTemplate.name}
                  </span>
                  <h2 className="text-3xl font-extrabold tracking-tight drop-shadow-md">
                    {eventTitle || 'Nome do Seu Evento'}
                  </h2>
                  <p className="text-sm opacity-90 mt-2 font-medium">Convite Individual com QR Code</p>
                </div>

                {coverImageUrl && (
                  <div className="max-w-[200px] mx-auto rounded-lg overflow-hidden shadow-md">
                    <img src={coverImageUrl} alt="Capa" className="w-full h-auto object-cover max-h-36" />
                  </div>
                )}

                <div className="bg-white/90 backdrop-blur-sm text-slate-800 rounded-xl p-4 max-w-sm mx-auto shadow-md space-y-1">
                  <p className="font-bold text-sm text-indigo-700">Nome do Convidado</p>
                  <p className="text-xs text-slate-500">
                    {eventDate ? new Date(eventDate).toLocaleDateString('pt-BR') : 'Data do Evento'} • {eventLocation || 'Local a ser confirmado'}
                  </p>
                </div>

                <div className="pt-2">
                  <p className="text-xs opacity-75">Validação por QR Code Exclusivo na Portaria</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

