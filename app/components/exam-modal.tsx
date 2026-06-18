import React, { useState, useRef } from 'react';
import { X, ChevronRight, CheckCircle2, AlertCircle, Download, User } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Question {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

const EXAM_QUESTIONS: Question[] = [
    {
        id: 'q1',
        question: 'Observas que el brazo del robot se detiene a la mitad del recorrido (Arm Frozen). ¿Cuál es el primer paso a realizar en los headsets?',
        options: [
            'Mandar el comando Home inmediatamente',
            'Enviar el comando Fault (arm frozen)',
            'Apagar la estación desde el botón de emergencia',
            'Esperar 5 minutos a que se reinicie solo'
        ],
        correctIndex: 1,
        explanation: 'Siempre se debe registrar la falla con el comando Fault antes de intentar mover el robot, para que quede registro y se evalúe si es seguro moverlo.'
    },
    {
        id: 'q2',
        question: 'En la Bagger, una bolsa queda fuera de posición. ¿Qué deberias de hacer ?',
        options: [
            'Retirar la bolsa, colocarla en la bin que esta en la parte superior  y mandar el reprint label para que genere una nueva reimpresion de el pedido en ese momento no terminado',
            'Cancelar el pedido y esperar instrucciones',
            'Detener el proceso en donde este, mandar el robot a posicion de HOME',
            'Nada, continuar con el pedido'
        ],
        correctIndex: 0,
        explanation: 'Se debe de retirar la bolsa y colocar en la bin superior, mandar el reprint label que es el boton amarillo en la UI y continuar con el pedido, esto es por que si esta fuera de posicion, no va a cerrar bien la bolsa,'
    },
    {
        id: 'q3',
        question: 'Durante un ciclo en Tote, recibes el error de "Producto no escaneado". ¿Qué debes hacer con el producto?',
        options: [
            'Tirarlo a la basura',
            'Empacarlo de todos modos',
            'Apartar el producto y regresarlo al rack para revisión del cliente',
            'Forzar el escáner y continuar'
        ],
        correctIndex: 2,
        explanation: 'El producto debe apartarse para revisión posterior; el operador no debe tomar la decisión final.'
    },
    {
        id: 'q4',
        question: 'En el robot Phil, si una orden contiene 6 productos, ¿qué tamaño de bolsa debes utilizar para el empaque?',
        options: [
            'La bolsa más chica',
            'La bolsa mediana estándar',
            'Una caja compacta',
            'No se requiere bolsa, se colocan sueltos'
        ],
        correctIndex: 2,
        explanation: 'De acuerdo con el consejo de operación del robot Phil, cuando sean más de 5 productos se tiene que ocupar la bolsa más grande, de lo contrario se ocupará la bolsa más chica.'
    },
    {
        id: 'q5',
        question: 'Si tienes un problem con la orden en el robot Phil (por ejemplo, no se imprime la etiqueta y continúa solicitando otro producto), ¿cuál es el procedimiento correcto?',
        options: [
            'Dejar el tote abajo en el rack y esperar a que el robot se autocorrige',
            'Ingresar todo al mismo tote, dejarlo arriba en el rack, levantar un pick fault, seleccionar order package y presionar "FAIL JOB"',
            'Retirar los productos del tote y colocarlos de nuevo en el rack principal',
            'Apagar la estación inmediatamente para detener el flujo'
        ],
        correctIndex: 1,
        explanation: 'Ante problemas con la orden en el robot Phil, se debe ingresar todo al mismo tote y dejarlo en la parte de hasta arriba del rack. Luego, se levanta un pick fault, seleccionas order package y después presionas "FAIL JOB".'
    },
    {
        id: 'q6',
        question: 'En las estaciones de Packie y Future, si la Bagger arroja la bolsa sin abrir por causa del aire con los grippers cerrados, ¿qué acción correctiva debes tomar?',
        options: [
            'Volver a reiniciar la estación robótica',
            'Realizar un movimiento vertical de arriba a abajo con la bolsa para forzar que entre el aire en la posición correcta',
            'Soplar manualmente dentro del área de la Bagger',
            'Marcar la bolsa como defectuosa en el sistema y desecharla'
        ],
        correctIndex: 1,
        explanation: 'De acuerdo con las pautas de operación, realizar un movimiento vertical de arriba a abajo obliga a que entre el aire en la posición correcta para que la bolsa se abra y continúe el ciclo.'
    },
    {
        id: 'q7',
        question: 'Al empacar productos grandes y pesados en Packie y Future, ¿cómo se debe colocar la pinza para facilitar el cierre?',
        options: [
            'Colocar la pinza a un costado del empaque',
            'No utilizar la pinza y empujar el paquete manualmente',
            'Colocar la pinza debajo de la bolsa para ayudar a sostener el peso',
            'Colocar la pinza en la parte superior para suspender la bolsa'
        ],
        correctIndex: 2,
        explanation: 'Para objetos de gran tamaño y pesados, colocar la pinza debajo de la bolsa ayuda con el peso del paquete y facilita que la máquina realice el cierre/sello correctamente.'
    },
    {
        id: 'q8',
        question: '¿Qué debes hacer si el robot se detiene porque la Bagger se quedó sin bolsas (Out of Bags)?',
        options: [
            'Apagar la máquina y reportar mantenimiento de inmediato',
            'Detener el robot, mandar la fault de out of bags para que un Fiel Agent pueda resolver el problema.',
            'Forzar el reinicio del brazo robótico sin cambiar nada',
            'Cambiar a operación manual y empacar sin bolsas'
        ],
        correctIndex: 1,
        explanation: 'La opción "Out of Bags" indica que el rollo de bolsas se ha terminado y se requiere reemplazarlo por uno nuevo para que el ciclo continúe.'
    },
    {
        id: 'q9',
        question: '¿Cuándo se debe seleccionar la opción "Out of Labels" en la Bagger?',
        options: [
            'Cuando la impresora no tiene papel térmico o la etiqueta presenta problemas de impresión',
            'Cuando no hay productos en la banda transportadora',
            'Cuando el brazo robótico no puede succionar las bolsas',
            'Cuando la Bagger se sobrecalienta'
        ],
        correctIndex: 0,
        explanation: '"Out of Labels" se utiliza cuando el rollo de etiquetas está vacío o la impresora presenta fallas para imprimir la guía de envío.'
    },
    {
        id: 'q10',
        question: 'Si una bolsa se atasca en el mecanismo de sellado o apertura de la Bagger, ¿qué reporte debes levantar?',
        options: [
            'Out of Bags',
            'Bad Seal',
            'Bag Jam',
            'Other Robot Issue'
        ],
        correctIndex: 2,
        explanation: '"Bag Jam" es la opción específica para cuando una bolsa queda atascada en cualquier parte del mecanismo de la Bagger.'
    },
    {
        id: 'q11',
        question: 'Si detectas que la bolsa de un paquete quedó arrugada, quemada o mal cerrada en los extremos, ¿qué fallo reportarías?',
        options: [
            'Bad Seal',
            'Bag Jam',
            'Out of Bags',
            'Product Dropped'
        ],
        correctIndex: 0,
        explanation: '"Bad Seal" es el fallo que indica que el sellado de la bolsa quedó abierto, quemado, arrugado o defectuoso de alguna forma.'
    },
    {
        id: 'q12',
        question: 'El robot coloca el paquete terminado en un contenedor (bin) que no corresponde a la ruta de envío. ¿Qué reporte se debe seleccionar?',
        options: [
            'Product Dropped',
            'Package Dropped on Floor',
            'Package Dropped in Wrong Bin',
            'Bin Location Adjustment Needed'
        ],
        correctIndex: 2,
        explanation: '"Package Dropped in Wrong Bin" se selecciona cuando el brazo robótico deposita el paquete final en un contenedor equivocado.'
    },
    {
        id: 'q13',
        question: 'El robot coloca el paquete terminado en un contenedor (bin) que no corresponde a la ruta de envío. ¿Qué reporte se debe seleccionar?',
        options: [
            'Product Dropped',
            'Package Dropped on Floor',
            'Package Dropped in Wrong Bin',
            'Bin Location Adjustment Needed'
        ],
        correctIndex: 2,
        explanation: '"Package Dropped in Wrong Bin" se selecciona cuando el brazo robótico deposita el paquete final en un contenedor equivocado.'
    },
    {
        id: 'q14',
        question: '¿Cuándo es correcto seleccionar la opción "Out of Product"?',
        options: [
            'Cuando el rack de bolsas está vacío',
            'Cuando ya no hay más artículos disponibles en la zona de alimentación para ser escaneados o empacados',
            'Cuando el robot tira un producto al suelo',
            'Cuando la cámara de la cabeza falla'
        ],
        correctIndex: 1,
        explanation: '"Out of Product" se reporta cuando la estación se queda sin artículos físicos disponibles para continuar el flujo de empaque.'
    },
    {
        id: 'q15',
        question: 'Si el contenedor de paquetes terminados listos para envío se llena por completo, ¿qué debes hacer?',
        options: [
            'Seleccionar "Package Bin Full", vaciar el contenedor y continuar',
            'Seleccionar "Hospital Bin Full" y cambiar de estación',
            'Detener la celda con botón de emergencia y llamar a mantenimiento',
            'Continuar colocando paquetes encima hasta que se caigan'
        ],
        correctIndex: 0,
        explanation: '"Package Bin Full" es para reportar que el contenedor de salida está a su máxima capacidad y requiere vaciado físico.'
    },
    {
        id: 'q16',
        question: '¿Qué significa la alerta o reporte de "Hospital Bin Full"?',
        options: [
            'Que el contenedor de paquetes listos para enviar está lleno',
            'Que el contenedor de artículos rechazados o con problemas requiere ser vaciado',
            'Que el robot se ha lesionado en sus articulaciones',
            'Que el software del visor se congeló'
        ],
        correctIndex: 1,
        explanation: '"Hospital Bin Full" indica que el contenedor donde se colocan artículos defectuosos o con problemas está lleno.'
    },
    {
        id: 'q17',
        question: 'Si notas que el robot intenta dejar los productos en un contenedor pero no se alinea correctamente con su posición física, ¿qué reporte debes usar?',
        options: [
            'Bin Location Adjustment Needed',
            'Package Dropped in Wrong Bin',
            'Left Arm Frozen',
            'Other Product Issue'
        ],
        correctIndex: 0,
        explanation: 'Se reporta "Bin Location Adjustment Needed" cuando la alineación del robot respecto al contenedor físico está desviada y requiere ajuste de posición.'
    },
    {
        id: 'q18',
        question: 'Si en tu visor de control dejas de recibir la transmisión de video de la muñeca del brazo izquierdo, ¿cuál es el reporte adecuado?',
        options: [
            'Head Cam Out',
            'Left Wrist Cam Out',
            'Left Arm Frozen',
            'App Not Working'
        ],
        correctIndex: 1,
        explanation: '"Left Wrist Cam Out" se selecciona cuando la cámara montada en la muñeca izquierda pierde la conexión o deja de dar imagen.'
    },
    {
        id: 'q19',
        question: 'Si en tu visor de control dejas de recibir la transmisión de video de la muñeca del brazo izquierdo, ¿cuál es el reporte adecuado?',
        options: [
            'Head Cam Out',
            'Left Wrist Cam Out',
            'Left Arm Frozen',
            'App Not Working'
        ],
        correctIndex: 1,
        explanation: '"Left Wrist Cam Out" se selecciona cuando la cámara montada en la muñeca izquierda pierde la conexión o deja de dar imagen.'
    },
    {
        id: 'q20',
        question: 'El robot intenta sujetar un artículo pero los dedos de la pinza derecha no cierran ni aplican fuerza. ¿Qué debes reportar?',
        options: [
            'Right Arm Frozen',
            'Right Gripper Not Working',
            'Left Gripper Not Working',
            'Other Robot Issue'
        ],
        correctIndex: 1,
        explanation: '"Right Gripper Not Working" se selecciona específicamente cuando la pinza o griper del brazo derecho presenta problemas de apertura, cierre o fuerza.'
    },
    {
        id: 'q21',
        question: 'Si el sistema autónomo de toma de decisiones del robot falla y este deja de realizar tareas por sí solo sin causa física visible, ¿qué reporte aplica?',
        options: [
            'App Not Working',
            'Autonomy Not Working',
            'Left Arm Frozen',
            'Other Headset Issue'
        ],
        correctIndex: 1,
        explanation: '"Autonomy Not Working" se reporta cuando el software de autonomía del robot falla, impidiendo que tome decisiones o ejecute trayectorias de forma autónoma.'
    },
    {
        id: 'q22',
        question: '¿Para qué sirve reportar la falla con la opción "Other" en la pantalla de selección de fallos del simulador?',
        options: [
            'Para reiniciar el robot automáticamente',
            'Para reportar cualquier otro problema técnico o falla que no haya sido mencionado en las categorías anteriores de la capacitación',
            'Para apagar las cámaras de seguridad',
            'Para pausar el simulador indefinidamente'
        ],
        correctIndex: 1,
        explanation: '"Other" se reserva para fallas y problemas imprevistos que no coinciden con ninguna de las opciones específicas provistas en el menú.'
    }
];

interface ExamModalProps {
    onClose: () => void;
    onLaunchSimulatorExam?: (applicantName: string) => void;
}

interface UserAnswerLog {
    questionText: string;
    selectedText: string;
    correctText: string;
    isCorrect: boolean;
}

export default function ExamModal({ onClose, onLaunchSimulatorExam }: ExamModalProps) {
    const [step, setStep] = useState<'identity' | 'selection' | 'teorico'>('identity');
    const [applicantName, setApplicantName] = useState<string>('');
    const [questions, setQuestions] = useState<Question[]>(() => {
        const shuffled = [...EXAM_QUESTIONS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 10);
    });
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState<boolean>(false);
    const [score, setScore] = useState<number>(0);
    const [isFinished, setIsFinished] = useState<boolean>(false);
    const [answersLog, setAnswersLog] = useState<UserAnswerLog[]>([]);

    const certificateRef = useRef<HTMLDivElement>(null);
    const question = questions[currentStep];

    const handleStart = (e: React.FormEvent) => {
        e.preventDefault();
        if (!applicantName.trim()) return;
        setStep('selection');
    };

    const handleSelectOption = (idx: number) => {
        if (isAnswered || !question) return;
        setSelectedOption(idx);
        setIsAnswered(true);

        const isCorrectAnswer = idx === question.correctIndex;
        if (isCorrectAnswer) {
            setScore(prev => prev + 1);
        }

        setAnswersLog(prev => [
            ...prev,
            {
                questionText: question.question,
                selectedText: question.options[idx],
                correctText: question.options[question.correctIndex],
                isCorrect: isCorrectAnswer
            }
        ]);
    };

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            setIsFinished(true);
        }
    };

    const handleRetry = () => {
        const shuffled = [...EXAM_QUESTIONS].sort(() => 0.5 - Math.random());
        setQuestions(shuffled.slice(0, 10));
        setCurrentStep(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setScore(0);
        setIsFinished(false);
        setAnswersLog([]);
    };

    const handleDownloadPDF = async () => {
        if (!certificateRef.current || typeof window === 'undefined') return;
        try {
            await new Promise((resolve) => setTimeout(resolve, 250));

            const canvas = await html2canvas(certificateRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 850,
                windowHeight: 1100
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`Reporte_Entrenamiento_${applicantName.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('Error generando el PDF:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-[#FF6A00] px-6 py-4 flex items-center justify-between shrink-0">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-sm">PRO</span>
                        Examen de Certificación Training
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto grow">

                    {/* Paso 1: Registro del Aplicante */}
                    {step === 'identity' && (
                        <form onSubmit={handleStart} className="flex flex-col items-center justify-center py-8 animate-in fade-in duration-300">
                            <div className="bg-orange-50 text-[#FF6A00] w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                <User className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-neutral-900 mb-2">Registro de Aplicante</h3>
                            <p className="text-neutral-500 mb-6 max-w-sm text-center text-sm">
                                Por favor ingresa tu nombre completo para personalizar el examen y tu certificado de aprobación.
                            </p>
                            <div className="w-full max-w-md flex flex-col gap-4">
                                <input
                                    type="text"
                                    required
                                    value={applicantName}
                                    onChange={(e) => setApplicantName(e.target.value)}
                                    placeholder="Nombre y Apellidos"
                                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-[#FF6A00] transition-all text-neutral-800"
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-[#FF6A00] hover:bg-[#E65C00] text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Continuar a Selección
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Paso 2: Selección de Modalidad */}
                    {step === 'selection' && (
                        <div className="flex flex-col items-center justify-center py-8 animate-in fade-in duration-300">
                            <h3 className="text-2xl font-black text-neutral-900 mb-2">Selecciona la Modalidad</h3>
                            <p className="text-neutral-500 mb-8 max-w-sm text-center text-sm">
                                Hola <span className="font-bold text-neutral-800">{applicantName}</span>, elige si deseas realizar el examen teórico o el práctico en el entorno simulado.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg">
                                <button
                                    onClick={() => setStep('teorico')}
                                    className="bg-white border-2 border-neutral-200 hover:border-[#FF6A00] p-6 rounded-2xl flex flex-col items-center gap-4 transition-all hover:scale-105 group"
                                >
                                    <div className="bg-orange-50 text-[#FF6A00] w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <AlertCircle className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-lg font-black text-neutral-800">Examen Teórico</h4>
                                        <p className="text-xs text-neutral-500 mt-2">10 preguntas de opción múltiple sobre procedimientos.</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => onLaunchSimulatorExam && onLaunchSimulatorExam(applicantName)}
                                    className="bg-white border-2 border-neutral-200 hover:border-[#FF6A00] p-6 rounded-2xl flex flex-col items-center gap-4 transition-all hover:scale-105 group"
                                >
                                    <div className="bg-orange-50 text-[#FF6A00] w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-lg font-black text-neutral-800">Examen Simulación</h4>
                                        <p className="text-xs text-neutral-500 mt-2">Navega y levanta 10 reportes de fallas dentro del entorno 3D.</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Paso 3: Flujo del Examen e Interfaz de Resultados */}
                    {step === 'teorico' && (
                        !isFinished ? (
                            <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between text-xs font-bold text-neutral-400 uppercase tracking-wider">
                                        <span>Pregunta {currentStep + 1} de {questions.length}</span>
                                        <span>Puntaje: {score}</span>
                                    </div>
                                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#FF6A00] transition-all duration-500 ease-out"
                                            style={{ width: `${((currentStep) / questions.length) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-neutral-800 leading-snug">
                                    {question.question}
                                </h3>

                                <div className="flex flex-col gap-3">
                                    {question.options.map((opt, idx) => {
                                        let btnClass = "border-neutral-200 bg-white text-neutral-700 hover:border-[#FF6A00] hover:bg-orange-50";
                                        let icon = null;

                                        if (isAnswered) {
                                            if (idx === question.correctIndex) {
                                                btnClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold";
                                                icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
                                            } else if (idx === selectedOption) {
                                                btnClass = "border-red-300 bg-red-50 text-red-800";
                                                icon = <X className="w-5 h-5 text-red-500" />;
                                            } else {
                                                btnClass = "border-neutral-200 bg-neutral-50 text-neutral-400 opacity-60";
                                            }
                                        }

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleSelectOption(idx)}
                                                disabled={isAnswered}
                                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-4 ${btnClass}`}
                                            >
                                                <span className="text-sm">{opt}</span>
                                                {icon}
                                            </button>
                                        );
                                    })}
                                </div>

                                {isAnswered && (
                                    <div className="mt-2 p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-sm flex flex-col gap-1 animate-in fade-in duration-200">
                                        <span className="font-bold uppercase tracking-wider text-xs text-blue-600 mb-1">Explicación</span>
                                        {question.explanation}
                                    </div>
                                )}
                            </div>
                        ) : (
                            (() => {
                                const percent = Math.round((score / questions.length) * 100);
                                const passed = percent >= 80;
                                return (
                                    <div className="flex flex-col items-center justify-center py-4 text-center">

                                        {/* Elemento oculto de flujo seguro para exportar a PDF (Formato Carta con Feedback Completo) */}
                                        <div className="pointer-events-none fixed left-0 top-0 h-0 w-0 overflow-hidden opacity-0 select-none">
                                            <div
                                                ref={certificateRef}
                                                className="w-[800px] bg-white border-[12px] border-[#FF6A00] p-10 flex flex-col font-sans text-neutral-900"
                                            >
                                                <div className="flex justify-between items-center border-b-2 border-neutral-100 pb-4 mb-6">
                                                    <div>
                                                        <h1 className="text-3xl font-black text-[#FF6A00] tracking-tight uppercase">Reporte de Entrenamiento</h1>
                                                        <p className="text-xs tracking-widest text-neutral-400 uppercase font-bold">Autoryx Critical Automation Stack</p>
                                                    </div>
                                                    <div className="text-right text-[10px] font-mono text-neutral-400">
                                                        <div>FECHA: {new Date().toLocaleDateString()}</div>
                                                        <div>STATUS: {passed ? 'APROBADO' : 'RECHAZADO'}</div>
                                                    </div>
                                                </div>

                                                <div className="mb-6">
                                                    <p className="text-xs text-neutral-400 italic">Nombre del Operador/Aplicante:</p>
                                                    <h2 className="text-2xl font-black text-neutral-800">{applicantName}</h2>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4 bg-neutral-50 border border-neutral-100 rounded-xl p-4 mb-6 text-center">
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-neutral-400">Puntaje</p>
                                                        <p className={`text-xl font-black ${passed ? 'text-emerald-500' : 'text-red-500'}`}>{percent}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-neutral-400">Aciertos</p>
                                                        <p className="text-xl font-black text-neutral-700">{score} / {questions.length}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-neutral-400">Resultado Técnico</p>
                                                        <p className={`text-xl font-black ${passed ? 'text-emerald-500' : 'text-red-500'}`}>{passed ? 'PASS' : 'FAIL'}</p>
                                                    </div>
                                                </div>

                                                {/* Sección de Feedback de Preguntas para el Entrenador */}
                                                <div className="flex flex-col gap-4 text-left border-t border-neutral-100 pt-4">
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Desglose Técnico de Respuestas (Feedback del Sistema)</h3>
                                                    {answersLog.map((log, idx) => (
                                                        <div key={idx} className="p-3 rounded-lg border border-neutral-100 bg-neutral-50/50 text-xs">
                                                            <div className="flex items-start justify-between gap-4 mb-1">
                                                                <p className="font-bold text-neutral-800">{idx + 1}. {log.questionText}</p>
                                                                <span className={`shrink-0 font-bold px-2 py-0.5 rounded text-[10px] ${log.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                                    {log.isCorrect ? 'Correcto' : 'Fallo'}
                                                                </span>
                                                            </div>
                                                            <p className="text-neutral-600"><span className="font-semibold text-neutral-500">Seleccionada:</span> {log.selectedText}</p>
                                                            {!log.isCorrect && (
                                                                <p className="text-emerald-700 font-medium"><span className="font-semibold text-neutral-500">Correcta esperada:</span> {log.correctText}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Vista de UI para el Usuario Final */}
                                        {passed ? (
                                            <>
                                                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4 animate-bounce">
                                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                                </div>
                                                <h2 className="text-3xl font-black text-neutral-900 mb-1">¡Examen Aprobado!</h2>
                                                <p className="text-neutral-500 mb-6 max-w-sm text-sm">
                                                    Felicidades <span className="font-bold text-neutral-700">{applicantName}</span>. Has acreditado la evaluación teórica del sistema.
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                                    <AlertCircle className="w-10 h-10 text-red-500" />
                                                </div>
                                                <h2 className="text-3xl font-black text-neutral-900 mb-1">Evaluación No Aprobada</h2>
                                                <p className="text-neutral-500 mb-6 max-w-sm text-sm">
                                                    Necesitas un mínimo de 80% para aprobar. Intenta de nuevo para obtener tu acreditación.
                                                </p>
                                            </>
                                        )}

                                        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 w-full max-w-sm mb-6">
                                            <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">Puntuación Final</div>
                                            <div className={`text-5xl font-black ${passed ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {percent}%
                                            </div>
                                            <div className="text-xs text-neutral-400 mt-2 font-medium">
                                                Aciertos: {score} de {questions.length} (Requerido: 80%)
                                            </div>
                                        </div>

                                        {/* Acciones del fin del examen */}
                                        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center items-center">
                                            <button
                                                onClick={handleDownloadPDF}
                                                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-105"
                                            >
                                                <Download className="w-4 h-4" />
                                                Descargar PDF
                                            </button>

                                            {!passed ? (
                                                <button
                                                    onClick={handleRetry}
                                                    className="w-full sm:w-auto bg-[#FF6A00] hover:bg-[#E65C00] text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all hover:scale-105"
                                                >
                                                    Intentar nuevamente
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={onClose}
                                                    className="w-full sm:w-auto bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-6 py-3 rounded-xl font-bold transition-all"
                                                >
                                                    Salir
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()
                        )
                    )}
                </div>

                {/* Footer Controls */}
                {step === 'teorico' && !isFinished && (
                    <div className="bg-neutral-50 p-4 border-t border-neutral-200 shrink-0 flex justify-end">
                        <button
                            onClick={handleNext}
                            disabled={!isAnswered}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${isAnswered
                                ? 'bg-[#FF6A00] text-white hover:bg-[#E65C00] shadow-md hover:scale-105'
                                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                                }`}
                        >
                            {currentStep === questions.length - 1 ? 'Finalizar' : 'Siguiente Pregunta'}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}