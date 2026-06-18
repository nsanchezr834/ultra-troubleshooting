import React, { useState, useEffect } from 'react';
import { HelpCircle, Mic, MicOff, Settings, LogOut, Pause, Bell, X, Check } from 'lucide-react';

interface SimulatorModalProps {
    onClose: () => void;
    isExamMode?: boolean;
}

interface SimulationQuestion {
    id: string;
    instruction: string;
    expectedFaultTitle: string;
}

const SIMULATION_QUESTIONS: SimulationQuestion[] = [
    { id: 'sq1', instruction: 'El rollo de bolsas se atascó en el mecanismo de apertura.', expectedFaultTitle: 'Bag Jam' },
    { id: 'sq2', instruction: 'La aplicación en el visor se cerró inesperadamente.', expectedFaultTitle: 'App Not Working' },
    { id: 'sq3', instruction: 'El brazo izquierdo del robot se congeló y no responde.', expectedFaultTitle: 'Left Arm Frozen' },
    { id: 'sq4', instruction: 'El paquete se cayó de la pinza al suelo de la celda.', expectedFaultTitle: 'Package Dropped on Floor' },
    { id: 'sq5', instruction: 'Ya no hay más productos para empacar en la banda.', expectedFaultTitle: 'Out of Product' },
    { id: 'sq6', instruction: 'El robot intentó meter un paquete en un contenedor equivocado.', expectedFaultTitle: 'Package Dropped in Wrong Bin' },
    { id: 'sq7', instruction: 'No hay etiquetas térmicas en la impresora.', expectedFaultTitle: 'Out of Labels' },
    { id: 'sq8', instruction: 'El contenedor de paquetes terminados está lleno a su capacidad máxima.', expectedFaultTitle: 'Package Bin Full' },
    { id: 'sq9', instruction: 'La cámara de la muñeca derecha perdió la señal de video.', expectedFaultTitle: 'Right Wrist Cam Out' },
    { id: 'sq10', instruction: 'Ocurrió un error mecánico desconocido que no aparece en las opciones normales.', expectedFaultTitle: 'Other' },
];

type Screen = 'main' | 'fault-category' | 'fault-bagger' | 'fault-order' | 'fault-product' | 'fault-robot' | 'fault-software' | 'fault-other';

export default function SimulatorModal({ onClose, isExamMode = false }: SimulatorModalProps) {
    const [showDashboard, setShowDashboard] = useState(false);
    const [currentScreen, setCurrentScreen] = useState<Screen>('main');
    const [showFaultDialog, setShowFaultDialog] = useState(false);
    const [infoDialogState, setInfoDialogState] = useState<{ show: boolean, title: string, message: string } | null>(null);
    const [isMicOn, setIsMicOn] = useState(false);

    // Exam States
    const [examQuestionIndex, setExamQuestionIndex] = useState(0);
    const [examScore, setExamScore] = useState(0);
    const [examFinished, setExamFinished] = useState(false);
    const [examFeedback, setExamFeedback] = useState<{ show: boolean, isCorrect: boolean, message: string } | null>(null);

    const setInfoDialog = (data: {show: boolean, title: string, message: string} | null) => {
        if (!data) {
            setInfoDialogState(null);
            return;
        }
        const nonFaultButtons = ['Ayuda / Workflow', 'Configuraciones', 'Salir', 'Home', 'Pause', 'Tele', 'Auto', 'Sleep', 'Microphone On', 'Microphone Off'];
        if (isExamMode && currentScreen.startsWith('fault-') && !nonFaultButtons.includes(data.title)) {
            const currentQ = SIMULATION_QUESTIONS[examQuestionIndex];
            if (currentQ.expectedFaultTitle === data.title) {
                setExamFeedback({ show: true, isCorrect: true, message: `¡Correcto! Identificaste la falla adecuada: ${data.title}` });
                setExamScore(prev => prev + 1);
            } else {
                setExamFeedback({ show: true, isCorrect: false, message: `Incorrecto. Reportaste "${data.title}", pero no es la acción requerida para este escenario.` });
            }
        } else {
            setInfoDialogState(data);
        }
    };

    const handleNextExamQuestion = () => {
        setExamFeedback(null);
        if (examQuestionIndex < SIMULATION_QUESTIONS.length - 1) {
            setExamQuestionIndex(prev => prev + 1);
            setCurrentScreen('main'); // Volver al inicio para la siguiente pregunta
        } else {
            setExamFinished(true);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowDashboard(true);
        }, 3000); // Muestra el logo haciendo pulse durante 3 segundos

        return () => clearTimeout(timer);
    }, []);

    const handleElegirFault = () => {
        setShowFaultDialog(true);
    };

    const handleDialogAccept = () => {
        setShowFaultDialog(false);
        setCurrentScreen('fault-category');
    };

    if (!showDashboard) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="animate-pulse flex flex-col items-center">
                    <img src="/ultra_logo.png" alt="Ultra Logo" className="w-48 h-auto" />
                    <p className="text-white mt-4 text-xl font-bold tracking-widest">Iniciando Simulador...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#2B2D31] rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto overflow-x-hidden shadow-2xl relative flex flex-col">
                {/* Close Button on top right of the modal to exit simulator */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-6 relative flex-1">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-lg">Lab 8</span>
                                <div className="bg-[#1DB954] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">N</div>
                                {isExamMode && <span className="ml-2 bg-[#FF6A00] text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">Modo Examen</span>}
                            </div>
                            <div className="flex gap-4 text-sm text-gray-400 font-medium">
                                <span className="bg-[#383A40] px-3 py-1 rounded-full">Latency: {currentScreen === 'fault-category' || currentScreen === 'fault-bagger' || currentScreen === 'fault-order' || currentScreen === 'fault-product' || currentScreen === 'fault-robot' || currentScreen === 'fault-software' || currentScreen === 'fault-other' ? '--' : '1101927'} ms</span>
                                {currentScreen === 'fault-bagger' && <span className="bg-[#383A40] px-3 py-1 rounded-full">Buffer: 33 ms</span>}
                                {currentScreen === 'fault-order' && <span className="bg-[#383A40] px-3 py-1 rounded-full">Buffer: 25 ms</span>}
                                {currentScreen === 'fault-product' && <span className="bg-[#383A40] px-3 py-1 rounded-full">Buffer: 36 ms</span>}
                                {currentScreen === 'fault-robot' && <span className="bg-[#383A40] px-3 py-1 rounded-full">Buffer: 34 ms</span>}
                                {currentScreen === 'fault-software' && <span className="bg-[#383A40] px-3 py-1 rounded-full">Buffer: 28 ms</span>}
                                {currentScreen === 'fault-other' && <span className="bg-[#383A40] px-3 py-1 rounded-full">Buffer: 20 ms</span>}
                                {(currentScreen !== 'fault-bagger' && currentScreen !== 'fault-order' && currentScreen !== 'fault-product' && currentScreen !== 'fault-robot' && currentScreen !== 'fault-software' && currentScreen !== 'fault-other') && <span className="bg-[#383A40] px-3 py-1 rounded-full">Drops: 0.0%</span>}
                                <span className="bg-[#383A40] px-3 py-1 rounded-full">10:49 AM</span>
                            </div>
                        </div>

                        <div className="text-center flex-1">
                            <h1 className="text-white text-xl font-bold">
                                {currentScreen === 'main' ? 'apile 3 anillos' : (currentScreen === 'fault-bagger' || currentScreen === 'fault-order' || currentScreen === 'fault-product' || currentScreen === 'fault-robot' || currentScreen === 'fault-software' || currentScreen === 'fault-other') ? 'Select a fault' : 'Select a fault category'}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setInfoDialog({
                                    show: true,
                                    title: 'Ayuda / Workflow',
                                    message: 'Este botón sirve para visualizar el flujo del proceso (workflow) y guiarte paso a paso en el entrenamiento.'
                                })}
                                className="bg-[#00A8FC] text-white p-3 rounded-full hover:brightness-110"
                            >
                                <HelpCircle className="w-6 h-6" />
                            </button>
                            <button 
                                onClick={() => {
                                    const nextState = !isMicOn;
                                    setIsMicOn(nextState);
                                    setInfoDialog({
                                        show: true,
                                        title: nextState ? 'Microphone On' : 'Microphone Off',
                                        message: 'Este botón permite encender o apagar tu micrófono. Cuando está encendido (en color verde), puedes comunicarte por voz; cuando está apagado, el micrófono queda silenciado.'
                                    });
                                }}
                                className={isMicOn ? "bg-[#1DB954] text-white p-3 rounded-full hover:brightness-110 transition-colors" : "bg-[#383A40] text-gray-400 border border-gray-600 p-3 rounded-full hover:brightness-110 transition-colors"}
                            >
                                {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                            </button>
                            <button 
                                onClick={() => setInfoDialog({
                                    show: true,
                                    title: 'Configuraciones',
                                    message: 'Este botón abre el panel de configuración del simulador, permitiéndote cambiar la visibilidad del laboratorio en el que estás trabajando.'
                                })}
                                className="bg-[#383A40] text-gray-200 border border-gray-600 p-3 rounded-full hover:brightness-110"
                            >
                                <Settings className="w-6 h-6" />
                            </button>
                            <button 
                                onClick={() => setInfoDialog({
                                    show: true,
                                    title: 'Salir',
                                    message: 'Este botón permite cerrar la sesión del simulador actual y volver a la pantalla principal de entrenamiento.'
                                })}
                                className="bg-[#383A40] text-gray-200 border border-gray-600 p-3 rounded-full hover:brightness-110"
                            >
                                <LogOut className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Top Row Buttons */}
                    <div className="flex gap-2 mb-4">
                        <button 
                            onClick={() => setInfoDialog({
                                show: true,
                                title: 'Home',
                                message: 'El botón Home sirve para colocar al robot en su posición inicial de reposo y calibración.'
                            })}
                            className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl"
                        >
                            Home
                        </button>
                        <button 
                            onClick={() => setInfoDialog({
                                show: true,
                                title: 'Pause',
                                message: 'El botón Pause se utiliza para pausar el movimiento del robot de forma inmediata en la posición exacta en la que se encuentre en ese momento.'
                            })}
                            className={`flex-1 ${currentScreen === 'fault-category' || currentScreen === 'fault-bagger' || currentScreen === 'fault-order' || currentScreen === 'fault-product' || currentScreen === 'fault-robot' || currentScreen === 'fault-software' || currentScreen === 'fault-other' ? 'bg-[#00A8FC] hover:bg-[#29B6F6]' : 'bg-[#9E9E9E] hover:bg-[#BDBDBD]'} text-white font-bold py-4 rounded-xl text-xl`}
                        >
                            Pause
                        </button>
                        <button 
                            onClick={() => setInfoDialog({
                                show: true,
                                title: 'Tele',
                                message: 'El botón Tele indica cuando el robot está siendo controlado por el teleoperador.'
                            })}
                            className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl"
                        >
                            Tele
                        </button>
                        <button 
                            onClick={() => setInfoDialog({
                                show: true,
                                title: 'Auto',
                                message: 'El botón Auto es para cuando el robot está en modo autónomo, ejecutando sus tareas de forma independiente.'
                            })}
                            className={`flex-1 ${currentScreen === 'main' ? 'bg-[#1DB954] hover:bg-[#1ED760]' : 'bg-[#9E9E9E] hover:bg-[#BDBDBD]'} text-white font-bold py-4 rounded-xl text-xl`}
                        >
                            Auto
                        </button>
                        <button 
                            onClick={() => setInfoDialog({
                                show: true,
                                title: 'Sleep',
                                message: 'El botón Sleep coloca al robot en modo de suspensión o reposo de bajo consumo de energía.'
                            })}
                            className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl"
                        >
                            Sleep
                        </button>
                    </div>

                    {isExamMode && !examFinished && (
                        <div className="bg-[#FF6A00]/10 border border-[#FF6A00]/50 rounded-xl p-5 mb-4 shadow-inner">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[#FF6A00] font-black text-sm uppercase tracking-wider">Pregunta {examQuestionIndex + 1} de {SIMULATION_QUESTIONS.length}</span>
                                <span className="text-[#FF6A00] font-bold text-sm">Puntaje: {examScore}</span>
                            </div>
                            <p className="text-white text-lg font-medium leading-relaxed">
                                {SIMULATION_QUESTIONS[examQuestionIndex].instruction}
                            </p>
                        </div>
                    )}

                    {/* Robot Issues Error Box */}
                    <div className="bg-[#4A1D20] rounded-xl p-4 mb-4 border border-[#FF5252]/30">
                        <h3 className="text-white font-bold text-sm mb-1">Robot issues</h3>
                        <p className="text-[#FF5252] text-sm font-mono">• debuggable_chrome: process crashed</p>
                    </div>

                    {currentScreen === 'main' && (
                        <div className="flex gap-2 mt-auto">
                            {/* Bottom Row Buttons */}
                            <button className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-lg">
                                Pause
                                <Pause className="w-12 h-12" fill="currentColor" />
                            </button>
                            <button 
                                onClick={handleElegirFault}
                                className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                <span className="relative">Elegir Fault</span>
                                <Bell className="w-12 h-12 relative animate-bounce" fill="currentColor" />
                            </button>
                            <button className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#FFC107] hover:bg-[#FFD54F] text-white font-bold py-4 rounded-xl text-lg">
                                Marcar como fallido
                                <X className="w-12 h-12 stroke-[3]" />
                            </button>
                            <button className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#00A8FC] hover:bg-[#29B6F6] text-white font-bold py-4 rounded-xl text-lg">
                                Aceptar
                                <Check className="w-12 h-12 stroke-[3]" />
                            </button>
                        </div>
                    )}

                    {currentScreen === 'fault-category' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                <button 
                                    onClick={() => setCurrentScreen('fault-bagger')}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl transition-transform active:scale-95"
                                >
                                    Bagger
                                </button>
                                <button 
                                    onClick={() => setCurrentScreen('fault-order')}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95"
                                >
                                    Order /<br/>Package
                                </button>
                                <button 
                                    onClick={() => setCurrentScreen('fault-product')}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95"
                                >
                                    Product /<br/>Bins
                                </button>
                                <button 
                                    onClick={() => setCurrentScreen('fault-robot')}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl transition-transform active:scale-95"
                                >
                                    Robot
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <button 
                                    onClick={() => setCurrentScreen('fault-software')}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95"
                                >
                                    Headset /<br/>App /<br/>Software
                                </button>
                                <button 
                                    onClick={() => setCurrentScreen('fault-other')}
                                    className="col-span-1 bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl transition-transform active:scale-95"
                                >
                                    Other
                                </button>
                            </div>
                            <button 
                                onClick={() => setCurrentScreen('main')}
                                className="w-full bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl"
                            >
                                Exit
                            </button>

                            <div className="mt-8 text-center bg-[#FFC107]/10 p-4 rounded-xl border border-[#FFC107]/30 backdrop-blur-sm shadow-lg shadow-[#FFC107]/10">
                                <p className="text-[#FFC107] font-black text-lg animate-pulse tracking-wide">
                                    💡 Ve las diferentes opciones, vamos a aprender para qué sirve cada una de ellas.
                                </p>
                            </div>
                        </div>
                    )}

                    {currentScreen === 'fault-bagger' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Out of Bags', message: 'Selecciona esta opción cuando el rollo de bolsas se haya terminado y necesites reemplazarlo para que el robot continúe empaquetando.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg transition-transform active:scale-95"
                                >
                                    Out of Bags
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Out of Labels', message: 'Selecciona esta opción cuando el rollo de etiquetas esté vacío o la impresora presente problemas para imprimir la guía.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95"
                                >
                                    Out of<br/>Labels
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Bag Jam', message: 'Selecciona esta opción cuando una bolsa se haya atascado en el mecanismo de sellado, apertura o alimentación de la Bagger.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg transition-transform active:scale-95"
                                >
                                    Bag Jam
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Other Bagger Issue', message: 'Selecciona esta opción para cualquier otro problema relacionado con la Bagger que no esté categorizado en las opciones anteriores.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95"
                                >
                                    Other<br/>Bagger<br/>Issue
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentScreen('fault-category')}
                                    className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={() => setCurrentScreen('main')}
                                    className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl"
                                >
                                    Exit
                                </button>
                            </div>
                        </div>
                    )}

                    {currentScreen === 'fault-order' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Bad Seal', message: 'Selecciona esta opción si el sellado de la bolsa quedó abierto, quemado, arrugado o de alguna forma defectuoso.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg transition-transform active:scale-95"
                                >
                                    Bad Seal
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Label Won\'t Scan', message: 'Selecciona esta opción si el código de barras o la etiqueta están borrosos, dañados o no son legibles por el escáner.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95"
                                >
                                    Label Won't<br/>Scan
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Package Dropped in Wrong Bin', message: 'Selecciona esta opción si el robot depositó el paquete en un contenedor (bin) equivocado.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95"
                                >
                                    Package<br/>Dropped in<br/>Wrong Bin
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Package Dropped on Floor', message: 'Selecciona esta opción si el paquete se cayó al piso durante el movimiento del brazo robótico.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95"
                                >
                                    Package<br/>Dropped on<br/>Floor
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Other Order Issue', message: 'Selecciona esta opción para reportar cualquier otro problema con el paquete o la orden que no esté en esta lista.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95"
                                >
                                    Other Order<br/>Issue
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentScreen('fault-category')}
                                    className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={() => setCurrentScreen('main')}
                                    className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl"
                                >
                                    Exit
                                </button>
                            </div>
                        </div>
                    )}

                    {currentScreen === 'fault-product' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Out of Product', message: 'Selecciona esta opción cuando no haya más producto disponible para ser escaneado o empacado.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95"
                                >
                                    Out of<br/>Product
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Package Bin Full', message: 'Selecciona esta opción cuando el contenedor de paquetes listos esté lleno y necesite ser vaciado.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95"
                                >
                                    Package Bin<br/>Full
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Hospital Bin Full', message: 'Selecciona esta opción cuando el contenedor de artículos rechazados o con problemas (hospital) esté lleno.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95"
                                >
                                    Hospital Bin<br/>Full
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Bin Location Adjustment Needed', message: 'Selecciona esta opción si el robot no está apuntando correctamente a un contenedor y requiere que se ajuste la ubicación física del mismo.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95"
                                >
                                    Bin Location<br/>Adjustment<br/>Needed
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Product Dropped', message: 'Selecciona esta opción si el robot tiró un producto fuera de su lugar o contenedor correspondiente.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95"
                                >
                                    Product<br/>Dropped
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Other Product Issue', message: 'Selecciona esta opción para reportar cualquier otro problema relacionado con el producto o contenedores que no esté listado.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95"
                                >
                                    Other<br/>Product<br/>Issue
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentScreen('fault-category')}
                                    className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={() => setCurrentScreen('main')}
                                    className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl"
                                >
                                    Exit
                                </button>
                            </div>
                        </div>
                    )}

                    {currentScreen === 'fault-robot' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Left Arm Frozen', message: 'Selecciona esta opción si el brazo izquierdo del robot no responde a los comandos o se quedó congelado en una posición.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95"
                                >
                                    Left Arm<br/>Frozen
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Right Arm Frozen', message: 'Selecciona esta opción si el brazo derecho del robot no responde a los comandos o se quedó congelado en una posición.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95"
                                >
                                    Right Arm<br/>Frozen
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Chest Frozen', message: 'Selecciona esta opción si el torso o el pecho del robot dejaron de moverse.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95"
                                >
                                    Chest<br/>Frozen
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Mailer Folder Frozen', message: 'Selecciona esta opción si el mecanismo de la carpeta de envíos (Mailer Folder) se atascó o no funciona.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95"
                                >
                                    Mailer<br/>Folder<br/>Frozen
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Head Cam Out', message: 'Selecciona esta opción si la cámara de la cabeza perdió conexión o no da video.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95"
                                >
                                    Head Cam<br/>Out
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Left Wrist Cam Out', message: 'Selecciona esta opción si la cámara de la muñeca izquierda perdió conexión.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95"
                                >
                                    Left Wrist<br/>Cam Out
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Right Wrist Cam Out', message: 'Selecciona esta opción si la cámara de la muñeca derecha perdió conexión.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95"
                                >
                                    Right Wrist<br/>Cam Out
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Left Gripper Not Working', message: 'Selecciona esta opción si la pinza izquierda (gripper) no abre, no cierra, o no tiene fuerza de agarre.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95"
                                >
                                    Left Gripper<br/>Not Working
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Right Gripper Not Working', message: 'Selecciona esta opción si la pinza derecha (gripper) no abre, no cierra, o no tiene fuerza de agarre.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95"
                                >
                                    Right<br/>Gripper Not<br/>Working
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Neck Frozen', message: 'Selecciona esta opción si el cuello del robot no puede girar o se atascó.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95"
                                >
                                    Neck Frozen
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Other Robot Issue', message: 'Selecciona esta opción para reportar cualquier otro fallo del hardware del robot que no esté listado.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95"
                                >
                                    Other Robot<br/>Issue
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentScreen('fault-category')}
                                    className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={() => setCurrentScreen('main')}
                                    className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl"
                                >
                                    Exit
                                </button>
                            </div>
                        </div>
                    )}

                    {currentScreen === 'fault-software' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'App Not Working', message: 'Selecciona esta opción si la aplicación en tu casco (headset) o tableta se congeló, se cerró inesperadamente o no responde.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-8 rounded-xl text-2xl leading-tight transition-transform active:scale-95"
                                >
                                    App Not<br/>Working
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Autonomy Not Working', message: 'Selecciona esta opción si el sistema autónomo del robot está fallando y no puede tomar decisiones o moverse por sí solo.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-8 rounded-xl text-2xl leading-tight transition-transform active:scale-95"
                                >
                                    Autonomy<br/>Not Working
                                </button>
                                <button 
                                    onClick={() => setInfoDialog({ show: true, title: 'Other Headset Issue', message: 'Selecciona esta opción para reportar cualquier otro problema técnico con el visor o el software que no esté en la lista.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-8 rounded-xl text-2xl leading-tight transition-transform active:scale-95"
                                >
                                    Other<br/>Headset<br/>Issue
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentScreen('fault-category')}
                                    className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={() => setCurrentScreen('main')}
                                    className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl"
                                >
                                    Exit
                                </button>
                            </div>
                        </div>
                    )}

                    {currentScreen === 'fault-other' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <button 
                                    onClick={() => setInfoDialog({ 
                                        show: true, 
                                        title: 'Other', 
                                        message: 'Selecciona esta opción para reportar cualquier otro problema o falla que no haya sido mencionado en las secciones anteriores de la capacitación.' 
                                    })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl transition-transform active:scale-95"
                                >
                                    Other
                                </button>
                                <div />
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentScreen('fault-category')}
                                    className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={() => setCurrentScreen('main')}
                                    className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl"
                                >
                                    Exit
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Dialogo Informativo de las Opciones */}
                    {infoDialogState?.show && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 rounded-2xl backdrop-blur-md">
                            <div className="bg-white p-8 rounded-3xl max-w-lg text-center shadow-2xl animate-in zoom-in duration-300">
                                <div className="bg-blue-100 text-[#00A8FC] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <HelpCircle className="w-10 h-10 animate-pulse" fill="currentColor" />
                                </div>
                                <h2 className="text-xl font-black text-gray-800 mb-4">{infoDialogState.title}</h2>
                                <p className="text-gray-600 mb-8 text-xl leading-relaxed font-medium">
                                    {infoDialogState.message}
                                </p>
                                <button 
                                    onClick={() => setInfoDialog(null)}
                                    className="w-full bg-[#00A8FC] hover:bg-[#0086C9] text-white font-black py-4 rounded-xl text-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30"
                                >
                                    Entendido
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Feedback del Modo Examen */}
                    {examFeedback?.show && (
                        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 rounded-2xl backdrop-blur-md">
                            <div className="bg-[#2B2D31] border border-gray-700 p-8 rounded-3xl max-w-lg w-full text-center shadow-2xl animate-in zoom-in duration-300">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${examFeedback.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {examFeedback.isCorrect ? <Check className="w-10 h-10" /> : <X className="w-10 h-10" />}
                                </div>
                                <h2 className={`text-2xl font-black mb-4 ${examFeedback.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {examFeedback.isCorrect ? '¡Bien hecho!' : 'Falla Incorrecta'}
                                </h2>
                                <p className="text-gray-300 mb-8 text-lg leading-relaxed font-medium">
                                    {examFeedback.message}
                                </p>
                                <button 
                                    onClick={handleNextExamQuestion}
                                    className="w-full bg-[#FF6A00] hover:bg-[#E65C00] text-white font-black py-4 rounded-xl text-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
                                >
                                    {examQuestionIndex === SIMULATION_QUESTIONS.length - 1 ? 'Ver Resultados' : 'Siguiente Escenario'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Pantalla Final del Examen */}
                    {isExamMode && examFinished && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 rounded-2xl backdrop-blur-lg">
                            <div className="bg-[#2B2D31] border border-[#FF6A00]/30 p-10 rounded-3xl max-w-xl w-full text-center shadow-[0_0_50px_rgba(255,106,0,0.15)] animate-in zoom-in duration-500">
                                <div className="w-24 h-24 rounded-full bg-[#FF6A00]/20 flex items-center justify-center mx-auto mb-6">
                                    <Check className="w-12 h-12 text-[#FF6A00]" />
                                </div>
                                <h2 className="text-3xl font-black text-white mb-2">Simulación Completada</h2>
                                <p className="text-gray-400 mb-8 text-lg">Has finalizado los escenarios interactivos.</p>
                                
                                <div className="bg-black/50 rounded-2xl p-6 mb-8 border border-gray-800">
                                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Puntuación de Precisión</div>
                                    <div className="text-6xl font-black text-[#FF6A00]">{Math.round((examScore / SIMULATION_QUESTIONS.length) * 100)}%</div>
                                    <div className="text-gray-400 mt-2 font-medium">
                                        Identificaste correctamente {examScore} de {SIMULATION_QUESTIONS.length} fallas.
                                    </div>
                                </div>

                                <button 
                                    onClick={onClose}
                                    className="w-full bg-[#FF6A00] hover:bg-[#E65C00] text-white font-black py-4 rounded-xl text-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#FF6A00]/20"
                                >
                                    Cerrar y Volver al Menú
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Dialogo Informativo sobre Elegir Fault */}
                    {showFaultDialog && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 rounded-2xl backdrop-blur-md">
                            <div className="bg-white p-8 rounded-3xl max-w-lg text-center shadow-2xl animate-in zoom-in duration-300">
                                <div className="bg-red-100 text-[#FF3D00] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <Bell className="w-10 h-10 animate-bounce" fill="currentColor" />
                                </div>
                                <h2 className="text-xl font-black text-gray-800 mb-4">Elegir Fault</h2>
                                <p className="text-gray-600 mb-8 text-xl leading-relaxed font-medium">
                                    Ese levantar fault es cuando se tiene algún problema con el robot, automáticamente el robot pasará a pausa.
                                </p>
                                <button 
                                    onClick={handleDialogAccept}
                                    className="w-full bg-[#FF3D00] hover:bg-[#E63900] text-white font-black py-4 rounded-xl text-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30"
                                >
                                    ¡Entendido!
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
