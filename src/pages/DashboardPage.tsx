import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, FolderHeart, RefreshCw, AlertCircle } from 'lucide-react';
import { eventService } from '../services/event.service';
import { EventCard } from '../components/Event/EventCard';
import { CreateEventForm } from '../components/Event/CreateEventForm';
import { Modal } from '../components/UI/Modal';
import { Button } from '../components/UI/Button';
import { EmptyState } from '../components/UI/EmptyState';
import { CreateEventData } from '../types';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'paused'>('all');
  const queryClient = useQueryClient();

  // Fetch events
  const {
    data: events = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.getUserEvents(),
  });

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateEventData) => eventService.createEvent(data),
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsModalOpen(false);
      toast.success(`Álbum "${newEvent.title}" criado com sucesso!`);
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(error.message || 'Erro ao criar álbum.');
    },
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: boolean }) =>
      eventService.toggleEvent(id, nextStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Status do evento atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar status do evento.');
    },
  });

  const handleToggle = (id: string, currentStatus: boolean) => {
    toggleMutation.mutate({ id, nextStatus: !currentStatus });
  };

  // Filtered events
  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterActive === 'active') return ev.is_active;
    if (filterActive === 'paused') return !ev.is_active;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Meus Eventos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie seus álbuns de fotos, acesse QR Codes e baixe os envios em alta qualidade.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-5 h-5" />}
            size="md"
          >
            Criar Novo Evento
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      {events.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="dashboard-search-events"
              name="search_query"
              type="text"
              placeholder="Buscar evento por título ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 text-slate-900 rounded-xl text-sm border-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all placeholder-slate-400"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setFilterActive('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterActive === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({events.length})
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterActive === 'active'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ativos ({events.filter((e) => e.is_active).length})
            </button>
            <button
              onClick={() => setFilterActive('paused')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterActive === 'paused'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pausados ({events.filter((e) => !e.is_active).length})
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-64 rounded-2xl bg-white border border-slate-200 p-6 animate-pulse space-y-4"
            >
              <div className="h-5 bg-slate-200 rounded-md w-1/3" />
              <div className="h-6 bg-slate-200 rounded-md w-3/4" />
              <div className="h-4 bg-slate-200 rounded-md w-full" />
              <div className="h-10 bg-slate-100 rounded-xl w-full mt-6" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="font-bold text-base mb-1">Não foi possível carregar os eventos</h3>
          <p className="text-xs text-red-600 mb-4">Verifique sua conexão ou tente novamente.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Recarregar
          </Button>
        </div>
      )}

      {/* Empty State when no events exist */}
      {!isLoading && !isError && events.length === 0 && (
        <EmptyState
          icon={<FolderHeart className="w-10 h-10" />}
          title="Nenhum álbum criado ainda"
          description="Crie seu primeiro álbum de fotos para gerar o QR Code e começar a receber momentos inesquecíveis dos seus convidados."
          actionText="Criar Meu Primeiro Evento"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      {/* Empty State when filter yields 0 */}
      {!isLoading && !isError && events.length > 0 && filteredEvents.length === 0 && (
        <EmptyState
          title="Nenhum evento encontrado"
          description="Tente ajustar sua busca ou limpar os filtros para visualizar outros eventos."
          actionText="Limpar busca"
          onAction={() => {
            setSearchQuery('');
            setFilterActive('all');
          }}
          actionVariant="secondary"
        />
      )}

      {/* Events Grid */}
      {!isLoading && !isError && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onToggleActive={handleToggle}
              isToggling={toggleMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Criar Novo Álbum de Evento"
        description="Defina os detalhes do evento para gerar o QR Code exclusivo."
        maxWidth="lg"
      >
        <CreateEventForm
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data);
          }}
          onCancel={() => setIsModalOpen(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>
    </div>
  );
};
