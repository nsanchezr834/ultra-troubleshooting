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
                        content: 'Verifica las dimensiones de el producto, ya que si son muy grandes procuremos ingresarlo de forma vertical para que pueda realizar correctamente el cierre.',
                        isException: false
                    },
                    {
                        id: 'packie-2.0__2',
                        adviceNumber: 2,
                        content: 'Si se observa que la bagger arrojo la bolsa sin que abra por el aire que emite la maquina con los grippers cerrados haz un movimiento vertical de arrib abajo para poder obligar a que entre el aire en la psosicon correcta y abra la bolsa.',
                        isException: false
                    },
                    {
                        id: 'packie-2.0__3',
                        adviceNumber: 3,
                        content: 'Cuando los objetos son grandes y pesados pongamos la pinza debajo de la bolsa para ayudar con el peso y facilitar el cierre.',
                        isException: false
                    },
                    {
                        id: 'packie-2.0__4',
                        adviceNumber: 4,
                        content: 'Prioriza que el moviemiento de los brazos sea minimo y que el movimiento sea de el robot completamente por los espacios reducidos.',
                        isException: false
                    },
                    {
                        id: 'packie-2.0__5',
                        adviceNumber: 5,
                        content: 'Visualiza la posición del robot: en una posición correcta no se vería demasiado el hombro del robot. Los movimientos que se hacen deben de ser fluidos, constantes y verificando la movilidad para no dañar el robot.',
                        isException: false
                    },
                    {
                        id: 'packie-2.0__6',
                        adviceNumber: 6,
                        content: 'Si se detiene la máquina porque se quedó atorada la barra selladora: con el brazo izquierdo jalen la barra hacia sí mismo y posterior, con el gripper de la mano derecha cerrado, presionen la pantalla del display de la máquina de bagger para quitar el error. Posteriormente, con los pedales se confirma el cerrado para que la máquina alcance a reaccionar correctamente (si vuelve a dar fallo de cerrado, usar el pedal 3 de color amarillo para reimprimir la etiqueta).',
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
                        content: 'Verifica las dimensiones de el producto, ya que si son muy grandes procuremos ingresarlo de forma vertical para que pueda realizar correctamente el cierre.',
                        isException: false
                    },
                    {
                        id: 'future-2.0__2',
                        adviceNumber: 2,
                        content: 'Si se observa que la bagger arrojo la bolsa sin que abra por el aire que emite la maquina con los grippers cerrados haz un movimiento vertical de arrib abajo para poder obligar a que entre el aire en la psosicon correcta y abra la bolsa.',
                        isException: false
                    },
                    {
                        id: 'future-2.0__3',
                        adviceNumber: 3,
                        content: 'Cuando los objetos son grandes y pesados pongamos la pinza debajo de la bolsa para ayudar con el peso y facilitar el cierre.',
                        isException: false
                    },
                    {
                        id: 'future-2.0__4',
                        adviceNumber: 4,
                        content: 'Prioriza que el moviemiento de los brazos sea minimo y que el movimiento sea de el robot completamente por los espacios reducidos.',
                        isException: false
                    },
                    {
                        id: 'future-2.0__5',
                        adviceNumber: 5,
                        content: 'Visualiza la posición del robot: en una posición correcta no se vería demasiado el hombro del robot. Los movimientos que se hacen deben de ser fluidos, constantes y verificando la movilidad para no dañar el robot.',
                        isException: false
                    },
                    {
                        id: 'future-2.0__6',
                        adviceNumber: 6,
                        content: 'Si se detiene la máquina porque se quedó atorada la barra selladora: con el brazo izquierdo jalen la barra hacia sí mismo y posterior, con el gripper de la mano derecha cerrado, presionen la pantalla del display de la máquina de bagger para quitar el error. Posteriormente, con los pedales se confirma el cerrado para que la máquina alcance a reaccionar correctamente (si vuelve a dar fallo de cerrado, usar el pedal 3 de color amarillo para reimprimir la etiqueta).',
                        isException: false
                    }
                ]
            },
            { id: 'captain-pack-sparrow', name: 'Captain Pack Sparrow', status: 'active', faults: [] },
            { 
                id: 'packasaurus', 
                name: 'Packasaurus', 
                status: 'active', 
                faults: [],
                advises: [
                    {
                        id: 'packasaurus__1',
                        adviceNumber: 1,
                        content: 'se necesita agarrar la etiqueta con el brazo donde se encuentre la etiquetadora',
                        isException: false
                    },
                    {
                        id: 'packasaurus__2',
                        adviceNumber: 2,
                        content: 'Mientras va cerrando la bolsa se le pega la etiqueta, la bagger tardara unos 10 segundos aproximadamente para terminar de cerrar la bolsa',
                        isException: false
                    },
                    {
                        id: 'packasaurus__3',
                        adviceNumber: 3,
                        content: 'Mucho cuidado al finalizar el cerrado inmediatamente sale la otra bolsa de la bagger hay que ser rapidos y precisos en estos movimientos',
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
                        content: 'Verifica qué workflow está activo, ya que en cierta hora cambia de Bagger a Tote. Asegúrate de estar trabajando en el modo correcto antes de iniciar.',
                        isException: false
                    },
                    {
                        id: 'fleetwood-pack__2',
                        adviceNumber: 2,
                        content: 'Ingresa los objetos por la parte más delgada para facilitar la entrada a la bolsa y asegurar un cierre limpio.',
                        isException: false
                    },
                    {
                        id: 'fleetwood-pack__3',
                        adviceNumber: 3,
                        content: 'La bin roja se ocupa exclusivamente para la basura generada durante el proceso. No mezclar con producto.',
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
                        content: 'Visualiza la posición del robot: en una posición correcta no se vería demasiado el hombro del robot. Los movimientos que se hacen deben de ser fluidos, constantes y verificando la movilidad para no dañar el robot.',
                        isException: false
                    },
                    {
                        id: 'fleetwood-pack__6',
                        adviceNumber: 6,
                        content: 'Si se detiene la máquina porque se quedó atorada la barra selladora: con el brazo izquierdo jalen la barra hacia sí mismo y posterior, con el gripper de la mano derecha cerrado, presionen la pantalla del display de la máquina de bagger para quitar el error. Posteriormente, con los pedales se confirma el cerrado para que la máquina alcance a reaccionar correctamente (si vuelve a dar fallo de cerrado, usar el pedal 3 de color amarillo para reimprimir la etiqueta).',
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
                        content: 'Las etiquetas que tienen una letra van a ir en la bin mas lejana al robot, y las etiquetas que no tienen una letra van a ir en la bin mas cercana de el robot.',
                        isException: false
                    },
                    {
                        id: 'phil__2',
                        adviceNumber: 2,
                        content: 'Es importante escanear producto por producto siguiendo la secuencia de 1 x 1 para ingresarlos en la bolsa.',
                        isException: false
                    },
                    {
                        id: 'phil__3',
                        adviceNumber: 3,
                        content: 'Si el tote contiene 6 productos o más se ocupa la bolsa de mayor tamaño, y si tiene 5 productos o menos se ocupa la bolsa pequeña (medida estándar).',
                        isException: false
                    },
                    {
                        id: 'phil__4',
                        adviceNumber: 4,
                        content: 'Una vez terminada el tote se dejara en la parte de hasta abajo del rack.',
                        isException: false
                    },
                    {
                        id: 'phil__5',
                        adviceNumber: 5,
                        content: 'Cuando se tiene algun problema con la orden ya sea que no imprime la eqituqta y continua solicitando otro producto, o se tiene algun otro detalle, se ingresa todo al mismo tote y se deja en la parte de hasta arriba de el rack con todos los elementos, se levanta un pick fault, seleccionas order package y posterior a "FAIL JOB".',
                        isException: true
                    },
                    {
                        id: 'phil__6',
                        adviceNumber: 6,
                        content: 'Es tambien importante saber que si el tote contiene una etiqueta no se olvide ingresarla tambien en el sobre bolsa.',
                        isException: false
                    },
                    {
                        id: 'phil__7',
                        adviceNumber: 7,
                        content: 'Visualiza la posición del robot: en una posición correcta no se vería demasiado el hombro del robot. Los movimientos que se hacen deben de ser fluidos, constantes y verificando la movilidad para no dañar el robot.',
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
                        content: 'Presiona el botón verde de la máquina que se encuentra en la esquina inferior derecha para proceder con el cerrado de la bolsa.',
                        isException: false
                    },
                    {
                        id: 'mabel__2',
                        adviceNumber: 2,
                        content: 'Ingresa el producto por la parte más delgada para evitar forzar la bolsa.',
                        isException: false
                    },
                    {
                        id: 'mabel__3',
                        adviceNumber: 3,
                        content: 'Verifica en más de una ocasión cuál es la cantidad de productos a ingresar.',
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
                        content: 'Presiona el botón verde de la máquina que se encuentra en la esquina inferior derecha para proceder con el cerrado de la bolsa.',
                        isException: false
                    },
                    {
                        id: 'monty__2',
                        adviceNumber: 2,
                        content: 'Ingresa el producto por la parte más delgada para evitar forzar la bolsa.',
                        isException: false
                    },
                    {
                        id: 'monty__3',
                        adviceNumber: 3,
                        content: 'Verifica en más de una ocasión cuál es la cantidad de productos a ingresar.',
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
            { id: 'box-fold',           name: 'Box Fold',           status: 'active', faults: [] },
            { id: 'tower-stack-unstack',name: 'Tower Stack/Unstack', status: 'active', faults: [] },
            { id: 'pick-sort',          name: 'Pick Sort',          status: 'active', faults: [] },
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
                        content: 'Si se detiene la máquina porque se quedó atorada la barra selladora: con el brazo izquierdo jalen la barra hacia sí mismo y posterior, con el gripper de la mano derecha cerrado, presionen la pantalla del display de la máquina de bagger para quitar el error. Posteriormente, con los pedales se confirma el cerrado para que la máquina alcance a reaccionar correctamente (si vuelve a dar fallo de cerrado, usar el pedal 3 de color amarillo para reimprimir la etiqueta).',
                        isException: false
                    }
                ]
            },
        ]
    }
};