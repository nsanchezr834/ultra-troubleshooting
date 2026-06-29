export interface FaultConfig {
    id: string;
    issue: string;
    description: string;
    troubleshooting: string[];
    escalation: string;
    finalNotes?: string;
    severity: 'baja' | 'media' | 'alta';
}

export interface AdviceConfig {
    id: string;
    adviceNumber: number;
    title?: string;
    content: string;
    isException: boolean;
}

export interface RobotConfig {
    id: string;
    name: string;
    status: 'active' | 'offline';
    faults: FaultConfig[]; // Requerido estrictamente para el componente de diagnóstico
    advises?: AdviceConfig[];
}

export interface ClientConfig {
    id: string;
    name: string;
    robots: RobotConfig[];
}

export const CLIENTS_DATABASE: Record<string, ClientConfig> = {
    'manifest.eco': {
        id: 'manifest.eco',
        name: 'manifest.eco',
        robots: [
            {
                id: 'packie-2.0',
                name: 'Packie 2.0',
                status: 'active',
                faults: [
                    {
                        id: 'arm-frozen',
                        issue: 'Arm Frozen',
                        severity: 'media',
                        description: 'Brazo izquierdo detenido en medio de un proceso operativo activo.',
                        troubleshooting: [
                            'En la interfaz en tus headsets, envíe el comando Fault (arm frozen).',

                            'Antes de mandar el comando Home, verifique visualmente que el robot esté en posición segura.',
                            'Si es necesario o detecta riesgo de colisión, manténgalo únicamente en Pausa.'
                        ],
                        escalation: 'Liam (Slack Internal)'
                    }
                ],
                advises: [
                    {
                        id: 'packie-2.0__1',
                        adviceNumber: 1,
                        content: 'Verifica las dimensiones del producto, ya que si es muy grande, procura ingresarlo de forma vertical para que pueda realizar correctamente el cierre.',
                        isException: false
                    },
                    {
                        id: 'packie-2.0__2',
                        adviceNumber: 2,
                        content: 'Si se observa que la bagger arrojó la bolsa sin abrirse por falta de aire con los grippers cerrados, haz un movimiento vertical de arriba hacia abajo para obligar a que entre el aire en la posición correcta y abra la bolsa.',
                        isException: false
                    },
                    {
                        id: 'packie-2.0__3',
                        adviceNumber: 3,
                        content: 'Cuando los objetos sean grandes y pesados, coloca la pinza debajo de la bolsa para ayudar con el peso y facilitar el cierre.',
                        isException: false
                    },
                    {
                        id: 'packie-2.0__4',
                        adviceNumber: 4,
                        content: 'Prioriza que el movimiento de los brazos sea mínimo y que el movimiento sea del robot completamente debido a los espacios reducidos.',
                        isException: false
                    },
                    {
                        id: 'packie-2.0__5',
                        adviceNumber: 5,
                        content: 'Visualiza la posición del robot: en una posición correcta no se vería demasiado el hombro del robot. Los movimientos que realices deben ser fluidos, constantes y verificando la movilidad para no dañar el robot.',
                        isException: false
                    },
                    {
                        id: 'packie-2.0__6',
                        adviceNumber: 6,
                        content: 'Si se detiene la máquina porque se quedó atorada la barra selladora:\nPaso 1: Con el brazo izquierdo jala la barra hacia ti.\nPaso 2: Posteriormente, con el gripper de la mano derecha cerrado, presiona la pantalla del display de la máquina bagger para borrar el error.\nPaso 3: Confirma el cerrado con los pedales para que la máquina reaccione correctamente.\nPaso 4: Si vuelve a fallar el cerrado, usa el pedal 3 de color amarillo para reimprimir la etiqueta.',
                        isException: false
                    },
                    {
                        id: 'packie-2.0__7',
                        adviceNumber: 7,
                        content: 'Falla con la bagger: En caso de que la bolsa se imprima por fuera de la barra selladora:\nPaso 1: Arrancar la bolsa y dejarla en el hospital bin.\nPaso 2: Presionar en reprint (pedal amarillo) para que vuelva a sacar la bolsa correctamente.',
                        isException: false
                    }
                ]
            },
            { 
                id: 'future-2.0', 
                name: 'Future 2.0', 
                status: 'active', 
                faults: [],
                advises: [
                    {
                        id: 'future-2.0__1',
                        adviceNumber: 1,
                        content: 'Verifica las dimensiones del producto, ya que si es muy grande, procura ingresarlo de forma vertical para que pueda realizar correctamente el cierre.',
                        isException: false
                    },
                    {
                        id: 'future-2.0__2',
                        adviceNumber: 2,
                        content: 'Si se observa que la bagger arrojó la bolsa sin abrirse por falta de aire con los grippers cerrados, haz un movimiento vertical de arriba hacia abajo para obligar a que entre el aire en la posición correcta y abra la bolsa.',
                        isException: false
                    },
                    {
                        id: 'future-2.0__3',
                        adviceNumber: 3,
                        content: 'Cuando los objetos sean grandes y pesados, coloca la pinza debajo de la bolsa para ayudar con el peso y facilitar el cierre.',
                        isException: false
                    },
                    {
                        id: 'future-2.0__4',
                        adviceNumber: 4,
                        content: 'Prioriza que el movimiento de los brazos sea mínimo y que el movimiento sea del robot completamente debido a los espacios reducidos.',
                        isException: false
                    },
                    {
                        id: 'future-2.0__5',
                        adviceNumber: 5,
                        content: 'Visualiza la posición del robot: en una posición correcta no se vería demasiado el hombro del robot. Los movimientos que realices deben ser fluidos, constantes y verificando la movilidad para no dañar el robot.',
                        isException: false
                    },
                    {
                        id: 'future-2.0__6',
                        adviceNumber: 6,
                        content: 'Si se detiene la máquina porque se quedó atorada la barra selladora:\nPaso 1: Con el brazo izquierdo jala la barra hacia ti.\nPaso 2: Posteriormente, con el gripper de la mano derecha cerrado, presiona la pantalla del display de la máquina bagger para borrar el error.\nPaso 3: Confirma el cerrado con los pedales para que la máquina reaccione correctamente.\nPaso 4: Si vuelve a fallar el cerrado, usa el pedal 3 de color amarillo para reimprimir la etiqueta.',
                        isException: false
                    },
                    {
                        id: 'future-2.0__7',
                        adviceNumber: 7,
                        content: 'Falla con la bagger: En caso de que la bolsa se imprima por fuera de la barra selladora:\nPaso 1: Arrancar la bolsa y dejarla en el hospital bin.\nPaso 2: Presionar en reprint (pedal amarillo) para que vuelva a sacar la bolsa correctamente.',
                        isException: false
                    }
                ]
            },
            { 
                id: 'captain-pack-sparrow', 
                name: 'Captain Pack Sparrow', 
                status: 'active', 
                faults: [
                    {
                        id: 'no-saca-bolsa',
                        issue: 'No saca la bolsa de la bagger',
                        severity: 'media',
                        description: 'La bagger no arroja o no saca la bolsa correspondiente al pedido.',
                        troubleshooting: [
                            'Retirar la etiqueta.',
                            'Darle en reportar falla y reimprimir, esto activará de nuevo la bagger.',
                            'Si no la saca aún con los dos pasos anteriores, se tiene que poner la fault de bagger, bag jam. Eso hará que se mande un redo al pedido de forma automática.'
                        ],
                        escalation: 'Liam (Slack Internal)'
                    }
                ],
                advises: [
                    {
                        id: 'captain-pack-sparrow__1',
                        adviceNumber: 1,
                        content: 'La mejor posición para quitar las etiquetas es en la parte superior haciendo un movimiento vertical para evitar la ruptura de la etiqueta o que se quede pegada al gripper.',
                        isException: false
                    },
                    {
                        id: 'captain-pack-sparrow__2',
                        adviceNumber: 2,
                        content: 'En caso de que no saque la bolsa de la bagger:\nPaso 1: Retirar la etiqueta.\nPaso 2: Darle en reportar falla y reimprimir (esto activará de nuevo la bagger).\nPaso 3: Si persiste, colocar la fault de bagger "bag jam" para enviar un redo automático del pedido.',
                        isException: false
                    },
                    {
                        id: 'captain-pack-sparrow__3',
                        adviceNumber: 3,
                        content: 'En caso de que la bolsa de la bagger se imprima por fuera de la barra:\nPaso 1: Intenta ingresarla a la posición por detrás de la barra.',
                        isException: false
                    }
                ]
            },
            { 
                id: 'packasaurus', 
                name: 'Packasaurus', 
                status: 'active', 
                faults: [
                    {
                        id: 'no-saca-bolsa',
                        issue: 'No saca la bolsa de la bagger',
                        severity: 'media',
                        description: 'La bagger no arroja o no saca la bolsa correspondiente al pedido.',
                        troubleshooting: [
                            'Retirar la etiqueta.',
                            'Darle en reportar falla y reimprimir, esto activará de nuevo la bagger.',
                            'Si no la saca aún con los dos pasos anteriores, se tiene que poner la fault de bagger, bag jam. Eso hará que se mande un redo al pedido de forma automática.'
                        ],
                        escalation: 'Liam (Slack Internal)'
                    }
                ],
                advises: [
                    {
                        id: 'packasaurus__1',
                        adviceNumber: 1,
                        content: 'Se necesita agarrar la etiqueta con el brazo donde se encuentre la etiquetadora.',
                        isException: false
                    },
                    {
                        id: 'packasaurus__2',
                        adviceNumber: 2,
                        content: 'Mientras se va cerrando la bolsa se le pega la etiqueta; la bagger tardará unos 10 segundos aproximadamente para terminar de cerrar la bolsa.',
                        isException: false
                    },
                    {
                        id: 'packasaurus__3',
                        adviceNumber: 3,
                        content: 'Mucho cuidado al finalizar el cerrado: inmediatamente sale la otra bolsa de la bagger, por lo que hay que ser rápidos y precisos en estos movimientos.',
                        isException: false
                    },
                    {
                        id: 'packasaurus__4',
                        adviceNumber: 4,
                        content: 'La mejor posición para quitar las etiquetas es en la parte superior haciendo un movimiento vertical para evitar la ruptura de la etiqueta o que se quede pegada al gripper.',
                        isException: false
                    },
                    {
                        id: 'packasaurus__5',
                        adviceNumber: 5,
                        content: 'En caso de que no saque la bolsa de la bagger:\nPaso 1: Retirar la etiqueta.\nPaso 2: Darle en reportar falla y reimprimir (esto activará de nuevo la bagger).\nPaso 3: Si persiste, colocar la fault de bagger "bag jam" para enviar un redo automático del pedido.',
                        isException: false
                    },
                    {
                        id: 'packasaurus__6',
                        adviceNumber: 6,
                        content: 'En caso de que la bolsa de la bagger se imprima por fuera de la barra:\nPaso 1: Intenta ingresarla a la posición por detrás de la barra.',
                        isException: false
                    }
                ]
            },
            { id: 'packemon', name: 'Packemon', status: 'offline', faults: [] },
            { id: 'packula', name: 'Packula', status: 'offline', faults: [] },
        ]
    },
    'highline-commerce': {
        id: 'highline-commerce',
        name: 'Highline Commerce',
        robots: [
            {
                id: 'fleetwood-pack',
                name: 'Fleetwood Pack',
                status: 'active',
                faults: [
                    {
                        id: 'no-workflow',
                        issue: 'No Workflow (Totes)',
                        severity: 'alta',
                        description: 'Sin batch activo de totes',
                        troubleshooting: [
                            'Restart Station / Restart App /'
                        ],
                        escalation: 'Liam (Slack Internal)',
                        finalNotes: 'El piloto no podia iniciar el workflow de totes, debido a que anteriormente tenia Batch al final se solicitó que actualizaran el Workflow para totes'
                    },
                    {
                        id: 'arm-frozen',
                        issue: 'Arm Frozen',
                        severity: 'media',
                        description: 'Brazo izquierdo detenido en medio de un proceso operativo activo.',
                        troubleshooting: [
                            'En la interfaz en tus headsets, envíe el comando Fault (arm frozen).',
                            'Antes de mandar el comando Home, verifique visualmente que el robot esté en posición segura.',
                            'Si es necesario o detecta riesgo de colisión, manténgalo únicamente en Pausa.'
                        ],
                        escalation: 'Liam (Slack Internal)'
                    }
                ],
                advises: [
                    {
                        id: 'fleetwood-pack__1',
                        adviceNumber: 1,
                        content: 'Verifica qué workflow está activo, ya que a cierta hora cambia de Bagger a Tote. Asegúrate de estar trabajando en el modo correcto antes de iniciar.',
                        isException: false
                    },
                    {
                        id: 'fleetwood-pack__2',
                        adviceNumber: 2,
                        content: 'Ingresa los objetos por la parte más delgada para facilitar su entrada a la bolsa y asegurar un cierre limpio.',
                        isException: false
                    },
                    {
                        id: 'fleetwood-pack__3',
                        adviceNumber: 3,
                        content: 'La bin roja se ocupa exclusivamente para la basura generada durante el proceso. No la mezcles con el producto.',
                        isException: false
                    },
                    {
                        id: 'fleetwood-pack__4',
                        adviceNumber: 4,
                        content: 'Si la bolsa no abre correctamente, desliza las pinzas cerradas de forma vertical sobre la bolsa sutilmente. Esto permitirá que ingrese el aire y la abra.',
                        isException: false
                    },
                    {
                        id: 'fleetwood-pack__5',
                        adviceNumber: 5,
                        content: 'Visualiza la posición del robot: en una posición correcta no se vería demasiado el hombro del robot. Los movimientos que realices deben ser fluidos, constantes y verificando la movilidad para no dañar el robot.',
                        isException: false
                    },
                    {
                        id: 'fleetwood-pack__6',
                        adviceNumber: 6,
                        content: 'Si se detiene la máquina porque se quedó atorada la barra selladora:\nPaso 1: Con el brazo izquierdo jala la barra hacia ti.\nPaso 2: Posteriormente, con el gripper de la mano derecha cerrado, presiona la pantalla del display de la máquina bagger para borrar el error.\nPaso 3: Confirma el cerrado con los pedales para que la máquina reaccione correctamente.\nPaso 4: Si vuelve a fallar el cerrado, usa el pedal 3 de color amarillo para reimprimir la etiqueta.',
                        isException: false
                    },
                    {
                        id: 'fleetwood-pack__7',
                        adviceNumber: 7,
                        content: 'Falla con la bagger: En caso de que la bolsa se imprima por fuera de la barra selladora:\nPaso 1: Arrancar la bolsa y dejarla en el hospital bin.\nPaso 2: Presionar en reprint (pedal amarillo) para que vuelva a sacar la bolsa correctamente.',
                        isException: false
                    }
                ]
            },
            {
                id: 'phil',
                name: 'Phil',
                status: 'active',
                faults: [
                    {
                        id: 'bad-seal',
                        issue: 'No se puede completar Tote',
                        severity: 'media',
                        description: 'EL piloto no podia concluir el workflow de Tote',
                        troubleshooting: [
                            'Fault (Bad Seal)'
                        ],
                        escalation: 'El cliente se encarga de revisar ese tote',
                        finalNotes: 'Apartar el producto, sobre y tote y regresarlo al rack para una revisión posterior del cliente'
                    },
                    {
                        id: 'out-of-product',
                        issue: 'Out of product',
                        severity: 'baja',
                        description: 'Cuando el rack se queda sin producto / Totes',
                        troubleshooting: [
                            'Faul (out of product)',
                            'Dejar el robot viendo al rack para ver cuando coloquen más producto'
                        ],
                        escalation: 'El cliente se encarga de revisar ese tote',
                        finalNotes: ''
                    },
                    {
                        id: 'bad-tote-scan',
                        issue: 'Bad Tote',
                        severity: 'baja',
                        description: 'Escanear el tote incorrecto',
                        troubleshooting: [
                            'Marcar Pick Faul - Package - Bad Seal'
                        ],
                        escalation: 'NA',
                        finalNotes: 'NA'
                    },
                    {
                        id: 'totes-correctos',
                        issue: 'Totes Correctos',
                        severity: 'baja',
                        description: 'Solo seleccionar los totes que se encuentren "salidos" del rack, los cuales tienen menos de 4 productos',
                        troubleshooting: [
                            'NA'
                        ],
                        escalation: 'NA',
                        finalNotes: 'NA'
                    }
                ],
                advises: [
                    {
                        id: 'phil__1',
                        adviceNumber: 1,
                        content: 'Las etiquetas que tienen una letra van en la bin más lejana al robot, y las etiquetas que no tienen letra van en la bin más cercana al robot.',
                        isException: false
                    },
                    {
                        id: 'phil__2',
                        adviceNumber: 2,
                        content: 'Es importante escanear producto por producto, siguiendo la secuencia de 1 a 1, antes de ingresarlos a la bolsa.',
                        isException: false
                    },
                    {
                        id: 'phil__3',
                        adviceNumber: 3,
                        content: 'Si el tote contiene 6 productos o más, se utiliza la bolsa de mayor tamaño; si tiene 5 productos o menos, se utiliza la bolsa pequeña (medida estándar).',
                        isException: false
                    },
                    {
                        id: 'phil__4',
                        adviceNumber: 4,
                        content: 'Una vez terminado el tote, se debe dejar en la parte más baja del rack.',
                        isException: false
                    },
                    {
                        id: 'phil__5',
                        adviceNumber: 5,
                        content: 'Cuando se presente algún problema con la orden (ya sea que no se imprima la etiqueta y continúe solicitando otro producto, o cualquier otro detalle), ingresa todo al mismo tote y déjalo en la parte superior del rack con todos los elementos. Luego, levanta un "Pick Fault", selecciona "Order Package" y posteriormente presiona "FAIL JOB".',
                        isException: true
                    },
                    {
                        id: 'phil__6',
                        adviceNumber: 6,
                        content: 'También es importante recordar que si el tote contiene una etiqueta, esta debe ingresarse dentro del sobre-bolsa.',
                        isException: false
                    },
                    {
                        id: 'phil__7',
                        adviceNumber: 7,
                        content: 'Visualiza la posición del robot: en una posición correcta no se vería demasiado el hombro del robot. Los movimientos que realices deben ser fluidos, constantes y verificando la movilidad para no dañar el robot.',
                        isException: false
                    }
                ]
            },
        ]
    },
    'outerspace': {
        id: 'outerspace',
        name: 'Outerspace',
        robots: [
            { 
                id: 'mercury', 
                name: 'Mercury', 
                status: 'active', 
                faults: [],
                advises: [
                    {
                        id: 'mercury__1',
                        adviceNumber: 1,
                        title: 'Ubicación Contenedor',
                        content: 'Al iniciar la tarea si te solicita el workflow escanear el cointener se escanea el codigo de barras que se encuentra de el lado derecho de el robot a lado de donde estan los productos en un carrito.',
                        isException: false
                    },
                    {
                        id: 'mercury__2',
                        adviceNumber: 2,
                        title: 'Selección de Bolsa',
                        content: 'Para saber que tamaña de bolsa ocupar depende de el producto, productos singulares y de menor tamaño van en las bolsas de 03, si es un producto algo mas voluminoso en el 04 y si es un multiproducto ocupar la 05.',
                        isException: false
                    },
                    {
                        id: 'mercury__3',
                        adviceNumber: 3,
                        title: 'Uso de Tool / Barra Negra',
                        content: 'Ocupa la tool que es la barra de color negro para aplastar la bolsa y pueda cerrar de manera mas facil. También ocupa esta misma herramienta para doblar la hoja en 4.',
                        isException: false
                    },
                    {
                        id: 'mercury__4',
                        adviceNumber: 4,
                        title: 'Posición y Movilidad',
                        content: 'Visualiza la posición del robot: en una posición correcta no se vería demasiado el hombro del robot. Los movimientos que se hacen deben de ser fluidos, constantes y verificando la movilidad para no dañar el robot.',
                        isException: false
                    },
                    {
                        id: 'mercury__5',
                        adviceNumber: 5,
                        title: 'Agarre de Bolsa',
                        content: 'Esta es la forma correcta de agarrar la bolsa: <a href="https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/agarre%20de%20bolsa%20blanca.mp4" target="_blank" class="text-[#ff4f00] hover:underline font-extrabold">Ver video 🎥</a>',
                        isException: false
                    },
                    {
                        id: 'mercury__6',
                        adviceNumber: 6,
                        title: 'Colocar Etiqueta',
                        content: 'Forma correcta de colocar una etiqueta en Venus o Mercury: <a href="https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/etiqueta%20en%20venus.mp4" target="_blank" class="text-[#ff4f00] hover:underline font-extrabold">Ver video 🎥</a>',
                        isException: false
                    },
                    {
                        id: 'mercury__7',
                        adviceNumber: 7,
                        title: 'Ingresar Producto',
                        content: 'Esta es la forma correcta de ingresar un objeto para evitar problemas de cerrado del mailer: <a href="https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/ingresar%20un%20producto.mp4" target="_blank" class="text-[#ff4f00] hover:underline font-extrabold">Ver video 🎥</a>',
                        isException: false
                    },
                    {
                        id: 'mercury__8',
                        adviceNumber: 8,
                        title: 'Quitar Adhesivo',
                        content: 'Esta es la forma correcta de quitar la cinta adhesiva: <a href="https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/quitar%20adesivo.mp4" target="_blank" class="text-[#ff4f00] hover:underline font-extrabold">Ver video 🎥</a>',
                        isException: false
                    }
                ]
            },
            { 
                id: 'venus', 
                name: 'Venus', 
                status: 'active', 
                faults: [],
                advises: [
                    {
                        id: 'venus__1',
                        adviceNumber: 1,
                        title: 'Ubicación Contenedor',
                        content: 'Al iniciar la tarea si te solicita el workflow escanear el cointener se escanea el codigo de barras que se encuentra de el lado derecho de el robot a lado de donde estan los productos en un carrito.',
                        isException: false
                    },
                    {
                        id: 'venus__2',
                        adviceNumber: 2,
                        title: 'Selección de Bolsa',
                        content: 'Para saber que tamaña de bolsa ocupar depende de el producto, productos singulares y de menor tamaño van en las bolsas de 03, si es un producto algo mas voluminoso en el 04 y si es un multiproducto ocupar la 05.',
                        isException: false
                    },
                    {
                        id: 'venus__3',
                        adviceNumber: 3,
                        title: 'Uso de Tool / Barra Negra',
                        content: 'Ocupa la tool que es la barra de color negro para aplastar la bolsa y pueda cerrar de manera mas facil. También ocupa esta misma herramienta para doblar la hoja en 4.',
                        isException: false
                    },
                    {
                        id: 'venus__4',
                        adviceNumber: 4,
                        title: 'Posición y Movilidad',
                        content: 'Visualiza la posición del robot: en una posición correcta no se vería demasiado el hombro del robot. Los movimientos que se hacen deben de ser fluidos, constantes y verificando la movilidad para no dañar el robot.',
                        isException: false
                    },
                    {
                        id: 'venus__5',
                        adviceNumber: 5,
                        title: 'Agarre de Bolsa',
                        content: 'Esta es la forma correcta de agarrar la bolsa: <a href="https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/agarre%20de%20bolsa%20blanca.mp4" target="_blank" class="text-[#ff4f00] hover:underline font-extrabold">Ver video 🎥</a>',
                        isException: false
                    },
                    {
                        id: 'venus__6',
                        adviceNumber: 6,
                        title: 'Colocar Etiqueta',
                        content: 'Forma correcta de colocar una etiqueta en Venus o Mercury: <a href="https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/etiqueta%20en%20venus.mp4" target="_blank" class="text-[#ff4f00] hover:underline font-extrabold">Ver video 🎥</a>',
                        isException: false
                    },
                    {
                        id: 'venus__7',
                        adviceNumber: 7,
                        title: 'Ingresar Producto',
                        content: 'Esta es la forma correcta de ingresar un objeto para evitar problemas de cerrado del mailer: <a href="https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/ingresar%20un%20producto.mp4" target="_blank" class="text-[#ff4f00] hover:underline font-extrabold">Ver video 🎥</a>',
                        isException: false
                    },
                    {
                        id: 'venus__8',
                        adviceNumber: 8,
                        title: 'Quitar Adhesivo',
                        content: 'Esta es la forma correcta de quitar la cinta adhesiva: <a href="https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/quitar%20adesivo.mp4" target="_blank" class="text-[#ff4f00] hover:underline font-extrabold">Ver video 🎥</a>',
                        isException: false
                    }
                ]
            },
        ]
    },
    'mountainy': {
        id: 'mountainy',
        name: 'Mountainy',
        robots: [
            {
                id: 'mabel',
                name: 'Mabel',
                status: 'active',
                faults: [],
                advises: [
                    {
                        id: 'mabel__1',
                        adviceNumber: 1,
                        content: 'Presiona el botón verde de la máquina, ubicado en la esquina inferior derecha, para proceder con el cerrado de la bolsa.',
                        isException: false
                    },
                    {
                        id: 'mabel__2',
                        adviceNumber: 2,
                        content: 'Ingresa el producto por su parte más delgada para evitar forzar la bolsa.',
                        isException: false
                    },
                    {
                        id: 'mabel__3',
                        adviceNumber: 3,
                        content: 'Verifica más de una vez la cantidad de productos a ingresar.',
                        isException: false
                    }
                ]
            },
            {
                id: 'monty',
                name: 'Monty',
                status: 'active',
                faults: [],
                advises: [
                    {
                        id: 'monty__1',
                        adviceNumber: 1,
                        content: 'Presiona el botón verde de la máquina, ubicado en la esquina inferior derecha, para proceder con el cerrado de la bolsa.',
                        isException: false
                    },
                    {
                        id: 'monty__2',
                        adviceNumber: 2,
                        content: 'Ingresa el producto por su parte más delgada para evitar forzar la bolsa.',
                        isException: false
                    },
                    {
                        id: 'monty__3',
                        adviceNumber: 3,
                        content: 'Verifica más de una vez la cantidad de productos a ingresar.',
                        isException: false
                    },
                    {
                        id: 'monty__4',
                        adviceNumber: 4,
                        content: 'La indicación y correcta manera de trabajar es tomar 2 productos a la vez e ingresarlos cuando la batch solicite más de uno: con el gripper derecho agarras un producto y con el izquierdo el segundo, ingresándolos uno a uno. Revisa bien la batch para ver qué cantidad de productos debe tener.',
                        isException: false
                    }
                ]
            },
        ]
    },
    'internal': {
        id: 'internal',
        name: 'Internal',
        robots: [
            {
                id: 'box-fold',
                name: 'Box Fold',
                status: 'active',
                faults: [],
                advises: [
                    {
                        id: 'box-fold__1',
                        adviceNumber: 1,
                        content: 'Procura soltar las dos pestañas al mismo tiempo para agilizar el armado.',
                        isException: false
                    },
                    {
                        id: 'box-fold__2',
                        adviceNumber: 2,
                        content: 'Voltea la caja de un solo movimiento sin soltar los grippers del lado izquierdo.',
                        isException: false
                    }
                ]
            },
            {
                id: 'tower-stack-unstack',
                name: 'Tower Stack/Unstack',
                status: 'active',
                faults: [],
                advises: [
                    {
                        id: 'tower-stack-unstack__1',
                        adviceNumber: 1,
                        content: 'Intenta meter los anillos de lado para que el brazo no te obstruya la vista.',
                        isException: false
                    },
                    {
                        id: 'tower-stack-unstack__2',
                        adviceNumber: 2,
                        content: 'Confirma con el pedal la secuencia de manera correcta: apilado/desapilado.',
                        isException: false
                    },
                    {
                        id: 'tower-stack-unstack__3',
                        adviceNumber: 3,
                        content: 'Utiliza los dos brazos para apilar y para desapilar.',
                        isException: false
                    }
                ]
            },
            {
                id: 'pick-sort',
                name: 'Pick Sort',
                status: 'active',
                faults: [],
                advises: [
                    {
                        id: 'pick-sort__1',
                        adviceNumber: 1,
                        content: 'Utiliza la mano derecha para alcanzar los objetos más alejados y pásalos a la mano izquierda para ingresarlos a la bin.',
                        isException: false
                    }
                ]
            },
            { id: 'tote',               name: 'Tote',               status: 'active', faults: [] },
            {
                id: 'bagger-label',
                name: 'Bagger Label',
                status: 'active',
                faults: [],
                advises: [
                    {
                        id: 'bagger-label__1',
                        adviceNumber: 1,
                        content: 'Verifica las dimensiones del producto, ya que si es muy grande, procura ingresarlo de forma vertical para que pueda realizar correctamente el cierre.',
                        isException: false
                    },
                    {
                        id: 'bagger-label__2',
                        adviceNumber: 2,
                        content: 'Si se observa que la bagger arrojó la bolsa sin abrirse por falta de aire con los grippers cerrados, haz un movimiento vertical de arriba hacia abajo para obligar a que entre el aire en la posición correcta y abra la bolsa.',
                        isException: false
                    },
                    {
                        id: 'bagger-label__3',
                        adviceNumber: 3,
                        content: 'Cuando los objetos sean grandes y pesados, coloca la pinza debajo de la bolsa para ayudar con el peso y facilitar el cierre.',
                        isException: false
                    },
                    {
                        id: 'bagger-label__4',
                        adviceNumber: 4,
                        content: 'Prioriza que el movimiento de los brazos sea mínimo y que el movimiento sea del robot completamente debido a los espacios reducidos.',
                        isException: false
                    },
                    {
                        id: 'bagger-label__5',
                        adviceNumber: 5,
                        content: 'Visualiza la posición del robot: en una posición correcta no se vería demasiado el hombro del robot. Los movimientos que realices deben ser fluidos, constantes y verificando la movilidad para no dañar el robot.',
                        isException: false
                    },
                    {
                        id: 'bagger-label__6',
                        adviceNumber: 6,
                        content: 'Si se detiene la máquina porque se quedó atorada la barra selladora:\nPaso 1: Con el brazo izquierdo jala la barra hacia ti.\nPaso 2: Posteriormente, con el gripper de la mano derecha cerrado, presiona la pantalla del display de la máquina bagger para borrar el error.\nPaso 3: Confirma el cerrado con los pedales para que la máquina reaccione correctamente.\nPaso 4: Si vuelve a fallar el cerrado, usa el pedal 3 de color amarillo para reimprimir la etiqueta.',
                        isException: false
                    }
                ]
            },
        ]
    },
    'missouristar': {
        id: 'missouristar',
        name: 'Missouri Star',
        robots: [
            {
                id: 'msqc',
                name: 'MSQC',
                status: 'active',
                faults: [],
                advises: [
                    {
                        id: 'msqc__1',
                        adviceNumber: 1,
                        content: 'Sigue el workflow establecido para asegurar la correcta operación del robot.',
                        isException: false
                    }
                ]
            }
        ]
    }
};