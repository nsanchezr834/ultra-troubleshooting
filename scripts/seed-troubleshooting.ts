import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { TroubleshootingKnowledge } from '../types/troubleshooting.types';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY deben estar definidos en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const payload: TroubleshootingKnowledge[] = [
  {
    id: "ERR-KIN-001",
    category: "cinemática",
    symptom: "El hombro del robot comienza a visualizarse en la pantalla operativa / pérdida de alineación",
    root_cause: "Operador trabajando con los brazos demasiado cerca del pecho, afectando la sincronía y el tracking del torso.",
    severity: "MEDIUM",
    resolution_protocol: "Detener el movimiento actual de inmediato. Regresar el robot a la posición HOME para restablecer offsets y reiniciar el proceso desde cero.",
    sop_reference: "SOP 1-C, SOP 1-F, Estándares de Seguridad (Postura)"
  },
  {
    id: "ERR-MEC-002",
    category: "manipulación",
    symptom: "Deslizamiento de empaques, productos cilíndricos o redondos que se resbalan del gripper",
    root_cause: "El operador intentó sujetar el ítem por el cuerpo cilíndrico en lugar de la tapa o los pliegues superiores.",
    severity: "HIGH",
    resolution_protocol: "Asegurar la sujeción obligatoria por la tapa. Si el ítem cae, evaluar límites cinemáticos antes de intentar recuperarlo físicamente; si no es alcanzable de forma segura, emitir fault 'dropped item'.",
    sop_reference: "SOP 1-D, SOP 11"
  },
  {
    id: "ERR-NET-003",
    category: "conectividad",
    symptom: "Alta latencia, congelamiento intermitente de cámaras o pérdida crítica de paquetes",
    root_cause: "Saturación o degradación del enlace del ISP primario (Alestra).",
    severity: "CRITICAL",
    resolution_protocol: "Notificar inmediatamente al supervisor e IT indicando sitio, hora y síntomas. Realizar el cambio manual de Gateway en caliente hacia los ISPs de respaldo (Marcatel o Flo). Pausar operación si la latencia compromete la seguridad física.",
    sop_reference: "SOP 2-D, SOP 4, Estándares de Seguridad (ISP)"
  },
  {
    id: "ERR-SW-004",
    category: "software",
    symptom: "Brazo del robot estático o congelado sin responder a los comandos del joystick/torso",
    root_cause: "Crash o bloqueo (deadlock) en el demonio/proceso de control del actuador del brazo.",
    severity: "HIGH",
    resolution_protocol: "Detener la operación. Enviar al canal el formato estricto usando el código de fallo específico 'frozen arm'. Esto disparará el script automatizado que reinicia el backend del brazo.",
    sop_reference: "SOP 8-C, Estándares de Seguridad (Brazo)"
  },
  {
    id: "ERR-SW-005",
    category: "software_lock",
    symptom: "El robot muestra el aviso o estado de sistema 'held for software dev'",
    root_cause: "Bloqueo manual e intencional por parte del equipo de ingeniería de Ultra para despliegue de código o debugging.",
    severity: "CRITICAL",
    resolution_protocol: "PROHIBIDO CONECTARSE O IGNORAR EL AVISO. Detener inicialización del piloto y escalar la disponibilidad únicamente a través de los supervisores designados: Lukas, Kyle o Malcolm.",
    sop_reference: "SOP 8-D, SOP 8-E, Estándares de Seguridad (Modo Dev)"
  },
  {
    id: "ERR-SEC-006",
    category: "seguridad",
    symptom: "Incursión de personal o Warehouse Representative en el espacio de trabajo físico del robot",
    root_cause: "Ingreso no coordinado de personal on-site al perímetro operativo de la máquina.",
    severity: "CRITICAL",
    resolution_protocol: "Detener de inmediato todo movimiento del robot. Mantener el volumen de audio del equipo activo para coordinarse con ingeniería on-site. Evaluar la situación visualmente antes de reanudar cualquier comando.",
    sop_reference: "SOP 2-F, SOP 2-G, Estándares de Seguridad (Volumen)"
  }
];

async function seed() {
  console.log('Iniciando ingesta de conocimientos de Troubleshooting (Autoryx Standard)...');

  const { data, error } = await supabase
    .from('troubleshooting_knowledge')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    console.error('Error al ingestar datos:', error.message, error.details);
    process.exit(1);
  }

  console.log('✅ Ingesta exitosa. Base de conocimientos actualizada.');
}

seed();
