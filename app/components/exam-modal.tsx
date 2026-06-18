import React, { useState } from 'react';
import { X, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

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
        question: 'En la Bagger, una bolsa queda fuera de posición y el sistema se detiene. ¿Qué severidad tiene esta falla?',
        options: [
            'Baja',
            'Media',
            'Alta',
            'Crítica'
        ],
        correctIndex: 1,
        explanation: 'Es una falla Media porque requiere intervención manual para corregir la bolsa, pero no daña la máquina ni requiere escalamiento de nivel 2.'
    },
    {
        id: 'q3',
        question: 'Durante un ciclo en Tote, recibes el error de "Producto fuera del rango de fecha". ¿Qué debes hacer con el producto?',
        options: [
            'Tirarlo a la basura',
            'Empacarlo de todos modos',
            'Apartar el producto y regresarlo al rack para revisión del cliente',
            'Forzar el escáner y continuar'
        ],
        correctIndex: 2,
        explanation: 'El producto debe apartarse para revisión posterior; el operador no debe tomar la decisión final sobre productos expirados.'
    },
    {
        id: 'q4',
        question: 'En el robot Phil, si una orden contiene 6 productos, ¿qué tamaño de bolsa debes utilizar para el empaque?',
        options: [
            'La bolsa más chica',
            'La bolsa mediana estándar',
            'La bolsa más grande',
            'No se requiere bolsa, se colocan sueltos'
        ],
        correctIndex: 2,
        explanation: 'De acuerdo con el consejo de operación del robot Phil, cuando sean más de 5 productos se tiene que ocupar la bolsa más grande, de lo contrario se ocupará la bolsa más chica.'
    },
    {
        id: 'q5',
        question: 'Si tienes un problema con la orden en el robot Phil (por ejemplo, no se imprime la etiqueta y continúa solicitando otro producto), ¿cuál es el procedimiento correcto?',
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
            'Cambiar el rollo de bolsas vacío por uno nuevo para que el robot continúe',
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
        question: 'Si el escáner automático no puede leer el código de barras porque la etiqueta salió borrosa o maltratada, ¿cuál es la opción correcta?',
        options: [
            'App Not Working',
            'Label Won\'t Scan',
            'Out of Labels',
            'Product Dropped'
        ],
        correctIndex: 1,
        explanation: 'Debes elegir "Label Won\'t Scan" cuando el código de barras o la etiqueta están borrosos, dañados o ilegibles para el escáner.'
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
        question: 'Si el mecanismo encargado de doblar o empujar los sobres de envío (Mailer Folder) se queda atascado o inmóvil, ¿qué reporte es el adecuado?',
        options: [
            'Chest Frozen',
            'Mailer Folder Frozen',
            'Bag Jam',
            'Left Gripper Not Working'
        ],
        correctIndex: 1,
        explanation: '"Mailer Folder Frozen" es el reporte específico para fallos en el mecanismo plegador o empujador de sobres (Mailer Folder).'
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
    onLaunchSimulatorExam?: () => void;
}

export default function ExamModal({ onClose, onLaunchSimulatorExam }: ExamModalProps) {
    const [mode, setMode] = useState<'selection' | 'teorico'>('selection');
    const [questions, setQuestions] = useState<Question[]>(() => {
        const shuffled = [...EXAM_QUESTIONS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 10);
    });
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState<boolean>(false);
    const [score, setScore] = useState<number>(0);
    const [isFinished, setIsFinished] = useState<boolean>(false);

    const question = questions[currentStep];

    const handleSelectOption = (idx: number) => {
        if (isAnswered || !question) return;
        setSelectedOption(idx);
        setIsAnswered(true);
        if (idx === question.correctIndex) {
            setScore(prev => prev + 1);
        }
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
                    {mode === 'selection' ? (
                        <div className="flex flex-col items-center justify-center py-8 animate-in fade-in duration-300">
                            <h3 className="text-2xl font-black text-neutral-900 mb-2">Selecciona la Modalidad</h3>
                            <p className="text-neutral-500 mb-8 max-w-sm text-center">
                                Elige si deseas realizar el cuestionario de preguntas de opción múltiple o el examen de práctica dentro del simulador interactivo.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg">
                                <button
                                    onClick={() => setMode('teorico')}
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
                                    onClick={() => onLaunchSimulatorExam && onLaunchSimulatorExam()}
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
                    ) : (
                        !isFinished ? (
                            <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                                {/* Progress bar */}
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

                                {/* Question */}
                                <h3 className="text-xl font-bold text-neutral-800 leading-snug">
                                    {question.question}
                                </h3>

                                {/* Options */}
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

                                {/* Explanation */}
                                {isAnswered && (
                                    <div className="mt-2 p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-1">
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
                                    <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-500">
                                        {passed ? (
                                            <>
                                                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                                                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                                                </div>
                                                <h2 className="text-3xl font-black text-neutral-900 mb-2">¡Examen Aprobado!</h2>
                                                <p className="text-neutral-500 mb-8 max-w-sm">
                                                    ¡Felicidades! Has completado y aprobado el examen de certificación de entrenamiento.
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-6">
                                                    <AlertCircle className="w-12 h-12 text-red-500" />
                                                </div>
                                                <h2 className="text-3xl font-black text-neutral-900 mb-2">No Aprobado</h2>
                                                <p className="text-neutral-500 mb-8 max-w-sm text-lg font-medium">
                                                    Intenta nuevamente para alcanzar el 80% requerido.
                                                </p>
                                            </>
                                        )}

                                        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 w-full max-w-sm mb-8">
                                            <div className="text-sm text-neutral-500 font-bold uppercase tracking-wider mb-1">Puntuación Final</div>
                                            <div className={`text-5xl font-black ${passed ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {percent}%
                                            </div>
                                            <div className="text-sm text-neutral-400 mt-2">
                                                Aciertos: {score} de {questions.length} (Mínimo requerido: 80%)
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            {!passed ? (
                                                <>
                                                    <button
                                                        onClick={handleRetry}
                                                        className="bg-[#FF6A00] hover:bg-[#E65C00] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-orange-500/30 transition-all hover:scale-105 active:scale-95"
                                                    >
                                                        Intentar nuevamente
                                                    </button>
                                                    <button
                                                        onClick={onClose}
                                                        className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95"
                                                    >
                                                        Cerrar
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={onClose}
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
                                                >
                                                    Volver al Inicio
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()
                        ))}
                </div>

                {/* Footer Controls */}
                {mode === 'teorico' && !isFinished && (
                    <div className="bg-neutral-50 p-4 border-t border-neutral-200 shrink-0 flex justify-end">
                        <button
                            onClick={handleNext}
                            disabled={!isAnswered}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all ${isAnswered
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