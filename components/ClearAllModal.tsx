import React, { useState } from 'react';
import { X, AlertTriangle, Loader2, Trash2 } from 'lucide-react';

interface ClearAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  itemCount: number;
}

export const ClearAllModal: React.FC<ClearAllModalProps> = ({ isOpen, onClose, onConfirm, title, description, itemCount }) => {
  const [stage, setStage] = useState<'CONFIRM' | 'PROCESSING' | 'DONE'>('CONFIRM');
  const [confirmText, setConfirmText] = useState('');

  const reset = () => {
    setStage('CONFIRM');
    setConfirmText('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = async () => {
    setStage('PROCESSING');
    try {
      await onConfirm();
      setStage('DONE');
    } catch {
      setStage('CONFIRM');
    }
  };

  if (!isOpen) return null;

  const canConfirm = confirmText.toLowerCase() === 'limpar';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            {title}
          </h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {stage === 'CONFIRM' && (
            <div>
              <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-4 mb-5">
                <p className="text-sm text-red-300 font-medium mb-1">⚠️ Ação irreversível</p>
                <p className="text-sm text-slate-300">{description}</p>
                <p className="text-sm text-white font-bold mt-2">{itemCount} item(ns) serão removidos permanentemente.</p>
              </div>

              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Digite <span className="text-red-400 font-bold">limpar</span> para confirmar
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="limpar"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all placeholder:text-slate-600 mb-4"
                autoFocus
              />

              <div className="flex gap-3">
                <button onClick={handleClose} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Limpar Tudo
                </button>
              </div>
            </div>
          )}

          {stage === 'PROCESSING' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-red-400 animate-spin mb-4" />
              <p className="text-white font-medium">Removendo todos os dados...</p>
              <p className="text-slate-400 text-sm mt-1">Isso pode levar alguns segundos.</p>
            </div>
          )}

          {stage === 'DONE' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <p className="text-white font-medium mb-1">Dados removidos com sucesso!</p>
              <p className="text-slate-400 text-sm">O módulo foi resetado ao estado padrão.</p>
              <button onClick={handleClose} className="mt-6 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors">
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
