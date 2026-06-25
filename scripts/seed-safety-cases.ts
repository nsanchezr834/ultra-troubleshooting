import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Faltan variables de entorno de Supabase en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SAFETY_CASES_DATA = [
  {
    id: 1,
    label_corto: "Caso 1: Atorado",
    titulo: "Colisión y Forzado de Motores",
    descripcion: "En el video se observa un atoramiento debajo de la mesa provocando que se haya movido la mesa el operador trata de regresar a posicion de home pero como el robot estaba mal posicionado jala la mesa y empieza a forzar motores.",
    recomendacion: "Es de suma importancia tener conciente que cuando se presente una posicion donde esta muy comprometido el robot es imperative sin ninguna otra alternativa mencionarle al suoervisor en turno que el robot se encuentra en esa posicion, el tiene toda la capacidad de poder ayudar a resolver el problema y evitar escalaciones.",
    video_url: "https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/atoramiento%20robot.mp4"
  },
  {
    id: 2,
    label_corto: "Caso 2: Impresora",
    titulo: "Desprendimiento de Componentes de la Estación",
    descripcion: "En este video se muestra como el operador tuvo un accidente con una impresora ya que por los movimientos realizados la tiro de su posicion, esto puede provocar daños no solo a la impresora en si, si no alguna persona que se encuentre al rededor o que caiga en algun otro objeto sea dañandolo o proyectandolo.",
    recomendacion: "Es importante escalar cualquier situacion de riesgo de forma imperativa a el supervisor en turno.",
    video_url: "https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/impresorasecae.mp4"
  },
  {
    id: 3,
    label_corto: "Caso 3: Mismatch",
    titulo: "Desalineación en Intervención Manual",
    descripcion: "Aquí el operador, utilizando el modo AUTO, no realizó una correcta intervención debido a su posición física.",
    recomendacion: "Si uno está en modo AUTO e interviene, es imperativo estar en la misma posición del robot en el momento en que queremos intervenir presionando la letra A en el joystick.",
    video_url: "https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/Future%202.0%20_%20Operator%20&%20AUTO%20not%20matching%201_2.mp4"
  },
  {
    id: 4,
    label_corto: "Caso 4: Brazo",
    titulo: "Fallo de Hardware Crítico (Brazo Derecho)",
    descripcion: "En este caso el brazo derecho se desprendió completamente del robot. El operador no tuvo ninguna mala práctica en este caso; lo importante aquí es observar cómo, en el instante en que el brazo cayó, el operador reaccionó oportunamente colocando el robot en pausa de inmediato.",
    recomendacion: "La pausa inmediata ante cualquier evento imprevisto es una excelente práctica que evita accidentes secundarios o daños a otros componentes.",
    video_url: "https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/Packie%202.0%20Right%20arm%20.mp4"
  },
  {
    id: 5,
    label_corto: "Caso 5: Headset",
    titulo: "Falta de Carga y Caída del Visor",
    descripcion: "El operador tuvo un descuido en cuanto a la preparación de su estación debido a que no se aseguró de que los headsets estuvieran cargando, por lo que la pila se agotó y se apagó, haciendo que el robot se desvaneciera hacia un lado completamente. No hubo daños, pero descuidos así pueden dañar la imagen con el cliente y, en un caso más grave, tirar producto o, peor aún, golpear a alguien.",
    recomendacion: "Es importante realizar una buena preparación de nuestra estación para evitar estos problemas: tener bien conectados los pedales, el cable de red, el cable USB tipo C conectado en el headset y el cargador conectado de preferencia en el contacto de caída regulada (contacto naranja), ya que este está conectado a la planta del corporativo y con esto evitamos que si se va la luz se pierda la conexión.",
    video_url: "https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/Future%202.0%20%20%20Headset%20Turned%20Off%20(1)(1).mp4"
  },
  {
    id: 6,
    label_corto: "Caso 6: Etiquetas",
    titulo: "Falta de Control y Mal Uso de la Bagger",
    descripcion: "El operador no pudo retirar de manera correcta la etiqueta de la impresora. La etiqueta se pega en las manos, choca con la bagger, se empieza a desesperar porque la etiqueta no se quita de los grippers y erróneamente utiliza la bagger como herramienta para poder quitarse los restos. Esto puede provocar daños tanto al robot como a la bagger. Además, tira la hospital bin que estaba ubicada sobre la impresora de etiquetas, hasta que por fin se va a la posición de home para solicitar ayuda.",
    recomendacion: "La mejor posición para quitar esas etiquetas es en la parte superior haciendo un movimiento vertical para evitar la ruptura de la etiqueta o que se quede pegada al gripper.",
    video_url: "https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/Packasaurus%2520%2520%2520Be%2520Careful%2520With%2520Movement%2520While%2520Operating.mp4"
  },
  {
    id: 7,
    label_corto: "Caso 7",
    titulo: "Malas Prácticas",
    descripcion: "Lo que se observa en el video es totalmente prohibido y no se debe de realizar esas acciones ya que pueden tener consecuencias físicas como daños al robot, problemas con Ultra y incluso faltas administrativas.",
    recomendacion: "¡IMPORTANTE! Remarcar muy bien que esto es una mala práctica y nunca se deben de realizar estas acciones bajo ninguna circunstancia.",
    video_url: "https://hdwbmwnppatfbwntiskd.supabase.co/storage/v1/object/public/assets-videos/MalasPracticas.mp4"
  }
];

async function seed() {
  console.log(`Iniciando migración de ${SAFETY_CASES_DATA.length} Casos de Estudio de Seguridad a Supabase...`);

  const { error } = await supabase
    .from('casos_estudio')
    .upsert(SAFETY_CASES_DATA, { onConflict: 'id' });

  if (error) {
    console.error('❌ Error al migrar casos de estudio:', error.message, error.details);
    process.exit(1);
  }

  console.log('✅ Ingesta exitosa. La tabla casos_estudio ha sido sincronizada.');
}

seed();
