'use client';

import React, { useState } from 'react';
import { Siren, AlertOctagon, Film, Eye, ShieldAlert, AlertTriangle } from 'lucide-react';

interface SafetyCasesProps {
    isDarkMode?: boolean;
}

export default function SafetyCases({ isDarkMode = false }: SafetyCasesProps) {
    const [activeCase, setActiveCase] = useState<number>(1);

    const descTextClass = isDarkMode ? 'text-neutral-300' : 'text-neutral-700';
    const bgContainerClass = isDarkMode 
        ? 'bg-[#12131a]/65 backdrop-blur-[20px] border-white/[0.08] text-neutral-100'
        : 'bg-white/65 backdrop-blur-[20px] border-white/[0.6] text-neutral-900 shadow-slate-200/50';

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 animate-fadeIn">
            {/* Encabezado del Módulo */}
            <div className="text-center space-y-2 mb-4">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-1.5 animate-pulse">
                    <Siren className="w-3.5 h-3.5" />
                    Protocolos y Prevención de Riesgos
                </span>
                <h3 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-neutral-100' : 'text-neutral-900'}`}>
                    Casos de Estudio de Seguridad
                </h3>
                <p className={`text-xs max-w-md mx-auto font-medium ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Analiza incidentes reales para comprender la importancia de las escalaciones oportunas y la seguridad física.
                </p>
            </div>

            {/* Selector de Casos (Grid de 6 botones) */}
            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 p-1.5 rounded-2xl max-w-5xl mx-auto w-full border gap-1.5 ${
                isDarkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
            }`}>
                {[
                    { id: 1, label: 'Caso 1: Atorado' },
                    { id: 2, label: 'Caso 2: Impresora' },
                    { id: 3, label: 'Caso 3: Mismatch' },
                    { id: 4, label: 'Caso 4: Brazo' },
                    { id: 5, label: 'Caso 5: Headset' },
                    { id: 6, label: 'Caso 6: Etiquetas' }
                ].map((c) => (
                    <button
                        key={c.id}
                        onClick={() => setActiveCase(c.id)}
                        className={`flex items-center justify-center gap-1.5 py-3 rounded-xl text-[10px] sm:text-xs font-black tracking-wider uppercase transition-all duration-300 ${
                            activeCase === c.id
                                ? 'bg-red-600 text-white shadow-md shadow-red-600/20 scale-[1.02]'
                                : isDarkMode
                                    ? 'text-neutral-400 hover:text-neutral-200'
                                    : 'text-neutral-500 hover:text-neutral-800'
                        }`}
                    >
                        <Film className="w-3.5 h-3.5" />
                        {c.label}
                    </button>
                ))}
            </div>

            {/* Detalle del Caso Activo */}
            <div className={`border rounded-[2.5rem] p-6 md:p-8 flex flex-col gap-8 transition-all duration-500 shadow-lg ${bgContainerClass}`}>
                {activeCase === 1 && (
                    <div className="flex flex-col gap-8 animate-fadeIn">
                        {/* Fila del Video y la Descripción */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Video */}
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black/90 group">
                                <video 
                                    src="https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/atoramiento%20robot.mp4"
                                    controls
                                    playsInline
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Descripción */}
                            <div className="flex flex-col justify-center h-full gap-4">
                                <div className="flex items-center gap-2 text-red-500 font-extrabold uppercase text-xs tracking-wider">
                                    <AlertTriangle className="w-4 h-4" />
                                    Análisis del Incidente — Robot Atorado
                                </div>
                                <h4 className="text-xl font-extrabold tracking-tight">
                                    Colisión y Forzado de Motores
                                </h4>
                                <p className={`text-sm leading-relaxed ${descTextClass}`}>
                                    En el video se observa un atoramiento debajo de la mesa provocando que se haya movido la mesa el operador trata de regresar a posicion de home pero como el robot estaba mal posicionado jala la mesa y empieza a forzar motores.
                                </p>
                                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm leading-relaxed mt-2 shadow-xs">
                                    <strong>
                                        Es de suma importancia tener conciente que cuando se presente una posicion donde esta muy comprometido el robot es imperative sin ninguna otra alternativa mencionarle al suoervisor en turno que el robot se encuentra en esa posicion, el tiene toda la capacidad de poder ayudar a resolver el problema y evitar escalaciones.
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* Resultados No Deseados */}
                        <div className="border-t border-neutral-200/20 pt-6 mt-2">
                            <h4 className="text-sm font-black uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                                <AlertOctagon className="w-4 h-4 text-red-600" />
                                Resultados no deseados
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {[
                                    { src: '/brazo1.webp', alt: 'Daño Físico Brazo 1', label: 'Estructura forzada' },
                                    { src: '/brazo2.webp', alt: 'Daño Físico Brazo 2', label: 'Deformación del soporte' },
                                    { src: '/brazo3.webp', alt: 'Daño Físico Brazo 3', label: 'Articulación averiada' }
                                ].map((img, idx) => (
                                    <div key={idx} className="flex flex-col gap-2 group cursor-pointer">
                                        <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-250/20 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg bg-neutral-900 flex items-center justify-center">
                                            <img 
                                                src={img.src} 
                                                alt={img.alt} 
                                                className="w-full h-full object-cover group-hover:opacity-90"
                                            />
                                        </div>
                                        <span className="text-[11px] font-bold text-neutral-500 text-center uppercase tracking-wider group-hover:text-red-500 transition-colors">
                                            {img.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeCase === 2 && (
                    <div className="flex flex-col gap-8 animate-fadeIn">
                        {/* Fila del Video y la Descripción */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Video */}
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black/90 group">
                                <video 
                                    src="https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/impresorasecae.mp4"
                                    controls
                                    playsInline
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Descripción */}
                            <div className="flex flex-col justify-center h-full gap-4">
                                <div className="flex items-center gap-2 text-red-500 font-extrabold uppercase text-xs tracking-wider">
                                    <AlertTriangle className="w-4 h-4" />
                                    Análisis del Incidente — Caída de Impresora
                                </div>
                                <h4 className="text-xl font-extrabold tracking-tight">
                                    Desprendimiento de Componentes de la Estación
                                </h4>
                                <p className={`text-sm leading-relaxed ${descTextClass}`}>
                                    En este video se muestra como el operador tuvo un accidente con una impresora ya que por los movimientos realizados la tiro de su posicion, esto puede provocar daños no solo a la impresora en si, si no alguna persona que se encuentre al rededor o que caiga en algun otro objeto sea dañandolo o proyectandolo.
                                </p>
                                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm leading-relaxed mt-2 shadow-xs">
                                    <strong>
                                        Es importante escalar cualquier situacion de riesgo de forma imperativa a el supervisor en turno.
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeCase === 3 && (
                    <div className="flex flex-col gap-8 animate-fadeIn">
                        {/* Fila del Video y la Descripción */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Video */}
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black/90 group">
                                <video 
                                    src="https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/Future%202.0%20_%20Operator%20&%20AUTO%20not%20matching%201_2.mp4"
                                    controls
                                    playsInline
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Descripción */}
                            <div className="flex flex-col justify-center h-full gap-4">
                                <div className="flex items-center gap-2 text-red-500 font-extrabold uppercase text-xs tracking-wider">
                                    <AlertTriangle className="w-4 h-4" />
                                    Análisis del Incidente — Operator & AUTO Mismatch
                                </div>
                                <h4 className="text-xl font-extrabold tracking-tight">
                                    Desalineación en Intervención Manual
                                </h4>
                                <p className={`text-sm leading-relaxed ${descTextClass}`}>
                                    <strong>Aquí el operador, utilizando el modo AUTO, no realizó una correcta intervención debido a su posición física.</strong>
                                </p>
                                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm leading-relaxed mt-2 shadow-xs">
                                    <strong>
                                        Si uno está en modo AUTO e interviene, es imperativo estar en la misma posición del robot en el momento en que queremos intervenir presionando la letra A en el joystick.
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeCase === 4 && (
                    <div className="flex flex-col gap-8 animate-fadeIn">
                        {/* Fila del Video y la Descripción */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Video */}
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black/90 group">
                                <video 
                                    src="https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/Packie%202.0%20Right%20arm%20.mp4"
                                    controls
                                    playsInline
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Descripción */}
                            <div className="flex flex-col justify-center h-full gap-4">
                                <div className="flex items-center gap-2 text-red-500 font-extrabold uppercase text-xs tracking-wider">
                                    <AlertTriangle className="w-4 h-4" />
                                    Análisis del Incidente — Desprendimiento de Brazo
                                </div>
                                <h4 className="text-xl font-extrabold tracking-tight">
                                    Fallo de Hardware Crítico (Brazo Derecho)
                                </h4>
                                <p className={`text-sm leading-relaxed ${descTextClass}`}>
                                    En este caso el brazo derecho se desprendió completamente del robot. El operador no tuvo ninguna mala práctica en este caso; lo importante aquí es observar cómo, en el instante en que el brazo cayó, el operador reaccionó oportunamente colocando el robot en pausa de inmediato.
                                </p>
                                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm leading-relaxed mt-2 shadow-xs">
                                    <strong>
                                        La pausa inmediata ante cualquier evento imprevisto es una excelente práctica que evita accidentes secundarios o daños a otros componentes.
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeCase === 5 && (
                    <div className="flex flex-col gap-8 animate-fadeIn">
                        {/* Fila del Video y la Descripción */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Video */}
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black/90 group">
                                <video 
                                    src="https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/Future%202.0%20%20%20Headset%20Turned%20Off%20(1)(1).mp4"
                                    controls
                                    playsInline
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Descripción */}
                            <div className="flex flex-col justify-center h-full gap-4">
                                <div className="flex items-center gap-2 text-red-500 font-extrabold uppercase text-xs tracking-wider">
                                    <AlertTriangle className="w-4 h-4" />
                                    Análisis del Incidente — Headset Apagado
                                </div>
                                <h4 className="text-xl font-extrabold tracking-tight">
                                    Falta de Carga y Caída del Visor
                                </h4>
                                <p className={`text-sm leading-relaxed ${descTextClass}`}>
                                    El operador tuvo un descuido en cuanto a la preparación de su estación debido a que no se aseguró de que los headsets estuvieran cargando, por lo que la pila se agotó y se apagó, haciendo que el robot se desvaneciera hacia un lado completamente. No hubo daños, pero descuidos así pueden dañar la imagen con el cliente y, en un caso más grave, tirar producto o, peor aún, golpear a alguien.
                                </p>
                                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm leading-relaxed mt-2 shadow-xs">
                                    <strong>
                                        Es importante realizar una buena preparación de nuestra estación para evitar estos problemas: tener bien conectados los pedales, el cable de red, el cable USB tipo C conectado en el headset y el cargador conectado de preferencia en el contacto de caída regulada (contacto naranja), ya que este está conectado a la planta del corporativo y con esto evitamos que si se va la luz se pierda la conexión.
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeCase === 6 && (
                    <div className="flex flex-col gap-8 animate-fadeIn">
                        {/* Fila del Video y la Descripción */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Video */}
                            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black/90 group">
                                <video 
                                    src="https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/Packasaurus%20%20%20Be%20Careful%20With%20Movement%20While%20Operating.mp4"
                                    controls
                                    playsInline
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Descripción */}
                            <div className="flex flex-col justify-center h-full gap-4">
                                <div className="flex items-center gap-2 text-red-500 font-extrabold uppercase text-xs tracking-wider">
                                    <AlertTriangle className="w-4 h-4" />
                                    Análisis del Incidente — Manejo de Etiquetas
                                </div>
                                <h4 className="text-xl font-extrabold tracking-tight">
                                    Falta de Control y Mal Uso de la Bagger
                                </h4>
                                <p className={`text-sm leading-relaxed ${descTextClass}`}>
                                    El operador no pudo retirar de manera correcta la etiqueta de la impresora. La etiqueta se pega en las manos, choca con la bagger, se empieza a desesperar porque la etiqueta no se quita de los grippers y erróneamente utiliza la bagger como herramienta para poder quitarse los restos. Esto puede provocar daños tanto al robot como a la bagger. Además, tira la hospital bin que estaba ubicada sobre la impresora de etiquetas, hasta que por fin se va a la posición de home para solicitar ayuda.
                                </p>
                                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm leading-relaxed mt-2 shadow-xs">
                                    <strong>
                                        La mejor posición para quitar esas etiquetas es en la parte superior haciendo un movimiento vertical para evitar la ruptura de la etiqueta o que se quede pegada al gripper.
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
