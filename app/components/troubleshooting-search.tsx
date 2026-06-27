'use client';

import React, { useState, useMemo } from 'react';
import { TroubleshootingKnowledge } from '../../types/troubleshooting.types';
import { CLIENTS_DATABASE } from '../../config/robots-db';
import { Search, Info, X, AlertCircle, Wrench, ShieldAlert, Check, Settings, Server, Cpu, Layers, Lightbulb, Mic, MicOff } from 'lucide-react';
import SpeechAgent from './SpeechAgent';

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
  const lastResultsRef = React.useRef<ExtendedTroubleshootingKnowledge[]>([]);
  const isWaitingForSelectionRef = React.useRef<boolean>(false);
  
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

  // Función para dictar por voz los resultados encontrados y habilitar la selección por voz
  const speakResults = (results: ExtendedTroubleshootingKnowledge[]) => {
    if (typeof window === 'undefined') return;

    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel(); // Cancelar cualquier lectura activa
    if (synth.paused) {
      synth.resume();
    }

    if (results.length === 0) {
      lastResultsRef.current = [];
      isWaitingForSelectionRef.current = false;
      const utter = new SpeechSynthesisUtterance("No se encontraron fallas ni consejos para tu búsqueda.");
      utter.lang = 'es-ES';
      synth.speak(utter);
      return;
    }

    // Almacenar los resultados para la selección por voz
    lastResultsRef.current = results;

    let textToSpeak = `Se encontraron ${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}: `;
    const maxToRead = Math.min(results.length, 3);
    for (let i = 0; i < maxToRead; i++) {
      const cleanSymptom = results[i].symptom
        .replace(/Qué hacer en caso de que/gi, '')
        .replace(/\(ID:.*?\)/gi, '')
        .trim();
      textToSpeak += `${i + 1}: ${cleanSymptom}. `;
    }

    if (results.length > 3) {
      textToSpeak += "Y otros resultados adicionales en pantalla. ";
    }

    textToSpeak += "¿Cuál número de opción deseas seleccionar?";

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'es-ES';
    utterance.rate = 1.05;

    let spoken = false;
    utterance.onstart = () => {
      spoken = true;
    };

    // Al finalizar la lectura, volver a activar el micrófono para esperar la respuesta
    utterance.onend = () => {
      isWaitingForSelectionRef.current = true;
      startListeningAfterSpeech();
    };

    utterance.onerror = (e) => {
      console.warn("SpeechSynthesis error:", e);
      if (!spoken) {
        isWaitingForSelectionRef.current = true;
        startListeningAfterSpeech();
      }
    };

    synth.speak(utterance);

    // Fallback de seguridad de 1.5s para móviles si el navegador bloquea la reproducción de voz
    setTimeout(() => {
      if (!spoken) {
        console.warn("SpeechSynthesis no inició tras 1.5s (bloqueado por navegador). Reactivando micrófono de todos modos.");
        isWaitingForSelectionRef.current = true;
        startListeningAfterSpeech();
      }
    }, 1500);
  };

  // Función interna para arrancar el reconocimiento tras terminar de hablar la IA
  const startListeningAfterSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || isListening) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        handleVoiceInput(transcript, result.isFinal);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error al re-iniciar micrófono para selección:', err);
      setIsListening(false);
    }
  };

  // Manejador centralizado de transcripciones de voz
  const handleVoiceInput = (transcript: string, isFinal: boolean = true) => {
    const normalized = transcript.toLowerCase().trim();

    // Comandos de control para cerrar el modal por voz (ejecutado de inmediato)
    if (normalized.includes('entendido') || normalized.includes('cerrar') || normalized.includes('listo') || normalized.includes('salir') || normalized.includes('regresar') || normalized.includes('atras')) {
      if (recognitionRef.current) recognitionRef.current.stop();
      handleCloseModal();
      return;
    }

    // 1. Si estábamos esperando una selección numérica (ejecutado de inmediato)
    if (isWaitingForSelectionRef.current && lastResultsRef.current.length > 0) {
      let selectedIndex = -1;

      if (normalized.includes('uno') || normalized.includes('1') || normalized.includes('primera') || normalized.includes('primero')) {
        selectedIndex = 0;
      } else if (normalized.includes('dos') || normalized.includes('2') || normalized.includes('segunda') || normalized.includes('segundo')) {
        selectedIndex = 1;
      } else if (normalized.includes('tres') || normalized.includes('3') || normalized.includes('tercera') || normalized.includes('tercero')) {
        selectedIndex = 2;
      }

      if (selectedIndex >= 0 && selectedIndex < lastResultsRef.current.length) {
        // Encontró la opción correspondiente
        const item = lastResultsRef.current[selectedIndex];
        
        // Detener el micrófono inmediatamente para evitar colisiones
        if (recognitionRef.current) recognitionRef.current.stop();

        // Limpiar el estado de selección
        isWaitingForSelectionRef.current = false;

        // Abrir el modal y leer con el prefijo de confirmación
        handleOpenModal(item, `Abriendo la opción ${selectedIndex + 1}. `, true);
        return;
      }
    }

    // 2. Si no es una selección ni comando, y no es el resultado final, actualizamos la búsqueda
    // en pantalla pero no la disparamos para evitar peticiones/voz errática.
    if (!isFinal) {
      setSearchTerm(transcript);
      return;
    }

    setSearchTerm(transcript);
    setShowAllFaults(false);
    isWaitingForSelectionRef.current = false;

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
        const normProtocol = normalizeForSearch(item.resolution_protocol);
        const normId = normalizeForSearch(item.id);

        let score = 0;
        searchWords.forEach((word: string) => {
          let matches = 0;
          if (normSymptom.includes(word)) matches += 10;
          if (normId.includes(word)) matches += 8;
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
      // Desbloquear SpeechSynthesis para navegadores móviles (iOS/Android) bajo el gesto del usuario
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          window.speechSynthesis.getVoices();
          const dummyUtterance = new SpeechSynthesisUtterance(' ');
          dummyUtterance.volume = 0;
          window.speechSynthesis.speak(dummyUtterance);
        } catch (e) {
          console.warn('Error al desbloquear el sintetizador de voz:', e);
        }
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          // Detener lectura de voz activa si inicia un nuevo dictado
          if (window.speechSynthesis) window.speechSynthesis.cancel();
        };

        recognition.onresult = (event: any) => {
          const result = event.results[event.results.length - 1];
          const transcript = result[0].transcript;
          handleVoiceInput(transcript, result.isFinal);
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
      const normProtocol = normalizeForSearch(item.resolution_protocol);
      const normId = normalizeForSearch(item.id);

      let score = 0;
      searchWords.forEach(word => {
        let matches = 0;
        if (normSymptom.includes(word)) matches += 10; // Síntoma tiene máxima prioridad
        if (normId.includes(word)) matches += 8;       // Código de error es muy relevante
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

    utterance.onend = () => {
      // Habilitar la escucha activa por comandos como "cerrar" o "entendido"
      startListeningAfterSpeech();
    };

    utterance.onerror = (e) => {
      console.warn("SpeechSynthesis error in modal:", e);
      if (!spoken) {
        startListeningAfterSpeech();
      }
    };

    synth.speak(utterance);

    // Fallback de 1.5s para móviles
    setTimeout(() => {
      if (!spoken) {
        console.warn("SpeechSynthesis bloqueado en modal. Reactivando micrófono de todos modos.");
        startListeningAfterSpeech();
      }
    }, 1500);
  };

  const handleOpenModal = (item: ExtendedTroubleshootingKnowledge, prefix: string = '', readAloud: boolean = false) => {
    setSelectedItemForModal(item);
    // Leer en voz alta el protocolo y detalle de la falla seleccionada solo si se solicitó explícitamente (micrófono / manos libres)
    if (readAloud) {
      speakItemDetails(item, prefix);
    }
  };

  const handleCloseModal = () => {
    setSelectedItemForModal(null);
    // Detener la lectura de voz inmediatamente si se cierra la ventana
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className={`w-full border rounded-[2.5rem] overflow-hidden shadow-xl flex flex-col h-full font-sans max-h-[85vh] relative animate-fadeIn transition-colors duration-300 ${
      isDarkMode ? 'bg-[#0f1015] border-neutral-800' : 'bg-white border-neutral-200'
    }`}>
      
      {/* Cabecera */}
      <div className={`p-6 border-b flex flex-col gap-4 ${isDarkMode ? 'border-neutral-800 bg-[#1a1b24]/60' : 'border-neutral-100 bg-neutral-50/50'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className={`text-xs font-black tracking-widest flex items-center gap-2 uppercase ${isDarkMode ? 'text-neutral-400' : 'text-neutral-400'}`}>
            <Search className="w-4 h-4 text-ultra-orange" />
            Buscador de Resolución
          </h3>
          
          {/* Selector de Modo de Búsqueda */}
          {!isExpert && (
            <div className={`flex p-1 rounded-xl self-start sm:self-auto ${isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200/60'}`}>
              <button
                type="button"
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
                type="button"
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
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-400" />
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
            className={`w-full border rounded-2xl py-5 pl-14 pr-64 text-base placeholder-neutral-400 focus:outline-none focus:border-ultra-orange focus:ring-1 focus:ring-ultra-orange transition-all shadow-md ${
              isDarkMode
                ? 'bg-[#0f1015] border-neutral-700 text-neutral-100 placeholder-neutral-600'
                : 'bg-white border-neutral-200 text-neutral-800'
            }`}
          />
          <SpeechAgent 
            isDarkMode={isDarkMode}
            onMatchFault={(symptom) => {
              setSearchTerm(symptom);
              const matchedItem = combinedKnowledgeBase.find(item => item.symptom === symptom);
              if (matchedItem) {
                handleOpenModal(matchedItem);
              }
            }}
          />
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 sm:p-6 animate-fadeIn">
          <div className="bg-[#FCFCFC] border border-white/20 rounded-[2rem] sm:rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-[0_16px_64px_rgba(0,0,0,0.15)] ring-1 ring-black/5 relative flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-scaleUp">
            
            {/* Cabezal del Modal */}
            <div className="px-5 py-5 sm:px-8 sm:py-7 border-b border-neutral-100 flex justify-between items-start gap-4 bg-white relative z-10">
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100/80 border border-neutral-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.03)] backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                    <span className="text-[10px] sm:text-[11px] font-mono text-neutral-600 font-bold tracking-widest uppercase">
                      {selectedItemForModal.id}
                    </span>
                  </div>
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-ultra-orange/5 border border-ultra-orange/20 shadow-[0_2px_8px_rgba(255,106,0,0.04)] backdrop-blur-md">
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-ultra-orange font-black">
                      {selectedItemForModal.category}
                    </span>
                  </div>
                </div>
                <h3 className="text-neutral-900 text-xl sm:text-[28px] font-black leading-tight sm:leading-tight tracking-tight">
                  {selectedItemForModal.symptom}
                </h3>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 bg-neutral-50/80 border border-neutral-200/50 rounded-full p-2.5 transition-all duration-300 shrink-0 mt-1"
                aria-label="Cerrar modal"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-5 sm:p-8 overflow-y-auto space-y-6 sm:space-y-8 flex-1 bg-[#FAFAFA]">
              
              {/* Bloque Destacado de Ayuda Visual */}
              {selectedItemForModal.category === "Consejos Operativos" && selectedItemForModal.clientKey && (
                <div className="flex items-center gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-amber-200/60 shadow-[0_2px_12px_rgba(245,158,11,0.06)] relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-400"></div>
                  <div className="relative shrink-0 ml-1">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl border border-amber-100 shadow-sm flex items-center justify-center p-2">
                      <img 
                        src={getClientLogoSrc(selectedItemForModal.clientKey)} 
                        alt="Logo del Cliente" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1 shadow-sm ring-2 ring-white">
                      <Lightbulb className="w-3 h-3 fill-amber-100" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-600/80 uppercase tracking-widest block mb-0.5">Entorno Cliente</span>
                    <h4 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                      {selectedItemForModal.robotName}
                      <span className="text-[9px] bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-amber-200/50">
                        Robot
                      </span>
                    </h4>
                  </div>
                </div>
              )}

              {/* Protocolo de Resolución */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase ml-1 block">Pasos de Resolución</span>
                
                <div className="space-y-3 sm:space-y-4">
                  {selectedItemForModal.resolution_protocol.split('\n').map((stepText, stepIdx) => {
                    if (!stepText.trim()) return null;
                    const match = stepText.match(/^Paso\s+(\d+):\s*(.*)/i);
                    if (match) {
                      const stepNum = match[1];
                      const stepDesc = match[2];
                      return (
                        <div key={stepIdx} className="flex gap-4 items-start bg-white p-4 sm:p-5 rounded-[1.25rem] sm:rounded-2xl border border-neutral-200/60 shadow-[0_4px_16px_rgba(0,0,0,0.03)] relative overflow-hidden">
                          <div className="flex flex-col items-center gap-2 pt-0.5 relative z-10">
                            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FF6A00] text-white shadow-[0_2px_8px_rgba(255,106,0,0.3)] flex items-center justify-center text-[11px] sm:text-xs font-black shrink-0">
                              {stepNum}
                            </span>
                          </div>
                          <p className="text-neutral-700 text-[14px] sm:text-[15px] leading-relaxed font-medium pt-1 relative z-10" dangerouslySetInnerHTML={{ __html: stepDesc }} />
                        </div>
                      );
                    }
                    
                    return (
                      <div key={stepIdx} className="bg-white p-4 sm:p-5 rounded-[1.25rem] sm:rounded-2xl border border-neutral-200/50 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        <p className="text-neutral-600 text-sm sm:text-[15px] leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: stepText }} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Video Demostrativo */}
              {selectedItemForModal.video_url && (
                <div className="space-y-4 pt-2">
                  <span className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase ml-1 block">Video Demostrativo</span>
                  <div className="aspect-video w-full bg-neutral-900 rounded-[1.5rem] overflow-hidden relative shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-neutral-800">
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
              <div className="pt-6 border-t border-neutral-200/60 flex items-center justify-between text-[11px] text-neutral-400">
                <span className="font-mono tracking-wider flex items-center gap-2">
                  REFERENCIA
                  <span className="text-neutral-700 font-bold bg-neutral-100 border border-neutral-200/60 px-2.5 py-1 rounded-md">{selectedItemForModal.sop_reference}</span>
                </span>
              </div>
            </div>

            {/* Pie del Modal */}
            <div className="p-4 sm:p-6 border-t border-neutral-100 bg-white relative z-10 flex justify-end">
              <button 
                onClick={handleCloseModal}
                className="w-full sm:w-auto bg-[#FF6A00] hover:bg-[#e65c00] text-white font-bold text-[14px] uppercase tracking-widest px-8 py-4 sm:py-3.5 rounded-2xl transition-all shadow-[0_4px_16px_rgba(255,106,0,0.25)] flex items-center justify-center gap-2.5"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                Entendido
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
