import React, { useState, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { X, Upload, FileSpreadsheet, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Loader2, FileText, Pause, Play, Trash2, Save } from 'lucide-react';
import { parseImportFile, validateFileExtension, ImportedRow, ImportResult } from '../services/fileImportService';

export interface ImportProgress {
  current: number;
  total: number;
  percent: number;
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    rows: ImportedRow[],
    onProgress: (progress: ImportProgress) => void,
    cancelRef: React.MutableRefObject<boolean>
  ) => Promise<string[]>; // returns array of inserted IDs
  onDiscardImported?: (ids: string[]) => Promise<void>;
  title: string;
  typeLabel: string;
}

const PREVIEW_PAGE_SIZE = 10;

type Stage = 'SELECT' | 'PREVIEW' | 'IMPORTING' | 'PAUSED' | 'DONE';

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport, onDiscardImported, title, typeLabel }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>('SELECT');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [previewPage, setPreviewPage] = useState(1);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const [importProgress, setImportProgress] = useState<ImportProgress>({ current: 0, total: 0, percent: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [wasCancelled, setWasCancelled] = useState(false);

  const cancelRef = useRef(false);
  const allRowsRef = useRef<ImportedRow[]>([]);
  const importedIdsRef = useRef<string[]>([]);

  const reset = () => {
    setStage('SELECT');
    setResult(null);
    setSelectedRows(new Set());
    setPreviewPage(1);
    setImportErrors([]);
    setImportedCount(0);
    setImportProgress({ current: 0, total: 0, percent: 0 });
    setWasCancelled(false);
    cancelRef.current = false;
    allRowsRef.current = [];
    importedIdsRef.current = [];
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = async (file: File) => {
    if (!validateFileExtension(file.name)) {
      setResult({ rows: [], headers: [], errors: [`Formato não suportado. Use .xlsx, .xls, .csv ou .txt`] });
      setStage('PREVIEW');
      return;
    }
    const parsed = await parseImportFile(file);
    setResult(parsed);
    if (parsed.rows.length > 0) {
      setSelectedRows(new Set(parsed.rows.map((_, i) => i)));
    }
    setStage('PREVIEW');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  }, []);

  const toggleRow = (idx: number) => {
    const next = new Set(selectedRows);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedRows(next);
  };

  const toggleAll = () => {
    if (!result) return;
    if (selectedRows.size === result.rows.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(result.rows.map((_, i) => i)));
  };

  const runImport = async (rows: ImportedRow[], startFrom: number, total: number) => {
    cancelRef.current = false;
    setStage('IMPORTING');

    try {
      const newIds = await onImport(rows, (progress) => {
        flushSync(() => {
          setImportProgress({
            current: startFrom + progress.current,
            total,
            percent: Math.round(((startFrom + progress.current) / total) * 100)
          });
        });
      }, cancelRef);

      importedIdsRef.current = [...importedIdsRef.current, ...newIds];

      if (cancelRef.current) {
        setStage('PAUSED');
      } else {
        setImportedCount(total);
        setWasCancelled(false);
        setStage('DONE');
      }
    } catch (e: any) {
      setImportErrors([e.message || 'Erro ao importar']);
      setStage('DONE');
    }
  };

  const handleImport = async () => {
    if (!result) return;
    const toImport = result.rows.filter((_, i) => selectedRows.has(i));
    if (toImport.length === 0) return;

    allRowsRef.current = toImport;
    importedIdsRef.current = [];
    setImportProgress({ current: 0, total: toImport.length, percent: 0 });
    await runImport(toImport, 0, toImport.length);
  };

  const handleCancelRequest = () => {
    cancelRef.current = true;
  };

  const handleResume = async () => {
    const done = importProgress.current;
    const total = allRowsRef.current.length;
    const remaining = allRowsRef.current.slice(done);
    if (remaining.length === 0) {
      setImportedCount(done);
      setStage('DONE');
      return;
    }
    await runImport(remaining, done, total);
  };

  const handleKeepImported = async () => {
    setImportedCount(importProgress.current);
    setWasCancelled(true);
    setStage('DONE');
  };

  const handleDiscardAll = async () => {
    if (onDiscardImported && importedIdsRef.current.length > 0) {
      try {
        await onDiscardImported(importedIdsRef.current);
      } catch (e) {
        console.error('Error discarding imported items:', e);
      }
    }
    importedIdsRef.current = [];
    setImportedCount(0);
    setWasCancelled(true);
    setStage('DONE');
  };

  if (!isOpen) return null;

  const totalPreviewPages = result ? Math.ceil(result.rows.length / PREVIEW_PAGE_SIZE) : 0;
  const previewRows = result ? result.rows.slice((previewPage - 1) * PREVIEW_PAGE_SIZE, previewPage * PREVIEW_PAGE_SIZE) : [];
  const previewOffset = (previewPage - 1) * PREVIEW_PAGE_SIZE;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            {title}
          </h2>
          {stage !== 'IMPORTING' && (
            <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Stage: SELECT */}
          {stage === 'SELECT' && (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${dragOver ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/10 hover:border-white/20'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Arraste um arquivo aqui ou clique para selecionar</p>
              <p className="text-slate-400 text-sm mb-6">Formatos aceitos: Excel (.xlsx, .xls), CSV (.csv) e Texto (.txt)</p>
              <div className="flex flex-col items-center gap-3">
                <button onClick={() => fileRef.current?.click()} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors">
                  Selecionar Arquivo
                </button>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt" className="hidden" onChange={handleFileChange} />
              </div>
              <div className="mt-8 text-left bg-slate-800/50 rounded-xl p-4 border border-white/5">
                <p className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Formato esperado</p>
                <p className="text-xs text-slate-400 mb-2">O arquivo deve conter ao menos a coluna <span className="text-emerald-400 font-mono">título</span> (ou <span className="text-emerald-400 font-mono">title</span>).</p>
                <p className="text-xs text-slate-400 mb-1">Colunas opcionais:</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {['status', 'nota/rating', 'plataforma', 'gêneros', 'autor', 'isbn', 'sinopse'].map(col => (
                    <span key={col} className="px-2 py-0.5 bg-slate-700 rounded text-[10px] text-slate-300 font-mono">{col}</span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3">Para .txt sem cabeçalho, cada linha será tratada como um título.</p>
              </div>
            </div>
          )}

          {/* Stage: PREVIEW */}
          {stage === 'PREVIEW' && result && (
            <div>
              {result.errors.length > 0 && (
                <div className="bg-red-950/50 border border-red-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-red-300">Avisos</span>
                  </div>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-400">{e}</p>
                  ))}
                </div>
              )}
              {result.rows.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Nenhum registro válido encontrado no arquivo.</p>
                  <button onClick={reset} className="mt-4 text-sm text-emerald-400 hover:underline">Tentar outro arquivo</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-300">
                      <span className="text-white font-bold">{result.rows.length}</span> {typeLabel} encontrado(s) — <span className="text-emerald-400 font-bold">{selectedRows.size}</span> selecionado(s)
                    </p>
                    <button onClick={toggleAll} className="text-xs text-slate-400 hover:text-white transition-colors">
                      {selectedRows.size === result.rows.length ? 'Desmarcar todos' : 'Selecionar todos'}
                    </button>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl border border-white/5 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="p-3 text-left w-10">
                            <input type="checkbox" checked={selectedRows.size === result.rows.length} onChange={toggleAll} className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500/30" />
                          </th>
                          <th className="p-3 text-left text-xs text-slate-400 uppercase tracking-wider">Título</th>
                          <th className="p-3 text-left text-xs text-slate-400 uppercase tracking-wider">Status</th>
                          {result.headers.includes('rating') && <th className="p-3 text-left text-xs text-slate-400 uppercase tracking-wider">Nota</th>}
                          {result.headers.includes('platform') && <th className="p-3 text-left text-xs text-slate-400 uppercase tracking-wider">Plataforma</th>}
                          {result.headers.includes('author') && <th className="p-3 text-left text-xs text-slate-400 uppercase tracking-wider">Autor</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, i) => {
                          const globalIdx = previewOffset + i;
                          return (
                            <tr key={globalIdx} className={`border-b border-white/5 transition-colors ${selectedRows.has(globalIdx) ? 'bg-emerald-500/5' : 'hover:bg-white/[0.02]'}`}>
                              <td className="p-3">
                                <input type="checkbox" checked={selectedRows.has(globalIdx)} onChange={() => toggleRow(globalIdx)} className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500/30" />
                              </td>
                              <td className="p-3 text-white font-medium truncate max-w-[200px]">{row.title}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-700 text-slate-300">{row.status || 'PENDING'}</span>
                              </td>
                              {result.headers.includes('rating') && <td className="p-3 text-slate-300">{row.rating ?? '-'}</td>}
                              {result.headers.includes('platform') && <td className="p-3 text-slate-300">{row.platform || '-'}</td>}
                              {result.headers.includes('author') && <td className="p-3 text-slate-300">{row.author || '-'}</td>}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {totalPreviewPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-4">
                      <button onClick={() => setPreviewPage(p => p - 1)} disabled={previewPage === 1} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300"><ChevronLeft className="w-4 h-4" /></button>
                      <span className="text-xs text-slate-400">Página {previewPage} de {totalPreviewPages}</span>
                      <button onClick={() => setPreviewPage(p => p + 1)} disabled={previewPage === totalPreviewPages} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Stage: IMPORTING */}
          {stage === 'IMPORTING' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
              <p className="text-white font-medium mb-1">
                Importando {importProgress.current} de {importProgress.total} {typeLabel}
              </p>
              <p className="text-slate-400 text-sm mb-6">Aguarde enquanto os dados são salvos.</p>
              <div className="w-full max-w-xs">
                <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.max(importProgress.percent, 2)}%` }}
                  />
                </div>
                <p className="text-center text-xs text-emerald-400 font-bold mt-2">{importProgress.percent}%</p>
              </div>
              <button
                onClick={handleCancelRequest}
                className="mt-8 px-5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pausar Importação
              </button>
            </div>
          )}

          {/* Stage: PAUSED */}
          {stage === 'PAUSED' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5">
                <Pause className="w-7 h-7 text-amber-400" />
              </div>
              <p className="text-white font-bold text-lg mb-1">Importação Pausada</p>
              <p className="text-slate-400 text-sm mb-2">
                <span className="text-amber-400 font-bold">{importProgress.current}</span> de <span className="text-white font-bold">{importProgress.total}</span> {typeLabel} foram importados até agora.
              </p>
              <p className="text-slate-500 text-xs mb-8">O que deseja fazer?</p>

              <div className="flex flex-col gap-3 w-full max-w-sm">
                <button
                  onClick={handleResume}
                  className="w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Retomar Importação
                </button>
                <button
                  onClick={handleKeepImported}
                  className="w-full px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Manter {importProgress.current} Importados
                </button>
                {onDiscardImported && (
                  <button
                    onClick={handleDiscardAll}
                    className="w-full px-5 py-3 bg-red-950/50 hover:bg-red-900/50 border border-red-500/30 text-red-300 hover:text-red-200 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Descartar Tudo
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stage: DONE */}
          {stage === 'DONE' && (
            <div className="flex flex-col items-center justify-center py-16">
              {importErrors.length > 0 ? (
                <>
                  <AlertTriangle className="w-10 h-10 text-red-400 mb-4" />
                  <p className="text-red-300 font-medium mb-2">Erro durante importação</p>
                  {importErrors.map((e, i) => <p key={i} className="text-xs text-red-400">{e}</p>)}
                </>
              ) : importedCount === 0 && wasCancelled ? (
                <>
                  <Trash2 className="w-10 h-10 text-slate-500 mb-4" />
                  <p className="text-slate-300 font-medium">Importação cancelada</p>
                  <p className="text-slate-500 text-sm mt-1">Todos os dados foram descartados.</p>
                </>
              ) : (
                <>
                  <CheckCircle className="w-10 h-10 text-emerald-400 mb-4" />
                  <p className="text-white font-medium">
                    {importedCount} {typeLabel} importado(s) com sucesso!
                  </p>
                  {wasCancelled && (
                    <p className="text-slate-400 text-sm mt-1">
                      Importação parcial — {allRowsRef.current.length - importedCount} itens não foram importados.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-white/5">
          {stage === 'SELECT' && (
            <button onClick={handleClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancelar</button>
          )}
          {stage === 'PREVIEW' && result && result.rows.length > 0 && (
            <>
              <button onClick={reset} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">← Voltar</button>
              <button
                onClick={handleImport}
                disabled={selectedRows.size === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Importar {selectedRows.size} {typeLabel}
              </button>
            </>
          )}
          {stage === 'PREVIEW' && result && result.rows.length === 0 && (
            <button onClick={handleClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Fechar</button>
          )}
          {stage === 'DONE' && (
            <button onClick={handleClose} className="ml-auto px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors">Fechar</button>
          )}
        </div>
      </div>
    </div>
  );
};
