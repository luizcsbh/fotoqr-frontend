import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquareHeart, MessageCircle, Trash2, ToggleLeft, ToggleRight, Tv, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { AlertDialog } from '../UI/AlertDialog';
import { messageWallService, formatWhatsApp, WallMessage } from '../../services/messageWall.service';
import { getPresentationUrl } from '../../utils/url';

interface MessageWallManagerProps {
  eventId: string;
  eventUuid: string;
  enabled: boolean;
  onToggle: () => void;
  isToggling: boolean;
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Owner view of the guest message wall: on/off switch and the messages, with delete. */
export const MessageWallManager: React.FC<MessageWallManagerProps> = ({
  eventId,
  eventUuid,
  enabled,
  onToggle,
  isToggling,
}) => {
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<WallMessage | null>(null);

  const { data: messages = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['wall-messages', eventId],
    queryFn: () => messageWallService.list(eventId),
    refetchInterval: 15_000,
  });

  const removeMutation = useMutation({
    mutationFn: (messageId: string) => messageWallService.remove(eventId, messageId),
    onSuccess: () => {
      toast.success('Recado removido do mural e do telão.');
      queryClient.invalidateQueries({ queryKey: ['wall-messages', eventId] });
      setToDelete(null);
    },
    onError: () => toast.error('Não foi possível remover o recado.'),
  });

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MessageSquareHeart className="w-5 h-5 text-rose-500" />
              Mural de Recados
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Com o mural ativo, os convidados deixam mensagens na página do evento (pelo mesmo QR Code das fotos)
              informando nome e WhatsApp. As mensagens aparecem no telão junto com as fotos.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant={enabled ? 'outline' : 'primary'}
              size="md"
              onClick={onToggle}
              isLoading={isToggling}
              leftIcon={enabled ? <ToggleRight className="w-5 h-5 text-rose-500" /> : <ToggleLeft className="w-5 h-5" />}
              className={enabled ? 'border-rose-300 text-rose-700 hover:bg-rose-50' : 'bg-rose-500 hover:bg-rose-600'}
            >
              {enabled ? 'Desativar mural' : 'Ativar mural'}
            </Button>
            <a href={getPresentationUrl(eventUuid)} target="_blank" rel="noopener noreferrer" className="inline-flex">
              <Button variant="secondary" size="md" leftIcon={<Tv className="w-4 h-4" />}>
                Abrir telão
              </Button>
            </a>
          </div>
        </div>
        <p
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            enabled ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-slate-50 text-slate-600 border border-slate-200'
          }`}
        >
          {enabled
            ? 'Mural ativo: os convidados já podem deixar recados.'
            : 'Mural desativado: o formulário de recados não aparece para os convidados.'}
        </p>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-base font-bold text-slate-800">
            Recados recebidos <span className="text-slate-400 font-semibold">({messages.length})</span>
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            isLoading={isFetching && !isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Atualizar
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
            Nenhum recado ainda. {enabled ? 'Eles aparecem aqui assim que os convidados enviarem.' : 'Ative o mural para os convidados escreverem.'}
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {messages.map((m) => (
              <li key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-3 min-w-0">
                <p className="text-sm text-slate-800 whitespace-pre-line break-words">“{m.message}”</p>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{m.name}</p>
                    <p className="text-xs text-slate-500">{formatTime(m.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {m.phone && (
                      <a
                        href={`https://wa.me/${m.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{formatWhatsApp(m.phone)}</span>
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setToDelete(m)}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AlertDialog
        isOpen={Boolean(toDelete)}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && removeMutation.mutate(toDelete.id)}
        title="Remover este recado?"
        message={toDelete ? `O recado de ${toDelete.name} sai do mural e do telão. Não dá para desfazer.` : ''}
        confirmText="Remover"
        variant="danger"
        isLoading={removeMutation.isPending}
      />
    </div>
  );
};
