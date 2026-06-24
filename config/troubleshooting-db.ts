import { TroubleshootingKnowledge } from '@/types/troubleshooting.types';

export const TROUBLESHOOTING_DATABASE: TroubleshootingKnowledge[] = [
  {
    id: "ERR-KIN-001",
    category: "Consejos Operativos",
    symptom: "El hombro del robot comienza a visualizarse en la pantalla operativa / pérdida de alineación",
    root_cause: "Visualizar mucho tiempo el hombro del robot significa que se está forzando el uso de las articulaciones y puede provocar movimientos erráticos del brazo. Recuerda cuidar tu postura.",
    severity: "MEDIUM",
    resolution_protocol: "Paso 1: Pausar el robot.\nPaso 2: Ajustar tu posición física (alineándote a la posición de Home).\nPaso 3: Mandar el robot a HOME.\nPaso 4: Iniciar a operar de nuevo.",
    sop_reference: "SOP 1-C, SOP 1-F, Estándares de Seguridad (Postura)"
  },
  {
    id: "ERR-ROB-007",
    category: "Problemas con el robot",
    symptom: "Falla de brazos: Uno o ambos brazos del robot se quedan congelados, no responden a comandos o se mueven de forma errática.",
    root_cause: "Pérdida de comunicación con los actuadores de las articulaciones de los brazos, o bloqueo (deadlock) en los controladores de movimiento de los brazos.",
    severity: "HIGH",
    resolution_protocol: "Paso 1: Detener la operación de inmediato.\nPaso 2: Verificar si el fallo se presenta en el brazo izquierdo o derecho.\nPaso 3: En el menú del simulador, levantar el reporte correspondiente al brazo afectado: seleccionar 'Left Arm Frozen' para el brazo izquierdo o 'Right Arm Frozen' para el brazo derecho. Al enviarlo, el sistema iniciará la autorrecuperación y reiniciará el módulo.\nPaso 4: Mover el robot a la posición HOME.\nPaso 5: Iniciar nuevamente la operación.\nPaso 6: Si el robot no se recupera tras esto, se enviará automáticamente un mensaje en el canal de Slack notificando que se requiere intervención.",
    sop_reference: "SOP 8-C, Estándares de Seguridad (Brazos)"
  },
  {
    id: "ERR-ROB-008",
    category: "Problemas con el robot",
    symptom: "Falla de grippers (pinzas): El gripper no abre, no cierra o no tiene fuerza de agarre.",
    root_cause: "Fallo neumático, desalineación física de las pinzas o pérdida de comunicación con la tarjeta controladora del efector final.",
    severity: "HIGH",
    resolution_protocol: "Paso 1: Pausar el flujo de operación de inmediato.\nPaso 2: Identificar cuál gripper presenta el problema (izquierdo o derecho).\nPaso 3: Levantar el reporte de fallo específico en el simulador: seleccionar 'Left Gripper Not Working' para el gripper izquierdo o 'Right Gripper Not Working' para el gripper derecho. Al enviarlo, el sistema reiniciará automáticamente el módulo afectado y entrará en fase de autorrecuperación.\nPaso 4: Llevar el robot a la posición HOME.\nPaso 5: Iniciar de nuevo la operación.\nPaso 6: Si el robot no logra recuperarse, el sistema enviará una notificación automática en el canal de Slack para recibir asistencia técnica.",
    sop_reference: "SOP 1-D, SOP 11, Estándares de Seguridad (Grippers)"
  },
  {
    id: "ERR-ROB-009",
    category: "Problemas con el robot",
    symptom: "Falla de cámaras: Pérdida de señal de video o interferencia en la retroalimentación visual del robot.",
    root_cause: "Desconexión física de cables, caída del controlador de video en el backend o fallo de hardware en la cámara correspondiente.",
    severity: "MEDIUM",
    resolution_protocol: "Paso 1: Identificar con precisión la cámara afectada.\nPaso 2: Levantar el reporte de fallo correspondiente en el simulador según el área afectada: seleccionar 'Head Cam Out' (cámara de la cabeza), 'Left Wrist Cam Out' (cámara de la muñeca izquierda) o 'Right Wrist Cam Out' (cámara de la muñeca derecha). El sistema reiniciará automáticamente el módulo de video.\nPaso 3: Regresar el robot a la posición HOME.\nPaso 4: Iniciar nuevamente la operación.\nPaso 5: Si el robot no se recupera, se enviará una notificación automática al canal de Slack solicitando intervención técnica.",
    sop_reference: "SOP 2-D, SOP 4, Estándares de Seguridad (Cámaras)"
  },
  {
    id: "ERR-ROB-010",
    category: "Problemas con el robot",
    symptom: "Falla de cuello: El cuello del robot no puede girar, está rígido o se atascó al intentar seguir visualmente un punto.",
    root_cause: "Bloqueo mecánico en la articulación del cuello, fallo del motor servo o descalibración del sensor de posición.",
    severity: "MEDIUM",
    resolution_protocol: "Paso 1: Detener los movimientos activos del robot.\nPaso 2: En el simulador, en la sección 'Robot', levantar el reporte seleccionando 'Neck Frozen'. Al enviarlo, se iniciará la autorrecuperación y el reinicio automático del módulo del cuello.\nPaso 3: Pasar el robot a la posición HOME.\nPaso 4: Iniciar de nuevo la operación de empaque.\nPaso 5: Si el robot sigue sin responder, se enviará automáticamente un mensaje en el canal de Slack informando que se requiere asistencia.",
    sop_reference: "SOP 8-C, Estándares de Seguridad (Cuello)"
  },
  {
    id: "ERR-ROB-011",
    category: "Problemas con el robot",
    symptom: "Falla en chest (pecho): El torso o pecho del robot se encuentra congelado o dejó de moverse/rotar completamente.",
    root_cause: "Bloqueo del actuador del torso principal o pérdida de comunicación con la controladora de movimiento central.",
    severity: "HIGH",
    resolution_protocol: "Paso 1: Pausar de inmediato toda la operación de la celda.\nPaso 2: En la sección 'Robot' del simulador, seleccionar y levantar el reporte 'Chest Frozen'. Esto iniciará automáticamente la fase de autorrecuperación y el reinicio del torso.\nPaso 3: Colocar el robot en posición HOME.\nPaso 4: Iniciar nuevamente el ciclo de empaque.\nPaso 5: Si el torso permanece sin responder, el sistema notificará de manera automática en el canal de Slack solicitando asistencia.",
    sop_reference: "SOP 8-D, Estándares de Seguridad (Torso)"
  },
  {
    id: "ERR-ROB-012",
    category: "Problemas con el robot",
    symptom: "Robot no se mueve: El robot se mantiene completamente estático y no responde a ningún comando de movimiento autónomo o manual.",
    root_cause: "Fallo general en el sistema de control autónomo (Autonomy Not Working) o problema de hardware indefinido en los actuadores principales.",
    severity: "HIGH",
    resolution_protocol: "Paso 1: Verificar si existen obstáculos físicos en el entorno del robot o si la autonomía se desactivó.\nPaso 2: En el simulador, levantar el reporte correspondiente al fallo: seleccionar 'Autonomy Not Working' (en la categoría Headset/App/Software) si es un fallo lógico, o 'Other Robot Issue' (en la categoría Robot) si es una anomalía general del hardware.\nPaso 3: Esperar a que el módulo afectado se reinicie automáticamente durante la fase de autorrecuperación.\nPaso 4: Llevar el robot a la posición HOME.\nPaso 5: Iniciar de nuevo la operación.\nPaso 6: Si el robot no se recupera, el sistema emitirá automáticamente una alerta en el canal de Slack solicitando intervención física.",
    sop_reference: "SOP 8-C, SOP 8-F, Estándares de Seguridad (Control)"
  },
  {
    id: "ERR-MEC-002",
    category: "Qué hacer en caso de...",
    symptom: "Qué hacer en caso de que el objeto sea cilíndrico",
    root_cause: "El operador intentó sujetar el ítem por el cuerpo cilíndrico en lugar de la tapa o los pliegues superiores.",
    severity: "HIGH",
    resolution_protocol: "Paso 1: Asegurar que la sujeción del objeto se realice obligatoriamente por la tapa o los pliegues superiores para evitar que resbale.\nPaso 2: Si el objeto llega a caerse, evaluar con precaución los límites de movimiento del robot antes de intentar recuperarlo físicamente.\nPaso 3: Si el objeto no está a un alcance seguro, levantar el reporte de fallo 'Dropped Item' en el simulador. Esto iniciará la autorrecuperación y reiniciará el módulo del brazo para continuar la operación.\nPaso 4: Pasar el robot a posición HOME y retomar el flujo de trabajo.\nPaso 5: Si no es posible continuar, el sistema notificará de manera automática en el canal de Slack para recibir asistencia.",
    sop_reference: "SOP 1-D, SOP 11"
  },
  {
    id: "ERR-MEC-013",
    category: "Qué hacer en caso de...",
    symptom: "Qué hacer en caso de que un objeto se caiga",
    root_cause: "Pérdida de agarre del gripper, colisión leve o desprendimiento del paquete durante la transferencia.",
    severity: "MEDIUM",
    resolution_protocol: "Paso 1: Detener o pausar la operación de inmediato para evitar colisiones.\nPaso 2: Verificar visualmente que no exista ningún riesgo de daño físico para el robot o colisión con la estructura.\nPaso 3: Si la celda es segura, proceder a recuperar el objeto de acuerdo con tu rol:\n  - Rol Customer: Autorizado para realizar la recuperación física directamente.\n  - Rol DC: Valorar con extrema precaución si el objeto está a un alcance seguro antes de intentar recogerlo.\n  - Rol Training: Prohibido estrictamente realizar la recuperación física del objeto.\nPaso 4: Si no es seguro o factible recuperar el producto, levantar la alerta de fallo correspondiente en el simulador (como 'Package Dropped on Floor' o 'Product Dropped'). Si se puede continuar con la operación colocar 'continue job', de lo contrario colocar 'fail job'.\nPaso 5: Llevar el robot a la posición HOME e iniciar nuevamente la operación.\nPaso 6: Si el sistema sigue bloqueado, se enviará automáticamente un aviso al canal de Slack.",
    sop_reference: "SOP 11, Estándares de Seguridad (Objetos Caídos)"
  },
  {
    id: "ERR-MEC-014",
    category: "Qué hacer en caso de...",
    symptom: "Qué hacer en caso de que no imprima la etiqueta (Bagger / Impresora Integrada)",
    root_cause: "Fallo de conexión con la impresora térmica integrada de la Bagger (máquina que saca la bolsa con la etiqueta pegada), falta de insumos o atasco en el cabezal.",
    severity: "MEDIUM",
    resolution_protocol: "Paso 1: Revisar la impresora de la máquina Bagger (que expide la bolsa con etiqueta integrada) y verificar si su pantalla integrada muestra un mensaje de error.\nPaso 2: Si hay un error en la pantalla de la impresora, usar las pinzas del robot (cerradas) para tocar la pantalla y borrar la alerta. Intentar imprimir de nuevo.\nPaso 3: Si el problema persiste y no imprime, levantar el reporte 'Out of Labels' en la ruta de fallos del simulador para alertar sobre rollo vacío o fallo de hardware.\nPaso 4: Esperar la autorrecuperación automática y el reinicio del módulo de impresión.\nPaso 5: Llevar el robot a la posición HOME e iniciar nuevamente la operación.\nPaso 6: Si el problema continúa sin resolverse, el sistema enviará de forma automática una notificación en el canal de Slack.",
    sop_reference: "SOP 7, Estándares de Impresión"
  },
  {
    id: "ERR-MEC-016",
    category: "Qué hacer en caso de...",
    symptom: "Qué hacer en caso de que la impresora de etiquetas (pegado manual) no saque la etiqueta",
    root_cause: "La impresora de etiquetas manual se encuentra en pausa o requiere una reimpresión.",
    severity: "MEDIUM",
    resolution_protocol: "Paso 1: Verifica si la impresora está en pausa (te darás cuenta porque el led de pausa está encendido); si es así, presiona el botón de reanudar y listo.\nPaso 2: En caso de que el problema persista, manda el reprint label con el pedal de color amarillo.\nPaso 3: Si esto no funciona, entonces levanta la fault de Bagger / Out of Labels.\nSe anexa un video de cómo reanudar la impresora físicamente.",
    sop_reference: "SOP 7, Estándares de Impresión (Pegado Manual)",
    video_url: "https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/quitar%20pausa%20a%20impresora.mp4"
  },
  {
    id: "ERR-NET-003",
    category: "Conectividad",
    symptom: "Alta latencia, congelamiento intermitente de cámaras o pérdida crítica de paquetes",
    root_cause: "Saturación o degradación del enlace del ISP primario (Alestra).",
    severity: "CRITICAL",
    resolution_protocol: "Paso 1: Notificar inmediatamente al supervisor y al equipo de TI en sitio, indicando la hora exacta y los síntomas presentados (congelamiento de video, alta latencia).\nPaso 2: Si la latencia compromete la seguridad de la operación física, pausar el robot de inmediato.\nPaso 3: Realizar el cambio manual de Gateway en caliente hacia uno de los proveedores de internet de respaldo (Marcatel o Flo).\nPaso 4: Confirmar la restauración de la señal, llevar el robot a la posición HOME y reiniciar la operación.\nPaso 5: Si el enlace sigue inestable, el sistema enviará una notificación automática en el canal de Slack para escalación técnica.",
    sop_reference: "SOP 2-D, SOP 4, Estándares de Seguridad (ISP)"
  },
  {
    id: "ERR-SW-004",
    category: "Software",
    symptom: "Qué hacer en caso de que el robot no se mueva (no se mueve en teleop pero sí en auto)",
    root_cause: "Aplica únicamente para los robots que se encuentran en modo auto, donde el robot no responde a los comandos de teleop pero sí se mueve de manera autónoma.",
    severity: "MEDIUM",
    resolution_protocol: "Paso 1: Presionar el pedal de home.\nPaso 2: Solicitarle al supervisor reiniciar la estación.\nPaso 3: Nota: si estás en un laboratorio interno lo puedes hacer tú mismo.",
    sop_reference: "Modo AUTO y Teleop"
  },
  {
    id: "ERR-SW-005",
    category: "Software",
    symptom: "El robot muestra el aviso o estado de sistema 'held for software dev'",
    root_cause: "Bloqueo manual e intencional por parte del equipo de ingeniería de Ultra para despliegue de código o debugging.",
    severity: "CRITICAL",
    resolution_protocol: "Paso 1: Detener inmediatamente cualquier intento de inicialización o movimiento del piloto (está estrictamente prohibido conectarse o ignorar este aviso).\nPaso 2: Escalar la disponibilidad de la celda de forma exclusiva con los supervisores designados: Lukas, Kyle o Malcolm.\nPaso 3: Esperar a que el equipo de desarrollo libere el bloqueo para que el robot inicie su fase de autorrecuperación.\nPaso 4: Pasar el robot a posición HOME y reiniciar la operación.\nPaso 5: Si el estado persiste sin autorización, el sistema registrará la espera y enviará el reporte correspondiente al canal de Slack.",
    sop_reference: "SOP 8-D, SOP 8-E, Estándares de Seguridad (Modo Dev)"
  },
  {
    id: "ERR-SEC-006",
    category: "Seguridad",
    symptom: "Incursión de personal o Warehouse Representative en el espacio de trabajo físico del robot",
    root_cause: "Ingreso no coordinado de personal on-site al perímetro operativo de la máquina.",
    severity: "CRITICAL",
    resolution_protocol: "Paso 1: Detener de inmediato todo movimiento del robot.\nPaso 2: Mantener encendido y con volumen el audio del visor para coordinarse de forma efectiva con el personal en sitio.\nPaso 3: Evaluar visualmente la seguridad de la celda y esperar a que el personal se retire del perímetro.\nPaso 4: Una vez despejada el área, pasar el robot a posición HOME y reanudar la operación.\nPaso 5: Si se detecta un riesgo continuo o el robot no reacciona, el sistema enviará un aviso de emergencia al canal de Slack.",
    sop_reference: "SOP 2-F, SOP 2-G, Estándares de Seguridad (Volumen)"
  },
  {
    id: "ERR-BAG-001",
    category: "Qué hacer en caso de...",
    symptom: "La bagger escupe de forma abrupta la bolsa o no imprime más (Out of Bags)",
    root_cause: "El rollo de bolsas se consumió por completo durante la operación estándar en un robot con embolsadora.",
    severity: "MEDIUM",
    resolution_protocol: "Paso 1: Detener la operación del robot si la bagger escupe de forma abrupta una bolsa o deja de dispensar.\nPaso 2: Presionar la pantalla del display integrado de la bagger para verificar si el error persiste y la impresión no continúa.\nPaso 3: Si se confirma que el rollo de bolsas se consumió, levantar el reporte de fallo correspondiente en la ruta: Fault -> Bagger -> Out of Bags.\nPaso 4: Esperar a que un Field Agent en sitio realice el reemplazo físico del rollo de bolsas.\nPaso 5: Llevar el robot a la posición HOME e iniciar nuevamente la operación.",
    sop_reference: "SOP 11-A, Bagger Standard"
  },
  {
    id: "ERR-BAG-002",
    category: "Problemas con el robot",
    symptom: "Bolsa atascada en Bagger (Bag Jam)",
    root_cause: "Una bolsa queda atrapada en el mecanismo de sellado, apertura o alimentación por desalineación física o falla neumática.",
    severity: "HIGH",
    resolution_protocol: "Paso 1: Pausar de inmediato la celda robótica para evitar daños en los mecanismos.\nPaso 2: Levantar el reporte de fallo específico 'Bag Jam' en la pantalla del simulador.\nPaso 3: Solicitar asistencia del personal de soporte o mantenimiento en sitio para retirar la bolsa atascada de forma segura.\nPaso 4: Una vez liberado el mecanismo, llevar el robot a la posición HOME e iniciar de nuevo la operación.",
    sop_reference: "SOP 11-B, Bagger Standard"
  },
  {
    id: "ERR-BAG-003",
    category: "Problemas con el robot",
    symptom: "Bolsa arrugada, quemada o mal sellada en los extremos (Bad Seal)",
    root_cause: "Falla en la temperatura o calibración del mecanismo de sellado térmico en robots con bagger (Fleetwood, Packie, Future, e interno Bagger-Label). No aplica a robots de puro Tote (como Phil).",
    severity: "MEDIUM",
    resolution_protocol: "Paso 1: Pausar la estación de empaque.\nPaso 2: Reportar el fallo 'Bad Seal' en la pantalla del simulador.\nPaso 3: Verificar visualmente la temperatura de la embolsadora y la correcta colocación de la bolsa.\nPaso 4: Si el artículo a empacar es pesado, sostener la bolsa por la parte inferior con la pinza del robot para soportar el peso y asegurar un sellado hermético.\nPaso 5: Llevar el robot a la posición HOME y reanudar la operación.",
    sop_reference: "SOP 11-C, Bagger Standard"
  },
  {
    id: "ERR-BIN-001",
    category: "Qué hacer en caso de...",
    symptom: "Robot deposita el paquete terminado en un contenedor equivocado (Package Dropped in Wrong Bin)",
    root_cause: "Falla de lectura del escáner de guías o descalibración lógica de rutas de salida.",
    severity: "MEDIUM",
    resolution_protocol: "Paso 1: Levantar el reporte de fallo 'Package Dropped in Wrong Bin' en el simulador para registrar el evento en el sistema.\nPaso 2: Localizar el paquete depositado erróneamente.\nPaso 3: Recuperar el paquete de forma segura y colocarlo manualmente en el contenedor correspondiente de la ruta correcta.\nPaso 4: Verificar la alineación del robot y continuar con la operación estándar.",
    sop_reference: "SOP 12-A, Mapeo de Destinos"
  },
  {
    id: "ERR-BIN-002",
    category: "Qué hacer en caso de...",
    symptom: "El contenedor de paquetes terminados listos para envío está lleno (Package Bin Full)",
    root_cause: "Acumulación física de paquetes terminados en el contenedor de salida de la estación.",
    severity: "LOW",
    resolution_protocol: "Paso 1: Reportar el fallo 'Package Bin Full' en el simulador.\nPaso 2: Vaciar físicamente el contenedor de salida, trasladando los paquetes terminados a la banda transportadora o carro asignado.\nPaso 3: Colocar nuevamente el contenedor vacío en su posición y reanudar la operación.",
    sop_reference: "SOP 12-B, Manejo de Salidas"
  },
  {
    id: "ERR-BIN-003",
    category: "Qué hacer en caso de...",
    symptom: "El contenedor de artículos rechazados o defectuosos está lleno (Hospital Bin Full)",
    root_cause: "Saturación del contenedor de hospitalización debido a productos defectuosos o descartes durante el turno.",
    severity: "LOW",
    resolution_protocol: "Paso 1: Reportar el fallo 'Hospital Bin Full' en el simulador.\nPaso 2: Vaciar el contenedor de hospitalización de artículos defectuosos.\nPaso 3: Notificar al supervisor en turno para proceder con la auditoría de los productos descartados y reanudar la marcha.",
    sop_reference: "SOP 12-C, Área de Descarte"
  },
  {
    id: "ERR-BIN-004",
    category: "Qué hacer en caso de...",
    symptom: "Alineación incorrecta del robot con el bin físico o necesidad de reubicar contenedores (Bin Location Adjustment Needed)",
    root_cause: "El robot intenta depositar productos en un contenedor pero no se alinea correctamente, no hay bin de depósito o no se alcanza, o en el caso de Customer no está el bin del color solicitado.",
    severity: "MEDIUM",
    resolution_protocol: "Paso 1: Levantar el reporte 'Bin Location Adjustment Needed' en el simulador.\nPaso 2: Ajustar manualmente la posición física del contenedor para que quede al rango de alcance del robot.\nPaso 3: En caso de rol Customer, verificar que el color del bin colocado coincida exactamente con el solicitado por el cliente.\nPaso 4: Reanudar la operación una vez confirmada la alineación.",
    sop_reference: "SOP 12-D, Calibración de Bins"
  },
  {
    id: "ERR-PRO-001",
    category: "Qué hacer en caso de...",
    symptom: "Falta de productos en la zona de alimentación (Out of Product) - Global",
    root_cause: "Se agotaron los artículos físicos en la banda de entrada o rack de alimentación, o no hay un lote (batch) cargado en el sistema.",
    severity: "LOW",
    resolution_protocol: "Paso 1: Detener temporalmente los movimientos del robot.\nPaso 2: Reportar 'Out of Product' en el simulador para registrar la inactividad por falta de insumos.\nPaso 3: Abastecer la banda de entrada o solicitar la carga de un nuevo lote (batch) de productos en el sistema.\nPaso 4: Una vez reabastecido, reanudar la marcha.",
    sop_reference: "SOP 10-A, Abastecimiento"
  },
  {
    id: "ERR-SW-006",
    category: "Software",
    symptom: "La aplicación en el visor/headset se congela, se cierra inesperadamente o no responde (App Not Working)",
    root_cause: "Crash del navegador integrado, bug de runtime en el headset o falta de memoria de la app.",
    severity: "HIGH",
    resolution_protocol: "Paso 1: Levantar el fallo 'App Not Working' en el simulador para que se genere el ticket de soporte automáticamente.\nPaso 2: Cerrar la aplicación y realizar un reinicio forzado del navegador integrado en el visor/headset.\nPaso 3: Restablecer la conexión con el servidor y reanudar la operación.",
    sop_reference: "SOP 4-E, Headset Troubleshoot"
  },

  {
    id: "ERR-KIN-003",
    category: "Consejos Operativos",
    symptom: "Cómo utilizar el modo AUTO",
    root_cause: "Si uno está en modo AUTO e interviene, es imperativo estar en la misma posición del robot en el momento que queremos intervenir presionando la letra A en el joystick.",
    severity: "MEDIUM",
    resolution_protocol: "Paso 1: Verifica que tu posición física coincida con la del robot en el momento de realizar la intervención.\nPaso 2: Presiona la letra A en el joystick para coordinar la posición y tomar el control de forma segura.",
    sop_reference: "Modo AUTO"
  },
  {
    id: "ERR-MEC-015",
    category: "Consejos Operativos",
    symptom: "Retiro correcto de etiquetas (labels) del gripper",
    root_cause: "El mal retiro de etiquetas puede provocar que se queden adheridas al gripper o a las manos, ocasionando desesperación y mal uso de componentes como la bagger para retirarlas.",
    severity: "MEDIUM",
    resolution_protocol: "Paso 1: Nunca utilices la bagger u otros equipos como herramienta mecánica para raspar o quitar etiquetas adheridas.\nPaso 2: La mejor posición para quitar esas etiquetas es en la parte superior haciendo un movimiento vertical para evitar la ruptura de la etiqueta o que se quede pegada al gripper.\nPaso 3: Si no es posible retirarla de esta manera, solicita ayuda al supervisor de la estación.",
    sop_reference: "Manejo de Etiquetas"
  }
];
