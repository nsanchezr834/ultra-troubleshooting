'use client';

import React, { useState, useMemo, useId } from 'react';
import { TroubleshootingKnowledge } from '../../types/troubleshooting.types';
import { CLIENTS_DATABASE } from '../../config/robots-db';
import { Search, Info, X, AlertCircle, Wrench, ShieldAlert, Settings, Server, Cpu, Layers, Lightbulb } from 'lucide-react';
import { logSearch } from '../lib/telemetry';
import { FaultCard, FaultModal, SearchBar } from './ui';
import type { ExtendedFault } from './ui';

// ExtendedFault is imported from ui/FaultCard — local alias for backward compatibility
type ExtendedTroubleshootingKnowledge = ExtendedFault;

interface TroubleshootingSearchProps {
  knowledgeBase: TroubleshootingKnowledge[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  isDarkMode?: boolean;
  appMode?: 'capacitacion' | 'operativo';
}

export default function TroubleshootingSearch({ 
  knowledgeBase, 
  selectedCategory, 
  onCategorySelect,
  isDarkMode = false,
  appMode = 'capacitacion',
}: TroubleshootingSearchProps) {
  const isExpert = appMode === 'operativo';
  const resultsId = useId();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllFaults, setShowAllFaults] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState<ExtendedTroubleshootingKnowledge | null>(null);
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const currentSearchRef = React.useRef<any>(null);
  
  // En Modo Experto arrancamos directo en búsqueda rápida
  const [searchMode, setSearchMode] = useState<'quick' | 'category'>(isExpert ? 'quick' : 'quick');

  const lastSearchTypeRef = React.useRef<'text' | 'voice_inline'>('text');

  // Ref para autofocus en Modo Experto
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Autofocus inmediato en Modo Experto
  React.useEffect(() => {
    if (isExpert && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpert]);

  // Sincronizar selectedCategory con el modo de búsqueda
  React.useEffect(() => {
    if (selectedCategory) {
      setSearchMode('category');
      setShowAllFaults(true);
    }
  }, [selectedCategory]);

  // Obtener logo local o dinámico por llave de cliente
  const getClientLogoSrc = (key: string): string => {
    const logoMap: Record<string, string> = {
      'manifest.eco': 'manifest_logo.png',
      'highline-commerce': 'highline_logo.png',
      'outerspace': 'outerspace_logo.png',
      'mountainy': 'mountainy_logo.png'
    };
    return `/${logoMap[key] || `${key.replace('-', '_')}_logo.png`}`;
  };

  // Extraer dinámicamente todos los consejos operativos de todos los robots de todos los clientes
  const robotAdvices = useMemo(() => {
    const advices: ExtendedTroubleshootingKnowledge[] = [];
    Object.values(CLIENTS_DATABASE).forEach(client => {
      client.robots.forEach(robot => {
        if (robot.advises) {
          robot.advises.forEach(advice => {
            const cleanContent = advice.content.replace(/<[^>]*>/g, '');
            advices.push({
              id: advice.id,
              category: "Consejos Operativos",
              symptom: `Consejo Operativo: ${cleanContent.substring(0, 80)}${cleanContent.length > 80 ? '...' : ''}`,
              resolution_protocol: advice.content,
              sop_reference: `Consejo Operativo - ${robot.name}`,
              clientKey: client.id,
              robotName: robot.name
            });
          });
        }
      });
    });
    return advices;
  }, []);

  // Base de conocimientos combinada
  const combinedKnowledgeBase = useMemo(() => {
    return [...knowledgeBase, ...robotAdvices] as ExtendedTroubleshootingKnowledge[];
  }, [knowledgeBase, robotAdvices]);

  const normalizeForSearch = (text: string): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos / diacríticos
      .replace(/z/g, 's')              // brazos -> brasos, seseo
      .replace(/ce/g, 'se')            // c -> s
      .replace(/ci/g, 'si')
      .replace(/[^a-z0-9\s]/g, '');    // Mantener alfanuméricos y espacios
  };

  // Búsqueda global
  const fuseRef = React.useRef<any>(null);

  React.useEffect(() => {
    // Dynamic import to avoid SSR issues if any, but regular import is fine.
    import('fuse.js').then((FuseModule) => {
      fuseRef.current = new FuseModule.default(combinedKnowledgeBase, {
        keys: ['title', 'symptom', 'keywords', 'id', 'resolution_protocol'],
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 3,
      });
    });
  }, [combinedKnowledgeBase]);

  const filteredKnowledge = useMemo(() => {
    const searchStr = searchTerm.trim();
    if (!searchStr) return [];
    
    if (fuseRef.current) {
      const result = fuseRef.current.search(searchStr);
      return result.map((r: any) => r.item);
    }
    
    // Fallback if fuse isn't loaded yet
    const stopWords = new Set([
      'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 
      'de', 'del', 'en', 'para', 'con', 'por', 'que', 'y', 'o', 'a',
      'falla', 'fallas', 'error', 'errores', 'problema', 'problemas', 'fe'
    ]);

    const searchWords = searchStr
      .split(/\s+/)
      .map(w => normalizeForSearch(w))
      .filter(w => w && !stopWords.has(w));

    if (searchWords.length === 0) return [];

    const scoredItems = combinedKnowledgeBase.map(item => {
      const normSymptom = normalizeForSearch(item.symptom);
      const normProtocol = normalizeForSearch(item.resolution_protocol);
      const normId = normalizeForSearch(item.id);
      const normKeywords = normalizeForSearch((item as any).keywords || '');

      let score = 0;
      searchWords.forEach(word => {
        let matches = 0;
        const singularWord = word.endsWith('s') ? word.slice(0, -1) : word;
        
        if (normSymptom.includes(word) || (word !== singularWord && normSymptom.includes(singularWord))) matches += 10;
        if (normKeywords.includes(word) || (word !== singularWord && normKeywords.includes(singularWord))) matches += 10;
        if (normId.includes(word) || (word !== singularWord && normId.includes(singularWord))) matches += 8;
        if (normProtocol.includes(word) || (word !== singularWord && normProtocol.includes(singularWord))) matches += 1;

        score += matches;
      });

      return { item, score };
    });

    return scoredItems
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.item);
  }, [combinedKnowledgeBase, searchTerm]);

  // Debounce effect to log no_matches for text search
  React.useEffect(() => {
    if (searchTerm.trim() === '') return;
    
    const handler = setTimeout(() => {
      if (lastSearchTypeRef.current === 'text') {
        const words = searchTerm.trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length > 0) {
          const matches = filteredKnowledge.length;
          if (matches === 0) {
            logSearch({
              query: searchTerm,
              matches_count: 0,
              status: 'no_matches',
              source: 'text'
            });
          }
        }
      }
    }, 2000);

    return () => clearTimeout(handler);
  }, [searchTerm, filteredKnowledge.length]);

  // Fallas de la categoría seleccionada
  const categoryKnowledge = useMemo(() => {
    if (!selectedCategory) return [];
    return combinedKnowledgeBase.filter(item => item.category === selectedCategory);
  }, [combinedKnowledgeBase, selectedCategory]);

  // Función para leer por voz el detalle de la falla seleccionada
  const speakItemDetails = (item: ExtendedTroubleshootingKnowledge, prefix: string = '') => {
    if (typeof window === 'undefined') return;

    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();
    if (synth.paused) {
      synth.resume();
    }

    const cleanSymptom = item.symptom.replace(/Qué hacer en caso de que/gi, '').replace(/\(ID:.*?\)/gi, '').trim();
    const cleanProtocol = item.resolution_protocol
      .replace(/\\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const textToSpeak = `${prefix}Detalle de la falla: ${cleanSymptom}. Protocolo de resolución: ${cleanProtocol}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'es-ES';
    utterance.rate = 1.05;

    let spoken = false;
    utterance.onstart = () => {
      spoken = true;
    };

    synth.speak(utterance);
  };

  const handleOpenModal = (item: ExtendedTroubleshootingKnowledge, prefix: string = '', readAloud: boolean = false) => {
    setSelectedItemForModal(item);
    setShowFeedbackPrompt(false);
    
    // Almacenar los parámetros de búsqueda para registrar telemetría al cerrar
    currentSearchRef.current = {
      query: searchTerm || item.symptom,
      matches_count: filteredKnowledge.length,
      selected_option: item.symptom,
      source: lastSearchTypeRef.current
    };

    // Leer en voz alta el protocolo y detalle de la falla seleccionada solo si se solicitó explícitamente (micrófono / manos libres)
    if (readAloud) {
      speakItemDetails(item, prefix);
    }
  };

  const forceCloseModal = () => {
    setSelectedItemForModal(null);
    setShowFeedbackPrompt(false);
    currentSearchRef.current = null;
    // Detener la lectura de voz inmediatamente si se cierra la ventana
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const handleCloseModalAttempt = () => {
    if (currentSearchRef.current) {
      setShowFeedbackPrompt(true);
    } else {
      forceCloseModal();
    }
  };

  const handleSaveFeedback = (solved: boolean) => {
    if (currentSearchRef.current) {
      logSearch({
        ...currentSearchRef.current,
        status: solved ? 'resolved' : 'no_matches', // 'no_matches' se muestra como 'SIN SOLUCIÓN' en el admin
      });
    }
    forceCloseModal();
  };

  return (
    <div className={`w-full border rounded-[2.5rem] overflow-hidden shadow-xl flex flex-col h-full font-sans max-h-[85vh] relative animate-fadeIn transition-colors duration-300 ${
      isDarkMode ? 'bg-[#0f1015] border-neutral-800' : 'bg-white border-neutral-200'
    }`}>
      
      {/* Cabecera */}
      <div className={`p-6 border-b flex flex-col gap-4 ${isDarkMode ? 'border-neutral-800 bg-[#1a1b24]/60' : 'border-neutral-100 bg-neutral-50/50'}`}>
        {/* Header: title + mode toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className={`text-xs font-black tracking-widest flex items-center gap-2 uppercase ${isDarkMode ? 'text-neutral-400' : 'text-neutral-400'}`}>
            <Search className="w-4 h-4 text-ultra-orange" aria-hidden="true" />
            Buscador de Resolución
          </h3>
          {!isExpert && (
            <div className={`flex p-1 rounded-xl self-start sm:self-auto ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200/60'}`}>
              <button
                type="button"
                onClick={() => { setSearchMode('quick'); onCategorySelect(null); }}
                aria-pressed={searchMode === 'quick'}
                className={`px-4 py-1.5 rounded-lg text-xs font-black tracking-wide transition-all ${
                  searchMode === 'quick'
                    ? isDarkMode ? 'bg-neutral-700 text-neutral-100 shadow-sm' : 'bg-white text-neutral-900 shadow-xs'
                    : isDarkMode ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Búsqueda Rápida
              </button>
              <button
                type="button"
                onClick={() => { setSearchMode('category'); setSearchTerm(''); }}
                aria-pressed={searchMode === 'category'}
                className={`px-4 py-1.5 rounded-lg text-xs font-black tracking-wide transition-all ${
                  searchMode === 'category'
                    ? isDarkMode ? 'bg-neutral-700 text-neutral-100 shadow-sm' : 'bg-white text-neutral-900 shadow-xs'
                    : isDarkMode ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Por Categorías
              </button>
            </div>
          )}
        </div>

        <SearchBar
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            lastSearchTypeRef.current = 'text';
            if (val.trim() !== '') setShowAllFaults(false);
          }}
          placeholder={
            isExpert
              ? 'Buscar falla rápido… (código ERR, robot, síntoma)'
              : searchMode === 'quick'
                ? 'Escribe la falla o consejo que buscas… (Ej: brazos, camara, etiquetas, tote)'
                : 'Filtrar fallas o consejos… (Ej: brazos, camara, etiquetas)'
          }
          isDarkMode={isDarkMode}
          inputRef={inputRef}
          resultsId={resultsId}
        />
      </div>

      <div className={`flex-1 overflow-y-auto p-6 flex flex-col justify-between transition-all duration-300 ${
        searchMode === 'quick' && searchTerm.trim() === '' ? 'min-h-[50px] p-0' : 'min-h-[300px]'
      } ${isDarkMode ? 'bg-[#0f1015]' : 'bg-white'}`}>
        
        {/* CASE A: Búsqueda Activa (Tiene texto el input) */}
        {searchTerm.trim() !== '' && (
          <div className="space-y-3">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block mb-2">
              Resultados encontrados ({filteredKnowledge.length})
            </span>
            {filteredKnowledge.length === 0 ? (
              <div className="text-center py-12 text-neutral-400 flex flex-col items-center my-auto">
                <Info className="w-8 h-8 mb-2 opacity-50 text-ultra-orange animate-pulse" />
                <p className="text-xs font-semibold">No se encontraron fallas ni consejos.</p>
              </div>
            ) : (
              <div id={resultsId} className="space-y-3">
                {filteredKnowledge.map((item: any, i: number) => (
                  <FaultCard key={item.id} item={item} index={i} isDarkMode={isDarkMode} onClick={handleOpenModal} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* CASE B: Sin Búsqueda Activa */}
        {searchTerm.trim() === '' && (
          <div className="w-full h-full flex flex-col justify-between flex-1">
            
            {/* Modo B1: Búsqueda Rápida Vacía */}
            {searchMode === 'quick' && (
              <div className="hidden" />
            )}

            {/* Modo B2: Búsqueda por Categoría */}
            {searchMode === 'category' && (
              <div className="w-full h-full flex flex-col flex-1">
                
                {/* Categorías No Seleccionadas */}
                {!selectedCategory ? (
                  <div className="flex flex-col items-center gap-6 w-full py-4 my-auto animate-fadeIn">
                    <div className="text-center space-y-1">
                      <span className="text-[10px] font-bold text-ultra-orange uppercase tracking-widest">Diagnóstico por Módulo</span>
                      <h3 className={`text-xl font-black ${isDarkMode ? 'text-neutral-100' : 'text-neutral-800'}`}>Seleccionar Categoría de Falla</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                      {/* Problemas con el robot */}
                      <div 
                        onClick={() => onCategorySelect('Problemas con el robot')}
                        className={`border rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 hover:border-ultra-orange hover:scale-102 cursor-pointer group shadow-xs ${
                          isDarkMode
                            ? 'bg-[#1a1b24] border-neutral-700 hover:bg-[#1a1b24]/80'
                            : 'bg-neutral-50/50 border-neutral-200 text-neutral-850 hover:bg-white'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-ultra-orange/5 group-hover:text-ultra-orange group-hover:border-ultra-orange/20 transition-all duration-200 ${
                          isDarkMode ? 'bg-neutral-800 text-neutral-400 border-neutral-700' : 'bg-white text-neutral-500 border-neutral-100'
                        }`}>
                          <Settings className="w-6 h-6" />
                        </div>
                        <h4 className={`text-xs font-black tracking-tight group-hover:text-ultra-orange ${isDarkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>Problemas con el robot</h4>
                        <p className={`text-[11px] mt-1.5 leading-relaxed ${isDarkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>Fallas a nivel de hardware que se relacionan con los movimientos del robot.</p>
                      </div>

                      {/* Qué hacer en caso de... */}
                      <div 
                        onClick={() => onCategorySelect('Qué hacer en caso de...')}
                        className="bg-neutral-50/50 border border-neutral-200 text-neutral-850 rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 hover:border-ultra-orange hover:bg-white hover:scale-102 cursor-pointer group shadow-xs"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white text-neutral-500 border border-neutral-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-ultra-orange/5 group-hover:text-ultra-orange group-hover:border-ultra-orange/20 transition-all duration-200">
                          <Wrench className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-black tracking-tight text-neutral-800 group-hover:text-ultra-orange">Qué hacer en caso de...</h4>
                        <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">Aquí se visualiza procesos que no son propios de un workflow pero si son obligatorios en la operatividad.</p>
                      </div>

                      {/* Red / Conectividad */}
                      <div 
                        onClick={() => onCategorySelect('Conectividad')}
                        className="bg-neutral-50/50 border border-neutral-200 text-neutral-850 rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 hover:border-ultra-orange hover:bg-white hover:scale-102 cursor-pointer group shadow-xs"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white text-neutral-500 border border-neutral-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-ultra-orange/5 group-hover:text-ultra-orange group-hover:border-ultra-orange/20 transition-all duration-200">
                          <Server className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-black tracking-tight text-neutral-800 group-hover:text-ultra-orange">Red / Conectividad</h4>
                        <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">Alta latencia, desconexión de ISPs o pérdida de streams de video.</p>
                      </div>

                      {/* Software */}
                      <div 
                        onClick={() => onCategorySelect('Software')}
                        className="bg-neutral-50/50 border border-neutral-200 text-neutral-850 rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 hover:border-ultra-orange hover:bg-white hover:scale-102 cursor-pointer group shadow-xs"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white text-neutral-500 border border-neutral-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-ultra-orange/5 group-hover:text-ultra-orange group-hover:border-ultra-orange/20 transition-all duration-200">
                          <Cpu className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-black tracking-tight text-neutral-800 group-hover:text-ultra-orange">Software</h4>
                        <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">Crash de demonios, procesos bloqueados o estados 'held for dev'.</p>
                      </div>

                      {/* Seguridad */}
                      <div 
                        onClick={() => onCategorySelect('Seguridad')}
                        className="bg-neutral-50/50 border border-neutral-200 text-neutral-850 rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 hover:border-ultra-orange hover:bg-white hover:scale-102 cursor-pointer group lg:col-span-2 shadow-xs"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white text-neutral-500 border border-neutral-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-ultra-orange/5 group-hover:text-ultra-orange group-hover:border-ultra-orange/20 transition-all duration-200">
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-black tracking-tight text-neutral-800 group-hover:text-ultra-orange">Seguridad Física</h4>
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">Incursión de personal, violaciones de perímetro o emergencias E-Stop.</p>
                      </div>

                      {/* Consejos Operativos */}
                      <div 
                        onClick={() => onCategorySelect('Consejos Operativos')}
                        className="bg-amber-50/30 border border-amber-200 text-neutral-850 rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 hover:border-amber-450 hover:bg-white hover:scale-102 cursor-pointer group shadow-xs animate-pulse"
                      >
                        <div className="w-12 h-12 rounded-xl bg-white text-amber-500 border border-amber-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-amber-500/5 group-hover:text-amber-600 group-hover:border-amber-300 transition-all duration-200">
                          <Lightbulb className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-black tracking-tight text-neutral-800 group-hover:text-amber-700">Consejos Operativos</h4>
                        <p className="text-[11px] text-amber-600/80 mt-1.5 leading-relaxed">Recomendaciones y mejores prácticas cargadas en el perfil de robots.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  
                  // Categoría Seleccionada -> Mostrar fallas
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 shadow-xs">
                      <span className="text-[10px] font-mono font-bold text-neutral-500">
                        CATEGORÍA SELECCIONADA: <span className="text-ultra-orange font-sans font-black uppercase tracking-wider">{selectedCategory}</span>
                      </span>
                      <button 
                        onClick={() => onCategorySelect(null)} 
                        className="text-xs font-bold text-neutral-500 hover:text-neutral-800 transition-colors underline decoration-neutral-300"
                      >
                        Volver a Categorías
                      </button>
                    </div>

                    {showAllFaults ? (
                      <div className="space-y-3">
                        {categoryKnowledge.map((item, i) => (
                          <FaultCard key={item.id} item={item} index={i} isDarkMode={isDarkMode} onClick={handleOpenModal} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 my-auto text-neutral-400 flex flex-col items-center">
                        <Layers className="w-8 h-8 mb-2 text-neutral-300 animate-bounce" />
                        <p className="text-xs font-semibold">Pulsa el botón de abajo para ver las fallas de esta categoría.</p>
                      </div>
                    )}

                    {/* Botón Ver todas las fallas en esta categoría */}
                    <div className="pt-4 border-t border-neutral-100 flex justify-center">
                      <button
                        onClick={() => setShowAllFaults(!showAllFaults)}
                        className="text-xs bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-600 font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs"
                      >
                        {showAllFaults ? "Ocultar fallas de esta categoría" : "Ver todas las posibles fallas"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FaultModal — premium accessible modal, integrated feedback screen */}
      {selectedItemForModal && (
        <FaultModal
          item={selectedItemForModal}
          showFeedback={showFeedbackPrompt}
          onClose={handleCloseModalAttempt}
          onForceClose={forceCloseModal}
          onFeedback={handleSaveFeedback}
        />
      )}

    </div>
  );
}
