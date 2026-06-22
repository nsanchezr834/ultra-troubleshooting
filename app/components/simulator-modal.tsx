import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, Mic, MicOff, Settings, LogOut, Pause, Bell, X, Check, Download, AlertCircle, CheckCircle2, Loader2, Star } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { saveExamResult, TraineeIdentity } from '../lib/training';

interface SimulatorModalProps {
    onClose: () => void;
    isExamMode?: boolean;
    applicantName?: string;
    traineeIdentity?: TraineeIdentity | null;
}

interface SimulationQuestion {
    id: string;
    instruction: string;
    expectedFaultTitle: string;
    category: string; // para el reporte PDF
    difficulty?: 'easy' | 'medium' | 'hard';
}

// ─── Banco completo: 25 escenarios ───────────────────────────────────────────
const ALL_SIMULATION_QUESTIONS: SimulationQuestion[] = [
    // — Originales (10) —
    { id: 'sq1', instruction: 'El rollo de bolsas se atascó en el mecanismo de apertura.', expectedFaultTitle: 'Bag Jam', category: 'Bagger' },
    { id: 'sq2', instruction: 'La aplicación en el visor se cerró inesperadamente.', expectedFaultTitle: 'App Not Working', category: 'Headset / App / Software' },
    { id: 'sq3', instruction: 'El brazo izquierdo del robot se congeló y no responde.', expectedFaultTitle: 'Left Arm Frozen', category: 'Robot' },
    { id: 'sq4', instruction: 'El paquete se cayó de la pinza al suelo.', expectedFaultTitle: 'Package Dropped on Floor', category: 'Order / Package' },
    { id: 'sq5', instruction: 'Ya no hay artículos físicos en la zona de alimentación, o no hay un lote (batch) cargado en el sistema para seguir el trabajo.', expectedFaultTitle: 'Out of Product', category: 'Product / Bins' },
    { id: 'sq6', instruction: 'El robot intentó meter un paquete en un contenedor equivocado.', expectedFaultTitle: 'Package Dropped in Wrong Bin', category: 'Order / Package' },
    { id: 'sq7', instruction: 'No hay etiquetas térmicas en la impresora.', expectedFaultTitle: 'Out of Labels', category: 'Bagger' },
    { id: 'sq8', instruction: 'El contenedor de paquetes terminados está lleno a su capacidad máxima.', expectedFaultTitle: 'Package Bin Full', category: 'Product / Bins' },
    { id: 'sq9', instruction: 'La cámara de la muñeca derecha perdió la señal de video.', expectedFaultTitle: 'Right Wrist Cam Out', category: 'Robot' },
    { id: 'sq10', instruction: 'Ocurrió un error mecánico desconocido que no aparece en las opciones normales.', expectedFaultTitle: 'Other', category: 'Other' },

    // — Nuevas (15) —
    { id: 'sq11', instruction: 'El brazo derecho del robot quedó congelado a la mitad de un movimiento de colocación.', expectedFaultTitle: 'Right Arm Frozen', category: 'Robot' },
    { id: 'sq12', instruction: 'El sistema autónomo del robot dejó de tomar decisiones sin causa física visible; el robot está quieto pero sin errores de hardware.', expectedFaultTitle: 'Autonomy Not Working', category: 'Headset / App / Software' },
    { id: 'sq13', instruction: 'La pinza izquierda del robot no abre ni aplica fuerza de agarre durante el ciclo de empaque.', expectedFaultTitle: 'Left Gripper Not Working', category: 'Robot' },
    { id: 'sq14', instruction: 'Revisas el paquete sellado y notas que el cierre de la bolsa quedó quemado y abierto en un extremo.', expectedFaultTitle: 'Bad Seal', category: 'Order / Package' },
    { id: 'sq15', instruction: 'La cámara instalada en la cabeza del robot dejó de transmitir video al visor.', expectedFaultTitle: 'Head Cam Out', category: 'Robot' },
    { id: 'sq16', instruction: 'El contenedor de artículos rechazados (hospital bin) llegó a su capacidad máxima y no caben más artículos.', expectedFaultTitle: 'Hospital Bin Full', category: 'Product / Bins' },
    { id: 'sq17', instruction: 'Se necesita mover el bin de depósito, el robot no lo alcanza físicamente, o no se tiene el bin en Customer del color que se solicita.', expectedFaultTitle: 'Bin Location Adjustment Needed', category: 'Product / Bins' },
    { id: 'sq18', instruction: 'La cámara de la muñeca izquierda perdió la conexión y el visor muestra una pantalla negra en esa vista.', expectedFaultTitle: 'Left Wrist Cam Out', category: 'Robot' },
    { id: 'sq19', instruction: 'La impresora de etiquetas terminó su rollo y ya no puede generar guías de envío para los paquetes actuales.', expectedFaultTitle: 'Out of Labels', category: 'Bagger' },
    { id: 'sq20', instruction: 'Un artículo cayó fuera del conveyor durante el movimiento del brazo y quedó en el suelo de la estación.', expectedFaultTitle: 'Product Dropped', category: 'Product / Bins' },
    { id: 'sq21', instruction: 'La pinza derecha del robot pierde agarre constantemente y deja caer los artículos antes de empacarlos.', expectedFaultTitle: 'Right Gripper Not Working', category: 'Robot' },
    { id: 'sq22', instruction: 'El cuello del robot no puede girar para orientar las cámaras hacia la banda de productos.', expectedFaultTitle: 'Neck Frozen', category: 'Robot' },
    { id: 'sq23', instruction: 'El torso del robot se quedó bloqueado en su posición y no responde a ningún comando de rotación.', expectedFaultTitle: 'Chest Frozen', category: 'Robot' },
    { id: 'sq24', instruction: 'El visor presenta un problema técnico con el headset que no corresponde a ninguna categoría de falla conocida del sistema.', expectedFaultTitle: 'Other Headset Issue', category: 'Headset / App / Software' },
];

// ─── Shuffle + slice helper ───────────────────────────────────────────────────
function pickRandom<T>(arr: T[], n: number): T[] {
    return [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
}

// ─── PDF generation ───────────────────────────────────────────────────────────
interface AnswerRecord {
    question: SimulationQuestion;
    reportedFault: string;
    isCorrect: boolean;
}

// ─── Load image as base64 for jsPDF ────────────────────────────────────────────
async function loadImageAsBase64(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

async function generateSimPDF(
    applicantName: string,
    sessionName: string,
    trainerName: string,
    examScore: number,
    total: number,
    answers: AnswerRecord[]
): Promise<void> {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const PAGE_W = 210;
    const PAGE_H = 297;
    const MARGIN = 18;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    const ORANGE = '#FF6A00';
    const DARK = '#1a1a1a';
    const GRAY = '#6b7280';
    const LIGHT_GRAY = '#f3f4f6';
    const GREEN = '#059669';
    const RED = '#dc2626';

    const percent = Math.round((examScore / total) * 100);
    const passed = percent >= 90;
    let y = 0;

    // ── Intenta cargar el logo de Ultra ──────────────────────────────────────
    const logoBase64 = await loadImageAsBase64('/ultra_logo.png');

    // Banda naranja de acento superior
    doc.setFillColor(ORANGE);
    doc.rect(0, 0, PAGE_W, 6, 'F');

    // Fondo blanco del header
    doc.setFillColor('#ffffff');
    doc.rect(0, 6, PAGE_W, 36, 'F');

    // Logo Ultra (si cargó)
    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', MARGIN, 12, 40, 16);
    } else {
        // Fallback texto si el logo no cargó
        doc.setTextColor(ORANGE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('ULTRA', MARGIN, 24);
    }

    // Título del reporte a la derecha del logo
    doc.setDrawColor('#e5e7eb');
    doc.line(MARGIN + 48, 10, MARGIN + 48, 38); // línea divisoria

    doc.setTextColor(DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('REPORTE DE EVALUACIÓN — SIMULACIÓN', MARGIN + 54, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(GRAY);
    doc.text('AUTORYX STACK — INTELLINENT TRAINING SYSTEM', MARGIN + 54, 29);

    // Fecha + ID en top-right
    doc.setFontSize(7);
    const dateStr = new Date().toLocaleDateString('es-MX');
    doc.text(`EMISIÓN: ${dateStr}`, PAGE_W - MARGIN, 16, { align: 'right' });
    doc.text(`ID: TX9X_SIM`, PAGE_W - MARGIN, 22, { align: 'right' });
    if (sessionName) {
        doc.setTextColor(ORANGE);
        const dispSessionName = sessionName.length > 25 ? sessionName.substring(0, 22) + '...' : sessionName;
        doc.text(`SESIÓN: ${dispSessionName}`, PAGE_W - MARGIN, 29, { align: 'right' });
    }

    // Línea separadora inferior del header
    doc.setDrawColor('#e5e7eb');
    doc.line(0, 42, PAGE_W, 42);

    y = 52;

    // ── Operator card ─────────────────────────────────────────────────────────
    doc.setFillColor(LIGHT_GRAY);
    doc.roundedRect(MARGIN, y, CONTENT_W, 28, 3, 3, 'F');

    doc.setTextColor(GRAY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('OPERADOR EVALUADO', MARGIN + 6, y + 8);

    doc.setTextColor(DARK);
    doc.setFont('helvetica', 'bold');
    // Escalar dinámicamente el tamaño de letra si el nombre es muy largo para evitar overlap
    const nameStr = applicantName || 'Sin Registro';
    let nameFontSize = 14;
    if (nameStr.length > 28) {
        nameFontSize = 10;
    } else if (nameStr.length > 20) {
        nameFontSize = 12;
    }
    doc.setFontSize(nameFontSize);
    doc.text(nameStr, MARGIN + 6, y + 18);

    // Trainer info bajo el nombre
    if (trainerName) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(GRAY);
        doc.text(`Trainer: ${trainerName}`, MARGIN + 6, y + 25);
    }

    // Status / percent / score — right side
    const statusColor = passed ? GREEN : RED;
    const statusText = passed ? 'APROBADO' : 'RECHAZADO';

    // Status
    doc.setTextColor(GRAY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('ESTADO', PAGE_W - MARGIN - 80, y + 8);
    doc.setTextColor(statusColor);
    doc.setFontSize(11);
    doc.text(statusText, PAGE_W - MARGIN - 80, y + 18);

    // Separator
    doc.setDrawColor('#d1d5db');
    doc.line(PAGE_W - MARGIN - 54, y + 6, PAGE_W - MARGIN - 54, y + 24);

    // Percent
    doc.setTextColor(GRAY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('PRECISIÓN', PAGE_W - MARGIN - 48, y + 8);
    doc.setTextColor(DARK);
    doc.setFontSize(11);
    doc.text(`${percent}%`, PAGE_W - MARGIN - 48, y + 18);

    // Separator
    doc.line(PAGE_W - MARGIN - 22, y + 6, PAGE_W - MARGIN - 22, y + 24);

    // Score
    doc.setTextColor(GRAY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('ACIERTOS', PAGE_W - MARGIN - 16, y + 8);
    doc.setTextColor(DARK);
    doc.setFontSize(11);
    doc.text(`${examScore}/${total}`, PAGE_W - MARGIN - 16, y + 18);

    y += 36;

    // ── Section title ─────────────────────────────────────────────────────────
    doc.setTextColor(GRAY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('AUDITORÍA DE ESCENARIOS — MODO SIMULACIÓN', MARGIN, y);
    doc.setDrawColor('#e5e7eb');
    doc.line(MARGIN, y + 2, PAGE_W - MARGIN, y + 2);
    y += 10;

    // ── Answer cards ──────────────────────────────────────────────────────────
    const LINE_H = 4.5;

    answers.forEach((rec, index) => {
        const scenarioLines = doc.splitTextToSize(
            `${index + 1}. ${rec.question.instruction}`,
            CONTENT_W - 30
        ) as string[];

        const reportedLines = doc.splitTextToSize(
            `Reportado: ${rec.reportedFault}`,
            CONTENT_W - 12
        ) as string[];

        const expectedLines = !rec.isCorrect
            ? doc.splitTextToSize(`Esperado: ${rec.question.expectedFaultTitle}`, CONTENT_W - 12) as string[]
            : [];

        const categoryLine = 1;
        const cardH = 10 + (scenarioLines.length + reportedLines.length + expectedLines.length + categoryLine) * LINE_H + 6;

        if (y + cardH > PAGE_H - 20) {
            doc.addPage();
            y = 20;
        }

        // Card background
        doc.setFillColor(rec.isCorrect ? '#f0fdf4' : '#fff7f7');
        doc.roundedRect(MARGIN, y, CONTENT_W, cardH, 2, 2, 'F');

        // Left accent bar
        doc.setFillColor(rec.isCorrect ? GREEN : RED);
        doc.rect(MARGIN, y, 3, cardH, 'F');

        // Category tag
        doc.setFillColor('#383A40');
        doc.roundedRect(MARGIN + 6, y + 3, doc.getTextWidth(rec.question.category) + 4, 5.5, 1, 1, 'F');
        doc.setTextColor('#ffffff');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.text(rec.question.category, MARGIN + 8, y + 7.2);

        // Badge top-right
        doc.setFillColor(rec.isCorrect ? GREEN : RED);
        doc.roundedRect(PAGE_W - MARGIN - 24, y + 4, 22, 6, 1, 1, 'F');
        doc.setTextColor('#ffffff');
        doc.setFontSize(6);
        doc.text(rec.isCorrect ? 'CORRECTA' : 'INCORRECTA', PAGE_W - MARGIN - 13, y + 8.2, { align: 'center' });

        // Scenario text
        let cy = y + 12;
        doc.setTextColor(DARK);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        scenarioLines.forEach((line: string) => {
            doc.text(line, MARGIN + 6, cy);
            cy += LINE_H;
        });

        cy += 2;

        // Reported fault
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(GRAY);
        const repLabelW = doc.getTextWidth('Reportado: ');
        doc.text('Reportado: ', MARGIN + 6, cy);
        doc.setTextColor(rec.isCorrect ? GREEN : RED);
        doc.setFont('helvetica', 'normal');
        if (reportedLines.length > 0) {
            doc.text(reportedLines[0].replace('Reportado: ', ''), MARGIN + 6 + repLabelW, cy);
            reportedLines.slice(1).forEach((line: string) => { cy += LINE_H; doc.text(line, MARGIN + 6 + repLabelW, cy); });
        }
        cy += LINE_H;

        // Expected fault (only if wrong)
        if (!rec.isCorrect && expectedLines.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(GRAY);
            const expLabelW = doc.getTextWidth('Esperado: ');
            doc.text('Esperado: ', MARGIN + 6, cy);
            doc.setTextColor(GREEN);
            doc.setFont('helvetica', 'normal');
            doc.text(expectedLines[0].replace('Esperado: ', ''), MARGIN + 6 + expLabelW, cy);
            expectedLines.slice(1).forEach((line: string) => { cy += LINE_H; doc.text(line, MARGIN + 6 + expLabelW, cy); });
        }

        y += cardH + 4;
    });

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = y > PAGE_H - 20 ? (doc.addPage(), 20) : PAGE_H - 12;
    doc.setTextColor('#d1d5db');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(
        'CÓDIGO DE INTEGRIDAD REPORTE PROTEGIDO BAJO PROTOCOLO AUTORYX COGNITIVE SYSTEM',
        PAGE_W / 2, footerY, { align: 'center' }
    );

    doc.save(`Reporte_Simulacion_${(applicantName || 'Operador').replace(/\s+/g, '_')}.pdf`);
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = 'main' | 'fault-category' | 'fault-bagger' | 'fault-order' | 'fault-product' | 'fault-robot' | 'fault-software' | 'fault-other';

// ─── Component ────────────────────────────────────────────────────────────────
export default function SimulatorModal({ onClose, isExamMode = false, applicantName = '', traineeIdentity = null }: SimulatorModalProps) {
    const EXAM_LENGTH = 15;

    const selectNextAdaptiveQuestion = (lastQuestion: SimulationQuestion, wasCorrect: boolean, currentQuestionsList: SimulationQuestion[]): SimulationQuestion => {
        const usedIds = new Set(currentQuestionsList.map(q => q.id));
        
        const lastQuestionDiff = lastQuestion.difficulty || 'easy';
        let targetDiff: 'easy' | 'medium' | 'hard' = lastQuestionDiff;
        if (wasCorrect) {
            if (lastQuestionDiff === 'easy') targetDiff = 'medium';
            else if (lastQuestionDiff === 'medium') targetDiff = 'hard';
        } else {
            if (lastQuestionDiff === 'hard') targetDiff = 'medium';
            else if (lastQuestionDiff === 'medium') targetDiff = 'easy';
        }
        
        const enrichedQuestions = ALL_SIMULATION_QUESTIONS.map(q => {
            const num = parseInt(q.id.replace('sq', ''), 10);
            const difficulty: 'easy' | 'medium' | 'hard' = num > 16 ? 'hard' : num > 8 ? 'medium' : 'easy';
            return { ...q, difficulty };
        });
        
        let available = enrichedQuestions.filter(q => q.difficulty === targetDiff && !usedIds.has(q.id));
        
        if (available.length === 0) {
            const fallbackOrder: Record<'easy' | 'medium' | 'hard', ('easy' | 'medium' | 'hard')[]> = {
                easy: ['medium', 'hard'],
                medium: ['hard', 'easy'],
                hard: ['medium', 'easy']
            };
            for (const diff of fallbackOrder[targetDiff]) {
                available = enrichedQuestions.filter(q => q.difficulty === diff && !usedIds.has(q.id));
                if (available.length > 0) break;
            }
        }
        
        if (available.length === 0) {
            available = enrichedQuestions.filter(q => !usedIds.has(q.id));
        }
        
        return available[Math.floor(Math.random() * available.length)];
    };

    const [showDashboard, setShowDashboard] = useState(false);
    const [currentScreen, setCurrentScreen] = useState<Screen>('main');
    const [showFaultDialog, setShowFaultDialog] = useState(false);
    const [infoDialogState, setInfoDialogState] = useState<{ show: boolean, title: string, message: string } | null>(null);
    const [isMicOn, setIsMicOn] = useState(false);

    // Exam states
    const [questions, setQuestions] = useState<SimulationQuestion[]>(() => {
        const enrichedQuestions = ALL_SIMULATION_QUESTIONS.map(q => {
            const num = parseInt(q.id.replace('sq', ''), 10);
            const difficulty: 'easy' | 'medium' | 'hard' = num > 16 ? 'hard' : num > 8 ? 'medium' : 'easy';
            return { ...q, difficulty };
        });
        const easyQuestions = enrichedQuestions.filter(q => q.difficulty === 'easy');
        return [easyQuestions[Math.floor(Math.random() * easyQuestions.length)]];
    });
    const [examQuestionIndex, setExamQuestionIndex] = useState(0);
    const [examScore, setExamScore] = useState(0);
    const [examFinished, setExamFinished] = useState(false);
    const [examFeedback, setExamFeedback] = useState<{ show: boolean, isCorrect: boolean, message: string } | null>(null);
    const [answersLog, setAnswersLog] = useState<AnswerRecord[]>([]);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [showRatingSurvey, setShowRatingSurvey] = useState(false);
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingHover, setRatingHover] = useState(0);

    const examStartTime = useRef<number | null>(null);

    // ── Estado de Pause e interactividad del Workflow ──
    const [isPaused, setIsPaused] = useState(false);
    const [workflowStep, setWorkflowStep] = useState(0);

    const WORKFLOW_STEPS = [
        { label: 'Obtener Pedido', nextMsg: 'Pedido obtenido correctamente. Siguiente paso: Escanear Producto.' },
        { label: 'Escanear Producto', nextMsg: 'Artículo escaneado y registrado en el sistema. Siguiente paso: Confirmar colocado en Bolsa/Tote.' },
        { label: 'Confirmar Colocado', nextMsg: 'Artículo colocado dentro de la bolsa o tote de forma segura. Siguiente paso: Sellar Bolsa.' },
        { label: 'Sellar Bolsa', nextMsg: 'Bolsa sellada térmicamente con éxito. Siguiente paso: Finalizar Pedido.' },
        { label: 'Finalizar Pedido', nextMsg: 'Pedido finalizado y enviado al canal de despacho. Listo para iniciar un nuevo ciclo.' }
    ];

    const handlePauseClick = () => {
        setIsPaused(true);
        setInfoDialog({
            show: true,
            title: 'Robot Pausado',
            message: 'El robot ha sido pausado de forma segura. El botón de pausa se ha convertido en HOME para retornar al robot a su posición original. IMPORTANTE: Al presionar HOME, si el robot tiene un objeto en las pinzas, lo soltará y este se caerá al suelo.'
        });
    };

    const handleHomeClick = () => {
        setIsPaused(false);
        setInfoDialog({
            show: true,
            title: 'Home (Retorno a Origen)',
            message: 'El robot ha retornado a su posición de inicio (HOME). ADVERTENCIA: Cualquier objeto que estuviera en las pinzas ha sido liberado y cayó al suelo.'
        });
    };

    const handleMarkFailedClick = () => {
        setInfoDialog({
            show: true,
            title: 'Marcar como Fallido',
            message: 'Este botón se utiliza cuando un proceso o procedimiento realizado no fue correcto. En el sistema de control (DC), marcar la tarea como fallida le indica a la IA que no debe aprender de este comportamiento erróneo.'
        });
    };

    const handleWorkflowAccept = () => {
        const currentStepData = WORKFLOW_STEPS[workflowStep];
        setInfoDialog({
            show: true,
            title: `Paso de Workflow: ${currentStepData.label}`,
            message: currentStepData.nextMsg
        });
        setWorkflowStep(prev => (prev + 1) % WORKFLOW_STEPS.length);
    };

    const setInfoDialog = (data: { show: boolean, title: string, message: string } | null) => {
        if (!data) { setInfoDialogState(null); return; }

        const nonFaultButtons = ['Ayuda / Workflow', 'Configuraciones', 'Salir', 'Home', 'Pause', 'Tele', 'Auto', 'Sleep', 'Microphone On', 'Microphone Off'];

        if (isExamMode && currentScreen.startsWith('fault-') && !nonFaultButtons.includes(data.title)) {
            const currentQ = questions[examQuestionIndex];
            const isCorrect = currentQ.expectedFaultTitle === data.title;

            setAnswersLog(prev => [...prev, {
                question: currentQ,
                reportedFault: data.title,
                isCorrect,
            }]);

            if (isCorrect) {
                setExamFeedback({ show: true, isCorrect: true, message: `¡Correcto! Identificaste la falla adecuada: ${data.title}` });
                setExamScore(prev => prev + 1);
            } else {
                setExamFeedback({ show: true, isCorrect: false, message: `Incorrecto. Reportaste "${data.title}", pero la falla correcta era "${currentQ.expectedFaultTitle}".` });
            }

            if (questions.length < EXAM_LENGTH) {
                const nextQ = selectNextAdaptiveQuestion(currentQ, isCorrect, questions);
                setQuestions(prev => [...prev, nextQ]);
            }
        } else {
            setInfoDialogState(data);
        }
    };

    const handleNextExamQuestion = () => {
        setExamFeedback(null);
        if (examQuestionIndex < questions.length - 1) {
            setExamQuestionIndex(prev => prev + 1);
            setCurrentScreen('main');
        } else {
            // Mostrar encuesta de confianza
            setShowRatingSurvey(true);
        }
    };

    const submitRatingSurvey = (rating: number) => {
        setShowRatingSurvey(false);
        setExamFinished(true);

        if (traineeIdentity) {
            setSaveStatus('saving');
            const finalScore = examScore;
            const finalPercent = Math.round((finalScore / EXAM_LENGTH) * 100);
            const finalPassed = finalPercent >= 90;
            const durationSec = examStartTime.current
                ? Math.round((Date.now() - examStartTime.current) / 1000)
                : null;

            const formattedAnswers = answersLog.map(rec => ({
                questionId: rec.question.id,
                questionText: rec.question.instruction,
                selectedText: rec.reportedFault,
                isCorrect: rec.isCorrect,
                correctText: rec.question.expectedFaultTitle
            }));

            // Agregar la valoración de confianza
            formattedAnswers.push({
                questionId: 'feedback_rating',
                questionText: '¿Qué tan seguro te sientes para resolver esta falla en el robot real ahora que usaste el simulador?',
                selectedText: String(rating),
                isCorrect: true,
                correctText: ''
            });

            saveExamResult({
                traineeId: traineeIdentity.traineeId,
                sessionId: traineeIdentity.sessionId,
                robotId: null,
                score: finalScore,
                maxScore: EXAM_LENGTH,
                passed: finalPassed,
                answers: formattedAnswers,
                durationSec: durationSec ?? undefined,
                attemptNumber: 1,
            })
                .then(() => setSaveStatus('saved'))
                .catch((err) => {
                    console.error('[Simulador] Error guardando resultado:', err);
                    setSaveStatus('error');
                });
        }
    };

    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            await generateSimPDF(
                applicantName,
                traineeIdentity?.sessionName ?? '',
                traineeIdentity?.trainerName ?? '',
                examScore,
                questions.length,
                answersLog
            );
        } catch (err) {
            console.error('Error generando PDF:', err);
            alert('Error al generar el PDF. Por favor intenta de nuevo.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => setShowDashboard(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isExamMode) {
            examStartTime.current = Date.now();
        }
    }, [isExamMode]);

    const handleElegirFault = () => setShowFaultDialog(true);
    const handleDialogAccept = () => { setShowFaultDialog(false); setCurrentScreen('fault-category'); };

    const isFaultScreen = currentScreen !== 'main' && currentScreen !== 'fault-category';

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
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
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
                                <span className="bg-[#383A40] px-3 py-1 rounded-full">
                                    Latency: {isFaultScreen ? '--' : '1101927'} ms
                                </span>
                                {isFaultScreen
                                    ? <span className="bg-[#383A40] px-3 py-1 rounded-full">Buffer: {currentScreen === 'fault-bagger' ? 33 : currentScreen === 'fault-order' ? 25 : currentScreen === 'fault-product' ? 36 : currentScreen === 'fault-robot' ? 34 : currentScreen === 'fault-software' ? 28 : 20} ms</span>
                                    : <span className="bg-[#383A40] px-3 py-1 rounded-full">Drops: 0.0%</span>
                                }
                                <span className="bg-[#383A40] px-3 py-1 rounded-full">10:49 AM</span>
                            </div>
                        </div>

                        <div className="text-center flex-1">
                            <h1 className="text-white text-xl font-bold">
                                {currentScreen === 'main' ? 'apile 3 anillos'
                                    : currentScreen === 'fault-category' ? 'Select a fault category'
                                        : 'Select a fault'}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => setInfoDialog({ show: true, title: 'Ayuda / Workflow', message: 'Este botón sirve para visualizar el flujo del proceso (workflow) y guiarte paso a paso en el entrenamiento.' })}
                                className="bg-[#00A8FC] text-white p-3 rounded-full hover:brightness-110">
                                <HelpCircle className="w-6 h-6" />
                            </button>
                            <button onClick={() => { const next = !isMicOn; setIsMicOn(next); setInfoDialog({ show: true, title: next ? 'Microphone On' : 'Microphone Off', message: 'Este botón permite encender o apagar tu micrófono.' }); }}
                                className={isMicOn ? 'bg-[#1DB954] text-white p-3 rounded-full hover:brightness-110 transition-colors' : 'bg-[#383A40] text-gray-400 border border-gray-600 p-3 rounded-full hover:brightness-110 transition-colors'}>
                                {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                            </button>
                            <button onClick={() => setInfoDialog({ show: true, title: 'Configuraciones', message: 'Este botón abre el panel de configuración del simulador.' })}
                                className="bg-[#383A40] text-gray-200 border border-gray-600 p-3 rounded-full hover:brightness-110">
                                <Settings className="w-6 h-6" />
                            </button>
                            <button onClick={() => setInfoDialog({ show: true, title: 'Salir', message: 'Este botón permite cerrar la sesión del simulador actual.' })}
                                className="bg-[#383A40] text-gray-200 border border-gray-600 p-3 rounded-full hover:brightness-110">
                                <LogOut className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Top Row Buttons */}
                    <div className="flex gap-2 mb-4">
                        {(['Home', 'Pause', 'Tele', 'Auto', 'Sleep'] as const).map((label) => (
                            <button key={label}
                                onClick={() => setInfoDialog({ show: true, title: label, message: label === 'Home' ? 'El botón Home sirve para colocar al robot en su posición inicial de reposo y calibración.' : label === 'Pause' ? 'El botón Pause se utiliza para pausar el movimiento del robot de forma inmediata.' : label === 'Tele' ? 'El botón Tele indica cuando el robot está siendo controlado por el teleoperador.' : label === 'Auto' ? 'El botón Auto es para cuando el robot está en modo autónomo.' : 'El botón Sleep coloca al robot en modo de suspensión de bajo consumo.' })}
                                className={`flex-1 font-bold py-4 rounded-xl text-xl text-white
                                    ${label === 'Pause' && currentScreen !== 'main' ? 'bg-[#00A8FC] hover:bg-[#29B6F6]'
                                        : label === 'Auto' && currentScreen === 'main' ? 'bg-[#1DB954] hover:bg-[#1ED760]'
                                            : 'bg-[#9E9E9E] hover:bg-[#BDBDBD]'}`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Exam question banner */}
                    {isExamMode && !examFinished && (
                        <div className="bg-[#FF6A00]/10 border border-[#FF6A00]/50 rounded-xl p-5 mb-4 shadow-inner">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[#FF6A00] font-black text-sm uppercase tracking-wider">
                                    Escenario {examQuestionIndex + 1} de {EXAM_LENGTH}
                                </span>
                                <span className="text-[#FF6A00] font-bold text-sm">Aciertos: {examScore}</span>
                            </div>
                            <p className="text-white text-lg font-medium leading-relaxed">
                                {questions[examQuestionIndex].instruction}
                            </p>
                        </div>
                    )}

                    {/* Robot Issues */}
                    <div className="bg-[#4A1D20] rounded-xl p-4 mb-4 border border-[#FF5252]/30">
                        <h3 className="text-white font-bold text-sm mb-1">Robot issues</h3>
                        <p className="text-[#FF5252] text-sm font-mono">• debuggable_chrome: process crashed</p>
                    </div>

                    {/* ── SCREEN: main ── */}
                    {currentScreen === 'main' && (
                        <div className="flex gap-2 mt-auto">
                            {isPaused ? (
                                <button onClick={handleHomeClick}
                                    className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#FF6A00] hover:bg-[#E65C00] text-white font-bold py-4 rounded-xl text-lg relative overflow-hidden group animate-pulse">
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                    <span className="relative">Home</span>
                                    <svg className="w-12 h-12 relative text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                </button>
                            ) : (
                                <button onClick={handlePauseClick}
                                    className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-lg relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                    <span className="relative">Pause</span>
                                    <Pause className="w-12 h-12 relative" fill="currentColor" />
                                </button>
                            )}

                            <button onClick={handleElegirFault}
                                className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg relative overflow-hidden group">
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                <span className="relative">Elegir Fault</span>
                                <Bell className="w-12 h-12 relative animate-bounce" fill="currentColor" />
                            </button>

                            <button onClick={handleMarkFailedClick}
                                className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#FFC107] hover:bg-[#FFD54F] text-white font-bold py-4 rounded-xl text-lg relative overflow-hidden group">
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                <span className="relative">Marcar como fallido</span>
                                <X className="w-12 h-12 stroke-[3] relative" />
                            </button>

                            <button onClick={handleWorkflowAccept}
                                className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#00A8FC] hover:bg-[#29B6F6] text-white font-bold py-4 rounded-xl text-lg relative overflow-hidden group">
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                <span className="relative text-base uppercase font-black tracking-wider">{WORKFLOW_STEPS[workflowStep].label}</span>
                                <Check className="w-12 h-12 stroke-[3] relative" />
                            </button>
                        </div>
                    )}

                    {/* ── SCREEN: fault-category ── */}
                    {currentScreen === 'fault-category' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                {[
                                    { label: 'Bagger', screen: 'fault-bagger' },
                                    { label: 'Order /\nPackage', screen: 'fault-order' },
                                    { label: 'Product /\nBins', screen: 'fault-product' },
                                    { label: 'Robot', screen: 'fault-robot' },
                                ].map(({ label, screen }) => (
                                    <button key={screen} onClick={() => setCurrentScreen(screen as Screen)}
                                        className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95">
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <button onClick={() => setCurrentScreen('fault-software')}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95">
                                    Headset /<br />App /<br />Software
                                </button>
                                <button onClick={() => setCurrentScreen('fault-other')}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl transition-transform active:scale-95">
                                    Other
                                </button>
                            </div>
                            <button onClick={() => setCurrentScreen('main')}
                                className="w-full bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl">
                                Exit
                            </button>
                            <div className="mt-8 text-center bg-[#FFC107]/10 p-4 rounded-xl border border-[#FFC107]/30">
                                <p className="text-[#FFC107] font-black text-lg animate-pulse tracking-wide">
                                    💡 Ve las diferentes opciones, vamos a aprender para qué sirve cada una de ellas.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── SCREEN: fault-bagger ── */}
                    {currentScreen === 'fault-bagger' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <button onClick={() => setInfoDialog({ show: true, title: 'Out of Bags', message: 'Selecciona esta opción cuando el rollo de bolsas se haya terminado y necesites reemplazarlo para que el robot continúe empaquetando.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg transition-transform active:scale-95">Out of Bags</button>
                                <button onClick={() => setInfoDialog({ show: true, title: 'Out of Labels', message: 'Selecciona esta opción cuando el rollo de etiquetas esté vacío o la impresora presente problemas para imprimir la guía.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95">Out of<br />Labels</button>
                                <button onClick={() => setInfoDialog({ show: true, title: 'Bag Jam', message: 'Selecciona esta opción cuando una bolsa se haya atascado en el mecanismo de sellado, apertura o alimentación de la Bagger.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg transition-transform active:scale-95">Bag Jam</button>
                                <button onClick={() => setInfoDialog({ show: true, title: 'Other Bagger Issue', message: 'Selecciona esta opción para cualquier otro problema relacionado con la Bagger que no esté categorizado.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95">Other<br />Bagger<br />Issue</button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentScreen('fault-category')} className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl">Back</button>
                                <button onClick={() => setCurrentScreen('main')} className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl">Exit</button>
                            </div>
                        </div>
                    )}

                    {/* ── SCREEN: fault-order ── */}
                    {currentScreen === 'fault-order' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                <button onClick={() => setInfoDialog({ show: true, title: 'Bad Seal', message: 'Selecciona esta opción si el sellado de la bolsa quedó abierto, quemado, arrugado o de alguna forma defectuoso.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg transition-transform active:scale-95">Bad Seal</button>
                                <button onClick={() => setInfoDialog({ show: true, title: "Label Won't Scan", message: 'Selecciona esta opción si el código de barras o la etiqueta están borrosos, dañados o no son legibles por el escáner.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95">Label Won't<br />Scan</button>
                                <button onClick={() => setInfoDialog({ show: true, title: 'Package Dropped in Wrong Bin', message: 'Selecciona esta opción si el robot depositó el paquete en un contenedor (bin) equivocado.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95">Package<br />Dropped in<br />Wrong Bin</button>
                                <button onClick={() => setInfoDialog({ show: true, title: 'Package Dropped on Floor', message: 'Selecciona esta opción si el paquete se cayó al piso durante el movimiento del brazo robótico.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95">Package<br />Dropped on<br />Floor</button>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <button onClick={() => setInfoDialog({ show: true, title: 'Other Order Issue', message: 'Selecciona esta opción para reportar cualquier otro problema con el paquete o la orden.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95">Other Order<br />Issue</button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentScreen('fault-category')} className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl">Back</button>
                                <button onClick={() => setCurrentScreen('main')} className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl">Exit</button>
                            </div>
                        </div>
                    )}

                    {/* ── SCREEN: fault-product ── */}
                    {currentScreen === 'fault-product' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                <button onClick={() => setInfoDialog({ show: true, title: 'Out of Product', message: 'Selecciona esta opción cuando no haya más producto disponible para ser escaneado o empacado.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95">Out of<br />Product</button>
                                <button onClick={() => setInfoDialog({ show: true, title: 'Package Bin Full', message: 'Selecciona esta opción cuando el contenedor de paquetes listos esté lleno y necesite ser vaciado.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95">Package Bin<br />Full</button>
                                <button onClick={() => setInfoDialog({ show: true, title: 'Hospital Bin Full', message: 'Selecciona esta opción cuando el contenedor de artículos rechazados esté lleno.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95">Hospital Bin<br />Full</button>
                                <button onClick={() => setInfoDialog({ show: true, title: 'Bin Location Adjustment Needed', message: 'Selecciona esta opción si el robot no está apuntando correctamente a un contenedor y requiere ajuste.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95">Bin Location<br />Adjustment<br />Needed</button>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <button onClick={() => setInfoDialog({ show: true, title: 'Product Dropped', message: 'Selecciona esta opción si el robot tiró un producto fuera de su lugar o contenedor.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95">Product<br />Dropped</button>
                                <button onClick={() => setInfoDialog({ show: true, title: 'Other Product Issue', message: 'Selecciona esta opción para reportar cualquier otro problema con el producto o contenedores.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-lg leading-tight transition-transform active:scale-95">Other<br />Product<br />Issue</button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentScreen('fault-category')} className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl">Back</button>
                                <button onClick={() => setCurrentScreen('main')} className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl">Exit</button>
                            </div>
                        </div>
                    )}

                    {/* ── SCREEN: fault-robot ── */}
                    {currentScreen === 'fault-robot' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {[
                                    { title: 'Left Arm Frozen', msg: 'Selecciona si el brazo izquierdo del robot no responde o se congeló.' },
                                    { title: 'Right Arm Frozen', msg: 'Selecciona si el brazo derecho del robot no responde o se congeló.' },
                                    { title: 'Chest Frozen', msg: 'Selecciona si el torso o pecho del robot dejó de moverse.' },
                                    { title: 'Head Cam Out', msg: 'Selecciona si la cámara de la cabeza perdió conexión o no da video.' },
                                    { title: 'Left Wrist Cam Out', msg: 'Selecciona si la cámara de la muñeca izquierda perdió conexión.' },
                                    { title: 'Right Wrist Cam Out', msg: 'Selecciona si la cámara de la muñeca derecha perdió conexión.' },
                                    { title: 'Left Gripper Not Working', msg: 'Selecciona si la pinza izquierda no abre, no cierra, o no tiene fuerza.' },
                                    { title: 'Right Gripper Not Working', msg: 'Selecciona si la pinza derecha no abre, no cierra, o no tiene fuerza.' },
                                    { title: 'Neck Frozen', msg: 'Selecciona si el cuello del robot no puede girar o se atascó.' },
                                    { title: 'Other Robot Issue', msg: 'Selecciona para reportar cualquier otro fallo de hardware del robot.' },
                                ].map(({ title, msg }) => (
                                    <button key={title} onClick={() => setInfoDialog({ show: true, title, message: msg })}
                                        className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl leading-tight transition-transform active:scale-95">
                                        {title}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentScreen('fault-category')} className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl">Back</button>
                                <button onClick={() => setCurrentScreen('main')} className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl">Exit</button>
                            </div>
                        </div>
                    )}

                    {/* ── SCREEN: fault-software ── */}
                    {currentScreen === 'fault-software' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {[
                                    { title: 'App Not Working', msg: 'Selecciona si la aplicación en tu casco o tableta se congeló, cerró inesperadamente o no responde.' },
                                    { title: 'Autonomy Not Working', msg: 'Selecciona si el sistema autónomo del robot está fallando y no puede tomar decisiones.' },
                                    { title: 'Other Headset Issue', msg: 'Selecciona para reportar cualquier otro problema técnico con el visor o software.' },
                                ].map(({ title, msg }) => (
                                    <button key={title} onClick={() => setInfoDialog({ show: true, title, message: msg })}
                                        className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-8 rounded-xl text-2xl leading-tight transition-transform active:scale-95">
                                        {title}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentScreen('fault-category')} className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl">Back</button>
                                <button onClick={() => setCurrentScreen('main')} className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl">Exit</button>
                            </div>
                        </div>
                    )}

                    {/* ── SCREEN: fault-other ── */}
                    {currentScreen === 'fault-other' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <button onClick={() => setInfoDialog({ show: true, title: 'Other', message: 'Selecciona esta opción para reportar cualquier otro problema o falla no mencionado en las secciones anteriores.' })}
                                    className="bg-[#FF3D00] hover:bg-[#FF5252] text-white font-bold py-4 rounded-xl text-xl transition-transform active:scale-95">
                                    Other
                                </button>
                                <div />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentScreen('fault-category')} className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl">Back</button>
                                <button onClick={() => setCurrentScreen('main')} className="flex-1 bg-[#9E9E9E] hover:bg-[#BDBDBD] text-white font-bold py-4 rounded-xl text-xl">Exit</button>
                            </div>
                        </div>
                    )}

                    {/* ── Info Dialog ── */}
                    {infoDialogState?.show && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 rounded-2xl backdrop-blur-md">
                            <div className="bg-white p-8 rounded-3xl max-w-lg text-center shadow-2xl animate-in zoom-in duration-300">
                                <div className="bg-blue-100 text-[#00A8FC] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <HelpCircle className="w-10 h-10 animate-pulse" fill="currentColor" />
                                </div>
                                <h2 className="text-xl font-black text-gray-800 mb-4">{infoDialogState.title}</h2>
                                <p className="text-gray-600 mb-8 text-xl leading-relaxed font-medium">{infoDialogState.message}</p>
                                <button onClick={() => setInfoDialog(null)}
                                    className="w-full bg-[#00A8FC] hover:bg-[#0086C9] text-white font-black py-4 rounded-xl text-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30">
                                    Entendido
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Exam Feedback Dialog ── */}
                    {examFeedback?.show && (
                        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 rounded-2xl backdrop-blur-md">
                            <div className="bg-[#2B2D31] border border-gray-700 p-8 rounded-3xl max-w-lg w-full text-center shadow-2xl animate-in zoom-in duration-300">
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${examFeedback.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {examFeedback.isCorrect ? <Check className="w-10 h-10" /> : <X className="w-10 h-10" />}
                                </div>
                                <h2 className={`text-2xl font-black mb-4 ${examFeedback.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {examFeedback.isCorrect ? '¡Bien hecho!' : 'Falla Incorrecta'}
                                </h2>
                                <p className="text-gray-300 mb-8 text-lg leading-relaxed font-medium">{examFeedback.message}</p>
                                <button onClick={handleNextExamQuestion}
                                    className="w-full bg-[#FF6A00] hover:bg-[#E65C00] text-white font-black py-4 rounded-xl text-xl transition-all hover:scale-105 active:scale-95 shadow-lg">
                                    {examQuestionIndex === questions.length - 1 ? 'Ver Resultados' : 'Siguiente Escenario'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Exam Rating Survey Overlay ── */}
                    {isExamMode && showRatingSurvey && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 rounded-2xl backdrop-blur-lg">
                            <div className="bg-[#181922] border border-[#FF6A00]/30 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_50px_rgba(255,106,0,0.15)] animate-in zoom-in duration-300">
                                <div className="w-16 h-16 rounded-full bg-[#FF6A00]/10 border border-[#FF6A00]/20 flex items-center justify-center mx-auto mb-6">
                                    <Star className="w-8 h-8 text-[#FF5A00]" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Encuesta de Confianza</h2>
                                <p className="text-gray-400 mb-6 text-sm">
                                    ¿Qué tan seguro te sientes para resolver esta falla en el robot real ahora que usaste el simulador de Ultra?
                                </p>
                                
                                <div className="flex items-center justify-center gap-3 mb-8">
                                    {[1, 2, 3, 4, 5].map((val) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setRatingValue(val)}
                                            onMouseEnter={() => setRatingHover(val)}
                                            onMouseLeave={() => setRatingHover(0)}
                                            className="p-1 transition-transform hover:scale-125 focus:outline-none"
                                        >
                                            <Star
                                                className={`w-10 h-10 transition-colors ${
                                                    val <= (ratingHover || ratingValue)
                                                        ? 'text-[#FF5A00] fill-[#FF5A00]'
                                                        : 'text-neutral-600'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>

                                <div className="text-xs text-[#FF5A00] font-semibold mb-6 uppercase tracking-wider h-4">
                                    {ratingValue === 1 && 'Nada seguro'}
                                    {ratingValue === 2 && 'Poco seguro'}
                                    {ratingValue === 3 && 'Seguro'}
                                    {ratingValue === 4 && 'Muy seguro'}
                                    {ratingValue === 5 && 'Totalmente seguro (Listo para operar)'}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => submitRatingSurvey(ratingValue)}
                                    disabled={ratingValue === 0}
                                    className="w-full bg-[#FF6A00] hover:bg-[#E65C00] disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-[#FF6A00]/20"
                                >
                                    Ver Resultados
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Exam Results Screen ── */}
                    {isExamMode && examFinished && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 rounded-2xl backdrop-blur-lg">
                            <div className="bg-[#2B2D31] border border-[#FF6A00]/30 p-10 rounded-3xl max-w-xl w-full text-center shadow-[0_0_50px_rgba(255,106,0,0.15)] animate-in zoom-in duration-500">
                                {(() => {
                                    const pct = Math.round((examScore / questions.length) * 100);
                                    const pass = pct >= 80;
                                    return (
                                        <>
                                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${pass ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                                {pass
                                                    ? <Check className="w-12 h-12 text-emerald-400" />
                                                    : <X className="w-12 h-12 text-red-400" />}
                                            </div>
                                            <h2 className="text-3xl font-black text-white mb-2">
                                                {pass ? '¡Simulación Aprobada!' : 'Simulación No Aprobada'}
                                            </h2>
                                            <p className="text-gray-400 mb-6 text-lg">
                                                {pass
                                                    ? 'Has identificado las fallas correctamente y superado el umbral requerido.'
                                                    : 'Necesitas 80% o más para aprobar. Descarga el reporte para revisar tus errores.'}
                                            </p>

                                            <div className="bg-black/50 rounded-2xl p-6 mb-8 border border-gray-800">
                                                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Puntuación de Precisión</div>
                                                <div className={`text-6xl font-black ${pass ? 'text-emerald-400' : 'text-red-400'}`}>{pct}%</div>
                                                <div className="text-gray-400 mt-2 font-medium">
                                                    Identificaste correctamente {examScore} de {questions.length} fallas.
                                                </div>

                                                {/* Estado de guardado en Supabase */}
                                                {traineeIdentity && (
                                                    <div className={`mt-4 pt-4 border-t border-neutral-850 flex items-center justify-center gap-2 text-xs font-semibold ${
                                                        saveStatus === 'saving' ? 'text-gray-400' :
                                                        saveStatus === 'saved'  ? 'text-emerald-400' :
                                                        saveStatus === 'error'  ? 'text-red-400' : 'text-gray-450'
                                                    }`}>
                                                        {saveStatus === 'saving' && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando resultado...</>}
                                                        {saveStatus === 'saved'  && <><CheckCircle2 className="w-3.5 h-3.5" /> Resultado guardado en el sistema</>}
                                                        {saveStatus === 'error'  && <><AlertCircle className="w-3.5 h-3.5" /> No se pudo guardar — revisa conexión</>}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <button onClick={handleDownloadPDF} disabled={isGeneratingPdf}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl text-lg flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-50">
                                                    <Download className="w-5 h-5" />
                                                    {isGeneratingPdf ? 'Generando PDF...' : 'Descargar Reporte PDF'}
                                                </button>
                                                <button onClick={onClose}
                                                    className="w-full bg-[#FF6A00] hover:bg-[#E65C00] text-white font-black py-4 rounded-xl text-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#FF6A00]/20">
                                                    Cerrar y Volver al Menú
                                                </button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* ── Elegir Fault Dialog ── */}
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
                                <button onClick={handleDialogAccept}
                                    className="w-full bg-[#FF3D00] hover:bg-[#E63900] text-white font-black py-4 rounded-xl text-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30">
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