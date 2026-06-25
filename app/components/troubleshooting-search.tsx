'use client';

import React, { useState, useMemo } from 'react';
import { TroubleshootingKnowledge } from '../../types/troubleshooting.types';
import { CLIENTS_DATABASE } from '../../config/robots-db';
import { Search, Info, X, AlertCircle, Wrench, ShieldAlert, Check, Settings, Server, Cpu, Layers, Lightbulb, Mic, MicOff } from 'lucide-react';

interface ExtendedTroubleshootingKnowledge extends TroubleshootingKnowledge {
  clientKey?: string;
  robotName?: string;
}

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
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllFaults, setShowAllFaults] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState<ExtendedTroubleshootingKnowledge | null>(null);

  // Estados y refs para control por voz
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = React.useRef<any>(null);
  
  // En Modo Experto arrancamos directo en búsqueda rápida
  const [searchMode, setSearchMode] = useState<'quick' | 'category'>(isExpert ? 'quick' : 'quick');

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

  // Estados para panel de especificidad (ERR-MEC-014)
  const [isSpecificOpen, setIsSpecificOpen] = useState(false);
  const [selectedError, setSelectedError] = useState('');
  const [selectedRobot, setSelectedRobot] = useState('');

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
            advices.push({
              id: advice.id,
              category: "Consejos Operativos",
              symptom: `Consejo Operativo: ${advice.content.substring(0, 80)}${advice.content.length > 80 ? '...' : ''}`,
              root_cause: `Recomendación operativa configurada para la unidad ${robot.name} del cliente ${client.name}.`,
              severity: "LOW",
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

  // Función para dictar por voz los resultados encontrados
  const speakResults = (results: ExtendedTroubleshootingKnowledge[]) => {
    if (typeof window === 'undefined') return;

    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel(); // Cancelar cualquier lectura activa

    if (results.length === 0) {
      const utter = new SpeechSynthesisUtterance("No se encontraron fallas ni consejos para tu búsqueda.");
      utter.lang = 'es-ES';
      synth.speak(utter);
      return;
    }

    let textToSpeak = `Se encontraron ${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}: `;
    const maxToRead = Math.min(results.length, 3);
    for (let i = 0; i < maxToRead; i++) {
      const cleanSymptom = results[i].symptom
        .replace(/Qué hacer en caso de que/gi, '')
        .replace(/\(ID:.*?\)/gi, '')
        .trim();
      textToSpeak += `${i + 1}, ${cleanSymptom}. `;
    }

    if (results.length > 3) {
      textToSpeak += "Y otros resultados adicionales en pantalla.";
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    synth.speak(utterance);
  };

  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('El reconocimiento de voz no está soportado en este navegador o dispositivo. Te recomendamos usar Google Chrome, Microsoft Edge o Safari actualizados.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          // Detener lectura de voz activa si inicia un nuevo dictado
          if (window.speechSynthesis) window.speechSynthesis.cancel();
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setSearchTerm(transcript);
          setShowAllFaults(false);

          // Calcular resultados inmediatamente para poder leerlos por voz
          const stopWords = new Set([
            'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 
            'de', 'del', 'en', 'para', 'con', 'por', 'que', 'y', 'o', 'a',
            'falla', 'fallas', 'error', 'errores', 'problema', 'problemas', 'fe'
          ]);

          const searchWords = transcript
            .trim()
            .split(/\s+/)
            .map((w: string) => normalizeForSearch(w))
            .filter((w: string) => w && !stopWords.has(w));

          if (searchWords.length > 0) {
            const scoredItems = combinedKnowledgeBase.map(item => {
              const normSymptom = normalizeForSearch(item.symptom);
              const normRootCause = normalizeForSearch(item.root_cause);
              const normProtocol = normalizeForSearch(item.resolution_protocol);
              const normId = normalizeForSearch(item.id);

              let score = 0;
              searchWords.forEach((word: string) => {
                let matches = 0;
                if (normSymptom.includes(word)) matches += 10;
                if (normId.includes(word)) matches += 8;
                if (normRootCause.includes(word)) matches += 3;
                if (normProtocol.includes(word)) matches += 1;

                score += matches;
              });

              return { item, score };
            });

            const results = scoredItems
              .filter(x => x.score > 0)
              .sort((a, b) => b.score - a.score)
              .map(x => x.item);

            speakResults(results);
          } else {
            speakResults([]);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Error en reconocimiento de voz:', event.error);
          setIsListening(false);
          
          if (event.error === 'not-allowed') {
            alert('Acceso al micrófono denegado. Por favor, ve a la configuración de tu navegador y permite el uso del micrófono para este sitio web.');
          } else if (event.error === 'no-speech') {
            alert('No se detectó ninguna voz. Por favor, intenta hablar de nuevo.');
          } else if (event.error === 'network') {
            alert('Error de red al intentar conectar con el servicio de reconocimiento de voz.');
          } else {
            alert(`Error en el micrófono: ${event.error}`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.error('Error inicializando SpeechRecognition:', err);
        setIsListening(false);
        alert(`No se pudo iniciar el dictado por voz: ${err?.message || err}`);
      }
    }
  };

  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Búsqueda global
  const filteredKnowledge = useMemo(() => {
    // Lista de palabras vacías (stop words) en español y términos genéricos de voz a omitir
    const stopWords = new Set([
      'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 
      'de', 'del', 'en', 'para', 'con', 'por', 'que', 'y', 'o', 'a',
      'falla', 'fallas', 'error', 'errores', 'problema', 'problemas', 'fe'
    ]);

    const searchWords = searchTerm
      .trim()
      .split(/\s+/)
      .map(w => normalizeForSearch(w))
      .filter(w => w && !stopWords.has(w));

    if (searchWords.length === 0) return [];

    // Calcular relevancia por coincidencia de palabras clave
    const scoredItems = combinedKnowledgeBase.map(item => {
      const normSymptom = normalizeForSearch(item.symptom);
      const normRootCause = normalizeForSearch(item.root_cause);
      const normProtocol = normalizeForSearch(item.resolution_protocol);
      const normId = normalizeForSearch(item.id);

      let score = 0;
      searchWords.forEach(word => {
        let matches = 0;
        if (normSymptom.includes(word)) matches += 10; // Síntoma tiene máxima prioridad
        if (normId.includes(word)) matches += 8;       // Código de error es muy relevante
        if (normRootCause.includes(word)) matches += 3;
        if (normProtocol.includes(word)) matches += 1;

        score += matches;
      });

      return { item, score };
    });

    // Filtrar los que tengan al menos una coincidencia y ordenar de mayor a menor relevancia
    return scoredItems
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.item);
  }, [combinedKnowledgeBase, searchTerm]);

  // Fallas de la categoría seleccionada
  const categoryKnowledge = useMemo(() => {
    if (!selectedCategory) return [];
    return combinedKnowledgeBase.filter(item => item.category === selectedCategory);
  }, [combinedKnowledgeBase, selectedCategory]);

  const getSpecificInstruction = () => {
    if (!selectedError || !selectedRobot) {
      return "Por favor, selecciona tanto el tipo de error como el robot afectado para generar las instrucciones específicas.";
    }

    let baseText = "";
    if (selectedError === "jam") {
      baseText = `Abrir la cubierta de la impresora del robot ${selectedRobot}, retirar con sumo cuidado la etiqueta atorada en el rodillo alimentador asegurando no rayar el cabezal térmico. Alinear nuevamente el rollo y presionar el botón FEED para calibrar.`;
    } else if (selectedError === "empty") {
      baseText = `Colocar un rollo nuevo de etiquetas térmicas de 4x6 en la impresora de ${selectedRobot}. Asegurar que el papel pase por debajo de las guías verdes de alineación. Cerrar la tapa firmemente y presionar FEED para auto-ajustar.`;
    } else if (selectedError === "power") {
      baseText = `Verificar físicamente el cable de alimentación AC y el cable USB de la impresora térmica ubicados detrás de la celda de ${selectedRobot}. Asegurar que el interruptor de encendido esté en la posición 'I'. Si la pantalla integrada sigue apagada, reportar hardware defectuoso.`;
    }

    return `${baseText} Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación y se reiniciará el módulo reportado. Posteriormente, debe pasarse a posición de HOME e iniciar nuevamente la operación. Si el robot no se recupera tras esto, se enviará de forma automática un mensaje en el canal de Slack notificando que sigue en espera de intervención.`;
  };

  const handleOpenModal = (item: ExtendedTroubleshootingKnowledge) => {
    setSelectedItemForModal(item);
    setIsSpecificOpen(false);
    setSelectedError('');
    setSelectedRobot('');
  };

  const handleCloseModal = () => {
    setSelectedItemForModal(null);
  };

  return (
    <div className={`w-full border rounded-[2.5rem] overflow-hidden shadow-xl flex flex-col h-full font-sans max-h-[85vh] relative animate-fadeIn transition-colors duration-300 ${
      isDarkMode ? 'bg-[#0f1015] border-neutral-800' : 'bg-white border-neutral-200'
    }`}>
      
      {/* Cabecera */}
      <div className={`p-6 border-b ${isDarkMode ? 'border-neutral-800 bg-[#1a1b24]/60' : 'border-neutral-100 bg-neutral-50/50'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className={`text-xs font-black tracking-widest flex items-center gap-2 uppercase ${isDarkMode ? 'text-neutral-400' : 'text-neutral-400'}`}>
            <Search className="w-4 h-4 text-ultra-orange" />
            Buscador de Resolución
          </h3>
          
          {/* Selector de Modo de Búsqueda */}
          {/* Selector de Modo de Búsqueda — oculto en Modo Experto */}
          {!isExpert && (
          <div className={`flex p-1 rounded-xl self-start sm:self-auto ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200/60'}`}>
            <button
              onClick={() => {
                setSearchMode('quick');
                onCategorySelect(null);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-black tracking-wide transition-all ${
                searchMode === 'quick' 
                  ? isDarkMode ? 'bg-neutral-700 text-neutral-100 shadow-sm' : 'bg-white text-neutral-900 shadow-xs'
                  : isDarkMode ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Búsqueda Rápida
            </button>
            <button
              onClick={() => {
                setSearchMode('category');
                setSearchTerm('');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-black tracking-wide transition-all ${
                searchMode === 'category' 
                  ? isDarkMode ? 'bg-neutral-700 text-neutral-100 shadow-sm' : 'bg-white text-neutral-900 shadow-xs'
                  : isDarkMode ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Buscar por Categorías
            </button>
          </div>
          )}
        </div>
        
        {/* Input de búsqueda */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder={
              isExpert
                ? "Buscar falla rápido... (código ERR, robot, síntoma)"
                : searchMode === 'quick' 
                  ? "Escribe la falla o consejo que buscas... (Ej: brazos, camara, etiquetas, tote)"
                  : "Filtrar fallas o consejos... (Ej: brazos, camara, etiquetas)"
            }
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value.trim() !== '') {
                setShowAllFaults(false); 
              }
            }}
            className={`w-full border rounded-2xl py-3.5 pl-12 pr-12 text-sm placeholder-neutral-400 focus:outline-none focus:border-ultra-orange focus:ring-1 focus:ring-ultra-orange transition-all shadow-xs ${
              isDarkMode
                ? 'bg-[#0f1015] border-neutral-700 text-neutral-100 placeholder-neutral-600'
                : 'bg-white border-neutral-200 text-neutral-800'
            }`}
          />
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? "Detener dictado por voz" : "Dictar falla por voz"}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all active:scale-95 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : isDarkMode
                  ? 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                  : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Contenedor de Resultados */}
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
              filteredKnowledge.map((item) => {
                const isAdvice = item.category === "Consejos Operativos";
                return (
                  <button
                    key={item.id}
                    onClick={() => handleOpenModal(item)}
                    className={`w-full text-left border rounded-2xl p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs ${
                      isAdvice 
                        ? 'bg-amber-50/25 border-amber-200 hover:border-amber-400 hover:bg-amber-50/50' 
                        : 'bg-neutral-50/50 border-neutral-200/60 hover:border-ultra-orange hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex flex-col gap-1 pr-4 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-mono font-bold uppercase ${isAdvice ? 'text-amber-600' : 'text-neutral-400'}`}>
                          {item.id}
                        </span>
                        {isAdvice && <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-100" />}
                      </div>
                      <h4 className="text-neutral-800 text-sm font-bold leading-snug group-hover:text-neutral-900 transition-colors mt-0.5 font-sans">
                        {item.symptom}
                      </h4>
                    </div>

                    {/* Ayuda Visual Destacada: Logo de cliente y Nombre de Robot */}
                    {isAdvice && item.clientKey && (
                      <div className="flex items-center gap-2.5 bg-white border border-amber-200 px-3 py-1.5 rounded-xl shadow-2xs self-start sm:self-auto min-w-[150px]">
                        <img 
                          src={getClientLogoSrc(item.clientKey)} 
                          alt="Logo Cliente" 
                          className="w-6 h-6 object-contain bg-neutral-50 p-0.5 rounded-lg border border-neutral-150 shrink-0" 
                        />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-0.5">Robot</span>
                          <span className="text-xs font-black text-neutral-800 uppercase tracking-tight leading-none">{item.robotName}</span>
                        </div>
                      </div>
                    )}

                    <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border shrink-0 self-start sm:self-auto ${
                      isAdvice 
                        ? 'text-amber-600 bg-amber-50 border-amber-200/40' 
                        : 'text-ultra-orange bg-ultra-orange/5 border-ultra-orange/10'
                    }`}>
                      {item.category}
                    </span>
                  </button>
                );
              })
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
                      <div className="space-y-3 animate-fadeIn">
                        {categoryKnowledge.map((item) => {
                          const isAdvice = item.category === "Consejos Operativos";
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleOpenModal(item)}
                              className={`w-full text-left border rounded-2xl p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs ${
                                isAdvice 
                                  ? 'bg-amber-50/25 border-amber-200 hover:border-amber-400 hover:bg-amber-50/50' 
                                  : 'bg-neutral-50/50 border-neutral-200/60 hover:border-ultra-orange hover:bg-neutral-50'
                              }`}
                            >
                              <div className="flex flex-col gap-1 pr-4 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[10px] font-mono font-bold uppercase ${isAdvice ? 'text-amber-600' : 'text-neutral-400'}`}>
                                    {item.id}
                                  </span>
                                  {isAdvice && <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-100" />}
                                </div>
                                <h4 className="text-neutral-800 text-sm font-bold leading-snug group-hover:text-neutral-900 transition-colors mt-0.5 font-sans">
                                  {item.symptom}
                                </h4>
                              </div>

                              {/* Ayuda Visual Destacada: Logo de cliente y Nombre de Robot */}
                              {isAdvice && item.clientKey && (
                                <div className="flex items-center gap-2.5 bg-white border border-amber-200 px-3 py-1.5 rounded-xl shadow-2xs self-start sm:self-auto min-w-[150px]">
                                  <img 
                                    src={getClientLogoSrc(item.clientKey)} 
                                    alt="Logo Cliente" 
                                    className="w-6 h-6 object-contain bg-neutral-50 p-0.5 rounded-lg border border-neutral-150 shrink-0" 
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-0.5">Robot</span>
                                    <span className="text-xs font-black text-neutral-800 uppercase tracking-tight leading-none">{item.robotName}</span>
                                  </div>
                                </div>
                              )}

                              <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border shrink-0 self-start sm:self-auto ${
                                isAdvice 
                                  ? 'text-amber-600 bg-amber-50 border-amber-200/40' 
                                  : 'text-ultra-orange bg-ultra-orange/5 border-ultra-orange/10'
                              }`}>
                                {item.category}
                              </span>
                            </button>
                          );
                        })}
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

      {/* =====================================================================
          VENTANA EMERGENTE (MODAL DE SOLUCIÓN COMPLETA - TEMA CLARO PREMIUM)
          ===================================================================== */}
      {selectedItemForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border border-neutral-200 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] animate-scaleUp">
            
            {/* Cabezal del Modal */}
            <div className="p-6 border-b border-neutral-150 flex justify-between items-start gap-4 bg-neutral-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-neutral-500 bg-neutral-200/80 px-2 py-1 rounded border border-neutral-300 font-bold">
                    {selectedItemForModal.id}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-ultra-orange font-black px-2.5 py-0.5 bg-ultra-orange/5 rounded-full border border-ultra-orange/15">
                    {selectedItemForModal.category}
                  </span>
                </div>
                <h3 className="text-neutral-900 text-lg font-black leading-snug">
                  {selectedItemForModal.symptom}
                </h3>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-neutral-400 hover:text-neutral-700 bg-neutral-200/60 rounded-full p-2 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-white">
              
              {/* Bloque Destacado de Ayuda Visual (Logo + Robot) para Consejos Operativos */}
              {selectedItemForModal.category === "Consejos Operativos" && selectedItemForModal.clientKey && (
                <div className="flex items-center gap-4 p-5 bg-amber-50/50 rounded-3xl border border-amber-200 shadow-xs animate-fadeIn">
                  <div className="relative shrink-0">
                    <img 
                      src={getClientLogoSrc(selectedItemForModal.clientKey)} 
                      alt="Logo del Cliente" 
                      className="w-14 h-14 object-contain p-2 bg-white rounded-2xl border border-amber-200 shadow-xs" 
                    />
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1 border border-white">
                      <Lightbulb className="w-3 h-3 fill-amber-100 text-white" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-black text-amber-600 block uppercase tracking-widest mb-0.5">Cliente: {selectedItemForModal.clientKey.toUpperCase()}</span>
                    <h4 className="text-xl font-black text-neutral-900 tracking-tight leading-none flex items-center gap-2">
                      {selectedItemForModal.robotName}
                      <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase border border-amber-200/50">
                        Robot
                      </span>
                    </h4>
                  </div>
                </div>
              )}

              {/* Causa Raíz */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-neutral-400 font-bold tracking-widest uppercase">Causa Raíz / Contexto</span>
                <p className="text-neutral-600 text-sm leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                  {selectedItemForModal.root_cause}
                </p>
              </div>

              {/* Protocolo de Resolución */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-neutral-400 font-bold tracking-widest uppercase block">Guía de Resolución Estándar</span>
                <div className="bg-neutral-50/50 p-5 rounded-3xl border border-neutral-200/80 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF6A00]"></div>
                  <div className="space-y-3 pl-3">
                    {selectedItemForModal.resolution_protocol.split('\n').map((stepText, stepIdx) => {
                      const match = stepText.match(/^Paso\s+(\d+):\s*(.*)/i);
                      if (match) {
                        const stepNum = match[1];
                        const stepDesc = match[2];
                        return (
                          <div key={stepIdx} className="flex gap-3 items-start bg-white p-3.5 rounded-2xl border border-neutral-150 shadow-2xs hover:border-[#FF6A00]/30 transition-all duration-200">
                            <span className="w-6 h-6 rounded-full bg-[#FF6A00] text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-sm shadow-orange-500/20">
                              {stepNum}
                            </span>
                            <p className="text-neutral-700 text-sm leading-relaxed font-semibold pt-0.5">
                              {stepDesc}
                            </p>
                          </div>
                        );
                      }
                      
                      return (
                        <p key={stepIdx} className="text-neutral-850 text-sm leading-relaxed font-semibold">
                          {stepText}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Panel de "Ser más específicos" (Solo para ERR-MEC-014) */}
              {selectedItemForModal.id === "ERR-MEC-014" && (
                <div className="pt-3 border-t border-neutral-200">
                  <button 
                    onClick={() => setIsSpecificOpen(!isSpecificOpen)}
                    className="text-xs bg-ultra-orange/10 border border-ultra-orange/25 text-ultra-orange font-black px-4 py-2 rounded-xl hover:bg-ultra-orange hover:text-white transition-colors uppercase tracking-wider block"
                  >
                    {isSpecificOpen ? "Ocultar panel específico" : "Ser más específicos"}
                  </button>

                  {isSpecificOpen && (
                    <div className="mt-4 p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4 animate-scaleUp">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold font-mono">Seleccionar Error Específico</label>
                          <select 
                            value={selectedError} 
                            onChange={(e) => setSelectedError(e.target.value)}
                            className="bg-white border border-neutral-200 rounded-lg px-3 py-2.5 text-xs text-neutral-700 focus:outline-none focus:border-ultra-orange"
                          >
                            <option value="">-- Seleccionar tipo de fallo --</option>
                            <option value="jam">Atasco de papel / Jam de etiqueta</option>
                            <option value="empty">Rollo vacío / Sin papel</option>
                            <option value="power">Impresora desconectada / Sin corriente</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold font-mono">Seleccionar Robot Específico</label>
                          <select 
                            value={selectedRobot} 
                            onChange={(e) => setSelectedRobot(e.target.value)}
                            className="bg-white border border-neutral-200 rounded-lg px-3 py-2.5 text-xs text-neutral-700 focus:outline-none focus:border-ultra-orange"
                          >
                            <option value="">-- Seleccionar robot --</option>
                            <option value="Packie 2.0">Packie 2.0</option>
                            <option value="Future 2.0">Future 2.0</option>
                            <option value="Fleetwood Pack">Fleetwood Pack</option>
                            <option value="Phil">Phil</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-2 p-4 bg-white border border-neutral-200 rounded-xl relative overflow-hidden shadow-2xs">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                        <span className="text-[9px] uppercase tracking-widest text-emerald-500 font-black font-mono block mb-1">PROTOCOLO PERSONALIZADO</span>
                        <p className="text-neutral-800 text-xs leading-relaxed font-semibold">
                          {getSpecificInstruction()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Video Demostrativo */}
              {selectedItemForModal.video_url && (
                <div className="space-y-2 mt-3">
                  <span className="text-[10px] font-mono text-neutral-400 font-bold tracking-widest uppercase block">Video Demostrativo</span>
                  <div className="aspect-video w-full bg-neutral-950 rounded-2xl overflow-hidden relative border border-neutral-200">
                    <video
                      src={encodeURI(decodeURI(selectedItemForModal.video_url))}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Referencia SOP */}
              <div className="pt-2 flex items-center justify-between text-xs text-neutral-400">
                <span className="font-mono">
                  REF: <span className="text-neutral-550 font-bold">{selectedItemForModal.sop_reference}</span>
                </span>
              </div>
            </div>

            {/* Pie del Modal */}
            <div className="p-5 border-t border-neutral-150 bg-neutral-50/50 flex justify-end">
              <button 
                onClick={handleCloseModal}
                className="bg-ultra-orange hover:bg-ultra-orange/90 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Entendido
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
