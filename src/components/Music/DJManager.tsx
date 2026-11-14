import React, { useState, useEffect } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { EmptyState } from '../UI/EmptyState';
import { Music2, UserPlus, Trash2, Smartphone, ExternalLink, ToggleRight, ToggleLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAlert } from '../../hooks/useAlert';
import { musicService } from '../../services/music.service';

export interface DJUser {
  id: number;
  userId: number;
  name: string;
  email: string;
  active: boolean;
}

interface DJManagerProps {
  eventId: string | number;
  eventUuid: string;
  djPlaylistEnabled: boolean;
  onToggleDjPlaylist?: () => void;
  isTogglingDjPlaylist?: boolean;
}

export const DJManager: React.FC<DJManagerProps> = ({
  eventId,
  eventUuid,
  djPlaylistEnabled,
  onToggleDjPlaylist,
  isTogglingDjPlaylist = false,
}) => {
  const { showConfirm } = useAlert();
  const [djs, setDjs] = useState<DJUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [djEmail, setDjEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const djConsoleUrl = `${window.location.origin}/dj/${eventUuid}`;

  const fetchDJs = async () => {
    try {
      setLoading(true);
      const data = await musicService.listDJs(eventId);
      setDjs(data || []);
    } catch {
      toast.error('Erro ao carregar DJs autorizados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDJs();
  }, [eventId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!djEmail.trim()) {
      toast.error('Informe o e-mail do DJ cadastrado no FotoQR.');
      return;
    }
    try {
      setSubmitting(true);
      await musicService.addDJ(eventId, djEmail.trim());
      toast.success('DJ autorizado com sucesso!');
      setDjEmail('');
      fetchDJs();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao autorizar DJ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (userId: number, name: string) => {
    const confirmed = await showConfirm({
      title: 'Revogar Autorização do DJ',
      message: `Tem certeza que deseja remover a autorização de DJ de ${name}?`,
      variant: 'danger',
      confirmText: 'Sim, revogar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      await musicService.removeDJ(eventId, userId);
      toast.success('Permissão de DJ revogada.');
      fetchDJs();
    } catch {
      toast.error('Erro ao revogar DJ.');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(djConsoleUrl);
    toast.success('Link copiado!');
  };

  return (
    <div className="space-y-6">
      {/* Interactive DJ Playlist Status & Toggle */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                djPlaylistEnabled
                  ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Music2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">
                  {djPlaylistEnabled ? 'Playlist do DJ está Ativa' : 'Playlist do DJ está Desativada'}
                </h3>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    djPlaylistEnabled
                      ? 'bg-violet-100 text-violet-700 border border-violet-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {djPlaylistEnabled ? 'Recebendo Pedidos' : 'Pausada'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {djPlaylistEnabled
                  ? 'Os convidados podem buscar e sugerir músicas no Spotify/Deezer diretamente ao enviar fotos no evento.'
                  : 'Ative para permitir que os convidados sugiram músicas para o DJ pelo celular.'}
              </p>
            </div>
          </div>

          {onToggleDjPlaylist && (
            <Button
              size="sm"
              variant={djPlaylistEnabled ? 'outline' : 'primary'}
              onClick={onToggleDjPlaylist}
              isLoading={isTogglingDjPlaylist}
              className={`shrink-0 ${
                djPlaylistEnabled
                  ? 'border-violet-300 text-violet-700 hover:bg-violet-50'
                  : 'bg-violet-600 hover:bg-violet-700'
              }`}
              leftIcon={
                djPlaylistEnabled ? (
                  <ToggleRight className="w-4 h-4 text-violet-600" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-slate-400" />
                )
              }
            >
              {djPlaylistEnabled ? 'Desativar Playlist' : 'Ativar Playlist do DJ'}
            </Button>
          )}
        </div>
      </Card>

      {/* Authorized DJs Management */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Music2 className="w-5 h-5 text-violet-600" />
          Gerenciar DJs da Equipe
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          Autorize os DJs da sua equipe para que eles possam acessar o painel de controle da playlist: aprovar pedidos dos convidados, marcar músicas como tocadas e gerenciar a fila em tempo real pelo celular ou computador.
        </p>

        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <input
            type="email"
            required
            placeholder="E-mail da conta do DJ no FotoQR..."
            value={djEmail}
            onChange={(e) => setDjEmail(e.target.value)}
            className="h-11 flex-1 text-sm rounded-lg border border-slate-300 px-3 focus:ring-2 focus:ring-violet-500"
          />
          <Button type="submit" disabled={submitting} className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700">
            <UserPlus className="w-4 h-4" />
            {submitting ? 'Autorizando...' : 'Autorizar DJ'}
          </Button>
        </form>

        {/* DJ Console Link */}
        <div className="mt-5 pt-5 border-t border-slate-100 space-y-2">
          <p className="text-xs text-slate-500 font-medium">Link do painel exclusivo para o DJ:</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <code className="flex-1 text-xs bg-slate-100 text-slate-700 px-3 py-2 rounded-lg font-mono break-all">
              {djConsoleUrl}
            </code>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={copyLink}
                className="text-xs font-semibold text-violet-600 hover:text-violet-800 px-3 py-2 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
              >
                Copiar link
              </button>
              <a
                href={`/dj/${eventUuid}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir
              </a>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            O DJ precisa ter uma conta no FotoQR e estar logado para acessar o painel.
          </p>
        </div>
      </Card>

      {/* DJs List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Carregando DJs autorizados...</div>
        ) : djs.length === 0 ? (
          <EmptyState
            icon={<Smartphone className="w-8 h-8" />}
            title="Nenhum DJ cadastrado"
            description="Adicione o e-mail de um DJ para que ele possa acessar o painel e controlar a playlist do evento."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {djs.map((dj) => (
                  <tr key={dj.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{dj.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{dj.email}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={dj.active ? 'success' : 'neutral'}>
                        {dj.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        title="Revogar Permissão"
                        onClick={() => handleRemove(dj.userId, dj.name)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
