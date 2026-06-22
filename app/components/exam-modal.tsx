import React, { useState } from 'react';
import { X, ChevronRight, CheckCircle2, AlertCircle, Download, User, Lock, Loader2, Star } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { validateAndRegisterTrainee, saveExamResult, TraineeIdentity } from '../lib/training';

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
        question: 'En la Bagger, una bolsa queda fuera de posición. ¿Qué deberias de hacer?',
        options: [
            'Retirar la bolsa, colocarla en la bin que esta en la parte superior y mandar el reprint label para que genere una nueva reimpresion de el pedido en ese momento no terminado',
            'Cancelar el pedido y esperar instrucciones',
            'Detener el proceso en donde este, mandar el robot a posicion de HOME',
            'Nada, continuar con el pedido'
        ],
        correctIndex: 0,
        explanation: 'Se debe de retirar la bolsa y colocar en la bin superior, mandar el reprint label que es el boton amarillo en la UI y continuar con el pedido, esto es por que si esta fuera de posicion, no va a cerrar bien la bolsa.'
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
            'La bolsa pequeña (medida estándar)',
            'La bolsa de mayor tamaño',
            'Una caja compacta',
            'No se requiere bolsa, se colocan sueltos'
        ],
        correctIndex: 1,
        explanation: 'De acuerdo con el consejo de operación del robot Phil, si el tote contiene 6 productos o más se ocupa la bolsa de mayor tamaño, y si tiene 5 productos o menos se ocupa la bolsa pequeña (medida estándar).'
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
        question: 'En las estaciones de Packie y Future, si la Bagger arroja la bolsa sin abrir por causa del aire con los grippers cerrados, ¿qué acción corrective debes tomar?',
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
            'Colocar la pinza in la parte superior para suspender la bolsa'
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
        question: 'Si detectas que la bolsa de un paquete quedó arrugada, quemada o mal cerrada en los extremos (aplica a Packie, Future, Fleetwood o Bagger Label), ¿qué fallo reportarías?',
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
        question: '¿Cuándo es correcto seleccionar la opción "Out of Product" (Falla Global)?',
        options: [
            'Cuando el rack de bolsas está vacío',
            'Cuando ya no hay artículos físicos en la zona de alimentación o cuando no hay un lote (batch) cargado para seguir el trabajo',
            'Cuando el robot tira un producto al suelo',
            'Cuando la cámara de la cabeza falla'
        ],
        correctIndex: 1,
        explanation: '"Out of Product" se reporta de forma global para todos los robots cuando se agota el producto en la zona o cuando no hay batch cargada en el sistema para continuar el trabajo.'
    },
    {
        id: 'q14',
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
        id: 'q15',
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
        id: 'q16',
        question: '¿En qué casos se debe reportar la falla "Bin Location Adjustment Needed"?',
        options: [
            'Cuando no hay bin de depósito, el robot no lo alcanza físicamente, o en el caso de Customer no está el bin del color solicitado',
            'Cuando el robot tira un paquete al suelo de la estación',
            'Cuando la aplicación del visor se congela inesperadamente',
            'Cuando el brazo izquierdo se detiene a la mitad del recorrido'
        ],
        correctIndex: 0,
        explanation: 'Se reporta "Bin Location Adjustment Needed" cuando no hay bin de depósito, el robot no lo alcanza, o el contenedor de Customer no es del color solicitado.'
    },
    {
        id: 'q17',
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
        id: 'q18',
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
        id: 'q19',
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
        id: 'q20',
        question: '¿Para qué sirve reportar la falla con la opción "Other" en la pantalla de selección de fallos del simulador?',
        options: [
            'Para reiniciar el robot automáticamente',
            'Para reportar cualquier otro problema técnico o falla que no haya sido mencionado en las categorías anteriores de la capacitación',
            'Para apagar las cámaras de seguridad',
            'Para pausar el simulador indefinidamente'
        ],
        correctIndex: 1,
        explanation: '"Other" se reserva para fallas y problemas imprevistos que no coinciden con ninguna de las opciones específicas provistas en el menú.'
    },
    {
        id: 'q21',
        question: '¿Cuál de los siguientes robots utiliza un flujo de trabajo basado exclusivamente en contenedores (Totes) en lugar de una embolsadora (Bagger)?',
        options: [
            'Packie 2.0',
            'Future 2.0',
            'Phil',
            'Bagger Label'
        ],
        correctIndex: 2,
        explanation: 'El robot Phil opera con el flujo de trabajo de Totes (contenedores), mientras que robots como Packie, Future y Bagger Label utilizan embolsadoras (Baggers).'
    },
    {
        id: 'q22',
        question: 'Si en tu visor de control la cámara principal de la cabeza del robot pierde señal completamente, ¿qué reporte debes levantar?',
        options: [
            'Left Wrist Cam Out',
            'Right Wrist Cam Out',
            'Head Cam Out',
            'App Not Working'
        ],
        correctIndex: 2,
        explanation: '"Head Cam Out" se selecciona cuando la cámara principal ubicada en la cabeza del robot pierde señal o deja de transmitir video.'
    },
    {
        id: 'q23',
        question: 'Si observas un atoramiento físico debajo de la mesa de operación y el brazo del robot está mal posicionado haciendo fuerza, ¿cuál es la acción correcta?',
        options: [
            'Presionar el botón HOME para forzar la autorecuperación',
            'Escalar e informar de inmediato al supervisor en turno para evitar daños mayores y forzado de motores',
            'Tratar de mover el brazo manualmente aplicando fuerza física',
            'Pausar la celda y esperar a que el robot se desatore solo'
        ],
        correctIndex: 1,
        explanation: 'Cuando el robot está en una posición comprometida o atorado debajo de la estructura, intentar hacer HOME puede jalar la mesa y forzar los motores. Se debe avisar inmediatamente al supervisor.'
    },
    {
        id: 'q24',
        question: 'En el Caso de Estudio 2 de seguridad, ¿cuál es el peligro principal asociado con la caída o desprendimiento de una impresora térmica de su posición?',
        options: [
            'Pérdida de la conexión a internet en toda la nave',
            'Provocar daños materiales al equipo y un alto riesgo de lesiones físicas al personal circundante si cae o proyecta algún objeto',
            'Que el robot entre de inmediato en modo de desarrollo "held for dev"',
            'Ninguno, las impresoras están diseñadas para soportar caídas repetidas'
        ],
        correctIndex: 1,
        explanation: 'La caída de una impresora térmica no solo daña el equipo, sino que representa un grave peligro de golpe o proyección para el personal de DC, Customer o Training alrededor.'
    },
    {
        id: 'q25',
        question: 'Si el robot está en una posición incorrecta o comprometida, ¿por qué es imperativo contactar al supervisor antes de enviar cualquier comando de Home?',
        options: [
            'Porque el supervisor es el único que puede autorizar la impresión de etiquetas',
            'Porque el robot puede jalar la estructura física, forzar los motores y causar daños catastróficos que requieran escalaciones mayores',
            'Para verificar si las cámaras de la muñeca están calibradas',
            'No es imperativo; el operador siempre debe tratar de solucionarlo solo primero'
        ],
        correctIndex: 1,
        explanation: 'Mandar comandos de movimiento cuando el robot está mecánicamente trabado o comprometido daña los actuadores y fuerza los servomotores.'
    },
    {
        id: 'q26',
        question: '¿Quién tiene la capacidad y autorización total de intervenir directamente para resolver atoramientos mecánicos graves sin forzar el sistema?',
        options: [
            'El operador en entrenamiento (Trainee) por su cuenta',
            'El supervisor en turno, quien cuenta con la capacidad para resolver y prevenir escalaciones',
            'Cualquier persona que pase cerca de la celda de empaque',
            'Nadie, se debe esperar a que el robot se apague por software'
        ],
        correctIndex: 1,
        explanation: 'El supervisor en turno está capacitado para actuar de forma segura ante situaciones de riesgo y evitar daños mecánicos costosos en la celda.'
    },
    {
        id: 'q27',
        question: 'Escenario: Estás operando y el robot se atora debajo de la mesa. La mesa comienza a vibrar y a moverse ligeramente. El software te da la opción de mandar a HOME. Y tú, ¿qué harías?',
        options: [
            'Presionar HOME rápidamente para ganarle al tiempo del ciclo',
            'Ignorar la vibración y mandar un comando de autonomía',
            'Detener todo movimiento y notificar inmediatamente al supervisor que el robot está atorado y comprometido',
            'Mover el torso del robot manualmente usando el joystick'
        ],
        correctIndex: 2,
        explanation: 'Ante cualquier vibración o atoramiento físico, no se debe intentar mover el robot sin antes avisar al supervisor en turno.'
    },
    {
        id: 'q28',
        question: 'Escenario: Durante tus movimientos con el torso, golpeas accidentalmente la base de la impresora de etiquetas y ves que se inclina peligrosamente fuera de su base. Y tú, ¿qué harías?',
        options: [
            'Continuar la operación asumiendo que no se va a caer',
            'Escalar de forma imperativa la situación de riesgo al supervisor en turno antes de que caiga y dañe a alguien o al equipo',
            'Esperar a que termine el turno para acomodarla',
            'Empujar el robot para que la detenga con el brazo'
        ],
        correctIndex: 1,
        explanation: 'Cualquier situación de riesgo o peligro de caída de periféricos pesados debe ser reportada de forma imperativa al supervisor de inmediato.'
    },
    {
        id: 'q29',
        question: 'Escenario: El robot está fuera de su posición normal y notas que una de las pinzas (grippers) está presionando con fuerza la mesa metálica. El sistema te pide enviar un comando de reinicio de motores. Y tú, ¿qué harías?',
        options: [
            'Reincorporar los motores desde el headset sin revisar la posición',
            'Pausar de inmediato y pedir al supervisor que evalúe la posición antes de forzar los motores y dañar los grippers',
            'Estirar el brazo del robot manualmente para destrabarlo',
            'Apagar la luz de la torreta y continuar operando'
        ],
        correctIndex: 1,
        explanation: 'Si el gripper está ejerciendo fuerza constante sobre una superficie rígida, reiniciar motores o mandar Home forzará las articulaciones del brazo.'
    },
    {
        id: 'q30',
        question: 'Escenario: Ves que una persona del equipo on-site ingresa al perímetro del robot para acomodar la impresora que está mal colocada, pero no ha pausado el robot por completo. Y tú, ¿qué harías?',
        options: [
            'Esperar a que la persona termine su ajuste y no reportar nada',
            'Detener de inmediato todo movimiento del robot presionando el paro de emergencia o pausa y notificar al supervisor',
            'Mandar al robot a HOME para que no estorbe a la persona',
            'Apagar únicamente la cámara de la cabeza para no ver el accidente'
        ],
        correctIndex: 1,
        explanation: 'La seguridad física del personal es la máxima prioridad. Se debe detener inmediatamente el robot si alguien ingresa al perímetro de trabajo sin el bloqueo correspondiente.'
    }
];

// ─── Helper: shuffle options and adjust correctIndex ──────────────────────────
function shuffleQuestionOptions(q: Question): Question {
    const optionsWithOriginalIndices = q.options.map((opt, idx) => ({
        text: opt,
        originalIndex: idx,
    }));
    // Mezcla aleatoria simple
    const shuffledOptions = [...optionsWithOriginalIndices].sort(() => Math.random() - 0.5);
    // Encontrar el nuevo índice correcto
    const correctIndex = shuffledOptions.findIndex(item => item.originalIndex === q.correctIndex);
    return {
        ...q,
        options: shuffledOptions.map(item => item.text),
        correctIndex,
    };
}


interface ExamModalProps {
    onClose: () => void;
    onLaunchSimulatorExam?: (applicantName: string, traineeIdentity: TraineeIdentity | null) => void;
}

interface UserAnswerLog {
    questionId: string;
    questionText: string;
    isCorrect: boolean;
    selectedText: string;
    correctText: string;
}

// ─── Helper: wrap text and return lines ───────────────────────────────────────
function splitLines(doc: jsPDF, text: string, maxWidth: number): string[] {
    return doc.splitTextToSize(text, maxWidth) as string[];
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

// ─── PDF generation (pure jsPDF, no html2canvas) ──────────────────────────────
async function generatePDF(
    applicantName: string,
    sessionName: string,
    trainerName: string,
    score: number,
    total: number,
    percent: number,
    passed: boolean,
    answersLog: UserAnswerLog[]
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

    let y = 0;

    // ── Intenta cargar el logo de Ultra ──────────────────────────────────────
    const logoBase64 = await loadImageAsBase64('/ultra_logo.png');

    // ── Header con logo (banda naranja delgada + logo en blanco) ─────────────
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
    doc.text('REPORTE DE EVALUACIÓN', MARGIN + 54, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(GRAY);
    doc.text('AUTORYX STACK — INTELLIGENT TRAINING SYSTEM', MARGIN + 54, 29);

    // Fecha + ID en top-right
    doc.setFontSize(7);
    const dateStr = new Date().toLocaleDateString('es-MX');
    doc.text(`EMISIÓN: ${dateStr}`, PAGE_W - MARGIN, 16, { align: 'right' });
    doc.text(`ID: TX9X_TRAINING`, PAGE_W - MARGIN, 22, { align: 'right' });
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
    doc.text('PORCENTAJE', PAGE_W - MARGIN - 48, y + 8);
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
    doc.text(`${score}/${total}`, PAGE_W - MARGIN - 16, y + 18);

    y += 36;

    // ── Section title ─────────────────────────────────────────────────────────
    doc.setTextColor(GRAY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('AUDITORÍA OPERATIVA DE RESPUESTAS', MARGIN, y);
    doc.setDrawColor('#e5e7eb');
    doc.line(MARGIN, y + 2, PAGE_W - MARGIN, y + 2);

    y += 10;

    // ── Answer cards ──────────────────────────────────────────────────────────
    answersLog.forEach((log, index) => {
        const LINE_H = 4.5;
        const BADGE_ROW_H = 10; // fila exclusiva para el badge
        const TEXT_W = CONTENT_W - 12; // ancho completo del texto (sin reservar espacio para badge)

        // IMPORTANTE: Establecer el tamaño y tipo de letra del documento ANTES de llamar a splitLines
        // para que jsPDF calcule las longitudes y saltos de línea con las dimensiones correctas.
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        const qLines = splitLines(doc, `${index + 1}. ${log.questionText}`, TEXT_W);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        const selLines = splitLines(doc, log.selectedText, TEXT_W - 20);
        const corrLines = !log.isCorrect
            ? splitLines(doc, log.correctText, TEXT_W - 26)
            : [];

        const cardH =
            BADGE_ROW_H +
            qLines.length * LINE_H + 4 +
            LINE_H + selLines.length * LINE_H + // "Seleccionado:"
            (!log.isCorrect ? LINE_H + corrLines.length * LINE_H : 0) + // "Solución correcta:"
            6;

        // Salto de página si no cabe
        if (y + cardH > PAGE_H - 20) {
            doc.addPage();
            y = 20;
        }

        // Fondo de la tarjeta
        const bgColor = log.isCorrect ? '#f0fdf4' : '#fff7f7';
        doc.setFillColor(bgColor);
        doc.roundedRect(MARGIN, y, CONTENT_W, cardH, 2, 2, 'F');

        // Barra de acento izquierda
        doc.setFillColor(log.isCorrect ? GREEN : RED);
        doc.rect(MARGIN, y, 3, cardH, 'F');

        // ── FILA 1: Número de pregunta (izquierda) + Badge (derecha) ──
        const badgeText = log.isCorrect ? 'CORRECTA' : 'INCORRECTA';
        const badgeColor = log.isCorrect ? GREEN : RED;
        const badgeW = log.isCorrect ? 20 : 24;

        // Badge en esquina superior derecha de la fila del badge
        doc.setFillColor(badgeColor);
        doc.roundedRect(MARGIN + CONTENT_W - badgeW - 4, y + 3, badgeW, 5.5, 1, 1, 'F');
        doc.setTextColor('#ffffff');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.text(badgeText, MARGIN + CONTENT_W - (badgeW / 2) - 4, y + 7, { align: 'center' });

        // Número de pregunta en fila badge
        doc.setTextColor(log.isCorrect ? GREEN : RED);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(`Pregunta ${index + 1}`, MARGIN + 6, y + 7.5);

        // ── FILA 2+: Texto de la pregunta ──
        let cy = y + BADGE_ROW_H + 2;
        doc.setTextColor(DARK);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        qLines.forEach((line: string) => {
            doc.text(line, MARGIN + 6, cy);
            cy += LINE_H;
        });

        cy += 4;

        // Respuesta seleccionada
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(GRAY);
        doc.text('Seleccionado:', MARGIN + 6, cy);
        cy += LINE_H;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(log.isCorrect ? GREEN : RED);
        selLines.forEach((line: string) => {
            doc.text(line, MARGIN + 10, cy);
            cy += LINE_H;
        });

        // Respuesta correcta (solo si falló)
        if (!log.isCorrect && corrLines.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(GRAY);
            doc.text('Solución correcta:', MARGIN + 6, cy);
            cy += LINE_H;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(GREEN);
            corrLines.forEach((line: string) => {
                doc.text(line, MARGIN + 10, cy);
                cy += LINE_H;
            });
        }

        y += cardH + 4;
    });

    // ── Footer ────────────────────────────────────────────────────────────────
    if (y > PAGE_H - 20) {
        doc.addPage();
        y = PAGE_H - 16;
    } else {
        y = PAGE_H - 12;
    }
    doc.setTextColor('#d1d5db');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(
        'CÓDIGO DE INTEGRIDAD REPORTE PROTEGIDO BAJO PROTOCOLO AUTORYX COGNITIVE SYSTEM',
        PAGE_W / 2,
        y,
        { align: 'center' }
    );

    doc.save(`Reporte_Evaluacion_${applicantName.replace(/\s+/g, '_')}.pdf`);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ExamModal({ onClose, onLaunchSimulatorExam }: ExamModalProps) {
    const [step, setStep] = useState<'identity' | 'selection' | 'teorico'>('identity');
    const [applicantName, setApplicantName] = useState<string>('');
    const [sessionPin, setSessionPin] = useState<string>('');
    const [traineeIdentity, setTraineeIdentity] = useState<TraineeIdentity | null>(null);
    const [isValidating, setIsValidating] = useState<boolean>(false);
    const [validationError, setValidationError] = useState<string>('');
    const [questions, setQuestions] = useState<Question[]>(() => {
        const shuffled = [...EXAM_QUESTIONS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 10).map(shuffleQuestionOptions);
    });
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState<boolean>(false);
    const [score, setScore] = useState<number>(0);
    const [isFinished, setIsFinished] = useState<boolean>(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
    const [answersLog, setAnswersLog] = useState<UserAnswerLog[]>([]);

    // ── Fase 3: tracking de duración, intentos y estado de guardado ──
    const examStartTime = React.useRef<number | null>(null);
    const [attemptCount, setAttemptCount] = useState<number>(1);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [showRatingSurvey, setShowRatingSurvey] = useState(false);
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingHover, setRatingHover] = useState(0);

    const question = questions[currentStep];
    const percent = Math.round((score / questions.length) * 100);
    const passed = percent >= 80;

    const handleStart = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!applicantName.trim()) return;
        setValidationError('');
        setIsValidating(true);

        try {
            // Si hay PIN, intentamos validarlo con Supabase
            if (sessionPin.trim()) {
                const identity = await validateAndRegisterTrainee(sessionPin, applicantName);
                setTraineeIdentity(identity);
            }
            // Si no hay PIN, continuamos en modo sin persistencia (modo degradado)
            setStep('selection');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error desconocido.';
            setValidationError(msg);
        } finally {
            setIsValidating(false);
        }
    };

    const handleSelectOption = (idx: number) => {
        if (isAnswered || !question) return;
        setSelectedOption(idx);
        setIsAnswered(true);

        const isCorrect = idx === question.correctIndex;
        if (isCorrect) setScore(prev => prev + 1);

        setAnswersLog(prev => [
            ...prev,
            {
                questionId: question.id,
                questionText: question.question,
                isCorrect,
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
            // Mostrar encuesta de confianza antes de finalizar
            setShowRatingSurvey(true);
        }
    };

    const submitRatingSurvey = (rating: number) => {
        setShowRatingSurvey(false);
        setIsFinished(true);

        const finalScore = score;
        const finalPercent = Math.round((finalScore / questions.length) * 100);
        const finalPassed = finalPercent >= 80;
        const durationSec = examStartTime.current
            ? Math.round((Date.now() - examStartTime.current) / 1000)
            : null;

        // Clonar y agregar la valoración de confianza al log de respuestas
        const finalAnswers = [
            ...answersLog,
            {
                questionId: 'feedback_rating',
                questionText: '¿Qué tan seguro te sientes para resolver esta falla en el robot real ahora que usaste el simulador?',
                isCorrect: true,
                selectedText: String(rating),
                correctText: ''
            }
        ];

        // Solo persistir si hay identidad vinculada (PIN válido)
        if (traineeIdentity) {
            setSaveStatus('saving');
            saveExamResult({
                traineeId: traineeIdentity.traineeId,
                sessionId: traineeIdentity.sessionId,
                robotId: null,
                score: finalScore,
                maxScore: questions.length,
                passed: finalPassed,
                answers: finalAnswers,
                durationSec: durationSec ?? undefined,
                attemptNumber: attemptCount,
            })
                .then(() => setSaveStatus('saved'))
                .catch((err) => {
                    console.error('[Fase 3] Error guardando resultado:', err);
                    setSaveStatus('error');
                });
        }
    };

    const handleRetry = () => {
        const shuffled = [...EXAM_QUESTIONS].sort(() => 0.5 - Math.random());
        setQuestions(shuffled.slice(0, 10).map(shuffleQuestionOptions));
        setCurrentStep(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setScore(0);
        setIsFinished(false);
        setAnswersLog([]);
        setSaveStatus('idle');
        setAttemptCount(prev => prev + 1);
        examStartTime.current = Date.now(); // reiniciar cronómetro
    };

    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            await generatePDF(
                applicantName,
                traineeIdentity?.sessionName ?? '',
                traineeIdentity?.trainerName ?? '',
                score,
                questions.length,
                percent,
                passed,
                answersLog
            );
        } catch (error) {
            console.error('Error generando el PDF:', error);
            alert('Error al generar el PDF. Por favor intenta de nuevo.');
        } finally {
            setIsGeneratingPdf(false);
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
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto grow">

                    {/* STEP: identity */}
                    {step === 'identity' && (
                        <form onSubmit={handleStart} className="flex flex-col items-center justify-center py-8 animate-in fade-in duration-300">
                            <div className="bg-orange-50 text-[#FF6A00] w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                <User className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-neutral-900 mb-2">Registro de Aplicante</h3>
                            <p className="text-neutral-500 mb-6 max-w-sm text-center text-sm">
                                Ingresa tu nombre y el PIN de tu sesión de training para registrar tus resultados.
                            </p>
                            <div className="w-full max-w-md flex flex-col gap-4">
                                {/* Campo Nombre */}
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        required
                                        value={applicantName}
                                        onChange={(e) => setApplicantName(e.target.value)}
                                        placeholder="Nombre y Apellidos"
                                        disabled={isValidating}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-[#FF6A00] transition-all text-neutral-800 disabled:opacity-50"
                                    />
                                </div>

                                {/* Campo PIN */}
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={sessionPin}
                                        onChange={(e) => {
                                            setSessionPin(e.target.value.replace(/\D/g, '').toUpperCase());
                                            setValidationError('');
                                        }}
                                        placeholder="PIN de sesión (6 dígitos — opcional)"
                                        disabled={isValidating}
                                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all text-neutral-800 font-mono tracking-widest disabled:opacity-50 ${
                                            validationError
                                                ? 'border-red-400 focus:border-red-500 bg-red-50'
                                                : 'border-neutral-200 focus:border-[#FF6A00]'
                                        }`}
                                    />
                                </div>

                                {/* Error de validación */}
                                {validationError && (
                                    <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm animate-in fade-in duration-200">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{validationError}</span>
                                    </div>
                                )}

                                {/* Hint PIN */}
                                {!validationError && (
                                    <p className="text-xs text-neutral-400 text-center">
                                        El PIN es proporcionado por tu Trainer. Sin PIN el examen funciona pero el resultado no se guardará en el sistema.
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isValidating || !applicantName.trim()}
                                    className="w-full bg-[#FF6A00] hover:bg-[#E65C00] text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isValidating ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Validando...</>
                                    ) : (
                                        <><ChevronRight className="w-4 h-4" /> Continuar a Selección</>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* STEP: selection */}
                    {step === 'selection' && (
                        <div className="flex flex-col items-center justify-center py-8 animate-in fade-in duration-300">
                            <h3 className="text-2xl font-black text-neutral-900 mb-2">Selecciona la Modalidad</h3>
                            <p className="text-neutral-500 mb-8 max-w-sm text-center text-sm">
                                Hola <span className="font-bold text-neutral-800">{applicantName}</span>, elige si deseas realizar el examen teórico o el práctico.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg">
                                <button onClick={() => {
                                    examStartTime.current = Date.now();
                                    setStep('teorico');
                                }} className="bg-white border-2 border-neutral-200 hover:border-[#FF6A00] p-6 rounded-2xl flex flex-col items-center gap-4 transition-all hover:scale-105 group">
                                    <div className="bg-orange-50 text-[#FF6A00] w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <AlertCircle className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <h4 className="text-lg font-black text-neutral-800">Examen Teórico</h4>
                                        <p className="text-xs text-neutral-500 mt-2">Evaluación integral con reportes de fallas automatizados.</p>
                                    </div>
                                </button>
                                <button onClick={() => onLaunchSimulatorExam && onLaunchSimulatorExam(applicantName, traineeIdentity)} className="bg-white border-2 border-neutral-200 hover:border-[#FF6A00] p-6 rounded-2xl flex flex-col items-center gap-4 transition-all hover:scale-105 group">
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
                            showRatingSurvey ? (
                                <div className="flex flex-col items-center justify-center py-6 text-center animate-in zoom-in duration-300">
                                    <div className="w-16 h-16 rounded-full bg-[#FF6A00]/10 border border-[#FF6A00]/25 flex items-center justify-center mx-auto mb-6">
                                        <Star className="w-8 h-8 text-[#FF6A00]" />
                                    </div>
                                    
                                    <h3 className="text-2xl font-black text-neutral-800 mb-2">Encuesta de Confianza</h3>
                                    <p className="text-neutral-500 mb-8 max-w-sm text-sm">
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
                                                            ? 'text-[#FF6A00] fill-[#FF6A00]'
                                                            : 'text-neutral-300'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="text-xs text-[#FF6A00] font-bold mb-8 uppercase tracking-wider h-4">
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
                                        className="w-full bg-[#FF6A00] hover:bg-[#E65C00] disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-orange-500/10 text-sm max-w-sm"
                                    >
                                        Ver Resultados
                                    </button>
                                </div>
                            ) : (
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
                                            <button key={idx} onClick={() => handleSelectOption(idx)} disabled={isAnswered}
                                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-4 ${btnClass}`}>
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
                        )
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
                                            Has completado la prueba. Genera tu reporte aquí mismo para revisar detalladamente tus respuestas.
                                        </p>
                                    </>
                                )}

                            {/* Puntuación + estado de guardado */}
                                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 w-full max-w-sm mb-6">
                                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">Puntuación Final</div>
                                    <div className={`text-5xl font-black ${passed ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {percent}%
                                    </div>
                                    <div className="text-xs text-neutral-400 mt-2 font-medium">
                                        Aciertos: {score} de {questions.length} (Requerido: 80%)
                                    </div>

                                    {/* Estado de guardado en Supabase */}
                                    {traineeIdentity && (
                                        <div className={`mt-3 pt-3 border-t border-neutral-200 flex items-center gap-2 text-xs font-semibold ${
                                            saveStatus === 'saving' ? 'text-neutral-400' :
                                            saveStatus === 'saved'  ? 'text-emerald-600' :
                                            saveStatus === 'error'  ? 'text-red-500' : 'text-neutral-400'
                                        }`}>
                                            {saveStatus === 'saving' && <><Loader2 className="w-3 h-3 animate-spin" /> Guardando resultado...</>}
                                            {saveStatus === 'saved'  && <><CheckCircle2 className="w-3 h-3" /> Resultado guardado en el sistema</>}
                                            {saveStatus === 'error'  && <><AlertCircle className="w-3 h-3" /> No se pudo guardar — revisa conexión</>}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm justify-center items-center">
                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={isGeneratingPdf}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-50 text-sm"
                                    >
                                        <Download className="w-4 h-4" />
                                        {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
                                    </button>

                                    {!passed ? (
                                        <button onClick={handleRetry} className="w-full bg-[#FF6A00] hover:bg-[#E65C00] text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all hover:scale-105 text-sm">
                                            Reintentar
                                        </button>
                                    ) : (
                                        <button onClick={onClose} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-6 py-3 rounded-xl font-bold transition-all text-sm">
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
                        <button onClick={handleNext} disabled={!isAnswered}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${isAnswered ? 'bg-[#FF6A00] text-white hover:bg-[#E65C00] shadow-md hover:scale-105' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}`}>
                            {currentStep === questions.length - 1 ? 'Finalizar' : 'Siguiente Pregunta'}
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}