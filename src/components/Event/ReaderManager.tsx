import React, { useState, useEffect } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { EmptyState } from '../UI/EmptyState';
import { ScanLine, UserPlus, Smartphone, Link2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAlert } from '../../hooks/useAlert';
import { invitationService } from '../../services/invitation.service';
import { ReaderUser } from '../../types';
import { StaffLinkActions } from './StaffLinkActions';

/** Toast after authorizing a reader: tells whether their exclusive link went out by e-mail. */
function announceStaffAdded(role: string, result: { emailSent?: boolean; emailError?: string; accessLink?: string }) {
  if (result.emailSent) {
    toast.success(`${role} autorizado! O link exclusivo foi enviado por e-mail.`);
  } else {
    toast.success(`${role} autorizado! Use "Copiar link" para enviar o acesso.`);
    if (result.emailError) toast.error(result.emailError, { duration: 6000 });
  }
}

interface ReaderManagerProps {
  eventId: string | number;
}

export const ReaderManager: React.FC<ReaderManagerProps> = ({ eventId }) => {
  const { showConfirm } = useAlert();
  const [readers, setReaders] = useState<ReaderUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [readerEmail, setReaderEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReaders = async () => {
    try {
      setLoading(true);
      const data = await invitationService.listReaders(eventId);
      setReaders(data || []);
    } catch (err: any) {
      toast.error('Erro ao carregar leitores autorizados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReaders();
  }, [eventId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readerEmail.trim()) {
      toast.error('Informe o e-mail do leitor.');
      return;
    }

    try {
      setSubmitting(true);
      announceStaffAdded('Leitor', await invitationService.addReader(eventId, readerEmail.trim()));
      setReaderEmail('');
      fetchReaders();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao autorizar leitor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (userId: number, name: string) => {
    const confirmed = await showConfirm({
      title: 'Revogar Autorização de Leitor',
      message: `Tem certeza que deseja remover a autorização de leitura de ${name}?`,
      variant: 'danger',
      confirmText: 'Sim, revogar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;

    try {
      await invitationService.removeReader(eventId, userId);
      toast.success('Permissão de leitor revogada.');
      fetchReaders();
    } catch (err: any) {
      toast.error('Erro ao revogar leitor.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Add Reader */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-indigo-600" />
          Operadores e Leitores de QR Code
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          Autorize membros da equipe da portaria para validar convites pela câmera do celular. O leitor só visualiza o nome e categoria do convidado e não tem acesso às configurações do evento.
        </p>

        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <input
            type="email"
            required
            placeholder="E-mail do leitor da portaria..."
            value={readerEmail}
            onChange={(e) => setReaderEmail(e.target.value)}
            className="h-11 flex-1 text-sm rounded-lg border border-slate-300 px-3 focus:ring-2 focus:ring-indigo-500"
          />
          <Button type="submit" isLoading={submitting} leftIcon={<UserPlus className="w-4 h-4" />}>
            {submitting ? 'Autorizando...' : 'Autorizar Leitor'}
          </Button>
        </form>

        {/* Exclusive links */}
        <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
          <p className="text-xs text-slate-600 flex items-start gap-2">
            <Link2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              Cada leitor recebe por e-mail um <strong>link exclusivo</strong> que abre direto o leitor de QR Code da
              portaria, sem senha. Esse acesso não abre o dashboard nem as configurações do evento. Use as ações da lista
              para copiar, reenviar ou gerar um novo link (o anterior deixa de funcionar).
            </span>
          </p>
          <a href={`/leitor/${eventId}`} target="_blank" rel="noreferrer" className="inline-flex">
            <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
              Abrir leitor da portaria
            </Button>
          </a>
        </div>
      </Card>

      {/* Readers List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Carregando operadores...</div>
        ) : readers.length === 0 ? (
          <EmptyState
            icon={<Smartphone className="w-8 h-8" />}
            title="Nenhum operador de portaria cadastrado"
            description="Adicione o e-mail de um membro da equipe para que ele possa abrir a câmera e validar ingressos na entrada."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Link exclusivo e ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readers.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{r.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{r.email}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={r.active ? 'success' : 'neutral'}>
                        {r.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <StaffLinkActions
                        eventId={eventId}
                        kind="reader"
                        userId={r.userId}
                        name={r.name}
                        accessLink={r.accessLink}
                        onLinkChanged={fetchReaders}
                        onRemove={() => handleRemove(r.userId, r.name)}
                      />
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

