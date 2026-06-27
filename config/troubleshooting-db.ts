import { TroubleshootingKnowledge } from '@/types/troubleshooting.types';

// ─────────────────────────────────────────────────────────────────────────────
// CAMPO `keywords`: sinónimos operativos en español e inglés que el operario
// usa en voz al describir el síntoma. La búsqueda fuzzy local los usa para
// matchear antes de llamar a Gemini. Gemini también los recibe en el catálogo
// para hacer matching semántico más preciso.
// ─────────────────────────────────────────────────────────────────────────────

export const TROUBLESHOOTING_DATABASE: TroubleshootingKnowledge[] = [
  {
    "id": "ERR-KIN-001",
    "category": "Consejos Operativos",
    "symptom": "El hombro del robot comienza a visualizarse en la pantalla operativa / pérdida de alineación",
    "keywords": "hombro visible pantalla alineacion perdida desalineado fuera de rango home posicion",
    "resolution_protocol": "Paso 1: Pausar el robot.\nPaso 2: Ajustar tu posición física (alineándote a la posición de Home).\nPaso 3: Mandar el robot a HOME.\nPaso 4: Iniciar a operar de nuevo.",
    "sop_reference": "SOP 1-C, SOP 1-F, Estándares de Seguridad (Postura)"
  },
  {
    "id": "ERR-ROB-007",
    "category": "Problemas con el robot",
    "symptom": "Falla de brazos: Uno o ambos brazos del robot se quedan congelados, no responden a comandos o se mueven de forma errática.",
    "keywords": "brazo congelado frozen arm no mueve no responde erratico trabado atorado bloqueado left right izquierdo derecho arm frozen",
    "resolution_protocol": "Paso 1: Detener la operación de inmediato.\nPaso 2: Verificar si el fallo se presenta en el brazo izquierdo o derecho.\nPaso 3: En el menú del simulador, levantar el reporte correspondiente al brazo afectado: seleccionar 'Left Arm Frozen' para el brazo izquierdo o 'Right Arm Frozen' para el brazo derecho. Al enviarlo, el sistema iniciará la autorrecuperación y reiniciará el módulo.\nPaso 4: Mover el robot a la posición HOME.\nPaso 5: Iniciar nuevamente la operación.\nPaso 6: Si el robot no se recupera tras esto, se enviará automáticamente un mensaje en el canal de Slack notificando que se requiere intervención.",
    "sop_reference": "SOP 8-C, Estándares de Seguridad (Brazos)"
  },
  {
    "id": "ERR-ROB-008",
    "category": "Problemas con el robot",
    "symptom": "Falla de grippers (pinzas): El gripper no abre, no cierra o no tiene fuerza de agarre.",
    "keywords": "gripper pinza no agarra no abre no cierra sin fuerza agarre suelto flojo left right gripper not working mano",
    "resolution_protocol": "Paso 1: Pausar el flujo de operación de inmediato.\nPaso 2: Identificar cuál gripper presenta el problema (izquierdo o derecho).\nPaso 3: Levantar el reporte de fallo específico en el simulador: seleccionar 'Left Gripper Not Working' para el gripper izquierdo o 'Right Gripper Not Working' para el gripper derecho. Al enviarlo, el sistema reiniciará automáticamente el módulo afectado y entrará en fase de autorrecuperación.\nPaso 4: Llevar el robot a la posición HOME.\nPaso 5: Iniciar de nuevo la operación.\nPaso 6: Si el robot no logra recuperarse, el sistema enviará una notificación automática en el canal de Slack para recibir asistencia técnica.",
    "sop_reference": "SOP 1-D, SOP 11, Estándares de Seguridad (Grippers)"
  },
  {
    "id": "ERR-ROB-009",
    "category": "Problemas con el robot",
    "symptom": "Falla de cámaras: Pérdida de señal de video o interferencia en la retroalimentación visual del robot.",
    "keywords": "camara sin video perdida señal interferencia negro pantalla negra head cam wrist cam out cabeza muneca imagen congelada",
    "resolution_protocol": "Paso 1: Identificar con precisión la cámara afectada.\nPaso 2: Levantar el reporte de fallo correspondiente en el simulador según el área afectada: seleccionar 'Head Cam Out' (cámara de la cabeza), 'Left Wrist Cam Out' (cámara de la muñeca izquierda) o 'Right Wrist Cam Out' (cámara de la muñeca derecha). El sistema reiniciará automáticamente el módulo de video.\nPaso 3: Regresar el robot a la posición HOME.\nPaso 4: Iniciar nuevamente la operación.\nPaso 5: Si el robot no se recupera, se enviará una notificación automática al canal de Slack solicitando intervención técnica.",
    "sop_reference": "SOP 2-D, SOP 4, Estándares de Seguridad (Cámaras)"
  },
  {
    "id": "ERR-ROB-010",
    "category": "Problemas con el robot",
    "symptom": "Falla de cuello: El cuello del robot no puede girar, está rígido o se atascó al intentar seguir visualmente un punto.",
    "keywords": "cuello rigido no gira atascado bloqueado neck frozen no voltea cabeza trabada",
    "resolution_protocol": "Paso 1: Detener los movimientos activos del robot.\nPaso 2: En el simulador, en la sección 'Robot', levantar el reporte seleccionando 'Neck Frozen'. Al enviarlo, se iniciará la autorrecuperación y el reinicio automático del módulo del cuello.\nPaso 3: Pasar el robot a la posición HOME.\nPaso 4: Iniciar de nuevo la operación de empaque.\nPaso 5: Si el robot sigue sin responder, se enviará automáticamente un mensaje en el canal de Slack informando que se requiere asistencia.",
    "sop_reference": "SOP 8-C, Estándares de Seguridad (Cuello)"
  },
  {
    "id": "ERR-ROB-011",
    "category": "Problemas con el robot",
    "symptom": "Falla en chest (pecho): El torso o pecho del robot se encuentra congelado o dejó de moverse/rotar completamente.",
    "keywords": "pecho torso chest frozen congelado no rota no gira bloqueado tronco sin movimiento",
    "resolution_protocol": "Paso 1: Pausar de inmediato toda la operación de la celda.\nPaso 2: En la sección 'Robot' del simulador, seleccionar y levantar el reporte 'Chest Frozen'. Esto iniciará automáticamente la fase de autorrecuperación y el reinicio del torso.\nPaso 3: Colocar el robot en posición HOME.\nPaso 4: Iniciar nuevamente el ciclo de empaque.\nPaso 5: Si el torso permanece sin responder, el sistema notificará de manera automática en el canal de Slack solicitando asistencia.",
    "sop_reference": "SOP 8-D, Estándares de Seguridad (Torso)"
  },
  {
    "id": "ERR-ROB-012",
    "category": "Problemas con el robot",
    "symptom": "Robot no se mueve: El robot se mantiene completamente estático y no responde a ningún comando de movimiento autónomo o manual.",
    "keywords": "robot estatico no responde no mueve autonomy not working congelado sin reaccion parado quieto bloqueado",
    "resolution_protocol": "Paso 1: Verificar si existen obstáculos físicos en el entorno del robot o si la autonomía se desactivó.\nPaso 2: En el simulador, levantar el reporte correspondiente al fallo: seleccionar 'Autonomy Not Working' (en la categoría Headset/App/Software) si es un fallo lógico, o 'Other Robot Issue' (en la categoría Robot) si es una anomalía general del hardware.\nPaso 3: Esperar a que el módulo afectado se reinicie automáticamente durante la fase de autorrecuperación.\nPaso 4: Llevar el robot a la posición HOME.\nPaso 5: Iniciar de nuevo la operación.\nPaso 6: Si el robot no se recupera, el sistema emitirá automáticamente una alerta en el canal de Slack solicitando intervención física.",
    "sop_reference": "SOP 8-C, SOP 8-F, Estándares de Seguridad (Control)"
  },
  {
    "id": "ERR-MEC-002",
    "category": "Qué hacer en caso de...",
    "symptom": "Qué hacer en caso de que el objeto sea cilíndrico",
    "keywords": "cilindrico lata botella objeto redondo tubo resbala rueda se cae dificil agarrar",
    "resolution_protocol": "Paso 1: Asegurar que la sujeción del objeto se realice obligatoriamente por la tapa o los pliegues superiores para evitar que resbale.\nPaso 2: Si el objeto llega a caerse, evaluar con precaución los límites de movimiento del robot antes de intentar recuperarlo físicamente.\nPaso 3: Si el objeto no está a un alcance seguro, levantar el reporte de fallo 'Dropped Item' en el simulador. Esto iniciará la autorrecuperación y reiniciará el módulo del brazo para continuar la operación.\nPaso 4: Pasar el robot a posición HOME y retomar el flujo de trabajo.\nPaso 5: Si no es posible continuar, el sistema notificará de manera automática en el canal de Slack para recibir asistencia.",
    "sop_reference": "SOP 1-D, SOP 11"
  },
  {
    "id": "ERR-MEC-013",
    "category": "Qué hacer en caso de...",
    "symptom": "Qué hacer en caso de que un objeto se caiga",
    "keywords": "objeto caido tirado en piso se cayo paquete caido dropped item product dropped piso suelo caer",
    "resolution_protocol": "Paso 1: Detener o pausar la operación de inmediato para evitar colisiones.\nPaso 2: Verificar visualmente que no exista ningún riesgo de daño físico para el robot o colisión con la estructura.\nPaso 3: Si la celda es segura, proceder a recuperar el objeto de acuerdo con tu rol:\n  - Rol Customer: Autorizado para realizar la recuperación física directamente.\n  - Rol DC: Valorar con extrema precaución si el objeto está a un alcance seguro antes de intentar recogerlo.\n  - Rol Training: Prohibido estrictamente realizar la recuperación física del objeto.\nPaso 4: Si no es seguro o factible recuperar el producto, levantar la alerta de fallo correspondiente en el simulador (como 'Package Dropped on Floor' o 'Product Dropped'). Si se puede continuar con la operación colocar 'continue job', de lo contrario colocar 'fail job'.\nPaso 5: Llevar el robot a la posición HOME e iniciar nuevamente la operación.\nPaso 6: Si el sistema sigue bloqueado, se enviará automáticamente un aviso al canal de Slack.",
    "sop_reference": "SOP 11, Estándares de Seguridad (Objetos Caídos)"
  },
  {
    "id": "ERR-MEC-014",
    "category": "Qué hacer en caso de...",
    "symptom": "Qué hacer en caso de que no imprima la etiqueta (Bagger / Impresora Integrada)",
    "keywords": "etiqueta no imprime no sale label bagger impresora integrada out of labels sin etiqueta no imprime bagger label",
    "resolution_protocol": "Paso 1: Revisar la impresora de la máquina Bagger (que expide la bolsa con etiqueta integrada) y verificar si su pantalla integrada muestra un mensaje de error.\nPaso 2: Si hay un error en la pantalla de la impresora, usar las pinzas del robot (cerradas) para tocar la pantalla y borrar la alerta. Intentar imprimir de nuevo.\nPaso 3: Si el problema persiste y no imprime, levantar el reporte 'Out of Labels' en la ruta de fallos del simulador para alertar sobre rollo vacío o fallo de hardware.\nPaso 4: Esperar la autorrecuperación automática y el reinicio del módulo de impresión.\nPaso 5: Llevar el robot a la posición HOME e iniciar nuevamente la operación.\nPaso 6: Si el problema continúa sin resolverse, el sistema enviará de forma automática una notificación en el canal de Slack.",
    "sop_reference": "SOP 7, Estándares de Impresión"
  },
  {
    "id": "ERR-MEC-016",
    "category": "Qué hacer en caso de...",
    "symptom": "Qué hacer en caso de que la impresora de etiquetas (pegado manual) no saque la etiqueta",
    "keywords": "impresora manual etiqueta no sale pedal amarillo reprint label pausa led pausada no imprime etiqueta manual",
    "resolution_protocol": "Paso 1: Verifica si la impresora está en pausa (te darás cuenta porque el led de pausa está encendido); si es así, presiona el botón de reanudar y listo.\nPaso 2: En caso de que el problema persista, manda el reprint label con el pedal de color amarillo.\nPaso 3: Si esto no funciona, entonces levanta la fault de Bagger / Out of Labels.\nSe anexa un video de cómo reanudar la impresora físicamente.",
    "sop_reference": "SOP 7, Estándares de Impresión (Pegado Manual)",
    "video_url": "https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/quitar%20pausa%20a%20impresora.mp4"
  },
  {
    "id": "ERR-NET-003",
    "category": "Conectividad",
    "symptom": "Alta latencia, congelamiento intermitente de cámaras o pérdida crítica de paquetes",
    "keywords": "latencia alta internet lento camara congelada perdida paquetes red inestable lag conexion falla network slow latency packet loss",
    "resolution_protocol": "Paso 1: Notificar inmediatamente al supervisor y al equipo de TI en sitio, indicando la hora exacta y los síntomas presentados (congelamiento de video, alta latencia).\nPaso 2: Si la latencia compromete la seguridad de la operación física, pausar el robot de inmediato.\nPaso 3: Realizar el cambio manual de Gateway en caliente hacia uno de los proveedores de internet de respaldo (Marcatel o Flo).\nPaso 4: Confirmar la restauración de la señal, llevar el robot a la posición HOME y reiniciar la operación.\nPaso 5: Si el enlace sigue inestable, el sistema enviará una notificación automática en el canal de Slack para escalación técnica.",
    "sop_reference": "SOP 2-D, SOP 4, Estándares de Seguridad (ISP)"
  },
  {
    "id": "ERR-SW-004",
    "category": "Software",
    "symptom": "Qué hacer en caso de que el robot no se mueva (no se mueve en teleop pero sí en auto)",
    "keywords": "teleop no mueve modo manual control manual no responde solo auto funciona en auto pero no en teleop",
    "resolution_protocol": "Paso 1: Presionar el pedal de home.\nPaso 2: Solicitarle al supervisor reiniciar la estación.\nPaso 3: Nota: si estás en un laboratorio interno lo puedes hacer tú mismo.",
    "sop_reference": "Modo AUTO y Teleop"
  },
  {
    "id": "ERR-SW-005",
    "category": "Software",
    "symptom": "El robot muestra el aviso o estado de sistema 'held for software dev'",
    "keywords": "held for software dev bloqueado por desarrollo reservado dev aviso software mensaje sistema no disponible lukas kyle malcolm",
    "resolution_protocol": "Paso 1: Detener inmediatamente cualquier intento de inicialización o movimiento del piloto (está estrictamente prohibido conectarse o ignorar este aviso).\nPaso 2: Escalar la disponibilidad de la celda de forma exclusiva con los supervisores designados: Lukas, Kyle o Malcolm.\nPaso 3: Esperar a que el equipo de desarrollo libere el bloqueo para que el robot inicie su fase de autorrecuperación.\nPaso 4: Pasar el robot a posición HOME y reiniciar la operación.\nPaso 5: Si el estado persiste sin autorización, el sistema registrará la espera y enviará el reporte correspondiente al canal de Slack.",
    "sop_reference": "SOP 8-D, SOP 8-E, Estándares de Seguridad (Modo Dev)"
  },
  {
    "id": "ERR-SEC-006",
    "category": "Seguridad",
    "symptom": "Incursión de personal o Warehouse Representative en el espacio de trabajo físico del robot",
    "keywords": "persona celda espacio trabajo incursion intrusion alguien entro warehouse rep personal ajeno dentro area seguridad",
    "resolution_protocol": "Paso 1: Detener de inmediato todo movimiento del robot.\nPaso 2: Mantener encendido y con volumen el audio del visor para coordinarse de forma efectiva con el personal en sitio.\nPaso 3: Evaluar visualmente la seguridad de la celda y esperar a que el personal se retire del perímetro.\nPaso 4: Una vez despejada el área, pasar el robot a posición HOME y reanudar la operación.\nPaso 5: Si se detecta un riesgo continuo o el robot no reacciona, el sistema enviará un aviso de emergencia al canal de Slack.",
    "sop_reference": "SOP 2-F, SOP 2-G, Estándares de Seguridad (Volumen)"
  },
  {
    "id": "ERR-BAG-001",
    "category": "Qué hacer en caso de...",
    "symptom": "La bagger escupe de forma abrupta la bolsa o no imprime más (Out of Bags)",
    "keywords": "bagger sin bolsas out of bags no saca bolsa escupe bolsa se acabaron bolsas rollo vacio no dispensa no embolsa bolsa agotada",
    "resolution_protocol": "Paso 1: Detener la operación del robot si la bagger escupe de forma abrupta una bolsa o deja de dispensar.\nPaso 2: Presionar la pantalla del display integrado de la bagger para verificar si el error persiste y la impresión no continúa.\nPaso 3: Si se confirma que el rollo de bolsas se consumió, levantar el reporte de fallo correspondiente en la ruta: Fault -> Bagger -> Out of Bags.\nPaso 4: Esperar a que un Field Agent en sitio realice el reemplazo físico del rollo de bolsas.\nPaso 5: Llevar el robot a la posición HOME e iniciar nuevamente la operación.",
    "sop_reference": "SOP 11-A, Bagger Standard"
  },
  {
    "id": "ERR-BAG-002",
    "category": "Problemas con el robot",
    "symptom": "Bolsa atascada en Bagger (Bag Jam)",
    "keywords": "bag jam bolsa atascada trabada atorada bagger bolsa atorada atasco mecanismo bloqueado",
    "resolution_protocol": "Paso 1: Pausar de inmediato la celda robótica para evitar daños en los mecanismos.\nPaso 2: Levantar el reporte de fallo específico 'Bag Jam' en la pantalla del simulador.\nPaso 3: Solicitar asistencia del personal de soporte o mantenimiento en sitio para retirar la bolsa atascada de forma segura.\nPaso 4: Una vez liberado el mecanismo, llevar el robot a la posición HOME e iniciar de nuevo la operación.",
    "sop_reference": "SOP 11-B, Bagger Standard"
  },
  {
    "id": "ERR-BAG-003",
    "category": "Problemas con el robot",
    "symptom": "Bolsa arrugada, quemada o mal sellada en los extremos (Bad Seal)",
    "keywords": "bad seal bolsa arrugada quemada mal sellada sello malo sellado incorrecto bolsa defectuosa bagger sello",
    "resolution_protocol": "Paso 1: Pausar la estación de empaque.\nPaso 2: Reportar el fallo 'Bad Seal' en la pantalla del simulador.\nPaso 3: Verificar visualmente la temperatura de la embolsadora y la correcta colocación de la bolsa.\nPaso 4: Si el artículo a empacar es pesado, sostener la bolsa por la parte inferior con la pinza del robot para soportar el peso y asegurar un sellado hermético.\nPaso 5: Llevar el robot a la posición HOME y reanudar la operación.",
    "sop_reference": "SOP 11-C, Bagger Standard"
  },
  {
    "id": "ERR-BIN-001",
    "category": "Qué hacer en caso de...",
    "symptom": "Robot deposita el paquete terminado en un contenedor equivocado (Package Dropped in Wrong Bin)",
    "keywords": "bin equivocado contenedor incorrecto paquete mal lugar wrong bin paquete ruta incorrecta deposito erroneo",
    "resolution_protocol": "Paso 1: Levantar el reporte de fallo 'Package Dropped in Wrong Bin' en el simulador para registrar el evento en el sistema.\nPaso 2: Localizar el paquete depositado erróneamente.\nPaso 3: Recuperar el paquete de forma segura y colocarlo manualmente en el contenedor correspondiente de la ruta correcta.\nPaso 4: Verificar la alineación del robot y continuar con la operación estándar.",
    "sop_reference": "SOP 12-A, Mapeo de Destinos"
  },
  {
    "id": "ERR-BIN-002",
    "category": "Qué hacer en caso de...",
    "symptom": "El contenedor de paquetes terminados listos para envío está lleno (Package Bin Full)",
    "keywords": "bin lleno contenedor lleno package bin full no caben mas paquetes salida llena",
    "resolution_protocol": "Paso 1: Reportar el fallo 'Package Bin Full' en el simulador.\nPaso 2: Vaciar físicamente el contenedor de salida, trasladando los paquetes terminados a la banda transportadora o carro asignado.\nPaso 3: Colocar nuevamente el contenedor vacío en su posición y reanudar la operación.",
    "sop_reference": "SOP 12-B, Manejo de Salidas"
  },
  {
    "id": "ERR-BIN-003",
    "category": "Qué hacer en caso de...",
    "symptom": "El contenedor de artículos rechazados o defectuosos está lleno (Hospital Bin Full)",
    "keywords": "hospital bin lleno contenedor defectuosos rechazados lleno descarte lleno hospital bin full",
    "resolution_protocol": "Paso 1: Reportar el fallo 'Hospital Bin Full' en el simulador.\nPaso 2: Vaciar el contenedor de hospitalización de artículos defectuosos.\nPaso 3: Notificar al supervisor en turno para proceder con la auditoría de los productos descartados y reanudar la marcha.",
    "sop_reference": "SOP 12-C, Área de Descarte"
  },
  {
    "id": "ERR-BIN-004",
    "category": "Qué hacer en caso de...",
    "symptom": "Alineación incorrecta del robot con el bin físico o necesidad de reubicar contenedores (Bin Location Adjustment Needed)",
    "keywords": "bin mal alineado contenedor fuera lugar reubicacion ajuste bin location adjustment needed contenedor desplazado",
    "resolution_protocol": "Paso 1: Levantar el reporte 'Bin Location Adjustment Needed' en el simulador.\nPaso 2: Ajustar manualmente la posición física del contenedor para que quede al rango de alcance del robot.\nPaso 3: En caso de rol Customer, verificar que el color del bin colocado coincida exactamente con el solicitado por el cliente.\nPaso 4: Reanudar la operación una vez confirmada la alineación.",
    "sop_reference": "SOP 12-D, Calibración de Bins"
  },
  {
    "id": "ERR-PRO-001",
    "category": "Qué hacer en caso de...",
    "symptom": "Falta de productos en la zona de alimentación (Out of Product) - Global",
    "keywords": "out of product sin productos no hay producto zona alimentacion vacia no job available no active batch lote vacio sin lote sin trabajo banda vacia sin insumo",
    "resolution_protocol": "Paso 1: Detener temporalmente los movimientos del robot.\nPaso 2: Reportar 'Out of Product' en el simulador para registrar la inactividad por falta de insumos.\nPaso 3: Abastecer la banda de entrada o solicitar la carga de un nuevo lote (batch) de productos en el sistema.\nPaso 4: Una vez reabastecido, reanudar la marcha.",
    "sop_reference": "SOP 10-A, Abastecimiento"
  },
  {
    "id": "ERR-SW-006",
    "category": "Software",
    "symptom": "La aplicación en el visor/headset se congela, se cierra inesperadamente o no responde (App Not Working)",
    "keywords": "app no funciona aplicacion se cierra se congela headset visor no responde app not working reiniciar app crashea",
    "resolution_protocol": "Paso 1: Levantar el fallo 'App Not Working' en el simulador para que se genere el ticket de soporte automáticamente.\nPaso 2: Cerrar la aplicación y realizar un reinicio forzado del navegador integrado en el visor/headset.\nPaso 3: Restablecer la conexión con el servidor y reanudar la operación.",
    "sop_reference": "SOP 4-E, Headset Troubleshoot"
  },
  {
    "id": "ERR-KIN-003",
    "category": "Consejos Operativos",
    "symptom": "Cómo utilizar el modo AUTO",
    "keywords": "modo auto autonomo autonomia como usar activar auto joystick letra a control autonomo",
    "resolution_protocol": "Paso 1: Verifica que tu posición física coincida con la del robot en el momento de realizar la intervención.\nPaso 2: Presiona la letra A en el joystick para coordinar la posición y tomar el control de forma segura.",
    "sop_reference": "Modo AUTO"
  },
  {
    "id": "ERR-MEC-015",
    "category": "Consejos Operativos",
    "symptom": "Retiro correcto de etiquetas (labels) del gripper",
    "keywords": "etiqueta pegada gripper label pegada pinza quitar etiqueta retirar label adherida bagger raspar",
    "resolution_protocol": "Paso 1: Nunca utilices la bagger u otros equipos como herramienta mecánica para raspar o quitar etiquetas adheridas.\nPaso 2: La mejor posición para quitar esas etiquetas es en la parte superior haciendo un movimiento vertical para evitar la ruptura de la etiqueta o que se quede pegada al gripper.\nPaso 3: Si no es posible retirarla de esta manera, solicita ayuda al supervisor de la estación.",
    "sop_reference": "Manejo de Etiquetas"
  },
  {
    "id": "ERR-PED-001",
    "category": "Consejos Operativos",
    "symptom": "No aparece el botón de los pedales / No tengo activos los pedales",
    "keywords": "pedal no aparece pedales inactivos sin pedales boton pedal no sale workflow falta pedal pedal desactivado",
    "resolution_protocol": "Paso 1: Pasar el robot a HOME.\nPaso 2: Si estás en un laboratorio interno, reinicia la estación en el portal de Ultra. Si es un robot de Customer, indícale al supervisor que te ayude con el reinicio de la estación.\nPaso 3: Si esto no funciona, verifica si hay un workflow cargado en el laboratorio. En muchas ocasiones es por esa razón que no tienes activos los pedales. El workflow lo puedes ver en la página de Ultra en donde aparece la información del laboratorio.\nPaso 4: Si no tienes workflow escala la información al grupo del robot en Slack y al supervisor en turno.",
    "sop_reference": "Calibración de Pedales y Workflow"
  },
  {
    "id": "ERR-ROB-013",
    "category": "Qué hacer en caso de...",
    "symptom": "El workflow solicita escanear el producto pero indica que el producto no ha sido encontrado (Aplica solo para robots Mabel y Fleetwood)",
    "keywords": "escanear producto no encontrado scan not found skip verificacion pedal amarillo mabel fleetwood barcode no lee",
    "resolution_protocol": "Paso 1: Intentar escanear el producto por segunda vez.\nPaso 2: Si en el segundo intento el producto sigue sin ser encontrado, presiona únicamente el botón 'Skip Verificación' utilizando el pedal amarillo.\nPaso 3: Continúa normalmente con el workflow.",
    "sop_reference": "Escaneo de Producto y Omisión (Mabel/Fleetwood)"
  },
  {
    "id": "ERR-BAG-004",
    "category": "Qué hacer en caso de...",
    "symptom": "La embolsadora no está sellando bien / falla de sellado en bolsa (Aplica solo para robot Monty)",
    "keywords": "monty embolsadora sello malo no sella bien bad seal bolsa mal sellada altura bolsa ajuste sellado fail job",
    "resolution_protocol": "Paso 1: Levantar el reporte de fallo 'Bad Seal' en el simulador y presionar 'Fail Job'.\nPaso 2: El personal físico en sitio debe estar al pendiente para ajustar la altura de la bolsa manualmente.\nPaso 3 (Nota adicional): Si el cliente limpia la falla pero no realiza ninguna acción correctiva, continúa el trabajo y escala la información de inmediato con tu supervisor.",
    "sop_reference": "Ajuste de Sellado (Monty)"
  }
];