import React, { useState, useEffect } from 'react';
import { X, ChevronRight, CheckCircle2, AlertCircle, Download, User, Lock, Loader2, Star, Award } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { validateAndRegisterTrainee, saveExamResult, TraineeIdentity, cleanAndFormatName, getApprovedLevelsByName } from '../lib/training';
import { supabase } from '../lib/supabase';

interface Question {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    category?: 'Training 1' | 'Training 2' | 'Training 3' | 'DC' | 'Customer';
}

// ==========================================
// 📘 BANCO DE PREGUNTAS (ESTRUCTURADO JERÁRQUICAMENTE)
// ==========================================

// --- CATEGORÍA 1: TRAINING 1 ---
const TRAINING_1_QUESTIONS: Question[] = [
    {
        id: 'q_t1_1',
        question: 'Al iniciar la operación en el robot real, ¿cuál es la postura física que debe tomar el operador para evitar desalineaciones?',
        options: [
            'Trabajar con los brazos totalmente estirados hacia el frente.',
            'Operar con las manos muy pegadas al pecho y los codos flexionados.',
            'Mantener una postura erguida y centrar el torso alineado con la posición física de HOME para un correcto manejo',
            'Agacharse y mirar hacia el suelo para calibrar los sensores.'
        ],
        correctIndex: 2,
        explanation: 'Para asegurar que el tracking de los brazos y el torso funcione correctamente sin descalibrar el robot, el operador debe tomar una posición erguida y centrar su torso alineado con la posición de HOME.',
        difficulty: 'easy',
        category: 'Training 1'
    },
    {
        id: 'q_t1_2',
        question: 'Durante la operación, si notas que el hombro del robot comienza a visualizarse constantemente en la pantalla operativa, ¿qué significa esto y qué riesgo representa?',
        options: [
            'Significa que el robot necesita una actualización de software y se apagará en 5 minutos.',
            'Significa que estás operando muy cerca del pecho, lo cual fuerza las articulaciones y puede provocar movimientos erráticos en los brazos',
            'Es una señal normal que indica que el robot está operando a máxima velocidad de empaque.',
            'Significa que la cámara de la cabeza perdió conexión con la red principal.'
        ],
        correctIndex: 1,
        explanation: 'Visualizar el hombro del robot de forma persistente en la pantalla operativa indica que el operador está trabajando con las manos muy cerca de su pecho, forzando los límites articulares del robot, lo cual puede generar movimientos erráticos y pérdida de alineación.',
        difficulty: 'easy',
        category: 'Training 1'
    },
    {
        id: 'q_t1_3',
        question: 'Durante la preparación de tu estación de trabajo (station), ¿qué medida es indispensable tomar respecto a la alimentación eléctrica del visor o headset para evitar desconexiones o movimientos imprevistos del robot?',
        options: [
            'Dejar que la batería del headset se agote por completo antes de volver a conectarlo.',
            'Asegurarse de que el visor esté conectado al cable USB-C de carga y verificar que realmente esté recibiendo corriente eléctrica.',
            'Desconectar el cable USB-C de carga para que el visor funcione únicamente en modo inalámbrico durante todo el turno.',
            'Conectar el cargador del headset en cualquier contacto sin importar el color o tipo de instalación.'
        ],
        correctIndex: 1,
        explanation: 'Para evitar que la batería del visor se agote y provoque que el robot se desvíe o desvanezca lateralmente, es crucial comprobar que el cable USB-C esté correctamente conectado y cargando el headset.',
        difficulty: 'easy',
        category: 'Training 1'
    },
    {
        id: 'q_t1_4',
        question: '¿En qué tipo de contacto eléctrico se prefiere conectar el cargador del headset y por qué razón?',
        options: [
            'En cualquier contacto común de la estación para facilitar el acceso rápido.',
            'En el contacto de color naranja (caída regulada), ya que está respaldado por la planta del corporativo para evitar la pérdida de conexión ante un corte de luz.',
            'Directamente a la computadora de control mediante el cable de red.',
            'En el contacto gris básico del laboratorio de pruebas.'
        ],
        correctIndex: 1,
        explanation: 'El contacto naranja representa una línea de corriente regulada y respaldada por la planta de energía del corporativo. Conectar allí el cargador evita que el visor se apague por pérdida de energía en caso de fallas en el suministro eléctrico general.',
        difficulty: 'easy',
        category: 'Training 1'
    },
    {
        id: 'q_t1_5',
        question: '¿Qué componentes deben ser inspeccionados y estar correctamente conectados físicamente como parte de una preparación segura de la estación?',
        options: [
            'Únicamente la banda transportadora y la torre de luces.',
            'Los pedales de control, el cable de red RJ45, el cable USB tipo C del headset y su respectivo cargador en la toma de energía asignada.',
            'Solamente los joysticks manuales y los headsets de repuesto.',
            'El display digital de la bagger y el regulador de presión neumática de la planta.'
        ],
        correctIndex: 1,
        explanation: 'Una preparación integral y correcta de la estación exige verificar las conexiones físicas de los pedales, el cable de red para garantizar estabilidad de comunicación, y el sistema de carga del headset (tanto cable USB-C como cargador).',
        difficulty: 'easy',
        category: 'Training 1'
    },
    {
        id: 'q_t1_6',
        question: '¿Qué consecuencia operativa y de seguridad puede ocurrir si el visor del operador se apaga repentinamente debido a que se agotó la batería durante una operación activa?',
        options: [
            'El robot entra automáticamente a su estación de mantenimiento autónomo sin afectar el entorno.',
            'El robot se desvanece completamente hacia un lado, lo que puede provocar que tire producto, dañe la imagen frente al cliente o golpee a alguna persona en la celda.',
            'La interfaz web simplemente muestra una advertencia de pausa, manteniendo los brazos del robot rígidos e inmóviles.',
            'La impresora de etiquetas duplica las órdenes impresas para proteger el flujo de trabajo.'
        ],
        correctIndex: 1,
        explanation: 'Si el visor se apaga por falta de batería, la pérdida instantánea del tracking hace que el robot pierda sustentación y se desvíe o desvanezca físicamente, poniendo en riesgo la integridad de los productos, la infraestructura y el personal circundante.',
        difficulty: 'easy',
        category: 'Training 1'
    },
    {
        id: 'q_t1_7',
        question: '¿Qué representa la información de alineación o datos de posición necesarios para operar el robot en modo AUTO?',
        options: [
            'Son comandos manuales de texto que el operador debe escribir en el display.',
            'Son los datos de calibración y tracking en tiempo real que sincronizan la posición del operador físico con los motores del robot para permitir intervenciones precisas.',
            'Es la lista de códigos de barra pregrabada en la base de datos local.',
            'Son videos de simulación que se reproducen en bucle en el headset.'
        ],
        correctIndex: 1,
        explanation: 'Para que el modo AUTO funcione de forma segura y coordinada con las intervenciones del operador, el sistema requiere datos constantes del tracking y la posición física del usuario en tiempo real.',
        difficulty: 'easy',
        category: 'Training 1'
    },
    {
        id: 'q_t1_8',
        question: '¿Quién o qué componente proporciona la información de posición y tracking para que el robot pueda coordinarse de forma segura durante el modo AUTO?',
        options: [
            'El supervisor en turno de manera manual.',
            'El visor (headset) y los sensores de la estación de trabajo del operador a través del sistema de tracking.',
            'La impresora térmica de etiquetas en cada ciclo de empaque.',
            'La banda transportadora al activarse mediante los pedales.'
        ],
        correctIndex: 1,
        explanation: 'El visor (headset) del operador es el encargado de capturar y transmitir constantemente los datos de movimiento y posición mediante sus sensores de tracking al robot.',
        difficulty: 'easy',
        category: 'Training 1'
    }
];

// --- CATEGORÍA 2: TRAINING 2 (Nivel Easy) ---
const TRAINING_2_QUESTIONS: Question[] = [
    {
        id: 'q_t2_1',
        question: 'Si observas un atoramiento físico, y los brazos del robot se encuentran debajo de la mesa de operación o están mal posicionados haciendo fuerza, ¿cuál es la acción correcta?',
        options: [
            'Presionar el botón HOME para forzar la autorecuperación',
            'Escalar e informar de inmediato al supervisor en turno para evitar daños mayores y forzado de motores',
            'Tratar de mover el brazo manualmente aplicando fuerza física',
            'Pausar la celda y esperar a que el robot se desatore solo'
        ],
        correctIndex: 1,
        explanation: 'Cuando el robot está en una posición comprometida o atorado debajo de la estructura, intentar hacer HOME puede jalar la mesa y forzar los motores. Se debe avisar inmediatamente al supervisor.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_2',
        question: 'En el Caso de Estudio 2 de seguridad, ¿cuál es el peligro principal asociado con la caída o desprendimiento de una impresora de etiquetas, de su posición?',
        options: [
            'Pérdida de la conexión a internet en toda la nave',
            'Provocar daños materiales al equipo y un alto riesgo de lesiones físicas al personal circundante si cae o proyecta algún objeto',
            'Que el robot entre de inmediato en modo de desarrollo "held for dev"',
            'Ninguno, las impresoras están diseñadas para soportar caídas repetidas'
        ],
        correctIndex: 1,
        explanation: 'La caída de una impresora de etiquetas, no solo daña el equipo, sino que representa un grave peligro de golpe o proyección para el personal en el sitio.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_3',
        question: 'Si el robot está en una posición incorrecta o comprometida, ¿por qué es imperativo contactar al supervisor antes de enviar cualquier comando de Home?',
        options: [
            'Porque el supervisor es el único que puede autorizar la impresión de etiquetas',
            'Porque el robot puede jalar la estructura física, forzar los motores y causar daños catastróficos que requieran escalaciones mayores',
            'Para verificar si las cámaras de la muñeca están calibradas',
            'No es imperativo; el operador siempre debe tratar de solucionarlo solo primero'
        ],
        correctIndex: 1,
        explanation: 'Mandar comandos de movimiento cuando el robot está mecánicamente trabado o comprometido daña los actuadores y fuerza los servomotores.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_4',
        question: '¿Quién tiene la capacidad y autorización total de intervenir directamente para resolver estas situaciones?',
        options: [
            'El operador en entrenamiento (Trainee) por su cuenta',
            'El supervisor en turno, quien cuenta con la capacidad para resolver para prevenir escalaciones',
            'Cualquiera que pase cerca de la celda de empaque',
            'Nadie, se debe esperar a que el robot se apague por software'
        ],
        correctIndex: 1,
        explanation: 'El supervisor en turno está capacitado para actuar de forma segura ante situaciones de riesgo y evitar daños mecánicos costosos a la infraestructura.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_5',
        question: 'Escenario: Estás operando y el robot se atora debajo de la mesa. La mesa comienza a vibrar y a moverse ligeramente. El software te da la opción de mandar a HOME. Y tú, ¿qué harías?',
        options: [
            'Presionar HOME rápidamente para ganarle al tiempo del ciclo',
            'Ignorar la vibración y mandar un comando de autonomía',
            'Detener todo movimiento y notificar inmediatamente al supervisor que el robot está atorado y comprometido',
            'Mover el torso del robot manualmente usando el joystick'
        ],
        correctIndex: 2,
        explanation: 'Ante cualquier vibración o atoramiento físico, no se debe intentar mover el robot sin antes avisar al supervisor en turno.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_6',
        question: 'Escenario: Durante tus movimientos con el torso, golpeas accidentalmente la base de la impresora de etiquetas y ves que se inclina peligrosamente fuera de su base. Y tú, ¿qué harías?',
        options: [
            'Continuar la operación asumiendo que no se va a caer',
            'Escalar de forma imperativa la situación de riesgo al supervisor en turno antes de que caiga y dañe a alguien o al equipo',
            'Esperar a que termine el turno para acomodarla',
            'Empujar el robot para que la detenga con el brazo'
        ],
        correctIndex: 1,
        explanation: 'Cualquier situación de riesgo o peligro de caída de periféricos pesados debe ser reportada de forma imperativa al supervisor de inmediato.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_7',
        question: 'Escenario: El robot está fuera de su posición normal y notas que una de las pinzas (grippers) está presionando con fuerza la mesa metálica. El sistema te pide enviar un comando de reinicio de motores. Y tú, ¿qué harías?',
        options: [
            'Reincorporar los motores desde el headset sin revisar la posición',
            'Pausar de inmediato y pedir al supervisor que evalúe la posición antes de forzar los motores y dañar los grippers',
            'Estirar el brazo del robot manualmente para destrabarlo',
            'Apagar la luz de la torreta y continuar operando'
        ],
        correctIndex: 1,
        explanation: 'Si el gripper está ejerciendo fuerza constante sobre una superficie rígida, reiniciar motores o mandar Home forzará las articulaciones del brazo.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_8',
        question: 'Escenario: Observas que una persona del equipo de Warehouse o Laboratorio ingresa al área de operación o se acerca al robot. ¿Qué acción debes de tomar?',
        options: [
            'Esperar a que la persona termine su ajuste y no reportar nada',
            'Poner en pausa el robot de inmediato para priorizar la seguridad física y notificar al supervisor',
            'Mandar al robot a HOME para que no estorbe a la persona',
            'Apagar únicamente la cámara de la cabeza para no ver el incidente'
        ],
        correctIndex: 1,
        explanation: 'La seguridad física de cualquier persona de Warehouse o Laboratorio es la máxima prioridad; se debe poner en pausa el robot de inmediato.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_9',
        question: 'Observas que el brazo del robot se detiene a la mitad del recorrido. ¿Cuál es el primer paso a realizar en los headsets?',
        options: [
            'Mandar el comando Home inmediatamente',
            'Enviar el comando Fault (arm frozen)',
            'Apagar la estación desde el botón de emergencia',
            'Esperar 5 minutos a que se reinicie solo'
        ],
        correctIndex: 1,
        explanation: 'Siempre se debe registrar la falla con el comando Fault antes de intentar mover el robot, para que quede registro y se evalúe si es seguro moverlo.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_10',
        question: 'Estás en un workflow de Bagger y notas que la etiqueta sale en blanco o no sale. ¿Qué acción debes reportar en la interfaz de control?',
        options: [
            'Reportar Out of Labels para alertar sobre el rollo vacío o falla de impresión',
            'Reiniciar el robot inmediatamente',
            'Reportar Bag Jam',
            'Reportar Product Dropped'
        ],
        correctIndex: 0,
        explanation: '"Out of Labels" se utiliza cuando el rollo de etiquetas está vacío o la impresora presenta fallas para imprimir la guía de envío.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_11',
        question: 'El robot coloca el paquete terminado en un contenedor (bin) que no corresponde a la ruta de envío. ¿Qué reporte se debe seleccionar?',
        options: [
            'Product Dropped',
            'Package Dropped on Floor',
            'Package Dropped in Wrong Bin',
            'Bin Location Adjustment Needed'
        ],
        correctIndex: 2,
        explanation: '"Package Dropped in Wrong Bin" se selecciona cuando el brazo robótico deposita el paquete final en un contenedor equivocado.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_12',
        question: 'Si el contenedor de paquetes terminados listos para envío se llena por completo, ¿qué debes hacer?',
        options: [
            'Seleccionar "Package Bin Full", vaciar el contenedor y continuar',
            'Seleccionar "Hospital Bin Full" y cambiar de estación',
            'Detener la celda con botón de emergencia y llamar a mantenimiento',
            'Continuar colocando paquetes encima hasta que se caigan'
        ],
        correctIndex: 0,
        explanation: '"Package Bin Full" es para reportar que el contenedor de salida está a su máxima capacidad y requiere vaciado físico.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_13',
        question: 'Estás empacando y al intentar colocar un producto en la bin de rechazo (hospital bin), el producto rebota y cae porque la bin está desbordada de artículos acumulados. ¿Qué reporte debes levantar?',
        options: [
            'Package Bin Full',
            'Hospital Bin Full',
            'Product Dropped',
            'Other'
        ],
        correctIndex: 1,
        explanation: '"Hospital Bin Full" indica que el contenedor donde se colocan artículos defectuosos o con problemas está lleno.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_14',
        question: 'El robot intenta depositar el paquete final, pero notas que no hay bin disponible o fue movida accidentalmente fuera de tu alcance. ¿Qué reporte debes seleccionar?',
        options: [
            'Bin Location Adjustment Needed',
            'Package Dropped in Wrong Bin',
            'App Not Working',
            'Left Arm Frozen'
        ],
        correctIndex: 0,
        explanation: 'Se reporta "Bin Location Adjustment Needed" cuando no hay bin de depósito, el robot no lo alcanza, o el contenedor de Customer no es del color solicitado.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_15',
        question: 'Si en tu visor de control dejas de recibir la transmisión de video de la muñeca del brazo izquierdo, ¿cuál es el reporte adecuado?',
        options: [
            'Head Cam Out',
            'Left Wrist Cam Out',
            'Left Arm Frozen',
            'App Not Working'
        ],
        correctIndex: 1,
        explanation: '"Left Wrist Cam Out" se selecciona cuando la cámara montada en la muñeca izquierda pierde la conexión o deja de dar imagen.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_16',
        question: 'El robot intenta sujetar un artículo pero la pinza derecha no cierran ni aplican fuerza. ¿Qué debes reportar?',
        options: [
            'Right Arm Frozen',
            'Right Gripper Not Working',
            'Left Gripper Not Working',
            'Other Robot Issue'
        ],
        correctIndex: 1,
        explanation: '"Right Gripper Not Working" se selecciona específicamente cuando la pinza o griper del brazo derecho presenta problemas de apertura, cierre o fuerza.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_17',
        question: 'Estás operando en modo auto y observas que el robot se queda totalmente estático. No no hay fallas mecánicas en las pinzas, ni reacciona para continuar. ¿Qué reporte debes levantar?',
        options: [
            'App Not Working',
            'Autonomy Not Working',
            'Left Arm Frozen',
            'Other Headset Issue'
        ],
        correctIndex: 1,
        explanation: '"Autonomy Not Working" se reporta cuando el software de autonomía del robot falla, impidiendo que tome decisiones o ejecute trayectorias de forma autónoma y proceder a documentar en el slack para verificar la continuidad del workflow o detenerse.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_18',
        question: 'Estás operando al robot y de repente pierdes la vista general (pantalla en negro en la cámara principal), aunque sigues viendo el video de las cámaras de las muñecas. ¿Qué reporte debes levantar?',
        options: [
            'Left Wrist Cam Out',
            'Right Wrist Cam Out',
            'Head Cam Out',
            'App Not Working'
        ],
        correctIndex: 2,
        explanation: '"Head Cam Out" se selecciona cuando la cámara principal ubicada en la cabeza del robot pierde señal o deja de transmitir video.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_19',
        question: 'Si una etiqueta (label) se queda pegada en las pinzas (grippers) del robot o en tus manos durante el proceso de empaque, ¿cuál es la mejor manera de retirarla de forma segura?',
        options: [
            'Utilizar la estructura de la bagger o de la impresora para raspar y remover los restos adheridos.',
            'Llevar las pinzas a la parte superior y realizar un movimiento vertical para evitar que la etiqueta se rompa o quede más adherida al gripper.',
            'Frotar con fuerza una pinza contra la otra a alta velocidad para generar fricción.',
            'Ignorar la etiqueta pegada y continuar operando, permitiendo que se adhiera al siguiente producto.'
        ],
        correctIndex: 1,
        explanation: 'La mejor posición para quitar restos de etiquetas es en la parte superior realizando un movimiento vertical. Esto previene que se rompa la etiqueta y evita que quede atascada en el gripper.',
        difficulty: 'easy',
        category: 'Training 2'
    },
    {
        id: 'q_t2_20',
        question: 'Durante el proceso de empaque, ¿por qué se considera incorrecto raspar el gripper contra el display de la máquina bagger o la impresora de etiquetas para quitar restos de adhesivo?',
        options: [
            'Porque ralentiza el ciclo de empaque en la banda transportadora.',
            'Porque puede provocar daños mecánicos severos tanto en el robot como en la bagger, además de correr el riesgo de tirar objetos periféricos como la hospital bin.',
            'Porque las etiquetas adhesivas solo deben retirarse usando solventes químicos especiales en caliente.',
            'No es incorrecto; cualquier superficie de la celda de trabajo es adecuada para limpiar los grippers.'
        ],
        correctIndex: 1,
        explanation: 'Utilizar componentes físicos de la estación como raspadores improvisados daña los sensores, pantallas e infraestructura del robot o la embolsadora, pudiendo tirar elementos de la celda. Las etiquetas deben retirarse con la técnica vertical recomendada.',
        difficulty: 'easy',
        category: 'Training 2'
    }
];

// --- CATEGORÍA 3: TRAINING 3 (Nivel Medium) ---
const TRAINING_3_QUESTIONS: Question[] = [
    {
        id: 'q_t3_1',
        question: 'Te asignan empacar una caja pesada y voluminosa en el Workflow Bagger. Para evitar que el peso venza la bolsa y asegurar que la máquina logre sellar correctamente, ¿cómo debes posicionar la pinza de soporte?',
        options: [
            'Colocar la pinza a un costado del empaque',
            'No utilizar la pinza y empujar el paquete manualmente',
            'Colocar la pinza debajo de la bolsa para ayudar a sostener el peso',
            'Colocar la pinza en la parte superior para suspender la bolsa'
        ],
        correctIndex: 2,
        explanation: 'Para objetos de gran tamaño y pesados, colocar la pinza debajo de la bolsa ayuda con el peso del paquete y facilita que la máquina realice el cierre/sello correctamente.',
        difficulty: 'medium',
        category: 'Training 3'
    },
    {
        id: 'q_t3_2',
        question: '¿Qué workflow se opera en el robot Phil?',
        options: [
            'Bolsas plásticas de rollo',
            'Cajas de cartón corrugado',
            'Contenedores de plástico (Totes)',
            'Sobres acolchados'
        ],
        correctIndex: 2,
        explanation: 'El robot Phil opera con el flujo de trabajo de Totes (contenedores), mientras que robots como Packie, Future y Bagger Label utilizan el workflow de Bagger.',
        difficulty: 'medium',
        category: 'Training 3'
    },
    {
        id: 'q_t3_3',
        question: '¿Qué debes hacer si el robot se detiene porque la Bagger se quedó sin bolsas (Out of Bags)?',
        options: [
            'Apagar la máquina y reportar mantenimiento de inmediato',
            'Detener el robot, mandar la fault de out of bags para que un Field Agent pueda resolver el problema',
            'Forzar el reinicio del brazo robótico sin cambiar nada',
            'Cambiar a operación manual y empacar sin bolsas'
        ],
        correctIndex: 1,
        explanation: 'La opción "Out of Bags" indica que el rollo de bolsas se ha terminado y se requiere reemplazarlo por uno nuevo para que el ciclo continúe.',
        difficulty: 'medium',
        category: 'Training 3'
    },
    {
        id: 'q_t3_4',
        question: 'Si detectas que la bolsa de un paquete quedó arrugada, quemada o mal cerrada en los extremos (aplica a Packie, Future, Fleetwood o Bagger), ¿qué falla reportamos?',
        options: [
            'Bad Seal',
            'Bag Jam',
            'Out of Bags',
            'Product Dropped'
        ],
        correctIndex: 0,
        explanation: 'Anteriormente "Bad Seal" es el fallo que indica que el sellado de la bolsa quedó abierto, quemado, arrugado o defectuoso de alguna forma.',
        difficulty: 'medium',
        category: 'Training 3'
    },
    {
        id: 'q_t3_5',
        question: 'Observas que la interfaz indica jobs no available. ¿Qué fault reportarías?',
        options: [
            'Hospital Bin Full',
            'Out of Product',
            'Bin Location Adjustment Needed',
            'Head Cam Out'
        ],
        correctIndex: 1,
        explanation: '"Out of Product" se reporta de forma global para todos los robots cuando se agota el producto en la zona o cuando no hay batch cargada en el sistema para continuar el trabajo.',
        difficulty: 'medium',
        category: 'Training 3'
    },
    {
        id: 'q_t3_6',
        question: 'Durante tu turno, ocurre una falla extraña: y la interfaz del visor muestra cosas no vistas en la capacitación. ¿Qué reporte debes levantar al no existir una categoría específica?',
        options: [
            'Reiniciar el robot automáticamente',
            'Escalar la información con el supervisor en turno para validar si se levanta reporte bajo la opción Other para documentar la falla imprevista.',
            'Apagar las cámaras',
            'Pausar el simulador'
        ],
        correctIndex: 1,
        explanation: '"Other" se reserva para fallas y problemas imprevistos que no coinciden con ninguna de las opciones específicas provistas en el menú.',
        difficulty: 'medium',
        category: 'Training 3'
    }
];

// --- CATEGORÍA 4: DC (Nivel Hard) ---
const DC_QUESTIONS: Question[] = [
    {
        id: 'q_dc_1',
        question: 'Te encuentras operando en el robot Phil, recibes el error de "Producto no escaneado". ¿Qué debes hacer con el producto?',
        options: [
            'Tirarlo a la basura',
            'Empacarlo de todos modos',
            'Apartar el producto y regresarlo al rack para revisión del cliente',
            'Forzar el escáner y continuar'
        ],
        correctIndex: 2,
        explanation: 'El producto debe apartarse para revisión posterior; el operador no debe tomar la decisión final.',
        difficulty: 'hard',
        category: 'DC'
    },
    {
        id: 'q_dc_2',
        question: 'Estás operando el robot Phil y ves que el tote tiene 7 productos. Al prepararte para el empaque, ¿qué decisión de sobrebolsas debes tomar?',
        options: [
            'Colocarlos todos en una bolsa pequeña para ahorrar espacio',
            'Elegir la bolsa de mayor tamaño disponible para el tote',
            'Dividir el pedido en 2 bolsas pequeñas diferentes',
            'Reportar Out of Product y esperar asistencia'
        ],
        correctIndex: 1,
        explanation: 'De acuerdo con el consejo de operación del robot Phil, si el tote contiene 6 productos o más se ocupa la bolsa de mayor tamaño, y si tiene 5 productos o menos se ocupa la bolsa pequeña (medida estándar).',
        difficulty: 'hard',
        category: 'DC'
    },
    {
        id: 'q_dc_3',
        question: 'Si tienes un problema con la orden en el robot Phil, no se imprime la etiqueta y continúa solicitando otro producto), ¿cuál es el procedimiento correcto?',
        options: [
            'Dejar el tote abajo en el rack y esperar a que el robot se autocorrige',
            'Ingresar todo al mismo tote, dejarlo arriba en el rack, levantar un pick fault, seleccionar order package y presionar "FAIL JOB"',
            'Retirar los productos del tote y colocarlos de nuevo en el rack principal',
            'Apagar la estación inmediatamente para detener el flujo'
        ],
        correctIndex: 1,
        explanation: 'Ante problemas con la orden en el robot Phil, se debe ingresar todo al mismo tote y dejarlo en la parte de hasta arriba del rack. Luego, se levanta un pick fault, seleccionas order package y después presionas "FAIL JOB".',
        difficulty: 'hard',
        category: 'DC'
    },
    {
        id: 'q_dc_4',
        question: 'En la Bagger, una bolsa queda fuera de posición. ¿Qué deberías de hacer?',
        options: [
            'Retirar la bolsa, colocarla en la hospital bin (cambia según el workflow de posición), mandar el reprint label para que genere una nueva reimpresión del pedido en ese momento no terminado',
            'Cancelar el pedido y esperar instrucciones',
            'Detener el proceso en donde esté, mandar el robot a posición de HOME',
            'Nada, continuar con el pedido'
        ],
        correctIndex: 0,
        explanation: 'Se debe de retirar la bolsa y colocar en la hospital bin, mandar el reprint label que es el botón amarillo en la UI y continuar con el pedido, esto es por que si está fuera de posición, no va a cerrar la bolsa.',
        difficulty: 'hard',
        category: 'DC'
    },
    {
        id: 'q_dc_5',
        question: 'Estás operando Packie y notas que el robot intenta colocar el producto pero la bolsa arrojada por la Bagger está completamente cerrada debido a falta de aire. ¿Qué debes hacer físicamente?',
        options: [
            'Volver a reiniciar la estación robótica',
            'Realizar un movimiento vertical de arriba a abajo con la bolsa para forzar que entre el aire en la posición correcta',
            'Soplar manualmente dentro del área de la Bagger',
            'Marcar la bolsa como defectuosa en el sistema y desecharla'
        ],
        correctIndex: 1,
        explanation: 'De acuerdo con las pautas de operación, realizar un movimiento vertical de arriba a abajo obliga a que entre el aire en la posición correcta para que la bolsa se abra y proceder a ingresar la batch correspondiente.',
        difficulty: 'hard',
        category: 'DC'
    },
    {
        id: 'q_dc_6',
        question: 'Estás operando en modo AUTO y notas que el robot se ha demorado demasiado tiempo tratando de sujetar un producto. Si decides realizar una intervención manual para asistir al robot, ¿qué acción es imperativa antes de interactuar física o virtualmente?',
        options: [
            'Tomar el control del joystick sin importar tu posición física en la celda.',
            'Sincronizar tu posición física alineándote exactamente a la postura del robot y presionar la letra A en el joystick para coordinar el control.',
            'Apagar de inmediato la estación con el botón de paro de emergencia.',
            'Desconectar el cable de red para forzar la detención del modo auto.'
        ],
        correctIndex: 1,
        explanation: 'Si decides intervenir manualmente en modo AUTO, es mandatorio que te alinees físicamente a la posición en la que está el robot y presiones la letra A en el joystick para asegurar que los movimientos no sean bruscos ni desalineados.',
        difficulty: 'hard',
        category: 'DC'
    },
    {
        id: 'q_dc_7',
        question: 'Durante una operación en modo AUTO, el robot tiene problemas para sujetar un objeto pesado. Decides tomar el control manual rápido con el joystick para corregir la pinza, pero olvidas presionar la letra A para sincronizar posiciones. ¿Qué riesgo representa esto?',
        options: [
            'Ninguno, el robot se alinea automáticamente por software sin importar la posición del operador.',
            'Provoca una desalineación (mismatch) inmediata entre el operador y el robot, lo que puede causar movimientos bruscos, golpes o forzado de motores.',
            'Que la impresora de etiquetas deje de funcionar temporalmente.',
            'Que la banda transportadora se mueva en sentido contrario.'
        ],
        correctIndex: 1,
        explanation: 'Intervenir sin coordinar las posiciones físicas (sin presionar la letra A) genera un desfase de control que puede derivar en movimientos erráticos y peligrosos del robot.',
        difficulty: 'hard',
        category: 'DC'
    },
    {
        id: 'q_dc_8',
        question: 'Escenario: El robot lleva más de 15 segundos intentando alcanzar un producto ubicado al extremo de la banda en modo AUTO. El ciclo se está retrasando. ¿Cuál es el protocolo correcto para intervenir de forma segura usando tu estación?',
        options: [
            'Mover bruscamente el torso para jalar el brazo del robot hacia ti.',
            'Alinear tu postura física con la posición actual del robot, presionar la tecla A del joystick para sincronizar el control y proceder a realizar el agarre manualmente.',
            'Esperar a que el headset se apague solo por inactividad.',
            'Golpear la mesa de empaque para que el producto ruede hacia el centro del alcance del robot.'
        ],
        correctIndex: 1,
        explanation: 'Para una intervención segura y fluida, debes alinear tu posición corporal con la del robot, pulsar la tecla A en el joystick para coordinar las señales, y concluir la maniobra de sujeción del producto de forma manual.',
        difficulty: 'hard',
        category: 'DC'
    }
];

// --- CATEGORÍA 5: CUSTOMER (Nivel Hard) ---
const CUSTOMER_QUESTIONS: Question[] = [
    {
        id: 'q_cust_1',
        question: 'Durante la operación, y ves que una bolsa plástica se dobló y quedó atrapada en la barra de sellado impidiendo que salga o corte. ¿Qué reporte debes hacer?',
        options: [
            'Arrancar la bolsa y darle reimprimir.',
            'Bad Seal. Ya que no se puede continuar operando.',
            'Intentar recuperar la falla haciendo el procedimiento de el display de la bagger. En caso de que siga sin salir reportar Bag Jam',
            'Other Robot Issue'
        ],
        correctIndex: 2,
        explanation: 'Primero debes de verificar el display de la bagger, dar clic en el error para que se borre y proceder a arrancar la bolsa, mandar el reprint label (boton color amarillo) y validar si ya salen las bolsas correctamente. "Bag Jam" es la opción específica para cuando una bolsa queda atascada en cualquier parte del mecanismo de la Bagger. En caso de que siga sin salir deberías de reportar Bag Jam.',
        difficulty: 'hard',
        category: 'Customer'
    }
];

// --- CONCATENACIÓN JERÁRQUICA DE PREGUNTAS ---
export const EXAM_QUESTIONS: Question[] = [
    ...TRAINING_1_QUESTIONS,
    ...TRAINING_2_QUESTIONS,
    ...TRAINING_3_QUESTIONS,
    ...DC_QUESTIONS,
    ...CUSTOMER_QUESTIONS
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
    timeSpentSeconds?: number;
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
    answersLog: UserAnswerLog[],
    examLevel: string
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

    // Trainer info + Nivel bajo el nombre
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(GRAY);
    const levelText = `Nivel: ${examLevel}`;
    const trainerText = trainerName ? `Trainer: ${trainerName}` : '';
    doc.text(`${levelText}${trainerText ? `  |  ${trainerText}` : ''}`, MARGIN + 6, y + 25);

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

const getQuestionsForLevel = (level: string, customPool?: Question[]): Question[] => {
    const activePool = (customPool && customPool.length > 0) ? customPool : EXAM_QUESTIONS;
    const pool: Question[] = [];
    pool.push(...activePool.filter(q => q.category === 'Training 1'));
    if (level === 'Training 1') return pool;
    pool.push(...activePool.filter(q => q.category === 'Training 2'));
    if (level === 'Training 2') return pool;
    pool.push(...activePool.filter(q => q.category === 'Training 3'));
    if (level === 'Training 3') return pool;
    pool.push(...activePool.filter(q => q.category === 'DC'));
    if (level.startsWith('DC')) return pool;
    pool.push(...activePool.filter(q => q.category === 'Customer'));
    return pool;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ExamModal({ onClose, onLaunchSimulatorExam }: ExamModalProps) {
    const EXAM_LENGTH = 15;
    const [eligiblePool, setEligiblePool] = useState<Question[]>([]);
    const [dbQuestions, setDbQuestions] = useState<Question[]>([]);
    const [loadingDb, setLoadingDb] = useState(true);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const { data, error } = await supabase
                    .from('exam_questions')
                    .select('*')
                    .eq('is_active', true);
                if (error) throw error;
                if (data && data.length > 0) {
                    const formatted: Question[] = data.map((q: any) => {
                        // Mapear dificultades de base de datos a las usadas por la lógica adaptativa
                        let mappedDiff: 'easy' | 'medium' | 'hard' = 'easy';
                        if (q.difficulty === 'facil') mappedDiff = 'easy';
                        else if (q.difficulty === 'media') mappedDiff = 'medium';
                        else if (q.difficulty === 'dificil') mappedDiff = 'hard';

                        return {
                            id: q.id,
                            question: q.question,
                            options: Array.isArray(q.options) ? q.options : JSON.parse(q.options),
                            correctIndex: q.correct_index,
                            explanation: q.explanation || '',
                            difficulty: mappedDiff,
                            category: q.category || 'Training 1'
                        };
                    });
                    setDbQuestions(formatted);
                }
            } catch (err) {
                console.error('[ExamModal] Error loading questions from db, using fallback:', err);
            } finally {
                setLoadingDb(false);
            }
        };
        fetchQuestions();
    }, []);

    const selectNextAdaptiveQuestion = (lastQuestion: Question, wasCorrect: boolean, currentQuestionsList: Question[]): Question => {
        const usedIds = new Set(currentQuestionsList.map(q => q.id));

        // Determine target difficulty
        const lastQuestionDiff = lastQuestion.difficulty || 'easy';
        let targetDiff: 'easy' | 'medium' | 'hard' = lastQuestionDiff;
        if (wasCorrect) {
            if (lastQuestionDiff === 'easy') targetDiff = 'medium';
            else if (lastQuestionDiff === 'medium') targetDiff = 'hard';
        } else {
            if (lastQuestionDiff === 'hard') targetDiff = 'medium';
            else if (lastQuestionDiff === 'medium') targetDiff = 'easy';
        }

        // Get all questions with difficulty from eligible pool
        const poolToUse = eligiblePool.length > 0 ? eligiblePool : (dbQuestions.length > 0 ? dbQuestions : EXAM_QUESTIONS);
        const allQuestions = poolToUse.map(q => ({
            ...q,
            difficulty: q.difficulty || 'easy'
        }));

        // Try target difficulty first
        let available = allQuestions.filter(q => q.difficulty === targetDiff && !usedIds.has(q.id));

        // Fallback order
        if (available.length === 0) {
            const fallbackOrder: Record<'easy' | 'medium' | 'hard', ('easy' | 'medium' | 'hard')[]> = {
                easy: ['medium', 'hard'],
                medium: ['hard', 'easy'],
                hard: ['medium', 'easy']
            };
            for (const diff of fallbackOrder[targetDiff]) {
                available = allQuestions.filter(q => q.difficulty === diff && !usedIds.has(q.id));
                if (available.length > 0) break;
            }
        }

        if (available.length === 0) {
            available = allQuestions.filter(q => !usedIds.has(q.id));
        }

        const chosen = available[Math.floor(Math.random() * available.length)];
        return shuffleQuestionOptions(chosen);
    };

    const [step, setStep] = useState<'identity' | 'selection' | 'teorico'>('identity');
    const [applicantName, setApplicantName] = useState<string>('');
    const [examLevel, setExamLevel] = useState<string>('Training 1');
    const [sessionPin, setSessionPin] = useState<string>('');
    const [traineeIdentity, setTraineeIdentity] = useState<TraineeIdentity | null>(null);
    const [isValidating, setIsValidating] = useState<boolean>(false);
    const [validationError, setValidationError] = useState<string>('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState<boolean>(false);
    const [score, setScore] = useState<number>(0);
    const [isFinished, setIsFinished] = useState<boolean>(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
    const [answersLog, setAnswersLog] = useState<UserAnswerLog[]>([]);
    const [explanationScrolled, setExplanationScrolled] = useState<boolean>(false);

    // ── Fase 3: tracking de duración, intentos y estado de guardado ──
    const examStartTime = React.useRef<number | null>(null);
    const questionStartTime = React.useRef<number | null>(null);
    const [attemptCount, setAttemptCount] = useState<number>(1);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [showRatingSurvey, setShowRatingSurvey] = useState(false);
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingHover, setRatingHover] = useState(0);

    const question = questions[currentStep];
    const percent = Math.round((score / EXAM_LENGTH) * 100);
    const passed = percent >= 90;

    const handleStart = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanedName = cleanAndFormatName(applicantName);
        if (!cleanedName) return;
        setApplicantName(cleanedName); // Normalize displayed name
        setValidationError('');
        setIsValidating(true);

        try {
            let approvedLevels: string[] = [];

            // Si hay PIN, intentamos validarlo con Supabase
            if (sessionPin.trim()) {
                const identity = await validateAndRegisterTrainee(sessionPin, cleanedName);
                setTraineeIdentity(identity);
                setAttemptCount(identity.existingAttemptsCount + 1);
                approvedLevels = identity.approvedLevels;
            } else {
                // Si no hay PIN, buscamos sus aprobados por nombre para validar progresión
                approvedLevels = await getApprovedLevelsByName(cleanedName);
            }

            // Validar progresión:
            // 1. DC requiere haber aprobado algún nivel de Training
            if (examLevel.startsWith('DC')) {
                const hasTraining = approvedLevels.some(l => l.startsWith('Training'));
                if (!hasTraining) {
                    throw new Error('Bloqueado: Debes aprobar al menos un nivel de Training antes de poder realizar exámenes de nivel DC.');
                }
            }
            // 2. Customer requiere haber aprobado algún nivel de DC
            if (examLevel.startsWith('Customer')) {
                const hasDC = approvedLevels.some(l => l.startsWith('DC'));
                if (!hasDC) {
                    throw new Error('Bloqueado: Debes aprobar al menos un nivel de DC antes de poder realizar exámenes de nivel Customer.');
                }
            }

            // Continuamos a la pantalla de selección si pasa las validaciones
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
        setExplanationScrolled(false); // Reset when answering

        const isCorrect = idx === question.correctIndex;
        if (isCorrect) setScore(prev => prev + 1);

        const timeSpentSeconds = questionStartTime.current
            ? Math.round((Date.now() - questionStartTime.current) / 1000)
            : 0;

        setAnswersLog(prev => [
            ...prev,
            {
                questionId: question.id,
                questionText: question.question,
                isCorrect,
                selectedText: question.options[idx],
                correctText: question.options[question.correctIndex],
                timeSpentSeconds
            }
        ]);

        if (questions.length < EXAM_LENGTH) {
            const nextQ = selectNextAdaptiveQuestion(question, isCorrect, questions);
            setQuestions(prev => [...prev, nextQ]);
        }
    };

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
            setExplanationScrolled(false); // Reset when going to next question
            questionStartTime.current = Date.now();
        } else {
            // Mostrar encuesta de confianza antes de finalizar
            setShowRatingSurvey(true);
        }
    };

    const submitRatingSurvey = (rating: number) => {
        setShowRatingSurvey(false);
        setIsFinished(true);

        const finalScore = score;
        const finalPercent = Math.round((finalScore / EXAM_LENGTH) * 100);
        const finalPassed = finalPercent >= 90;
        const durationSec = examStartTime.current
            ? Math.round((Date.now() - examStartTime.current) / 1000)
            : null;

        // Clonar y agregar la valoración de confianza al log de respuestas
        const finalAnswers = [
            ...answersLog,
            {
                questionId: 'exam_level',
                questionText: 'Nivel del Examen',
                isCorrect: true,
                selectedText: examLevel,
                correctText: ''
            },
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
                maxScore: EXAM_LENGTH,
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

    const startTeoricoExam = () => {
        const pool = getQuestionsForLevel(examLevel, dbQuestions);
        setEligiblePool(pool);

        const easyQuestions = pool.filter(q => q.difficulty === 'easy');
        const startPool = easyQuestions.length > 0 ? easyQuestions : pool;
        const firstQ = startPool[Math.floor(Math.random() * startPool.length)];

        setQuestions([shuffleQuestionOptions(firstQ)]);
        setCurrentStep(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setScore(0);
        setIsFinished(false);
        setAnswersLog([]);
        setExplanationScrolled(false);

        examStartTime.current = Date.now();
        questionStartTime.current = Date.now();
        setStep('teorico');
    };

    const handleRetry = () => {
        const pool = getQuestionsForLevel(examLevel, dbQuestions);
        setEligiblePool(pool);

        const easyQuestions = pool.filter(q => q.difficulty === 'easy');
        const startPool = easyQuestions.length > 0 ? easyQuestions : pool;
        const firstQ = startPool[Math.floor(Math.random() * startPool.length)];
        setQuestions([shuffleQuestionOptions(firstQ)]);
        setCurrentStep(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setScore(0);
        setIsFinished(false);
        setAnswersLog([]);
        setSaveStatus('idle');
        setAttemptCount(prev => prev + 1);
        setExplanationScrolled(false);
        examStartTime.current = Date.now(); // reiniciar cronómetro
        questionStartTime.current = Date.now();
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
                answersLog,
                examLevel
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
                                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all text-neutral-800 font-mono tracking-widest disabled:opacity-50 ${validationError
                                                ? 'border-red-400 focus:border-red-500 bg-red-50'
                                                : 'border-neutral-200 focus:border-[#FF6A00]'
                                            }`}
                                    />
                                </div>

                                {/* Selector de Nivel */}
                                <div className="relative">
                                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <select
                                        required
                                        value={examLevel}
                                        onChange={(e) => setExamLevel(e.target.value)}
                                        disabled={isValidating}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:border-[#FF6A00] transition-all text-neutral-800 bg-white disabled:opacity-50 appearance-none font-medium"
                                    >
                                        <optgroup label="Training">
                                            <option value="Training 1">Training 1</option>
                                            <option value="Training 2">Training 2</option>
                                            <option value="Training 3">Training 3</option>
                                        </optgroup>
                                        <optgroup label="DC">
                                            <option value="DC 1">DC 1</option>
                                            <option value="DC 2">DC 2</option>
                                        </optgroup>
                                        <optgroup label="Customer">
                                            <option value="Customer 1">Customer 1</option>
                                            <option value="Customer 2">Customer 2</option>
                                        </optgroup>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                        </svg>
                                    </div>
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
                                    startTeoricoExam();
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
                                                    className={`w-10 h-10 transition-colors ${val <= (ratingHover || ratingValue)
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
                                            <span>Pregunta {currentStep + 1} de {EXAM_LENGTH}</span>
                                            <span>Puntaje: {score}</span>
                                        </div>
                                        <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#FF6A00] transition-all duration-500 ease-out" style={{ width: `${(currentStep / EXAM_LENGTH) * 100}%` }} />
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
                                        <div
                                            ref={(el) => {
                                                if (el) {
                                                    // Wait 150ms to ensure layout has rendered and clientHeight is non-zero
                                                    setTimeout(() => {
                                                        if (el && el.clientHeight > 0) {
                                                            if (el.scrollHeight <= el.clientHeight) {
                                                                setExplanationScrolled(true);
                                                            }
                                                        }
                                                    }, 150);
                                                }
                                            }}
                                            onScroll={(e) => {
                                                const target = e.currentTarget;
                                                // 10px tolerance for Zoom and subpixel rounding
                                                const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 10;
                                                if (isAtBottom) {
                                                    setExplanationScrolled(true);
                                                }
                                            }}
                                            className="mt-2 p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-sm flex flex-col gap-1 animate-in fade-in duration-200 max-h-24 overflow-y-auto scrollbar-thin"
                                        >
                                            <span className="font-bold uppercase tracking-wider text-xs text-blue-600 mb-1">Explicación</span>
                                            <p className="whitespace-pre-line leading-relaxed">{question.explanation}</p>
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
                                        Aciertos: {score} de {questions.length} (Requerido: 90%)
                                    </div>

                                    {/* Estado de guardado en Supabase */}
                                    {traineeIdentity && (
                                        <div className={`mt-3 pt-3 border-t border-neutral-200 flex items-center gap-2 text-xs font-semibold ${saveStatus === 'saving' ? 'text-neutral-400' :
                                                saveStatus === 'saved' ? 'text-emerald-600' :
                                                    saveStatus === 'error' ? 'text-red-500' : 'text-neutral-400'
                                            }`}>
                                            {saveStatus === 'saving' && <><Loader2 className="w-3 h-3 animate-spin" /> Guardando resultado...</>}
                                            {saveStatus === 'saved' && <><CheckCircle2 className="w-3 h-3" /> Resultado guardado en el sistema</>}
                                            {saveStatus === 'error' && <><AlertCircle className="w-3 h-3" /> No se pudo guardar — revisa conexión</>}
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
                    <div className="bg-neutral-50 p-4 border-t border-neutral-200 shrink-0 flex items-center justify-between gap-4">
                        {isAnswered && !explanationScrolled ? (
                            <span className="text-xs font-semibold text-orange-600 animate-pulse flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                Por favor, lee la explicación completa desplazándote hacia abajo para continuar.
                            </span>
                        ) : (
                            <div />
                        )}
                        <button
                            onClick={handleNext}
                            disabled={!isAnswered || !explanationScrolled}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shrink-0 ${isAnswered && explanationScrolled
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