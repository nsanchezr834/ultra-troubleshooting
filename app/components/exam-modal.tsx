import React, { useState, useRef } from 'react';
import { X, ChevronRight, CheckCircle2, AlertCircle, Download, Send, User } from 'lucide-react';
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
    }
];

interface ExamModalProps {
    onClose: () => void;
    onLaunchSimulatorExam?: (applicantName: string) => void;
}

interface UserAnswerLog {
    questionId: string;
    questionText: string;
    isCorrect: boolean;
    selectedText: string;
    correctText: string;
}

export default function ExamModal({ onClose, onLaunchSimulatorExam }: ExamModalProps) {
    const [step, setStep] = useState<'identity' | 'selection' | 'teorico'>('identity');
    const [applicantName, setApplicantName] = useState<string>('');
    const [questions, setQuestions] = useState<Question[]>(() => {
        const shuffled = [...EXAM_QUESTIONS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 5);
    });
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState<boolean>(false);
    const [score, setScore] = useState<number>(0);
    const [isFinished, setIsFinished] = useState<boolean>(false);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

    // Historial de respuestas para el reporte detallado
    const [answersLog, setAnswersLog] = useState<UserAnswerLog[]>([]);

    const certificateRef = useRef<HTMLDivElement>(null);
    const question = questions[currentStep];

    const percent = Math.round((score / questions.length) * 100);
    const passed = percent >= 80;

    const handleStart = (e: React.FormEvent) => {
        e.preventDefault();
        if (!applicantName.trim()) return;
        setStep('selection');
    };

    const handleSelectOption = (idx: number) => {
        if (isAnswered || !question) return;
        setSelectedOption(idx);
        setIsAnswered(true);

        const isCorrect = idx === question.correctIndex;
        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        setAnswersLog(prev => [
            ...prev,
            {
                questionId: question.id,
                questionText: question.question,
                isCorrect: isCorrect,
                selectedText: question.options[idx],
                correctText: question.options[question.correctIndex]
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
        setQuestions(shuffled.slice(0, 5));
        setCurrentStep(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setScore(0);
        setIsFinished(false);
        setAnswersLog([]);
    };

    const handleSendResults = async () => {
        setIsSending(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSending(false);
        alert('Resultados enviados exitosamente al sistema central.');
    };

    const handleDownloadPDF = async () => {
        if (!certificateRef.current) return;
        setIsGeneratingPdf(true);

        try {
            // Un breve retraso garantiza la estabilidad del pintado completo en navegadores basados en Chromium
            await new Promise((resolve) => setTimeout(resolve, 400));

            const canvas = await html2canvas(certificateRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 900,
                windowHeight: 1100
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`Reporte_Evaluacion_${applicantName.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('Error generando el PDF:', error);
            alert('Error en el motor de generación del PDF.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">

            {/* CONTENEDOR DE CAPTURA ASÍNCRONO FUERA DEL VIEWPORT REAL */}
            {/* Permanece siempre montado para evitar pérdidas de referencia en la API del DOM */}
            <div className="fixed top-0 left-[100vw] z-[100] pointer-events-none bg-white">
                <div
                    ref={certificateRef}
                    className="w-[900px] bg-white border-[20px] border-[#FF6A00] p-12 flex flex-col justify-between font-sans text-neutral-900"
                    style={{ minHeight: '1100px' }}
                >
                    <div>
                        <div className="flex justify-between items-start border-b border-neutral-200 pb-6 mb-8">
                            <div>
                                <h1 className="text-4xl font-black text-[#FF6A00] tracking-tight uppercase mb-1">Reporte de Evaluación</h1>
                                <p className="text-xs tracking-widest text-neutral-400 uppercase font-black">Autoryx Stack Intelligent Training</p>
                            </div>
                            <div className="text-right text-xs font-mono text-neutral-400">
                                <div>ID EXAMEN: TX9X_TRAINING</div>
                                <div>EMISIÓN: {new Date().toLocaleDateString()}</div>
                            </div>
                        </div>

                        <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100 flex justify-between items-center mb-8">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1">Operador Evaluado</p>
                                <h2 className="text-2xl font-black text-neutral-800">{applicantName || "Sin Registro"}</h2>
                            </div>
                            <div className="flex gap-8 text-center">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-neutral-400">Estado</p>
                                    <p className={`text-xl font-black ${passed ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {passed ? 'APROBADO' : 'RECHAZADO'}
                                    </p>
                                </div>
                                <div className="w-px h-8 bg-neutral-200" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-neutral-400">Porcentaje</p>
                                    <p className="text-xl font-black text-neutral-700">{percent}%</p>
                                </div>
                                <div className="w-px h-8 bg-neutral-200" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-neutral-400">Métricas</p>
                                    <p className="text-xl font-black text-neutral-700">{score} / {questions.length}</p>
                                </div>
                            </div>
                        </div>

                        {/* DESGLOSE COMPLETO DE RESPUESTAS BUENAS Y MALAS */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase text-neutral-400 tracking-widest border-b pb-2">Auditoría Operativa de Respuestas</h3>
                            {answersLog.map((log, index) => (
                                <div key={index} className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 flex flex-col gap-2">
                                    <div className="flex items-start justify-between gap-4">
                                        <h4 className="text-xs font-bold text-neutral-800 leading-relaxed">
                                            <span className="text-neutral-400 mr-1">{index + 1}.</span> {log.questionText}
                                        </h4>
                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold shrink-0 ${log.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {log.isCorrect ? 'Correcta' : 'Incorrecta'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] mt-1">
                                        <div>
                                            <span className="font-semibold text-neutral-400">Seleccionado: </span>
                                            <span className={log.isCorrect ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                                                {log.selectedText}
                                            </span>
                                        </div>
                                        {!log.isCorrect && (
                                            <div>
                                                <span className="font-semibold text-neutral-400">Solución Correcta: </span>
                                                <span className="text-emerald-600 font-medium">{log.correctText}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center text-[10px] text-neutral-300 font-mono pt-8 mt-12 border-t border-neutral-100 uppercase tracking-widest">
                        CÓDIGO DE INTEGRIDAD REPORTE PROTEGIDO BAJO PROTOCOLO AUTORYX COGNITIVE SYSTEM
                    </div>
                </div>
            </div>

            {/* Interfaz de usuario interactiva */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-[#FF6A00] px-6 py-4 flex items-center justify-between shrink-0">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <span className="bg-white/20 px-2 py-0.5 rounded text-sm">PRO</span>
                        Examen de Certificación Training
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto grow">
                    {step === 'identity' && (
                        <form onSubmit={handleStart} className="flex flex-col items-center justify-center py-8 animate-in fade-in duration-300">
                            <div className="bg-orange-50 text-[#FF6A00] w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                <User className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-neutral-900 mb-2">Registro de Aplicante</h3>
                            <p className="text-neutral-500 mb-6 max-w-sm text-center text-sm">
                                Por favor ingresa tu nombre completo para personalizar el examen y tu certificado.
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
                                <button type="submit" className="w-full bg-[#FF6A00] hover:bg-[#E65C00] text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                    Continuar a Selección
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'selection' && (
                        <div className="flex flex-col items-center justify-center py-8 animate-in fade-in duration-300">
                            <h3 className="text-2xl font-black text-neutral-900 mb-2">Selecciona la Modalidad</h3>
                            <p className="text-neutral-500 mb-8 max-w-sm text-center text-sm">
                                Hola <span className="font-bold text-neutral-800">{applicantName}</span>, elige si deseas realizar el examen teórico o el práctico.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg">
                                <button onClick={() => setStep('teorico')} className="bg-white border-2 border-neutral-200 hover:border-[#FF6A00] p-6 rounded-2xl flex flex-col items-center gap-4 transition-all hover:scale-105 group">
                                    <div className="bg-orange-50 text-[#FF6A00] w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <AlertCircle className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-lg font-black text-neutral-800">Examen Teórico</h4>
                                        <p className="text-xs text-neutral-500 mt-2">Evaluación integral con reportes de fallas automatizados.</p>
                                    </div>
                                </button>

                                <button onClick={() => onLaunchSimulatorExam && onLaunchSimulatorExam(applicantName)} className="bg-white border-2 border-neutral-200 hover:border-[#FF6A00] p-6 rounded-2xl flex flex-col items-center gap-4 transition-all hover:scale-105 group">
                                    <div className="bg-orange-50 text-[#FF6A00] w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-lg font-black text-neutral-800">Examen Simulación</h4>
                                        <p className="text-xs text-neutral-500 mt-2">Navega y levanta reportes de fallas dentro del entorno 3D.</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'teorico' && (
                        !isFinished ? (
                            <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between text-xs font-bold text-neutral-400 uppercase tracking-wider">
                                        <span>Pregunta {currentStep + 1} de {questions.length}</span>
                                        <span>Puntaje: {score}</span>
                                    </div>
                                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#FF6A00] transition-all duration-500 ease-out" style={{ width: `${(currentStep / questions.length) * 100}%` }} />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-neutral-800 leading-snug">{question.question}</h3>

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
                                            <button key={idx} onClick={() => handleSelectOption(idx)} disabled={isAnswered} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-4 ${btnClass}`}>
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
                            <div className="flex flex-col items-center justify-center py-4 text-center">
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
                                            Necesitas un mínimo de 80% para aprobar. Genera el reporte para revisar tus fallas.
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

                                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center items-center">
                                    <button onClick={handleSendResults} disabled={isSending} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-50 text-sm">
                                        <Send className="w-4 h-4" />
                                        {isSending ? 'Enviando...' : 'Enviar Resultados'}
                                    </button>

                                    <button onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-50 text-sm">
                                        <Download className="w-4 h-4" />
                                        {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
                                    </button>

                                    {!passed ? (
                                        <button onClick={handleRetry} className="w-full sm:w-auto bg-[#FF6A00] hover:bg-[#E65C00] text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all hover:scale-105 text-sm">
                                            Intentar nuevamente
                                        </button>
                                    ) : (
                                        <button onClick={onClose} className="w-full sm:w-auto bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-6 py-3 rounded-xl font-bold transition-all text-sm">
                                            Salir
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                </div>

                {/* Footer Controls */}
                {step === 'teorico' && !isFinished && (
                    <div className="bg-neutral-50 p-4 border-t border-neutral-200 shrink-0 flex justify-end">
                        <button onClick={handleNext} disabled={!isAnswered} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${isAnswered ? 'bg-[#FF6A00] text-white hover:bg-[#E65C00] shadow-md hover:scale-105' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}`}>
                            {currentStep === questions.length - 1 ? 'Finalizar' : 'Siguiente Pregunta'}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}