import React, { useState, useEffect } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { EmptyState } from '../UI/EmptyState';
import { ScanLine, UserPlus, Trash2, Smartphone, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAlert } from '../../hooks/useAlert';
import { invitationService } from '../../services/invitation.service';
import { ReaderUser } from '../../types';

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
      toast.error('Informe o e-mail do operador cadastrado no FotoQR.');
      return;
    }

    try {
      setSubmitting(true);
      await invitationService.addReader(eventId, readerEmail.trim());
      toast.success('Leitor autorizado com sucesso!');
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
            placeholder="E-mail da conta do operador..."
            value={readerEmail}
            onChange={(e) => setReaderEmail(e.target.value)}
            className="flex-1 text-sm rounded-lg border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500"
          />
          <Button type="submit" disabled={submitting} className="flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" />
            {submitting ? 'Autorizando...' : 'Autorizar Leitor'}
          </Button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Link direto para os leitores na portaria:
          </p>
          <a
            href={`/leitor/${eventId}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Abrir App Leitor Mobile
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
                  <th className="py-3 px-4 text-right">Ação</th>
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
                      <button
                        title="Revogar Permissão"
                        onClick={() => handleRemove(r.userId, r.name)}
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

