import React, { useState, useEffect } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { ProgressBar } from '../UI/ProgressBar';
import {
  Users,
  QrCode,
  CheckCircle2,
  UserX,
  TrendingUp,
  Mail,
  MessageSquare,
  FileSpreadsheet,
  Download,
  Clock,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { invitationService } from '../../services/invitation.service';
import { DashboardMetrics } from '../../types';

interface EventDashboardHubProps {
  eventId: string | number;
}

export const EventDashboardHub: React.FC<EventDashboardHubProps> = ({ eventId }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await invitationService.getDashboardMetrics(eventId);
      setMetrics(data);
    } catch (err: any) {
      // Same toast id: the 15s polling must not stack a new error toast on every attempt
      toast.error(err?.message || 'Erro ao carregar estatísticas do evento.', { id: 'dashboard-metrics-error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Poll every 15s when active on dashboard
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, [eventId]);

  const handleExport = async (type: 'guests' | 'checkins' | 'absent' | 'deliveries', format: 'xlsx' | 'csv') => {
    try {
      setExporting(true);
      await invitationService.exportReport(eventId, type, format);
      toast.success(`Exportação de ${type} (${format.toUpperCase()}) iniciada!`);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao exportar relatório.');
    } finally {
      setExporting(false);
    }
  };

  if (loading && !metrics) {
    return <div className="p-8 text-center text-slate-500 text-sm">Carregando painel do evento...</div>;
  }

  if (!metrics) {
    return <div className="p-8 text-center text-slate-500 text-sm">Nenhum dado disponível para este evento.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with Refresh & Export options */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Métricas e Monitoramento em Tempo Real
          </h3>
          <p className="text-xs text-slate-500">Atualizado automaticamente a cada 15 segundos</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost" onClick={fetchMetrics} className="flex items-center gap-1 text-slate-600">
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={exporting}
            onClick={() => handleExport('guests', 'xlsx')}
            className="flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Exportar Convidados (XLSX)
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={exporting}
            onClick={() => handleExport('checkins', 'xlsx')}
            className="flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            Exportar Entradas (XLSX)
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total de Convidados</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{metrics.totalGuests}</p>
          <span className="text-xs text-slate-400 mt-1 block">Cadastrados no evento</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Convites Emitidos</span>
            <QrCode className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{metrics.totalInvitations}</p>
          <span className="text-xs text-slate-400 mt-1 block">Com QR Code exclusivo</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Entradas Realizadas</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{metrics.totalCheckins}</p>
          <span className="text-xs text-slate-400 mt-1 block">Check-ins válidos na portaria</span>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Taxa de Presença</span>
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{metrics.attendanceRate}%</p>
          <span className="text-xs text-slate-400 mt-1 block">{metrics.absentGuests} ausentes até agora</span>
        </Card>
      </div>

      {/* Deliveries Bar & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1 space-y-4">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Envios e Distribuição
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4 text-indigo-500" /> E-mails Enviados
              </span>
              <span className="font-bold text-slate-800">{metrics.sentEmail}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <MessageSquare className="w-4 h-4 text-emerald-500" /> WhatsApp Enviados
              </span>
              <span className="font-bold text-slate-800">{metrics.sentWhatsApp}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Envios Pendentes</span>
              <span className="font-semibold text-amber-600">{metrics.pendingDeliveries}</span>
            </div>
            {metrics.failedDeliveries > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-rose-500">Falhas de Envio</span>
                <span className="font-semibold text-rose-600">{metrics.failedDeliveries}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h5 className="text-xs font-bold text-slate-600 uppercase mb-3">Presença por Categoria</h5>
            <div className="space-y-3">
              {metrics.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{cat.category}</span>
                    <span className="text-slate-500">{cat.present}/{cat.total} presentes</span>
                  </div>
                  <ProgressBar
                    progress={cat.total > 0 ? (cat.present / cat.total) * 100 : 0}
                    color="blue"
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Recent Real-Time Check-ins */}
        <Card className="p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Últimas Entradas Registradas
            </h4>
            <span className="text-xs text-slate-400">Tempo real</span>
          </div>

          {metrics.recentCheckins.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Nenhuma entrada registrada até o momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Convidado</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Horário</th>
                    <th className="py-2.5 px-3">Leitor</th>
                    <th className="py-2.5 px-3 text-right">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.recentCheckins.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{entry.guestName}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="info">{entry.category}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-500">
                        {new Date(entry.checkedInAt).toLocaleTimeString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-600">{entry.readerName || 'Portaria'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <Badge variant={entry.result === 'VALIDO' ? 'success' : 'danger'}>
                          {entry.result}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

