'use client';

import React from 'react';

// Definimos la interfaz localmente para romper la dependencia rígida de rutas si el compilador se traba
export interface WorkflowNode {
    node_type: string;
    node_name: string | null;
    is_active: boolean;
    action_id: string | null;
    text_explain: string | null;
    children: WorkflowNode[];
}

interface WorkflowVisualizerProps {
    node: WorkflowNode;
    depth?: number;
}

export default function WorkflowVisualizer({ node, depth = 0 }: WorkflowVisualizerProps) {
    // Determinar el color y estilo según el tipo de nodo para que el operador identifique rápido la función
    const getNodeStyles = (type: string) => {
        switch (type) {
            case 'LoopForever':
            case 'While':
                return {
                    bg: 'bg-purple-50 border-purple-200 text-purple-700',
                    badge: 'Bucle / Control',
                    icon: '🔄'
                };
            case 'Sequence':
                return {
                    bg: 'bg-slate-50 border-slate-200 text-slate-700',
                    badge: 'Secuencia',
                    icon: '📋'
                };
            case 'ShowMessage':
            case 'ShowAndWaitForAction':
                return {
                    bg: 'bg-blue-50 border-blue-200 text-blue-700',
                    badge: 'Pantalla Operador',
                    icon: '💻'
                };
            case 'PrintLabel':
            case 'SealBag':
            case 'DropOffBagInDesignatedBin':
                return {
                    bg: 'bg-amber-50 border-amber-200 text-amber-800',
                    badge: 'Acción Hardware',
                    icon: '⚙️'
                };
            case 'FetchNextOrder':
            case 'FinishOrder':
                return {
                    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                    badge: 'Sistema / API',
                    icon: '⚡'
                };
            default:
                return {
                    bg: 'bg-neutral-50 border-neutral-200 text-neutral-700',
                    badge: 'Nodo',
                    icon: '•'
                };
        }
    };

    const styles = getNodeStyles(node.node_type);

    return (
        <div className="flex flex-col w-full text-left">
            {/* Nodo Actual */}
            <div
                className={`flex items-center justify-between p-3 my-1 rounded-xl border text-xs font-medium transition-all ${styles.bg}`}
                style={{ marginLeft: `${depth * 1.5}rem` }}
            >
                <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="text-sm shrink-0">{styles.icon}</span>
                    <div className="flex flex-col truncate">
                        <span className="font-sans font-bold text-neutral-900 truncate">
                            {node.node_name || node.node_type}
                        </span>
                        {node.text_explain && (
                            <span className="text-[10px] font-mono text-neutral-500 truncate">
                                Condición: {node.text_explain}
                            </span>
                        )}
                        {node.action_id && (
                            <span className="text-[10px] font-mono text-blue-600 truncate">
                                ID Acción: {node.action_id}
                            </span>
                        )}
                    </div>
                </div>

                <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/80 border border-inherit shrink-0 ml-2">
                    {styles.badge}
                </span>
            </div>

            {/* Renderizado recursivo de los nodos hijos */}
            {node.children && node.children.length > 0 && (
                <div className="w-full relative">
                    {/* Línea guía visual izquierda para denotar jerarquía */}
                    <div
                        className="absolute top-0 bottom-0 w-[1px] bg-neutral-200"
                        style={{ marginLeft: `${(depth * 1.5) + 0.75}rem` }}
                    />
                    {node.children.map((childNode: WorkflowNode, index: number) => (
                        <WorkflowVisualizer
                            key={index}
                            node={childNode}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}