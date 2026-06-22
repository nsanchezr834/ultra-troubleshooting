# Manual de Usuario: Plataforma de Capacitación y Soporte Ultra

Este manual describe el funcionamiento de la plataforma Ultra, detallando sus dos modos principales de uso —**Modo Capacitación** y **Modo Operativo (Soporte en Sitio)**— y las instrucciones para cada perfil: **Operador**, **Trainer** y **Administrador**.

---

## 1. El Selector de Modos (Header)
En la parte superior derecha de la aplicación principal, los operadores pueden alternar entre dos modos de trabajo dependiendo de su necesidad:

*   **Modo Capacitación (Fondo Oscuro):** Diseñado para aprender, practicar y acreditar habilidades en la plataforma. Da acceso a la teoría, el simulador 3D, y los exámenes de certificación.
*   **Modo Operativo (Fondo Claro):** Optimizado para la operación diaria en la planta. Cambia a una interfaz clara de alta visibilidad y va directo al buscador de fallas para resolver problemas en sitio de forma inmediata.

---

## 2. Flujo de Trabajo: MODO OPERATIVO (Soporte en Sitio)
Este modo es utilizado por el personal de operaciones y mantenimiento que se encuentra físicamente en la planta y necesita solucionar una falla en un robot de inmediato.

### 2.1. Acceso Directo a Diagnóstico
1. Activa el **Modo Operativo** en el switch del header.
2. La plataforma cambiará a fondo blanco (alta legibilidad bajo luz industrial) y cargará la interfaz de **Soporte de Fallas (Troubleshooting)**.

### 2.2. Búsqueda y Resolución de Fallas
1. **Búsqueda por Síntoma o Código:** Escribe la falla en el buscador (ej. *"Bag Jam"*, *"Robot Frozen"*, *"E-Stop"*).
2. **Selección de Falla:** Haz clic en la tarjeta del error correspondiente para abrir la guía detallada.
3. **Paso a Paso de Solución:** Sigue el flujo de instrucciones y descarte para desatorar, reiniciar o reparar la máquina física.
4. **Verificación de Seguridad:** Confirma cada paso bajo los protocolos indicados antes de volver a poner el equipo en marcha.

### 2.3. Soporte Asistido por Telemetría
Si necesitas diagnosticar basándote en el cliente y el robot específico:
1. En el módulo de **Asistencia**, selecciona el **Cliente** (ej. *Manifest.eco*, *Highline*) y el **Robot ID** correspondiente.
2. Accede al **Dashboard de Telemetría** interactivo del robot.
3. Analiza las alertas activas, lecturas de sensores en tiempo real y flujos recomendados para aislar el error operativo.

---

## 3. Flujo de Trabajo: MODO CAPACITACIÓN (Entrenamiento)
Este modo lo utilizan los trainees para aprender y obtener su certificación corporativa.

### 3.1. Ingreso e Identidad
1. Ingresa tu nombre y el **PIN de Sesión** activo proporcionado por tu Trainer.
   > [!NOTE]
   > El sistema normaliza nombres (mayúsculas y minúsculas). Escribir "nahum sanchez" o "Nahum Sanchez" recuperará el mismo registro e historial del participante para evitar duplicados.

### 3.2. Módulo de Evaluación
*   **Examen Teórico:** 10 preguntas de opción múltiple. Cada respuesta seleccionada muestra una **Explicación Técnica** inmediata.
*   **Examen Simulación:** Carga el visor 3D interactivo. Debes navegar por la máquina virtual, inspeccionar las anomalías físicas y registrar el reporte de falla correspondiente.

### 3.3. Encuesta de Confianza (Paso 4)
Al responder la última pregunta de cualquiera de las evaluaciones, aparecerá la pantalla de valoración:
1. Califica tu nivel de seguridad de **1 a 5 estrellas** (*¿Qué tan seguro te sientes para resolver este problema en el robot real en sitio?*).
2. Haz clic en **Ver Resultados**. Tu respuesta se guardará en la telemetría de negocio del administrador de forma automática.

### 3.4. Descarga de Reportes PDF
*   Si apruebas con **80% o más**, verás la pantalla de acreditación.
*   Haz clic en **Descargar PDF** para guardar tu certificado técnico oficial de Ultra.

---

## 4. Perfil del Trainer (Instructor)
El Trainer administra las sesiones de estudio y monitorea a su grupo asignado a través de la URL `/trainer`.

### 4.1. Creación y Cierre de Sesiones
*   **Crear Sesión:** Haz clic en *Nueva Sesión*, asigna un nombre de grupo y genera el PIN activo.
*   **Cerrar Sesión:** Finaliza la sesión cuando concluya la clase para bloquear el PIN y archivar los reportes.

### 4.2. Métricas y Filtros de Grupo
*   **Búsqueda y Filtros:** Filtra trainees por nombre, fecha (Hoy, Semana, Mes) o estatus.
*   **Estatus de Acreditación:** Monitorea la precisión y tiempos promedio del grupo.
*   **Foco de Tutoría (Rezago):** El dashboard resalta en color rojo con la leyenda **REZAGO** a alumnos con 3 o más intentos fallados.
*   **Fallas Frecuentes:** Analiza el Top 3 de fallas del simulador para saber en qué temas técnicos flaquea tu grupo.
*   **Exportar:** Descarga la base de datos en CSV compatible con Google Sheets.

---

## 5. Perfil del Administrador (Admin)
El Administrador evalúa las analíticas globales de negocio y retorno de inversión (ROI) a través de la URL `/admin` o el acceso secreto `"admin"` en la pantalla de inicio principal.

### 5.1. Analíticas de Negocio (ROI)
El panel administrativo calcula automáticamente:
*   **Horas Ahorradas:** Productividad administrativa del staff de trainers (Total de exámenes calificados automáticamente x 15 minutos).
*   **Tiempo de Ramp-up:** Velocidad de habilitación (tiempo promedio en que un trainee pasa de su 1er intento al aprobado).
*   **Nivel de Confianza:** Calificación de percepción promedio del Paso 4 (estrellas).

### 5.2. Curva de Aprendizaje
*   Compara la evolución del rendimiento por número de intento (**Intento 1 vs. Intento 2 vs. Intento 3+**) para verificar la efectividad del simulador interactivo en la asimilación de conocimientos.
