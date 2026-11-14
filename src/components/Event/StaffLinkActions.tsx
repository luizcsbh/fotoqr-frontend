import React, { useState } from 'react';
import { Copy, Mail, RefreshCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../UI/Button';
import { useAlert } from '../../hooks/useAlert';
import { staffService, StaffKind } from '../../services/staff.service';
import { ApiError } from '../../types';

interface StaffLinkActionsProps {
  eventId: string | number;
  kind: StaffKind;
  userId: number;
  name: string;
  accessLink?: string;
  /** Called after the link changed (regenerated), so the list can refetch */
  onLinkChanged: () => void;
  onRemove: () => void;
}

/**
 * Per-person actions for a DJ or reader's exclusive link: copy, e-mail, regenerate, remove.
 * Every button shows its icon on the left and the action name beside it.
 */
export const StaffLinkActions: React.FC<StaffLinkActionsProps> = ({
  eventId,
  kind,
  userId,
  name,
  accessLink,
  onLinkChanged,
  onRemove,
}) => {
  const { showConfirm } = useAlert();
  const [busy, setBusy] = useState<'email' | 'regenerate' | null>(null);

  const copy = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link exclusivo copiado!');
    } catch {
      toast.error('Não foi possível copiar. Selecione o link e copie manualmente.');
    }
  };

  const sendEmail = async () => {
    try {
      setBusy('email');
      await staffService.sendLink(eventId, kind, userId);
      toast.success(`Link enviado para o e-mail de ${name}.`);
    } catch (err) {
      toast.error((err as ApiError)?.message || 'Erro ao enviar o e-mail.');
    } finally {
      setBusy(null);
    }
  };

  const regenerate = async () => {
    const confirmed = await showConfirm({
      title: 'Gerar novo link',
      message: `O link atual de ${name} vai parar de funcionar imediatamente. Deseja gerar um novo?`,
      variant: 'danger',
      confirmText: 'Sim, gerar novo',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      setBusy('regenerate');
      const link = await staffService.regenerateLink(eventId, kind, userId);
      await copy(link);
      toast.success('Novo link gerado e copiado. Envie-o novamente.');
      onLinkChanged();
    } catch (err) {
      toast.error((err as ApiError)?.message || 'Erro ao gerar novo link.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={!accessLink}
        onClick={() => accessLink && copy(accessLink)}
        leftIcon={<Copy className="w-3.5 h-3.5" />}
      >
        Copiar link
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={sendEmail}
        isLoading={busy === 'email'}
        leftIcon={<Mail className="w-3.5 h-3.5" />}
      >
        Enviar por e-mail
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={regenerate}
        isLoading={busy === 'regenerate'}
        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
      >
        Gerar novo link
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
      >
        Remover
      </Button>
    </div>
  );
};
