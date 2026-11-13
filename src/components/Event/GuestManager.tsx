import React, { useState, useEffect } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { Badge } from '../UI/Badge';
import { EmptyState } from '../UI/EmptyState';
import {
  Users,
  UserPlus,
  Upload,
  Search,
  Filter,
  Trash2,
  Mail,
  Phone,
  QrCode,
  FileSpreadsheet,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { invitationService } from '../../services/invitation.service';
import { Guest, GuestCategory } from '../../types';

interface GuestManagerProps {
  eventId: string | number;
  onInvitationsUpdated?: () => void;
}

const CATEGORIES: GuestCategory[] = ['VIP', 'Convidado', 'Equipe', 'Imprensa', 'Organizador', 'Personalizado'];

export const GuestManager: React.FC<GuestManagerProps> = ({ eventId, onInvitationsUpdated }) => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<GuestCategory>('Convidado');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const res = await invitationService.listGuests(eventId, {
        search: search || undefined,
        category: categoryFilter || undefined,
      });
      setGuests(res.data || []);
    } catch (err: any) {
      toast.error('Erro ao carregar lista de convidados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, [eventId, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGuests();
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe o nome do convidado.');
      return;
    }

    try {
      setSubmitting(true);
      const guest = await invitationService.createGuest(eventId, {
        name,
        email: email || undefined,
        phone: phone || undefined,
        category,
        notes: notes || undefined,
      });

      toast.success(`Convidado "${guest.name}" adicionado!`);
      setShowAddModal(false);
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
      fetchGuests();
      if (onInvitationsUpdated) onInvitationsUpdated();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao cadastrar convidado.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Selecione uma planilha CSV ou XLSX.');
      return;
    }

    try {
      setImporting(true);
      const res = await invitationService.importGuests(eventId, importFile);
      toast.success(
        `Importação concluída: ${res.imported} adicionados, ${res.duplicates} duplicados ignorados.`
      );
      setShowImportModal(false);
      setImportFile(null);
      fetchGuests();
      if (onInvitationsUpdated) onInvitationsUpdated();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro na importação de convidados.');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (guestId: number, guestName: string) => {
    if (!window.confirm(`Tem certeza que deseja remover ${guestName}? O convite vinculado também será cancelado.`)) {
      return;
    }

    try {
      await invitationService.deleteGuest(eventId, guestId);
      toast.success('Convidado removido.');
      fetchGuests();
      if (onInvitationsUpdated) onInvitationsUpdated();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao remover convidado.');
    }
  };

  const handleGenerateInvite = async (guestId: number) => {
    try {
      await invitationService.generateInvitation(eventId, guestId);
      toast.success('Convite com QR Code gerado!');
      if (onInvitationsUpdated) onInvitationsUpdated();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao gerar convite.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por nome, email ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Buscar
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm rounded-lg border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas as Categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Importar Planilha
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar Convidado
          </Button>
        </div>
      </div>

      {/* Guest Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Carregando convidados...</div>
        ) : guests.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="Nenhum convidado cadastrado"
            description="Cadastre convidados individualmente ou importe uma planilha CSV/XLSX."
            actionText="Adicionar Primeiro Convidado"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Observações</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {guest.name}
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      {guest.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {guest.email}
                        </div>
                      )}
                      {guest.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {guest.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={guest.category === 'VIP' ? 'warning' : 'info'}>
                        {guest.category}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                      {guest.notes || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        title="Gerar / Ver Convite QR Code"
                        onClick={() => handleGenerateInvite(guest.id)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        title="Remover Convidado"
                        onClick={() => handleDelete(guest.id, guest.name)}
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

      {/* Modal Add Guest */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Novo Convidado"
      >
        <form onSubmit={handleAddGuest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maria Silva"
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                E-mail (para envio)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maria@exemplo.com"
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                WhatsApp / Telefone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GuestCategory)}
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mesa reservada, restrição alimentar, etc."
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancelar</Button>
            <Button
              type="submit"
              variant="success"
              disabled={submitting}
              isLoading={submitting}
              leftIcon={<Save className="w-4 h-4 text-white" />}
            >
              Salvar Convidado
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Import Spreadsheet */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Importar Lista de Convidados (CSV ou XLSX)"
      >
        <form onSubmit={handleImport} className="space-y-4">
          <p className="text-sm text-slate-600">
            Envie sua planilha com as colunas <strong>Nome</strong>, <strong>Email</strong>, <strong>Telefone</strong> e <strong>Categoria</strong>. O sistema identifica e ignora duplicidades automaticamente.
          </p>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input" className="cursor-pointer space-y-2 block">
              <Upload className="w-8 h-8 text-indigo-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                {importFile ? importFile.name : 'Clique para selecionar o arquivo (.csv ou .xlsx)'}
              </p>
              <p className="text-xs text-slate-400">Até 15MB</p>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowImportModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={!importFile || importing}>
              {importing ? 'Processando Planilha...' : 'Iniciar Importação'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

