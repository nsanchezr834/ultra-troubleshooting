/**
 * AUTORYX CRITICAL ENGINEERING STANDARD
 * MODULE: Core Workflow Database Configurations (Ultra Platform)
 * VERSION: Packie 2.0 Architectural Baseline
 *
 * Importar desde aquí en cualquier componente que necesite acceso a los flujos.
 * NO duplicar esta base de datos en page.tsx ni en telemetry-dashboard.tsx.
 */

export interface WorkflowNode {
    node_type: string;
    node_name: string | null;
    is_active: boolean;
    action_id: string | null;
    text_explain: string | null;
    children: WorkflowNode[];
}

export interface WorkflowConfig {
    id: string;
    name: string;
    version: string;
    description: string;
    rootNode: WorkflowNode;
}

const BAGGER_STANDARD_ROOT_NODE: WorkflowNode = {
    node_type: "LoopForever",
    node_name: "Bucle infinito",
    is_active: true,
    action_id: null,
    text_explain: null,
    children: [
        {
            node_type: "ShowMessage",
            node_name: "Obtener siguiente pedido",
            is_active: true,
            action_id: null,
            text_explain: null,
            children: [
                {
                    node_type: "ShowAndWaitForAction",
                    node_name: "Siguiente orden",
                    is_active: true,
                    action_id: "fetch_next_order",
                    text_explain: null,
                    children: [
                        {
                            node_type: "FetchNextOrder",
                            node_name: "Siguiente orden",
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: []
                        }
                    ]
                }
            ]
        },
        {
            node_type: "Sequence",
            node_name: "Secuencia",
            is_active: false,
            action_id: null,
            text_explain: null,
            children: [
                {
                    node_type: "PrintLabel",
                    node_name: "Print bag",
                    is_active: false,
                    action_id: null,
                    text_explain: null,
                    children: []
                },
                {
                    node_type: "Sequence",
                    node_name: "Secuencia",
                    is_active: false,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "While",
                            node_name: null,
                            is_active: false,
                            action_id: null,
                            text_explain: "order has more than 1 pending item",
                            children: [
                                {
                                    node_type: "ShowAndWaitForAction",
                                    node_name: "Confirmar colocado en el paquete",
                                    is_active: false,
                                    action_id: "confirm_placed",
                                    text_explain: null,
                                    children: []
                                }
                            ]
                        },
                        {
                            node_type: "ShowAndWaitForAction",
                            node_name: "Confirmar y sellar",
                            is_active: false,
                            action_id: "confirm_and_seal",
                            text_explain: null,
                            children: []
                        },
                        {
                            node_type: "SealBag",
                            node_name: "Sellar bolsa",
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: []
                        },
                        {
                            node_type: "ShowMessage",
                            node_name: null,
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: [
                                {
                                    node_type: "DropOffBagInDesignatedBin",
                                    node_name: null,
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: []
                                },
                                {
                                    node_type: "ShowAndWaitForAction",
                                    node_name: "Finalizar pedido",
                                    is_active: false,
                                    action_id: "finish_order",
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "FinishOrder",
                                            node_name: "Finalizar pedido",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

const SPARROW_ASURUS_ROOT_NODE: WorkflowNode = {
  action_id: null,
  is_active: true,
  node_name: "Sequence",
  node_type: "Sequence",
  text_explain: null,
  children: [
    {
      action_id: null,
      is_active: true,
      node_name: "Clear the work area of any items",
      node_type: "ShowMessage",
      text_explain: null,
      children: [
        {
          action_id: "confirm_work_area_clear",
          children: [],
          is_active: true,
          node_name: "Confirm Work Area Clear",
          node_type: "ShowAndWaitForAction",
          text_explain: null
        }
      ]
    },
    {
      action_id: null,
      is_active: false,
      node_name: "Loop Forever",
      node_type: "LoopForever",
      text_explain: null,
      children: [
        {
          action_id: null,
          is_active: false,
          node_name: "Fetch next order",
          node_type: "ShowMessage",
          text_explain: null,
          children: [
            {
              action_id: "fetch_next_order",
              is_active: false,
              node_name: "Fetch Next Order",
              node_type: "ShowAndWaitForAction",
              text_explain: null,
              children: [
                {
                  action_id: null,
                  children: [],
                  is_active: false,
                  node_name: "Fetch Next Order",
                  node_type: "FetchNextOrder",
                  text_explain: null
                }
              ]
            }
          ]
        },
        {
          action_id: null,
          children: [],
          is_active: false,
          node_name: "Verify Batch Product",
          node_type: "VerifyBatchProduct",
          text_explain: null
        },
        {
          action_id: null,
          is_active: false,
          node_name: "Sequence",
          node_type: "Sequence",
          text_explain: null,
          children: [
            {
              action_id: null,
              children: [],
              is_active: false,
              node_name: "Print bag",
              node_type: "PrintLabel",
              text_explain: null
            },
            {
              action_id: null,
              is_active: false,
              node_name: "Sequence",
              node_type: "Sequence",
              text_explain: null,
              children: [
                {
                  action_id: null,
                  is_active: false,
                  node_name: null,
                  node_type: "While",
                  text_explain: "order has more than 1 pending item",
                  children: [
                    {
                      action_id: "confirm_placed",
                      children: [],
                      is_active: false,
                      node_name: "Confirm Placed in Package",
                      node_type: "ShowAndWaitForAction",
                      text_explain: null
                    }
                  ]
                },
                {
                  action_id: "confirm_and_seal",
                  children: [],
                  is_active: false,
                  node_name: "Confirm and Seal",
                  node_type: "ShowAndWaitForAction",
                  text_explain: null
                },
                {
                  action_id: null,
                  children: [],
                  is_active: false,
                  node_name: "Seal Bag",
                  node_type: "SealBag",
                  text_explain: null
                },
                {
                  action_id: null,
                  is_active: false,
                  node_name: "Place label on bag",
                  node_type: "ShowMessage",
                  text_explain: null,
                  children: [
                    {
                      action_id: "confirm_label_placed",
                      children: [],
                      is_active: false,
                      node_name: "Confirm Label Placed",
                      node_type: "ShowAndWaitForAction",
                      text_explain: null
                    }
                  ]
                },
                {
                  action_id: null,
                  is_active: false,
                  node_name: null,
                  node_type: "ShowMessage",
                  text_explain: null,
                  children: [
                    {
                      action_id: null,
                      children: [],
                      is_active: false,
                      node_name: null,
                      node_type: "DropOffBagInDesignatedBin",
                      text_explain: null
                    },
                    {
                      action_id: "finish_order",
                      is_active: false,
                      node_name: "Finish Order",
                      node_type: "ShowAndWaitForAction",
                      text_explain: null,
                      children: [
                        {
                          action_id: null,
                          children: [],
                          is_active: false,
                          node_name: "Finish Order",
                          node_type: "FinishOrder",
                          text_explain: null
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

export const WORKFLOWS_DATABASE: Record<string, WorkflowConfig> = {
    'packie-2.0': {
        id: 'packie-2.0',
        name: 'Packie 2.0 - Embolsado Estándar',
        version: '2.0.0',
        description: 'Flujo maestro e infinito para estaciones robóticas de empaque asistido por embolsadora industrial y sellado térmico.',
        rootNode: BAGGER_STANDARD_ROOT_NODE
    },
    'captain-pack-sparrow': {
        id: 'captain-pack-sparrow',
        name: 'Captain PackSparrow- Bagger Grande',
        version: '2.0.0',
        description: 'Flujo maestro e infinito para estaciones robóticas de empaque asistido por embolsadora industrial y sellado térmico.',
        rootNode: SPARROW_ASURUS_ROOT_NODE
    },
    'packasaurus': {
        id: 'packasaurus',
        name: 'Packasaurus- Bagger Grande',
        version: '2.0.0',
        description: 'Flujo maestro e infinito para estaciones robóticas de empaque asistido por embolsadora industrial y sellado térmico.',
        rootNode: SPARROW_ASURUS_ROOT_NODE
    },
    'future-2.0': {
        id: 'future-2.0',
        name: 'Future 2.0 - Embolsado Avanzado',
        version: '2.0.0',
        description: 'Flujo maestro optimizado para estaciones robóticas asíncronas con secuenciación paralela de empaque.',
        rootNode: {
            node_type: "LoopForever",
            node_name: "Bucle infinito",
            is_active: true,
            action_id: null,
            text_explain: null,
            children: [
                {
                    node_type: "ShowMessage",
                    node_name: "Obtener siguiente pedido",
                    is_active: false,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "ShowAndWaitForAction",
                            node_name: "Siguiente orden",
                            is_active: false,
                            action_id: "fetch_next_order",
                            text_explain: null,
                            children: [
                                {
                                    node_type: "FetchNextOrder",
                                    node_name: "Siguiente orden",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: []
                                }
                            ]
                        }
                    ]
                },
                {
                    node_type: "Sequence",
                    node_name: "Secuencia",
                    is_active: false,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "PrintLabel",
                            node_name: "Print bag",
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: []
                        },
                        {
                            node_type: "Sequence",
                            node_name: "Secuencia",
                            is_active: true,
                            action_id: null,
                            text_explain: null,
                            children: [
                                {
                                    node_type: "While",
                                    node_name: null,
                                    is_active: false,
                                    action_id: null,
                                    text_explain: "order has more than 1 pending item",
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForAction",
                                            node_name: "Confirmar colocado en el paquete",
                                            is_active: false,
                                            action_id: "confirm_placed",
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "ShowAndWaitForAction",
                                    node_name: "Confirmar y sellar",
                                    is_active: true,
                                    action_id: "confirm_and_seal",
                                    text_explain: null,
                                    children: []
                                },
                                {
                                    node_type: "SealBag",
                                    node_name: "Sellar bolsa",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: []
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: null,
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "DropOffBagInDesignatedBin",
                                            node_name: null,
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        },
                                        {
                                            node_type: "ShowAndWaitForAction",
                                            node_name: "Finalizar pedido",
                                            is_active: false,
                                            action_id: "finish_order",
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "FinishOrder",
                                                    node_name: "Finalizar pedido",
                                                    is_active: false,
                                                    action_id: null,
                                                    text_explain: null,
                                                    children: []
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    },
    'highline-fleetwood': {
        id: 'highline-fleetwood',
        name: 'Highline Commerce - Fleetwood Pack',
        version: '1.0.0',
        description: 'Flujo de empaque Fleetwood con escaneo de tote y ciclo lógico de ítems.',
        rootNode: {
            node_type: "Sequence",
            node_name: "Sequence",
            is_active: true,
            action_id: null,
            text_explain: null,
            children: [
                {
                    node_type: "ShowMessage",
                    node_name: "Clear the work area of any items",
                    is_active: false,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "ShowAndWaitForAction",
                            node_name: "Confirm Work Area Clear",
                            is_active: false,
                            action_id: "confirm_work_area_clear",
                            text_explain: null,
                            children: []
                        }
                    ]
                },
                {
                    node_type: "LoopForever",
                    node_name: "Loop Forever",
                    is_active: true,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "Sequence",
                            node_name: "Sequence",
                            is_active: true,
                            action_id: null,
                            text_explain: null,
                            children: [
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Scan a tote",
                                    is_active: true,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ScanToteAndGetWmsEntry",
                                            node_name: "Scan Tote",
                                            is_active: true,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "FetchNextOrder",
                                    node_name: "Fetch Next Order",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: []
                                },
                                {
                                    node_type: "Sequence",
                                    node_name: "Sequence",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowMessage",
                                            node_name: "Pick up an envelope",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "ShowAndWaitForAction",
                                                    node_name: "Next",
                                                    is_active: false,
                                                    action_id: "next",
                                                    text_explain: null,
                                                    children: []
                                                }
                                            ]
                                        },
                                        {
                                            node_type: "While",
                                            node_name: null,
                                            is_active: false,
                                            action_id: null,
                                            text_explain: "order has pending items",
                                            children: [
                                                {
                                                    node_type: "ShowMessage",
                                                    node_name: "Scan an item",
                                                    is_active: false,
                                                    action_id: null,
                                                    text_explain: null,
                                                    children: [
                                                        {
                                                            node_type: "ScanItemAndGet",
                                                            node_name: "Scan Item",
                                                            is_active: false,
                                                            action_id: null,
                                                            text_explain: null,
                                                            children: []
                                                        }
                                                    ]
                                                },
                                                {
                                                    node_type: "ShowMessage",
                                                    node_name: "Place item in packaging",
                                                    is_active: false,
                                                    action_id: null,
                                                    text_explain: null,
                                                    children: [
                                                        {
                                                            node_type: "ShowAndWaitForAction",
                                                            node_name: "Confirm Placed in Package",
                                                            is_active: false,
                                                            action_id: "confirm_placed",
                                                            text_explain: null,
                                                            children: []
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            node_type: "FetchLabelUrlTote",
                                            node_name: "Fetch Label",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        },
                                        {
                                            node_type: "Sequence",
                                            node_name: "Sequence",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "ShowMessage",
                                                    node_name: "Seal mailer",
                                                    is_active: false,
                                                    action_id: null,
                                                    text_explain: null,
                                                    children: [
                                                        {
                                                            node_type: "PrintLabel",
                                                            node_name: "Print Label",
                                                            is_active: false,
                                                            action_id: null,
                                                            text_explain: null,
                                                            children: []
                                                        },
                                                        {
                                                            node_type: "ShowAndWaitForAction",
                                                            node_name: "Confirm Sealed",
                                                            is_active: false,
                                                            action_id: "confirm_sealed",
                                                            text_explain: null,
                                                            children: []
                                                        }
                                                    ]
                                                },
                                                {
                                                    node_type: "ShowMessage",
                                                    node_name: "Apply label",
                                                    is_active: false,
                                                    action_id: null,
                                                    text_explain: null,
                                                    children: [
                                                        {
                                                            node_type: "ShowAndWaitForAction",
                                                            node_name: "Confirm Applied",
                                                            is_active: false,
                                                            action_id: "confirm_applied",
                                                            text_explain: null,
                                                            children: []
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            node_type: "ShowMessage",
                                            node_name: null,
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "ShowAndWaitForAction",
                                                    node_name: "Finish Order",
                                                    is_active: false,
                                                    action_id: "finish_order",
                                                    text_explain: null,
                                                    children: [
                                                        {
                                                            node_type: "FinishOrder",
                                                            node_name: "Finish Order",
                                                            is_active: false,
                                                            action_id: null,
                                                            text_explain: null,
                                                            children: []
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            node_type: "ShowMessage",
                            node_name: null,
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: []
                        }
                    ]
                }
            ]
        }
    },
    'highline-phil': {
        id: 'highline-phil',
        name: 'Highline Commerce - Phil',
        version: '1.0.0',
        description: 'Flujo de empaque Phil con escaneo de tote, ciclo de ítems y etiquetado para estaciones Highline Commerce.',
        rootNode: {
            node_type: "Sequence",
            node_name: "Secuencia",
            is_active: true,
            action_id: null,
            text_explain: null,
            children: [
                {
                    node_type: "ShowMessage",
                    node_name: "Despeje el área de trabajo de cualquier artículo",
                    is_active: false,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "ShowAndWaitForAction",
                            node_name: "Confirmar área de trabajo despejada",
                            is_active: false,
                            action_id: "confirm_work_area_clear",
                            text_explain: null,
                            children: []
                        }
                    ]
                },
                {
                    node_type: "LoopForever",
                    node_name: "Bucle infinito",
                    is_active: true,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "Sequence",
                            node_name: "Secuencia",
                            is_active: true,
                            action_id: null,
                            text_explain: null,
                            children: [
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Escanee un contenedor",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ScanToteAndGetWmsEntry",
                                            node_name: "Escanear Tote",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "FetchNextOrder",
                                    node_name: "Siguiente orden",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: []
                                },
                                {
                                    node_type: "Sequence",
                                    node_name: "Secuencia",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowMessage",
                                            node_name: "Pick up an envelope",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "ShowAndWaitForAction",
                                                    node_name: "Siguiente",
                                                    is_active: false,
                                                    action_id: "next",
                                                    text_explain: null,
                                                    children: []
                                                }
                                            ]
                                        },
                                        {
                                            node_type: "While",
                                            node_name: null,
                                            is_active: false,
                                            action_id: null,
                                            text_explain: "order has pending items",
                                            children: [
                                                {
                                                    node_type: "ShowMessage",
                                                    node_name: "Escanee un artículo",
                                                    is_active: false,
                                                    action_id: null,
                                                    text_explain: null,
                                                    children: [
                                                        {
                                                            node_type: "ScanItemAndGet",
                                                            node_name: "Escanear artículo",
                                                            is_active: false,
                                                            action_id: null,
                                                            text_explain: null,
                                                            children: []
                                                        }
                                                    ]
                                                },
                                                {
                                                    node_type: "ShowMessage",
                                                    node_name: "Coloque el artículo en el empaque",
                                                    is_active: false,
                                                    action_id: null,
                                                    text_explain: null,
                                                    children: [
                                                        {
                                                            node_type: "ShowAndWaitForAction",
                                                            node_name: "Confirmar colocado en el paquete",
                                                            is_active: false,
                                                            action_id: "confirm_placed",
                                                            text_explain: null,
                                                            children: []
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            node_type: "FetchLabelUrlTote",
                                            node_name: "Obtener etiqueta",
                                            is_active: true,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        },
                                        {
                                            node_type: "Sequence",
                                            node_name: "Secuencia",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "ShowMessage",
                                                    node_name: "Sellar sobre",
                                                    is_active: false,
                                                    action_id: null,
                                                    text_explain: null,
                                                    children: [
                                                        {
                                                            node_type: "PrintLabel",
                                                            node_name: "Print Label",
                                                            is_active: false,
                                                            action_id: null,
                                                            text_explain: null,
                                                            children: []
                                                        },
                                                        {
                                                            node_type: "ShowAndWaitForAction",
                                                            node_name: "Confirmar sellado",
                                                            is_active: false,
                                                            action_id: "confirm_sealed",
                                                            text_explain: null,
                                                            children: []
                                                        }
                                                    ]
                                                },
                                                {
                                                    node_type: "ShowMessage",
                                                    node_name: "Aplique la etiqueta",
                                                    is_active: false,
                                                    action_id: null,
                                                    text_explain: null,
                                                    children: [
                                                        {
                                                            node_type: "ShowAndWaitForAction",
                                                            node_name: "Confirmar aplicado",
                                                            is_active: false,
                                                            action_id: "confirm_applied",
                                                            text_explain: null,
                                                            children: []
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            node_type: "ShowMessage",
                                            node_name: null,
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "ShowAndWaitForAction",
                                                    node_name: "Finalizar pedido",
                                                    is_active: false,
                                                    action_id: "finish_order",
                                                    text_explain: null,
                                                    children: [
                                                        {
                                                            node_type: "FinishOrder",
                                                            node_name: "Finalizar pedido",
                                                            is_active: false,
                                                            action_id: null,
                                                            text_explain: null,
                                                            children: []
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            node_type: "ShowMessage",
                            node_name: null,
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: []
                        }
                    ]
                }
            ]
        }
    },
    'outerspace-venus': {
        id: 'outerspace-venus',
        name: 'Outerspace - Venus',
        version: '1.0.0',
        description: 'Flujo operativo para el robot Venus en Outerspace.',
        rootNode: {
            node_type: "Sequence",
            node_name: "Secuencia",
            is_active: true,
            action_id: null,
            text_explain: null,
            children: [
                {
                    node_type: "ShowMessage",
                    node_name: "Despeje el área de trabajo de cualquier artículo",
                    is_active: false,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "ShowAndWaitForAction",
                            node_name: "Confirmar área de trabajo despejada",
                            is_active: false,
                            action_id: "confirm_work_area_clear",
                            text_explain: null,
                            children: []
                        }
                    ]
                },
                {
                    node_type: "LoopForever",
                    node_name: "Bucle infinito",
                    is_active: true,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "ShowMessage",
                            node_name: "Escanee un contenedor",
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: [
                                {
                                    node_type: "ScanContainerAndGetWmsEntry",
                                    node_name: "Escanear contenedor",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: []
                                }
                            ]
                        },
                        {
                            node_type: "While",
                            node_name: null,
                            is_active: true,
                            action_id: null,
                            text_explain: "order has pending items",
                            children: [
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Escanee un artículo",
                                    is_active: true,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ScanItemAndGet",
                                            node_name: "Escanear artículo",
                                            is_active: true,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "FetchNextOrder",
                                    node_name: "Siguiente orden",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: []
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Scan packaging type. Keep scanning until correct, then press OK",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ScanPackagingUntilConfirmed",
                                            node_name: "Scan Packaging Until Confirmed",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Place all items on scale then press OK",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForAction",
                                            node_name: "Siguiente",
                                            is_active: false,
                                            action_id: "next",
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "FinishOrder",
                                    node_name: "Finalizar pedido",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: []
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Apply shipping label to the package",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForReprintableAction",
                                            node_name: "Confirm or Reprint",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Insert item, then press Item Packed",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForAction",
                                            node_name: "Artículo empacado",
                                            is_active: false,
                                            action_id: "item_packed",
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Fold and insert packing list, then press Next",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForReprintableAction",
                                            node_name: "Confirm or Reprint",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Sellar sobre",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForAction",
                                            node_name: "Confirmar sellado",
                                            is_active: false,
                                            action_id: "confirm_sealed",
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: null,
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForAction",
                                            node_name: "Confirmar entregado",
                                            is_active: false,
                                            action_id: "confirm_dropped",
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            node_type: "ShowMessage",
                            node_name: null,
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: []
                        }
                    ]
                }
            ]
        }
    },
    'outerspace-mercury': {
        id: 'outerspace-mercury',
        name: 'Outerspace - Mercury',
        version: '1.0.0',
        description: 'Flujo operativo para el robot Mercury en Outerspace.',
        rootNode: {
            node_type: "Sequence",
            node_name: "Secuencia",
            is_active: true,
            action_id: null,
            text_explain: null,
            children: [
                {
                    node_type: "ShowMessage",
                    node_name: "Despeje el área de trabajo de cualquier artículo",
                    is_active: false,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "ShowAndWaitForAction",
                            node_name: "Confirmar área de trabajo despejada",
                            is_active: false,
                            action_id: "confirm_work_area_clear",
                            text_explain: null,
                            children: []
                        }
                    ]
                },
                {
                    node_type: "LoopForever",
                    node_name: "Bucle infinito",
                    is_active: true,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "ShowMessage",
                            node_name: "Escanee un contenedor",
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: [
                                {
                                    node_type: "ScanContainerAndGetWmsEntry",
                                    node_name: "Escanear contenedor",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: []
                                }
                            ]
                        },
                        {
                            node_type: "While",
                            node_name: null,
                            is_active: true,
                            action_id: null,
                            text_explain: "order has pending items",
                            children: [
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Escanee un artículo",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ScanItemAndGet",
                                            node_name: "Escanear artículo",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "FetchNextOrder",
                                    node_name: "Siguiente orden",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: []
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Scan packaging type. Keep scanning until correct, then press OK",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ScanPackagingUntilConfirmed",
                                            node_name: "Scan Packaging Until Confirmed",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Place all items on scale then press OK",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForAction",
                                            node_name: "Siguiente",
                                            is_active: false,
                                            action_id: "next",
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "FinishOrder",
                                    node_name: "Finalizar pedido",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: []
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Apply shipping label to the package",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForReprintableAction",
                                            node_name: "Confirm or Reprint",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Insert item, then press Item Packed",
                                    is_active: true,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForAction",
                                            node_name: "Artículo empacado",
                                            is_active: true,
                                            action_id: "item_packed",
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Fold and insert packing list, then press Next",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForReprintableAction",
                                            node_name: "Confirm or Reprint",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Sellar sobre",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForAction",
                                            node_name: "Confirmar sellado",
                                            is_active: false,
                                            action_id: "confirm_sealed",
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: null,
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForAction",
                                            node_name: "Confirmar entregado",
                                            is_active: false,
                                            action_id: "confirm_dropped",
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            node_type: "ShowMessage",
                            node_name: null,
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: []
                        }
                    ]
                }
            ]
        }
    },
    'mountainy-mabel': {
        id: 'mountainy-mabel',
        name: 'Mountainy - Mabel',
        version: '1.0.0',
        description: 'Flujo operativo para el robot Mabel en Mountainy.',
        rootNode: {
            node_type: "LoopForever",
            node_name: "Bucle infinito",
            is_active: true,
            action_id: null,
            text_explain: null,
            children: [
                {
                    node_type: "ShowMessage",
                    node_name: "Obtener siguiente pedido",
                    is_active: false,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "ShowAndWaitForAction",
                            node_name: "Siguiente orden",
                            is_active: false,
                            action_id: "fetch_next_order",
                            text_explain: null,
                            children: [
                                {
                                    node_type: "FetchNextOrder",
                                    node_name: "Siguiente orden",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: []
                                }
                            ]
                        }
                    ]
                },
                {
                    node_type: "Sequence",
                    node_name: "Secuencia",
                    is_active: false,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "PrintLabel",
                            node_name: "Print bag",
                            is_active: true,
                            action_id: null,
                            text_explain: null,
                            children: []
                        },
                        {
                            node_type: "Sequence",
                            node_name: "Secuencia",
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: [
                                {
                                    node_type: "While",
                                    node_name: null,
                                    is_active: false,
                                    action_id: null,
                                    text_explain: "order has more than 1 pending item",
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForAction",
                                            node_name: "Confirmar colocado en el paquete",
                                            is_active: false,
                                            action_id: "confirm_placed",
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "ShowAndWaitForAction",
                                    node_name: "Confirmar y sellar",
                                    is_active: false,
                                    action_id: "confirm_and_seal",
                                    text_explain: null,
                                    children: []
                                },
                                {
                                    node_type: "SealBag",
                                    node_name: "Sellar bolsa",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: []
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: null,
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "DropOffBagInDesignatedBin",
                                            node_name: null,
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        },
                                        {
                                            node_type: "ShowAndWaitForAction",
                                            node_name: "Finalizar pedido",
                                            is_active: false,
                                            action_id: "finish_order",
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "FinishOrder",
                                                    node_name: "Finalizar pedido",
                                                    is_active: false,
                                                    action_id: null,
                                                    text_explain: null,
                                                    children: []
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    },
    'mountainy-monty': {
        id: 'mountainy-monty',
        name: 'Mountainy - Monty',
        version: '1.0.0',
        description: 'Flujo operativo para el robot Monty en Mountainy.',
        rootNode: {
            node_type: "LoopForever",
            node_name: "Loop Forever",
            is_active: true,
            action_id: null,
            text_explain: null,
            children: [
                {
                    node_type: "ShowMessage",
                    node_name: "Fetch next order",
                    is_active: true,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "ShowAndWaitForAction",
                            node_name: "Fetch Next Order",
                            is_active: true,
                            action_id: "fetch_next_order",
                            text_explain: null,
                            children: [
                                {
                                    node_type: "FetchNextOrder",
                                    node_name: "Fetch Next Order",
                                    is_active: true,
                                    action_id: null,
                                    text_explain: null,
                                    children: []
                                }
                            ]
                        }
                    ]
                },
                {
                    node_type: "Sequence",
                    node_name: "Sequence",
                    is_active: false,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "PrintLabel",
                            node_name: "Print bag",
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: []
                        },
                        {
                            node_type: "Sequence",
                            node_name: "Sequence",
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: [
                                {
                                    node_type: "While",
                                    node_name: null,
                                    is_active: false,
                                    action_id: null,
                                    text_explain: "order has more than 1 pending item",
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForAction",
                                            node_name: "Confirm Placed in Package",
                                            is_active: false,
                                            action_id: "confirm_placed",
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "ShowAndWaitForAction",
                                    node_name: "Confirm and Seal",
                                    is_active: false,
                                    action_id: "confirm_and_seal",
                                    text_explain: null,
                                    children: []
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: null,
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForAction",
                                            node_name: "Finish Order",
                                            is_active: false,
                                            action_id: "finish_order",
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "FinishOrder",
                                                    node_name: "Finish Order",
                                                    is_active: false,
                                                    action_id: null,
                                                    text_explain: null,
                                                    children: []
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    },
    'internal-box-fold': {
        id: 'internal-box-fold',
        name: 'Internal - Box Fold',
        version: '1.0.0',
        description: 'Flujo de armado de caja: ciclo infinito de ensamblado y depósito en bin, con protocolo de recuperación tras falla.',
        rootNode: {
            node_type: "Sequence",
            node_name: "Sequence",
            is_active: true,
            action_id: null,
            text_explain: null,
            children: [
                {
                    node_type: "LoopForever",
                    node_name: "Loop Forever",
                    is_active: true,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "ShowMessage",
                            node_name: "Assemble a box",
                            is_active: true,
                            action_id: null,
                            text_explain: null,
                            children: [
                                {
                                    node_type: "ShowAndWaitForAction",
                                    node_name: "Next",
                                    is_active: true,
                                    action_id: "next",
                                    text_explain: null,
                                    children: []
                                }
                            ]
                        },
                        {
                            node_type: "ShowMessage",
                            node_name: "Drop box into bin",
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: [
                                {
                                    node_type: "ShowAndWaitForAction",
                                    node_name: "Confirm Dropped",
                                    is_active: false,
                                    action_id: "confirm_dropped",
                                    text_explain: null,
                                    children: []
                                }
                            ]
                        }
                    ]
                },
                {
                    node_type: "ShowMessage",
                    node_name: "Marked a failure. Reset the work area and press OK to begin next cycle.",
                    is_active: false,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "ShowAndWaitForAction",
                            node_name: "OK",
                            is_active: false,
                            action_id: "ok",
                            text_explain: null,
                            children: []
                        }
                    ]
                }
            ]
        }
    },
    'internal-pick-sort': {
        id: 'internal-pick-sort',
        name: 'Internal - Pick Sort',
        version: '1.0.0',
        description: 'Flujo de clasificación por escaneo: ciclo infinito de toma, escaneo y entrega en contenedor, con protocolo de recuperación tras falla.',
        rootNode: {
            node_type: "Sequence",
            node_name: "Secuencia",
            is_active: true,
            action_id: null,
            text_explain: null,
            children: [
                {
                    node_type: "ShowMessage",
                    node_name: "Tome un artículo, escanee su código de barras y déjelo en el contenedor mostrado.",
                    is_active: false,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "ShowAndWaitForAction",
                            node_name: "Aceptar",
                            is_active: false,
                            action_id: "ok",
                            text_explain: null,
                            children: []
                        }
                    ]
                },
                {
                    node_type: "LoopForever",
                    node_name: "Bucle infinito",
                    is_active: true,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "Sequence",
                            node_name: "Secuencia",
                            is_active: true,
                            action_id: null,
                            text_explain: null,
                            children: [
                                {
                                    node_type: "Sequence",
                                    node_name: "Secuencia",
                                    is_active: true,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "LogDuration",
                                            node_name: "Tomar y escanear",
                                            is_active: true,
                                            action_id: null,
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "ShowMessage",
                                                    node_name: "Tome un artículo y escanee su código de barras",
                                                    is_active: true,
                                                    action_id: null,
                                                    text_explain: null,
                                                    children: []
                                                }
                                            ]
                                        },
                                        {
                                            node_type: "ShowMessage",
                                            node_name: null,
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "ShowAndWaitForAction",
                                                    node_name: "Confirmar entregado",
                                                    is_active: false,
                                                    action_id: "confirm_dropped",
                                                    text_explain: null,
                                                    children: []
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    node_type: "Sequence",
                                    node_name: "Secuencia",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowMessage",
                                            node_name: "Marcado como fallo. Reinicie el área de trabajo",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "ShowAndWaitForAction",
                                                    node_name: "Aceptar",
                                                    is_active: false,
                                                    action_id: "ok",
                                                    text_explain: null,
                                                    children: []
                                                }
                                            ]
                                        },
                                        {
                                            node_type: "ShowMessage",
                                            node_name: "Inicie el siguiente ciclo con Aceptar",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "ShowAndWaitForAction",
                                                    node_name: "Aceptar",
                                                    is_active: false,
                                                    action_id: "ok",
                                                    text_explain: null,
                                                    children: []
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            node_type: "Sequence",
                            node_name: "Secuencia",
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: [
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Marcado como fallo. Reinicie el área de trabajo",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForAction",
                                            node_name: "Aceptar",
                                            is_active: false,
                                            action_id: "ok",
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Inicie el siguiente ciclo con Aceptar",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowAndWaitForAction",
                                            node_name: "Aceptar",
                                            is_active: false,
                                            action_id: "ok",
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    },
    'internal-tote': {
        id: 'internal-tote',
        name: 'Internal - Tote',
        version: '1.0.0',
        description: 'Flujo de empaque por tote: escaneo de tote, ciclo de ítems, etiquetado y finalización de pedido.',
        rootNode: {
            node_type: "Sequence",
            node_name: "Sequence",
            is_active: true,
            action_id: null,
            text_explain: null,
            children: [
                {
                    node_type: "ShowMessage",
                    node_name: "Clear the work area of any items",
                    is_active: false,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "ShowAndWaitForAction",
                            node_name: "Confirm Work Area Clear",
                            is_active: false,
                            action_id: "confirm_work_area_clear",
                            text_explain: null,
                            children: []
                        }
                    ]
                },
                {
                    node_type: "LoopForever",
                    node_name: "Loop Forever",
                    is_active: true,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "Sequence",
                            node_name: "Sequence",
                            is_active: true,
                            action_id: null,
                            text_explain: null,
                            children: [
                                {
                                    node_type: "ShowMessage",
                                    node_name: "Scan a tote",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ScanToteAndGetWmsEntry",
                                            node_name: "Scan Tote",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                },
                                {
                                    node_type: "FetchNextOrder",
                                    node_name: "Fetch Next Order",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: []
                                },
                                {
                                    node_type: "Sequence",
                                    node_name: "Sequence",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "ShowMessage",
                                            node_name: "Pick up an envelope",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "ShowAndWaitForAction",
                                                    node_name: "Next",
                                                    is_active: false,
                                                    action_id: "next",
                                                    text_explain: null,
                                                    children: []
                                                }
                                            ]
                                        },
                                        {
                                            node_type: "While",
                                            node_name: null,
                                            is_active: true,
                                            action_id: null,
                                            text_explain: "order has pending items",
                                            children: [
                                                {
                                                    node_type: "ShowMessage",
                                                    node_name: "Scan an item",
                                                    is_active: false,
                                                    action_id: null,
                                                    text_explain: null,
                                                    children: [
                                                        {
                                                            node_type: "ScanItemAndGet",
                                                            node_name: "Scan Item",
                                                            is_active: false,
                                                            action_id: null,
                                                            text_explain: null,
                                                            children: []
                                                        }
                                                    ]
                                                },
                                                {
                                                    node_type: "ShowMessage",
                                                    node_name: "Place item in packaging",
                                                    is_active: true,
                                                    action_id: null,
                                                    text_explain: null,
                                                    children: [
                                                        {
                                                            node_type: "ShowAndWaitForAction",
                                                            node_name: "Confirm Placed in Package",
                                                            is_active: true,
                                                            action_id: "confirm_placed",
                                                            text_explain: null,
                                                            children: []
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            node_type: "FetchLabelUrlTote",
                                            node_name: "Fetch Label",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        },
                                        {
                                            node_type: "Sequence",
                                            node_name: "Sequence",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "ShowMessage",
                                                    node_name: "Seal mailer",
                                                    is_active: false,
                                                    action_id: null,
                                                    text_explain: null,
                                                    children: [
                                                        {
                                                            node_type: "PrintLabel",
                                                            node_name: "Print Label",
                                                            is_active: false,
                                                            action_id: null,
                                                            text_explain: null,
                                                            children: []
                                                        },
                                                        {
                                                            node_type: "ShowAndWaitForAction",
                                                            node_name: "Confirm Sealed",
                                                            is_active: false,
                                                            action_id: "confirm_sealed",
                                                            text_explain: null,
                                                            children: []
                                                        }
                                                    ]
                                                },
                                                {
                                                    node_type: "ShowMessage",
                                                    node_name: "Apply label",
                                                    is_active: false,
                                                    action_id: null,
                                                    text_explain: null,
                                                    children: [
                                                        {
                                                            node_type: "ShowAndWaitForAction",
                                                            node_name: "Confirm Applied",
                                                            is_active: false,
                                                            action_id: "confirm_applied",
                                                            text_explain: null,
                                                            children: []
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            node_type: "ShowMessage",
                                            node_name: null,
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "ShowAndWaitForAction",
                                                    node_name: "Finish Order",
                                                    is_active: false,
                                                    action_id: "finish_order",
                                                    text_explain: null,
                                                    children: [
                                                        {
                                                            node_type: "FinishOrder",
                                                            node_name: "Finish Order",
                                                            is_active: false,
                                                            action_id: null,
                                                            text_explain: null,
                                                            children: []
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            node_type: "ShowMessage",
                            node_name: null,
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: []
                        }
                    ]
                }
            ]
        }
    },
    'internal-bagger-label': {
        id: 'internal-bagger-label',
        name: 'Internal - Bagger Label',
        version: '1.0.0',
        description: 'Flujo de embolsado con etiquetado manual: fetch de orden, impresión de bolsa, sellado, colocación de etiqueta y depósito en bin.',
        rootNode: {
            node_type: "Sequence",
            node_name: "Sequence",
            is_active: true,
            action_id: null,
            text_explain: null,
            children: [
                {
                    node_type: "ShowMessage",
                    node_name: "Clear the work area of any items",
                    is_active: false,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "ShowAndWaitForAction",
                            node_name: "Confirm Work Area Clear",
                            is_active: false,
                            action_id: "confirm_work_area_clear",
                            text_explain: null,
                            children: []
                        }
                    ]
                },
                {
                    node_type: "LoopForever",
                    node_name: "Loop Forever",
                    is_active: true,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "ShowMessage",
                            node_name: "Fetch next order",
                            is_active: true,
                            action_id: null,
                            text_explain: null,
                            children: [
                                {
                                    node_type: "ShowAndWaitForAction",
                                    node_name: "Fetch Next Order",
                                    is_active: true,
                                    action_id: "fetch_next_order",
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "FetchNextOrder",
                                            node_name: "Fetch Next Order",
                                            is_active: true,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            node_type: "Sequence",
                            node_name: "Sequence",
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: [
                                {
                                    node_type: "PrintLabel",
                                    node_name: "Print bag",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: []
                                },
                                {
                                    node_type: "Sequence",
                                    node_name: "Sequence",
                                    is_active: false,
                                    action_id: null,
                                    text_explain: null,
                                    children: [
                                        {
                                            node_type: "While",
                                            node_name: null,
                                            is_active: false,
                                            action_id: null,
                                            text_explain: "order has more than 1 pending item",
                                            children: [
                                                {
                                                    node_type: "ShowAndWaitForAction",
                                                    node_name: "Confirm Placed in Package",
                                                    is_active: false,
                                                    action_id: "confirm_placed",
                                                    text_explain: null,
                                                    children: []
                                                }
                                            ]
                                        },
                                        {
                                            node_type: "ShowAndWaitForAction",
                                            node_name: "Confirm and Seal",
                                            is_active: false,
                                            action_id: "confirm_and_seal",
                                            text_explain: null,
                                            children: []
                                        },
                                        {
                                            node_type: "SealBag",
                                            node_name: "Seal Bag",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: []
                                        },
                                        {
                                            node_type: "ShowMessage",
                                            node_name: "Place label on bag",
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "ShowAndWaitForAction",
                                                    node_name: "Confirm Label Placed",
                                                    is_active: false,
                                                    action_id: "confirm_label_placed",
                                                    text_explain: null,
                                                    children: []
                                                }
                                            ]
                                        },
                                        {
                                            node_type: "ShowMessage",
                                            node_name: null,
                                            is_active: false,
                                            action_id: null,
                                            text_explain: null,
                                            children: [
                                                {
                                                    node_type: "DropOffBagInDesignatedBin",
                                                    node_name: null,
                                                    is_active: false,
                                                    action_id: null,
                                                    text_explain: null,
                                                    children: []
                                                },
                                                {
                                                    node_type: "ShowAndWaitForAction",
                                                    node_name: "Finish Order",
                                                    is_active: false,
                                                    action_id: "finish_order",
                                                    text_explain: null,
                                                    children: [
                                                        {
                                                            node_type: "FinishOrder",
                                                            node_name: "Finish Order",
                                                            is_active: false,
                                                            action_id: null,
                                                            text_explain: null,
                                                            children: []
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    },
    'internal-tower-stack': {
        id: 'internal-tower-stack',
        name: 'Internal - Tower Stack/Unstack',
        version: '1.0.0',
        description: 'Flujo operativo del robot Tower Stack/Unstack para apilado y desapilado de producto con verificación de lote.',
        rootNode: {
            node_type: "Sequence",
            node_name: "Secuencia",
            is_active: true,
            action_id: null,
            text_explain: null,
            children: [
                {
                    node_type: "LoopForever",
                    node_name: "Bucle infinito",
                    is_active: true,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "ShowMessage",
                            node_name: "apile 3 anillos",
                            is_active: true,
                            action_id: null,
                            text_explain: null,
                            children: [
                                {
                                    node_type: "ShowAndWaitForAction",
                                    node_name: "Aceptar",
                                    is_active: true,
                                    action_id: "ok",
                                    text_explain: null,
                                    children: []
                                }
                            ]
                        },
                        {
                            node_type: "ShowMessage",
                            node_name: "desapile 3 anillos",
                            is_active: false,
                            action_id: null,
                            text_explain: null,
                            children: [
                                {
                                    node_type: "ShowAndWaitForAction",
                                    node_name: "Aceptar",
                                    is_active: false,
                                    action_id: "ok",
                                    text_explain: null,
                                    children: []
                                }
                            ]
                        }
                    ]
                },
                {
                    node_type: "ShowMessage",
                    node_name: "Marcado como fallo. Reinicie el área de trabajo y presione Aceptar para iniciar el siguiente ciclo.",
                    is_active: false,
                    action_id: null,
                    text_explain: null,
                    children: [
                        {
                            node_type: "ShowAndWaitForAction",
                            node_name: "Aceptar",
                            is_active: false,
                            action_id: "ok",
                            text_explain: null,
                            children: []
                        }
                    ]
                }
            ]
        }
    }
};
