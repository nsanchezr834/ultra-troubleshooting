import { TroubleshootingKnowledge } from '@/types/troubleshooting.types';

export const TROUBLESHOOTING_DATABASE: TroubleshootingKnowledge[] = [
  {
    id: "ERR-KIN-001",
    category: "Problemas con el robot", // Anteriormente "cinemática" y "Mecánica / Robótica"
    symptom: "El hombro del robot comienza a visualizarse en la pantalla operative / pérdida de alineación",
    root_cause: "Operador trabajando con los brazos demasiado cerca del pecho, afectando la sincronía y el tracking del torso.",
    severity: "MEDIUM",
    resolution_protocol: "Detener el movimiento actual de inmediato. Regresar el robot a la posición HOME para restablecer offsets y reiniciar el proceso desde cero. Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación y se reiniciará el módulo reportado. Posteriormente, debe pasarse a posición de HOME e iniciar nuevamente la operación. Si el robot no se recupera tras esto, se enviará de forma automática un mensaje en el canal de Slack notificando que sigue en espera de intervención.",
    sop_reference: "SOP 1-C, SOP 1-F, Estándares de Seguridad (Postura)"
  },
  {
    id: "ERR-ROB-007",
    category: "Problemas con el robot",
    symptom: "Falla de brazos: Uno o ambos brazos del robot se quedan congelados, no responden a comandos o se mueven de forma errática.",
    root_cause: "Pérdida de comunicación con los actuadores de las articulaciones de los brazos, o bloqueo (deadlock) en los controladores de movimiento de los brazos.",
    severity: "HIGH",
    resolution_protocol: "Verificar si el fallo es en el brazo izquierdo o derecho. Detener la operación de inmediato. En el sistema de alertas (simulador), levantar el fault correspondiente al área específica: seleccionar 'Left Arm Frozen' si el fallo es en el brazo izquierdo, o 'Right Arm Frozen' si es en el brazo derecho. Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación y se reiniciará el módulo reportado. Posteriormente, debe pasarse a posición de HOME e iniciar nuevamente la operación. Si el robot no se recupera tras esto, se enviará de forma automática un mensaje en el canal de Slack notificando que sigue en espera de intervención.",
    sop_reference: "SOP 8-C, Estándares de Seguridad (Brazos)"
  },
  {
    id: "ERR-ROB-008",
    category: "Problemas con el robot",
    symptom: "Falla de grippers (pinzas): El gripper no abre, no cierra o no tiene fuerza de agarre.",
    root_cause: "Fallo neumático, desalineación física de las pinzas o pérdida de comunicación con la tarjeta controladora del efector final.",
    severity: "HIGH",
    resolution_protocol: "Identificar cuál gripper presenta el problema. Pausar el flujo. Levantar el fault correspondiente en el simulador en su área específica: seleccionar 'Left Gripper Not Working' para el gripper izquierdo, o 'Right Gripper Not Working' para el gripper derecho. Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación y se reiniciará el módulo reportado (si se levanta el fault de gripper derecho, ese módulo se reinicia automáticamente). Posteriormente, debe pasarse a posición de HOME e iniciar nuevamente la operación. Si el robot no se recupera tras esto, se enviará de forma automática un mensaje en el canal de Slack notificando que sigue en espera de intervención.",
    sop_reference: "SOP 1-D, SOP 11, Estándares de Seguridad (Grippers)"
  },
  {
    id: "ERR-ROB-009",
    category: "Problemas con el robot",
    symptom: "Falla de cámaras: Pérdida de señal de video o interferencia en la retroalimentación visual del robot.",
    root_cause: "Desconexión física de cables, caída del controlador de video en el backend o fallo de hardware en la cámara correspondiente.",
    severity: "MEDIUM",
    resolution_protocol: "Identificar la cámara afectada. Levantar el fault de forma precisa en el área afectada dentro del simulador: seleccionar 'Head Cam Out' si falla la cámara de la cabeza, 'Left Wrist Cam Out' si falla la cámara de la muñeca izquierda, o 'Right Wrist Cam Out' si falla la cámara de la muñeca derecha. Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación y se reiniciará el módulo reportado. Posteriormente, debe pasarse a posición de HOME e iniciar nuevamente la operación. Si el robot no se recupera tras esto, se enviará de forma automática un mensaje en el canal de Slack notificando que sigue en espera de intervención.",
    sop_reference: "SOP 2-D, SOP 4, Estándares de Seguridad (Cámaras)"
  },
  {
    id: "ERR-ROB-010",
    category: "Problemas con el robot",
    symptom: "Falla de cuello: El cuello del robot no puede girar, está rígido o se atascó al intentar seguir visualmente un punto.",
    root_cause: "Bloqueo mecánico en la articulación del cuello, fallo del motor servo o descalibración del sensor de posición.",
    severity: "MEDIUM",
    resolution_protocol: "Detener los movimientos activos. En el simulador, se debe levantar el fault en el área específica de Robot: seleccionar 'Neck Frozen'. Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación y se reiniciará el módulo reportado. Posteriormente, debe pasarse a posición de HOME e iniciar nuevamente la operación. Si el robot no se recupera tras esto, se enviará de forma automática un mensaje en el canal de Slack notificando que sigue en espera de intervención.",
    sop_reference: "SOP 8-C, Estándares de Seguridad (Cuello)"
  },
  {
    id: "ERR-ROB-011",
    category: "Problemas con el robot",
    symptom: "Falla en chest (pecho): El torso o pecho del robot se encuentra congelado o dejó de moverse/rotar completamente.",
    root_cause: "Bloqueo del actuador del torso principal o pérdida de comunicación con la controladora de movimiento central.",
    severity: "HIGH",
    resolution_protocol: "Pausar de inmediato la operación. En el simulador, se debe levantar el fault en el área específica de Robot: seleccionar 'Chest Frozen'. Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación y se reiniciará el módulo reportado. Posteriormente, debe pasarse a posición de HOME e iniciar nuevamente la operación. Si el robot no se recupera tras esto, se enviará de forma automática un mensaje en el canal de Slack notificando que sigue en espera de intervención.",
    sop_reference: "SOP 8-D, Estándares de Seguridad (Torso)"
  },
  {
    id: "ERR-ROB-012",
    category: "Problemas con el robot",
    symptom: "Robot no se mueve: El robot se mantiene completamente estático y no responde a ningún comando de movimiento autónomo o manual.",
    root_cause: "Fallo general en el sistema de control autónomo (Autonomy Not Working) o problema de hardware indefinido en los actuadores principales.",
    severity: "HIGH",
    resolution_protocol: "Verificar si hay algún obstáculo o si el sistema de autonomía está activo. En el simulador, levantar el fault correspondiente: si el fallo es del software de autonomía, seleccionar 'Autonomy Not Working' en la categoría Headset/App/Software, o si es un fallo mecánico general, seleccionar 'Other Robot Issue' en la categoría Robot. Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación y se reiniciará el módulo reportado. Posteriormente, debe pasarse a posición de HOME e iniciar nuevamente la operación. Si el robot no se recupera tras esto, se enviará de forma automática un mensaje en el canal de Slack notificando que sigue en espera de intervención.",
    sop_reference: "SOP 8-C, SOP 8-F, Estándares de Seguridad (Control)"
  },
  {
    id: "ERR-MEC-002",
    category: "Qué hacer en caso de...",
    symptom: "Qué hacer en caso de que el objeto sea cilíndrico",
    root_cause: "El operador intentó sujetar el ítem por el cuerpo cilíndrico en lugar de la tapa o los pliegues superiores.",
    severity: "HIGH",
    resolution_protocol: "Asegurar la sujeción obligatoria por la tapa. Si el ítem cae, evaluar límites cinemáticos antes de intentar recuperarlo físicamente; si no es alcanzable de forma segura, emitir fault 'dropped item'. Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación y se reiniciará el módulo reportado. Posteriormente, debe pasarse a posición de HOME e iniciar nuevamente la operación. Si el robot no se recupera tras esto, se enviará de forma automática un mensaje en el canal de Slack notificando que sigue en espera de intervención.",
    sop_reference: "SOP 1-D, SOP 11"
  },
  {
    id: "ERR-MEC-013",
    category: "Qué hacer en caso de...",
    symptom: "Qué hacer en caso de que un objeto se caiga",
    root_cause: "Pérdida de agarre del gripper, colisión leve o desprendimiento del paquete durante la transferencia.",
    severity: "MEDIUM",
    resolution_protocol: "Lo más importante es asegurar que no se dañe el robot y verificar visualmente que no exista ningún riesgo de colisión o daño físico. Si se cumplen estas condiciones de seguridad, se puede proceder a recoger el objeto caído bajo las siguientes reglas de rol: 1) Solo el personal de 'Customer' está autorizado para realizar esta acción de recuperación. 2) El personal de 'DC' debe valorar con precaución si el objeto está a su alcance seguro para recogerlo. 3) El personal en 'Training' tiene estrictamente prohibido realizar esta acción. En caso de que no sea seguro o posible recuperar el objeto, se debe levantar la alerta de fallo correspondiente en el sistema/simulador (como 'Package Dropped on Floor' o 'Product Dropped'). Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación y se reiniciará el módulo reportado. Posteriormente, debe pasarse a posición de HOME e iniciar nuevamente la operación. Si el robot no se recupera tras esto, se enviará de forma automática un mensaje en el canal de Slack notificando que sigue en espera de intervención.",
    sop_reference: "SOP 11, Estándares de Seguridad (Objetos Caídos)"
  },
  {
    id: "ERR-MEC-014",
    category: "Qué hacer en caso de...",
    symptom: "Qué hacer en caso de que no imprima la etiqueta",
    root_cause: "Fallo de conexión con la impresora térmica, falta de insumos (etiquetas) o atasco en el cabezal.",
    severity: "MEDIUM",
    resolution_protocol: "Revisar la impresora de etiquetas (label printer) y verificar si la pantalla integrada muestra algún mensaje de error. Si es así, con las pinzas del robot cerradas, tocar la pantalla para interactuar/limpiar la alerta y volver a intentar la impresión. Si persiste y no imprime, levantar el fault en el simulador siguiendo la ruta correcta (seleccionar 'Out of Labels'). Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación y se reiniciará el módulo reportado. Posteriormente, debe pasarse a posición de HOME e iniciar nuevamente la operación. Si el robot no se recupera tras esto, se enviará de forma automática un mensaje en el canal de Slack notificando que sigue en espera de intervención.",
    sop_reference: "SOP 7, Estándares de Impresión"
  },
  {
    id: "ERR-NET-003",
    category: "Conectividad",
    symptom: "Alta latencia, congelamiento intermitente de cámaras o pérdida crítica de paquetes",
    root_cause: "Saturación o degradación del enlace del ISP primario (Alestra).",
    severity: "CRITICAL",
    resolution_protocol: "Notificar inmediatamente al supervisor e IT indicando sitio, hora y síntomas. Realizar el cambio manual de Gateway en caliente hacia los ISPs de respaldo (Marcatel o Flo). Pausar operación si la latencia compromete la seguridad física. Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación y se reiniciará el módulo reportado. Posteriormente, debe pasarse a posición de HOME e iniciar nuevamente la operación. Si el robot no se recupera tras esto, se enviará de forma automática un mensaje en el canal de Slack notificando que sigue en espera de intervención.",
    sop_reference: "SOP 2-D, SOP 4, Estándares de Seguridad (ISP)"
  },
  {
    id: "ERR-SW-004",
    category: "Software",
    symptom: "Brazo del robot estático o congelado sin responder a los comandos del joystick/torso",
    root_cause: "Crash o bloqueo (deadlock) en el demonio/proceso de control del actuador del brazo.",
    severity: "HIGH",
    resolution_protocol: "Detener la operación. Enviar al canal el formato estricto usando el código de fallo específico 'frozen arm'. Esto disparará el script automatizado que reinicia el backend del brazo. Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación y se reiniciará el módulo reportado. Posteriormente, debe pasarse a posición de HOME e iniciar nuevamente la operación. Si el robot no se recupera tras esto, se enviará de forma automática un mensaje en el canal de Slack notificando que sigue en espera de intervención.",
    sop_reference: "SOP 8-C, Estándares de Seguridad (Brazo)"
  },
  {
    id: "ERR-SW-005",
    category: "Software", // Simplificado para la interfaz
    symptom: "El robot muestra el aviso o estado de sistema 'held for software dev'",
    root_cause: "Bloqueo manual e intencional por parte del equipo de ingeniería de Ultra para despliegue de código o debugging.",
    severity: "CRITICAL",
    resolution_protocol: "PROHIBIDO CONECTARSE O IGNORAR EL AVISO. Detener inicialización del piloto y escalar la disponibilidad únicamente a través de los supervisores designados: Lukas, Kyle o Malcolm. Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación y se reiniciará el módulo reportado. Posteriormente, debe pasarse a posición de HOME e iniciar nuevamente la operación. Si el robot no se recupera tras esto, se enviará de forma automática un mensaje en el canal de Slack notificando que sigue en espera de intervención.",
    sop_reference: "SOP 8-D, SOP 8-E, Estándares de Seguridad (Modo Dev)"
  },
  {
    id: "ERR-SEC-006",
    category: "Seguridad",
    symptom: "Incursión de personal o Warehouse Representative en el espacio de trabajo físico del robot",
    root_cause: "Ingreso no coordinado de personal on-site al perímetro operativo de la máquina.",
    severity: "CRITICAL",
    resolution_protocol: "Detener de inmediato todo movimiento del robot. Mantener el volumen de audio del equipo activo para coordinarse con ingeniería on-site. Evaluar la situación visualmente antes de reanudar cualquier comando. Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación y se reiniciará el módulo reportado. Posteriormente, debe pasarse a posición de HOME e iniciar nuevamente la operación. Si el robot no se recupera tras esto, se enviará de forma automática un mensaje en el canal de Slack notificando que sigue en espera de intervención.",
    sop_reference: "SOP 2-F, SOP 2-G, Estándares de Seguridad (Volumen)"
  },
  {
    id: "ERR-BAG-001",
    category: "Qué hacer en caso de...",
    symptom: "La bagger escupe de forma abrupta la bolsa o no imprime más (Out of Bags)",
    root_cause: "El rollo de bolsas se consumió por completo durante la operación estándar en un robot con embolsadora.",
    severity: "MEDIUM",
    resolution_protocol: "Si la bagger escupe de forma abrupta la bolsa y tras presionar la pantalla del display en la bagger no imprime más, es muy probable que se haya terminado el rollo de bolsas. En este caso, se debe detener el robot y levantar la fault correspondiente en: Fault -> Bagger -> Out of Bags para que un Field Agent realice el reemplazo físico del rollo.",
    sop_reference: "SOP 11-A, Bagger Standard"
  },
  {
    id: "ERR-BAG-002",
    category: "Problemas con el robot",
    symptom: "Bolsa atascada en Bagger (Bag Jam)",
    root_cause: "Una bolsa queda atrapada en el mecanismo de sellado, apertura o alimentación por desalineación física o falla neumática.",
    severity: "HIGH",
    resolution_protocol: "Pausar la celda robótica. Levantar el reporte de fallo 'Bag Jam' en la pantalla del simulador. Llamar a soporte o mantenimiento en sitio para retirar la bolsa atascada de manera segura antes de reanudar.",
    sop_reference: "SOP 11-B, Bagger Standard"
  },
  {
    id: "ERR-BAG-003",
    category: "Problemas con el robot",
    symptom: "Bolsa arrugada, quemada o mal sellada en los extremos (Bad Seal)",
    root_cause: "Falla en la temperatura o calibración del mecanismo de sellado térmico en robots con bagger (Fleetwood, Packie, Future, e interno Bagger-Label). No aplica a robots de puro Tote (como Phil).",
    severity: "MEDIUM",
    resolution_protocol: "Pausar la estación. Reportar 'Bad Seal' en el simulador. Verificar la temperatura de la embolsadora o la colocación de la bolsa. Si el ítem es pesado, recordar colocar la pinza debajo para soportar el peso y facilitar el sello.",
    sop_reference: "SOP 11-C, Bagger Standard"
  },
  {
    id: "ERR-BIN-001",
    category: "Qué hacer en caso de...",
    symptom: "Robot deposita el paquete terminado en un contenedor equivocado (Package Dropped in Wrong Bin)",
    root_cause: "Falla de lectura del escáner de guías o descalibración lógica de rutas de salida.",
    severity: "MEDIUM",
    resolution_protocol: "Reportar 'Package Dropped in Wrong Bin' en el simulador para que quede registro. Recuperar el paquete de forma segura y colocarlo manualmente en el contenedor de la ruta correcta.",
    sop_reference: "SOP 12-A, Mapeo de Destinos"
  },
  {
    id: "ERR-BIN-002",
    category: "Qué hacer en caso de...",
    symptom: "El contenedor de paquetes terminados listos para envío está lleno (Package Bin Full)",
    root_cause: "Acumulación física de paquetes terminados en el contenedor de salida de la estación.",
    severity: "LOW",
    resolution_protocol: "Reportar 'Package Bin Full' en el simulador. Proceder a vaciar físicamente el contenedor de salida colocando los paquetes en la banda o carro correspondiente y reanudar la marcha.",
    sop_reference: "SOP 12-B, Manejo de Salidas"
  },
  {
    id: "ERR-BIN-003",
    category: "Qué hacer en caso de...",
    symptom: "El contenedor de artículos rechazados o defectuosos está lleno (Hospital Bin Full)",
    root_cause: "Saturación del contenedor de hospitalización debido a productos defectuosos o descartes durante el turno.",
    severity: "LOW",
    resolution_protocol: "Reportar 'Hospital Bin Full' en el simulador. Vaciar el contenedor de hospitalización y notificar al supervisor para la auditoría de los productos retenidos.",
    sop_reference: "SOP 12-C, Área de Descarte"
  },
  {
    id: "ERR-BIN-004",
    category: "Qué hacer en caso de...",
    symptom: "Alineación incorrecta del robot con el bin físico o necesidad de reubicar contenedores (Bin Location Adjustment Needed)",
    root_cause: "El robot intenta depositar productos en un contenedor pero no se alinea correctamente, no hay bin de depósito o no se alcanza, o en el caso de Customer no está el bin del color solicitado.",
    severity: "MEDIUM",
    resolution_protocol: "Levantar el reporte 'Bin Location Adjustment Needed' en el simulador. Ajustar la posición física del bin para que quede alineado al robot o verificar que esté colocado el bin del color que solicita el cliente.",
    sop_reference: "SOP 12-D, Calibración de Bins"
  },
  {
    id: "ERR-PRO-001",
    category: "Qué hacer en caso de...",
    symptom: "Falta de productos en la zona de alimentación (Out of Product) - Global",
    root_cause: "Se agotaron los artículos físicos en la banda de entrada o rack de alimentación, o no hay un lote (batch) cargado en el sistema.",
    severity: "LOW",
    resolution_protocol: "Reportar 'Out of Product' en el simulador. Esto aplica de forma global a todos los robots cuando ya no hay más producto en la zona o cuando no hay batch cargada en el sistema para seguir el trabajo.",
    sop_reference: "SOP 10-A, Abastecimiento"
  },
  {
    id: "ERR-SW-006",
    category: "Software",
    symptom: "La aplicación en el visor/headset se congela, se cierra inesperadamente o no responde (App Not Working)",
    root_cause: "Crash del navegador integrado, bug de runtime en el headset o falta de memoria de la app.",
    severity: "HIGH",
    resolution_protocol: "Reportar 'App Not Working' en el simulador para que se genere el ticket. Reiniciar la aplicación desde el visor y reestablecer la conexión con el servidor.",
    sop_reference: "SOP 4-E, Headset Troubleshoot"
  },
  {
    id: "ERR-SW-007",
    category: "Software",
    symptom: "Problema técnico imprevisto con el visor o software (Other Headset Issue)",
    root_cause: "Problemas diversos en el visor que no corresponden a categorías conocidas (descalibración de tracking, audio cortado, etc.).",
    severity: "MEDIUM",
    resolution_protocol: "Levantar el fault 'Other Headset Issue' en la categoría de software del simulador para el reporte automatizado con el equipo técnico.",
    sop_reference: "SOP 4-F, Headset Troubleshoot"
  }
];

/*
=============================================================================
SQL DE MIGRACIÓN A SUPABASE (ESCALABILIDAD)
=============================================================================
Para migrar esta información estática a una base de datos real y escalable,
ejecuta el siguiente script en el editor SQL de Supabase:

CREATE TYPE fault_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE troubleshooting_knowledge (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    symptom TEXT NOT NULL,
    root_cause TEXT NOT NULL,
    severity fault_severity NOT NULL,
    resolution_protocol TEXT NOT NULL,
    sop_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos base:
INSERT INTO troubleshooting_knowledge (id, category, symptom, root_cause, severity, resolution_protocol, sop_reference)
VALUES 
('ERR-KIN-001', 'Problemas con el robot', 'El hombro del robot comienza a visualizarse en la pantalla...', 'Operador trabajando con los brazos...', 'MEDIUM', 'Detener el movimiento... Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación...', 'SOP 1-C, SOP 1-F...'),
('ERR-ROB-007', 'Problemas con el robot', 'Falla de brazos: Uno o ambos brazos...', 'Pérdida de comunicación...', 'HIGH', 'Verificar si el fallo es en el brazo izquierdo o derecho... Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación...', 'SOP 8-C...'),
('ERR-ROB-008', 'Problemas con el robot', 'Falla de grippers...', 'Fallo neumático...', 'HIGH', 'Identificar cuál gripper presenta el problema... Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación...', 'SOP 1-D...'),
('ERR-ROB-009', 'Problemas con el robot', 'Falla de cámaras...', 'Desconexión física de cables...', 'MEDIUM', 'Identificar la cámara afectada... Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación...', 'SOP 2-D...'),
('ERR-ROB-010', 'Problemas con el robot', 'Falla de cuello...', 'Bloqueo mecánico...', 'MEDIUM', 'Detener los movimientos activos... Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación...', 'SOP 8-C...'),
('ERR-ROB-011', 'Problemas con el robot', 'Falla en chest (pecho)...', 'Bloqueo del actuador...', 'HIGH', 'Pausar de inmediato... Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación...', 'SOP 8-D...'),
('ERR-ROB-012', 'Problemas con el robot', 'Robot no se mueve...', 'Fallo general en el sistema...', 'HIGH', 'Verificar si hay algún obstáculo... Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación...', 'SOP 8-C...'),
('ERR-MEC-002', 'Qué hacer en caso de...', 'Qué hacer en caso de que el objeto sea cilíndrico...', 'El operador intentó sujetar...', 'HIGH', 'Asegurar la sujeción obligatoria... Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación...', 'SOP 1-D, SOP 11'),
('ERR-MEC-013', 'Qué hacer en caso de...', 'Qué hacer en caso de que un objeto se caiga...', 'Pérdida de agarre...', 'MEDIUM', 'Lo más importante es asegurar que no se dañe el robot... Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación...', 'SOP 11...'),
('ERR-MEC-014', 'Qué hacer en caso de...', 'Qué hacer en caso de que no imprima la etiqueta...', 'Fallo de conexión...', 'MEDIUM', 'Revisar la impresora... Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación...', 'SOP 7...'),
('ERR-NET-003', 'Conectividad', 'Alta latencia...', 'Saturación o degradación...', 'CRITICAL', 'Notificar inmediatamente... Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación...', 'SOP 2-D...'),
('ERR-SW-004', 'Software', 'Brazo del robot estático...', 'Crash o bloqueo...', 'HIGH', 'Detener la operación... Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación...', 'SOP 8-C...'),
('ERR-SW-005', 'Software', 'El robot muestra el aviso...', 'Bloqueo manual e intencional...', 'CRITICAL', 'PROHIBIDO CONECTARSE... Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación...', 'SOP 8-D...'),
('ERR-SEC-006', 'Seguridad', 'Incursión de personal...', 'Ingreso no coordinado...', 'CRITICAL', 'Detener de inmediato... Al momento de enviar el fault, automáticamente el robot entra en fase de autorrecuperación...', 'SOP 2-F...');

=============================================================================
*/
