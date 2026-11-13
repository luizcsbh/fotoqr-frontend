import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/UI/Button';
import { Card } from '../components/UI/Card';
import {
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  ArrowLeft,
  Smartphone,
  Volume2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { invitationService } from '../services/invitation.service';
import { CheckinValidationResult } from '../types';

export const QRScannerPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(true);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<CheckinValidationResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [sessionCount, setSessionCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Audio Beep Generator using Web Audio API
  const playSound = (type: 'success' | 'error') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 high beep
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3 low beep
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch {
      // AudioContext not allowed without user gesture or unsupported
    }
  };

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setHasCameraPermission(true);
      setScanning(true);
    } catch (err) {
      setHasCameraPermission(false);
      toast.error('Não foi possível acessar a câmera do dispositivo.');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [eventId]);

  const handleValidate = async (rawToken: string) => {
    if (!eventId || validating) return;

    try {
      setValidating(true);
      const res = await invitationService.validateCheckin(eventId, rawToken, navigator.userAgent);
      setResult(res);
      setScanning(false);

      if (res.allowed) {
        playSound('success');
        setSessionCount((prev) => prev + 1);
      } else {
        playSound('error');
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Erro ao validar QR Code.';
      setResult({
        status: 'INVALIDO',
        allowed: false,
        color: 'vermelho',
        message: errorMsg,
      });
      playSound('error');
      setScanning(false);
    } finally {
      setValidating(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleValidate(manualCode.trim());
    setManualCode('');
  };

  const handleNextScan = () => {
    setResult(null);
    setScanning(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between py-3 border-b border-slate-800">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="text-center">
          <h1 className="text-sm font-bold tracking-wider uppercase text-indigo-400">Leitor Portaria</h1>
          <span className="text-xs text-slate-400">Evento #{eventId}</span>
        </div>

        <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 border border-slate-700">
          Entradas: {sessionCount}
        </div>
      </div>

      {/* Main Camera / Result Area */}
      <div className="my-auto py-4">
        {result ? (
          /* Full Screen Result Card */
          <div
            className={`rounded-2xl p-6 text-center space-y-6 shadow-2xl transition-all duration-300 ${
              result.color === 'verde'
                ? 'bg-emerald-600 text-white'
                : result.color === 'laranja'
                ? 'bg-amber-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            <div className="py-2">
              {result.color === 'verde' ? (
                <CheckCircle2 className="w-20 h-20 mx-auto text-white drop-shadow-md animate-bounce" />
              ) : result.color === 'laranja' ? (
                <AlertTriangle className="w-20 h-20 mx-auto text-white drop-shadow-md" />
              ) : (
                <XCircle className="w-20 h-20 mx-auto text-white drop-shadow-md" />
              )}
            </div>

            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">{result.status}</h2>
              <p className="text-base font-semibold mt-1 opacity-90">{result.message}</p>
            </div>

            {result.guest && (
              <div className="bg-black/25 backdrop-blur-sm rounded-xl p-4 text-left space-y-1">
                <span className="text-xs uppercase tracking-wider opacity-75">Convidado</span>
                <p className="text-lg font-bold">{result.guest.name}</p>
                <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-white/20">
                  {result.guest.category}
                </span>
              </div>
            )}

            {result.entriesCount && (
              <p className="text-xs opacity-80">
                Uso de Entradas: {result.entriesCount.used} / {result.entriesCount.max}
              </p>
            )}

            <Button
              variant="secondary"
              size="lg"
              onClick={handleNextScan}
              className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold py-3.5 shadow-lg flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5 text-indigo-600" />
              Próxima Leitura
            </Button>
          </div>
        ) : (
          /* Camera Viewfinder */
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square border-2 border-indigo-500 shadow-2xl flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Overlay Reticle */}
              <div className="absolute inset-0 border-4 border-indigo-400/50 m-8 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-full h-0.5 bg-indigo-500/80 shadow-[0_0_15px_#6366f1] animate-pulse" />
              </div>

              {hasCameraPermission === false && (
                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <Camera className="w-12 h-12 text-slate-500" />
                  <p className="text-sm text-slate-300">Câmera não disponível ou sem permissão.</p>
                  <Button size="sm" onClick={startCamera}>Tentar Novamente</Button>
                </div>
              )}
            </div>

            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              Aponte a câmera para o QR Code do convite
            </p>
          </div>
        )}
      </div>

      {/* Manual Input Alternative */}
      <div className="pt-4 border-t border-slate-800">
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Digitar código ou token..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            disabled={validating}
            className="flex-1 text-sm bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button type="submit" size="sm" disabled={validating || !manualCode.trim()}>
            <Search className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

