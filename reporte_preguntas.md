# Reporte Completo de Preguntas — Banco de Exámenes de Ultra Platform

Este documento recopila la clasificación de las 31 preguntas que conforman el banco de exámenes teóricos de Ultra Platform, organizadas jerárquicamente desde el nivel más simple al más complejo.

---

## 📘 Preguntas Teóricas por Categoría

### 🟢 Training 1

#### 1. (Postura - Posición inicial de operación)
* **Pregunta**: Al iniciar la operación en el simulador o robot real, ¿cuál es la postura física que debe tomar el operador para evitar desalineaciones en el tracking?
* **Opciones**:
  * [ ] Trabajar con los brazos totalmente estirados hacia el frente.
  * [ ] Operar con las manos muy pegadas al pecho y los codos flexionados.
  * [x] **Mantener una postura erguida y centrar el torso alineado con la posición física de HOME para un correcto tracking (Respuesta Correcta)**
  * [ ] Agacharse y mirar hacia el suelo para calibrar los sensores.
* **Explicación**: Para asegurar que el tracking de los brazos y el torso funcione correctamente sin descalibrar el robot, el operador debe tomar una posición erguida y centrar su torso alineado con la posición de HOME.

#### 2. (Postura - Advertencia visual de hombro)
* **Pregunta**: Durante la operación, si notas que el hombro del robot comienza a visualizarse constantemente en la pantalla operativa, ¿qué significa esto y qué riesgo representa?
* **Opciones**:
  * [ ] Significa que el robot necesita una actualización de software y se apagará en 5 minutos.
  * [x] **Significa que estás operando muy cerca del pecho, lo cual fuerza las articulaciones y puede provocar movimientos erráticos en los brazos (Respuesta Correcta)**
  * [ ] Es una señal normal que indica que el robot está operando a máxima velocidad de empaque.
  * [ ] Significa que la cámara de la cabeza perdió conexión con la red principal.
* **Explicación**: Visualizar el hombro del robot de forma persistente en la pantalla operativa indica que el operador está trabajando con las manos muy cerca de su pecho, forzando los límites articulares del robot, lo cual puede generar movimientos erráticos y pérdida de alineación.

---

### 🟢 Training 2 (Nivel Easy)

#### 1. (Seguridad - Atoramiento físico)
* **Pregunta**: Si observas un atoramiento físico, y los brazos del robot se encuentran debajo de la mesa de operación o están mal posicionados haciendo fuerza, ¿cuál es la acción correcta?
* **Opciones**:
  * [ ] Presionar el botón HOME para forzar la autorecuperación
  * [x] **Escalar e informar de inmediato al supervisor en turno para evitar daños mayores y forzado de motores (Respuesta Correcta)**
  * [ ] Tratar de mover el brazo manualmente aplicando fuerza física
  * [ ] Pausar la celda y esperar a que el robot se desatore solo
* **Explicación**: Cuando el robot está en una posición comprometida o atorado debajo de la estructura, intentar hacer HOME puede jalar la mesa y forzar los motores. Se debe avisar inmediatamente al supervisor.

#### 2. (Seguridad - Caída de impresora)
* **Pregunta**: En el Caso de Estudio 2 de seguridad, ¿cuál es el peligro principal asociado con la caída o desprendimiento de una impresora de etiquetas, de su posición?
* **Opciones**:
  * [ ] Pérdida de la conexión a internet en toda la nave
  * [x] **Provocar daños materiales al equipo y un alto riesgo de lesiones físicas al personal circundante si cae o proyecta algún objeto (Respuesta Correcta)**
  * [ ] Que el robot entre de inmediato en modo de desarrollo "held for dev"
  * [ ] Ninguno, las impresoras están diseñadas para soportar caídas repetidas
* **Explicación**: La caída de una impresora de etiquetas, no solo daña el equipo, sino que representa un grave peligro de golpe o proyección para el personal en el sitio.

#### 3. (Seguridad - Comando Home en posición comprometida)
* **Pregunta**: Si el robot está en una posición incorrecta o comprometida, ¿por qué es imperativo contactar al supervisor antes de enviar cualquier comando de Home?
* **Opciones**:
  * [ ] Porque el supervisor es el único que puede autorizar la impresión de etiquetas
  * [x] **Porque el robot puede jalar la estructura física, forzar los motores y causar daños catastróficos que requieran escalaciones mayores (Respuesta Correcta)**
  * [ ] Para verificar si las cámaras de la muñeca están calibradas
  * [ ] No es imperativo; el operador siempre debe tratar de solucionarlo solo primero
* **Explicación**: Mandar comandos de movimiento cuando el robot está mecánicamente trabado o comprometido daña los actuadores y fuerza los servomotores.

#### 4. (Seguridad - Autorización de intervención)
* **Pregunta**: ¿Quién tiene la capacidad y autorización total de intervenir directamente para resolver estas situaciones?
* **Opciones**:
  * [ ] El operador en entrenamiento (Trainee) por su cuenta
  * [x] **El supervisor en turno, quien cuenta con la capacidad para resolver para prevenir escalaciones (Respuesta Correcta)**
  * [ ] Cualquiera que pase cerca de la celda de empaque
  * [ ] Nadie, se debe esperar a que el robot se apague por software
* **Explicación**: El supervisor en turno está capacitado para actuar de forma segura ante situaciones de riesgo y evitar daños mecánicos costosos a la infraestructura.

#### 5. (Seguridad - Escenario de vibración de mesa)
* **Pregunta**: Escenario: Estás operando y el robot se atora debajo de la mesa. La mesa comienza a vibrar y a moverse ligeramente. El software te da la opción de mandar a HOME. Y tú, ¿qué harías?
* **Opciones**:
  * [ ] Presionar HOME rápidamente para ganarle al tiempo del ciclo
  * [ ] Ignorar la vibración y mandar un comando de autonomía
  * [x] **Detener todo movimiento y notificar inmediatamente al supervisor que el robot está atorado y comprometido (Respuesta Correcta)**
  * [ ] Mover el torso del robot manualmente usando el joystick
* **Explicación**: Ante cualquier vibración o atoramiento físico, no se debe intentar mover el robot sin antes avisar al supervisor en turno.

#### 6. (Seguridad - Escenario de caída de impresora)
* **Pregunta**: Escenario: Durante tus movimientos con el torso, golpeas accidentalmente la base de la impresora de etiquetas y ves que se inclina peligrosamente fuera de su base. Y tú, ¿qué harías?
* **Opciones**:
  * [ ] Continuar la operación asumiendo que no se va a caer
  * [x] **Escalar de forma imperativa la situación de riesgo al supervisor en turno antes de que caiga y dañe a alguien o al equipo (Respuesta Correcta)**
  * [ ] Esperar a que termine el turno para acomodarla
  * [ ] Empujar el robot para que la detenga con el brazo
* **Explicación**: Cualquier situación de riesgo o peligro de caída de periféricos pesados debe ser reportada de forma imperativa al supervisor de inmediato.

#### 7. (Seguridad - Escenario gripper ejerciendo fuerza)
* **Pregunta**: Escenario: El robot está fuera de su posición normal y notas que una de las pinzas (grippers) está presionando con fuerza la mesa metálica. El sistema te pide enviar un comando de reinicio de motores. Y tú, ¿qué harías?
* **Opciones**:
  * [ ] Reincorporar los motores desde el headset sin revisar la posición
  * [x] **Pausar de inmediato y pedir al supervisor que evalúe la posición antes de forzar los motores y dañar los grippers (Respuesta Correcta)**
  * [ ] Estirar el brazo del robot manualmente para destrabarlo
  * [ ] Apagar la luz de la torreta y continuar operando
* **Explicación**: Si el gripper está ejerciendo fuerza constante sobre una superficie rígida, reiniciar motores o mandar Home forzará las articulaciones del brazo.

#### 8. (Seguridad - Escenario ingreso no autorizado)
* **Pregunta**: Escenario: Observas que una persona del equipo de Warehouse o Laboratorio ingresa al área de operación o se acerca al robot. ¿Qué acción debes de tomar?
* **Opciones**:
  * [ ] Esperar a que la persona termine su ajuste y no reportar nada
  * [x] **Poner en pausa el robot de inmediato para priorizar la seguridad física y notificar al supervisor (Respuesta Correcta)**
  * [ ] Mandar al robot a HOME para que no estorbe a la persona
  * [ ] Apagar únicamente la cámara de la cabeza para no ver el incidente
* **Explicación**: La seguridad física de cualquier persona de Warehouse o Laboratorio es la máxima prioridad; se debe poner en pausa el robot de inmediato.

#### 9. (Interfaz - Brazo congelado / Arm Frozen)
* **Pregunta**: Observas que el brazo del robot se detiene a la mitad del recorrido. ¿Cuál es el primer paso a realizar en los headsets?
* **Opciones**:
  * [ ] Mandar el comando Home inmediatamente
  * [x] **Enviar el comando Fault (arm frozen) (Respuesta Correcta)**
  * [ ] Apagar la estación desde el botón de emergencia
  * [ ] Esperar 5 minutos a que se reinicie solo
* **Explicación**: Siempre se debe registrar la falla con el comando Fault antes de intentar mover el robot, para que quede registro y se evalúe si es seguro moverlo.

#### 10. (Interfaz - Impresora / Out of Labels)
* **Pregunta**: Estás en un workflow de Bagger y notas que la etiqueta sale en blanco o no sale. ¿Qué acción debes reportar en la interfaz de control?
* **Opciones**:
  * [x] **Reportar Out of Labels para alertar sobre el rollo vacío o falla de impresión (Respuesta Correcta)**
  * [ ] Reiniciar el robot inmediatamente
  * [ ] Reportar Bag Jam
  * [ ] Reportar Product Dropped
* **Explicación**: "Out of Labels" se utiliza cuando el rollo de etiquetas está vacío o la impresora presenta fallas para imprimir la guía de envío.

#### 11. (Interfaz - Caída en contenedor incorrecto)
* **Pregunta**: El robot coloca el paquete terminado en un contenedor (bin) que no corresponde a la ruta de envío. ¿Qué reporte se debe seleccionar?
* **Opciones**:
  * [ ] Product Dropped
  * [ ] Package Dropped on Floor
  * [x] **Package Dropped in Wrong Bin (Respuesta Correcta)**
  * [ ] Bin Location Adjustment Needed
* **Explicación**: "Package Dropped in Wrong Bin" se selecciona cuando el brazo robótico deposita el paquete final en un contenedor equivocado.

#### 12. (Interfaz - Contenedor de salida lleno / Package Bin Full)
* **Pregunta**: Si el contenedor de paquetes terminados listos para envío se llena por completo, ¿qué debes hacer?
* **Opciones**:
  * [x] **Seleccionar "Package Bin Full", vaciar el contenedor y continuar (Respuesta Correcta)**
  * [ ] Seleccionar "Hospital Bin Full" y cambiar de estación
  * [ ] Detener la celda con botón de emergencia y llamar a mantenimiento
  * [ ] Continuar colocando paquetes encima hasta que se caigan
* **Explicación**: "Package Bin Full" es para reportar que el contenedor de salida está a su máxima capacidad y requiere vaciado físico.

#### 13. (Interfaz - Contenedor de descarte lleno / Hospital Bin Full)
* **Pregunta**: Estás empacando y al intentar colocar un producto en la bin de rechazo (hospital bin), el producto rebota y cae porque la bin está desbordada de artículos acumulados. ¿Qué reporte debes levantar?
* **Opciones**:
  * [ ] Package Bin Full
  * [x] **Hospital Bin Full (Respuesta Correcta)**
  * [ ] Product Dropped
  * [ ] Other
* **Explicación**: "Hospital Bin Full" indica que el contenedor donde se colocan artículos defectuosos o con problemas está lleno.

#### 14. (Interfaz - Contenedor fuera de rango)
* **Pregunta**: El robot intenta depositar el paquete final, pero notas que no hay bin disponible o fue movida accidentalmente fuera de tu alcance. ¿Qué reporte debes seleccionar?
* **Opciones**:
  * [x] **Bin Location Adjustment Needed (Respuesta Correcta)**
  * [ ] Package Dropped in Wrong Bin
  * [ ] App Not Working
  * [ ] Left Arm Frozen
* **Explicación**: Se reporta "Bin Location Adjustment Needed" cuando no hay bin de depósito, el robot no lo alcanza, o el contenedor de Customer no es del color solicitado.

#### 15. (Interfaz - Pérdida de cámara de muñeca)
* **Pregunta**: Si en tu visor de control dejas de recibir la transmisión de video de la muñeca del brazo izquierdo, ¿cuál es el reporte adecuado?
* **Opciones**:
  * [ ] Head Cam Out
  * [x] **Left Wrist Cam Out (Respuesta Correcta)**
  * [ ] Left Arm Frozen
  * [ ] App Not Working
* **Explicación**: "Left Wrist Cam Out" se selecciona cuando la cámara montada en la muñeca izquierda pierde la conexión o deja de dar imagen.

#### 16. (Interfaz - Falla en pinza del robot)
* **Pregunta**: El robot intenta sujetar un artículo pero la pinza derecha no cierran ni aplican fuerza. ¿Qué debes reportar?
* **Opciones**:
  * [ ] Right Arm Frozen
  * [x] **Right Gripper Not Working (Respuesta Correcta)**
  * [ ] Left Gripper Not Working
  * [ ] Other Robot Issue
* **Explicación**: "Right Gripper Not Working" se selecciona específicamente cuando la pinza o griper del brazo derecho presenta problemas de apertura, cierre o fuerza.

#### 17. (Interfaz - Fallo de autonomía / Autonomy Not Working)
* **Pregunta**: Estás operando en modo auto y observas que el robot se queda totalmente estático. No no hay fallas mecánicas en las pinzas, ni reacciona para continuar. ¿Qué reporte debes levantar?
* **Opciones**:
  * [ ] App Not Working
  * [x] **Autonomy Not Working (Respuesta Correcta)**
  * [ ] Left Arm Frozen
  * [ ] Other Headset Issue
* **Explicación**: "Autonomy Not Working" se reporta cuando el software de autonomía del robot falla, impidiendo que tome decisiones o ejecute trayectorias de forma autónoma y proceder a documentar en el slack para verificar la continuidad del workflow o detenerse.

#### 18. (Interfaz - Falla en cámara de cabeza / Head Cam Out)
* **Pregunta**: Estás operando al robot y de repente pierdes la vista general (pantalla en negro en la cámara principal), aunque sigues viendo el video de las cámaras de las muñecas. ¿Qué reporte debes levantar?
* **Opciones**:
  * [ ] Left Wrist Cam Out
  * [ ] Right Wrist Cam Out
  * [x] **Head Cam Out (Respuesta Correcta)**
  * [ ] App Not Working
* **Explicación**: "Head Cam Out" se selecciona cuando la cámara principal ubicada en la cabeza del robot pierde señal o deja de transmitir video.

---

### 🟡 Training 3 (Nivel Medium)

#### 19. (Pinza para soporte de peso)
* **Pregunta**: Te asignan empacar una caja pesada y voluminosa en el Workflow Bagger. Para evitar que el peso venza la bolsa y asegurar que la máquina logre sellar correctamente, ¿cómo debes posicionar la pinza de soporte?
* **Opciones**:
  * [ ] Colocar la pinza a un costado del empaque
  * [ ] No utilizar la pinza y empujar el paquete manualmente
  * [x] **Colocar la pinza debajo de la bolsa para ayudar a sostener el peso (Respuesta Correcta)**
  * [ ] Colocar la pinza en la parte superior para suspender la bolsa
* **Explicación**: Para objetos de gran tamaño y pesados, colocar la pinza debajo de la bolsa ayuda con el peso del paquete y facilita que la máquina realice el cierre/sello correctamente.

#### 20. (Flujo de Bagger)
* **Pregunta**: ¿Qué workflow se opera en el robot Phil?
* **Opciones**:
  * [ ] Bolsas plásticas de rollo
  * [ ] Cajas de cartón corrugado
  * [x] **Contenedores de plástico (Totes) (Respuesta Correcta)**
  * [ ] Sobres acolchados
* **Explicación**: El robot Phil opera con el flujo de trabajo de Totes (contenedores), mientras que robots como Packie, Future y Bagger Label utilizan el workflow de Bagger.

#### 21. (Interfaz - Bagger sin bolsas / Out of Bags)
* **Pregunta**: ¿Qué debes hacer si el robot se detiene porque la Bagger se quedó sin bolsas (Out of Bags)?
* **Opciones**:
  * [ ] Apagar la máquina y reportar mantenimiento de inmediato
  * [x] **Detener el robot, mandar la fault de out of bags para que un Field Agent pueda resolver el problema (Respuesta Correcta)**
  * [ ] Forzar el reinicio del brazo robótico sin cambiar nada
  * [ ] Cambiar a operación manual y empacar sin bolsas
* **Explicación**: La opción "Out of Bags" indica que el rollo de bolsas se ha terminado y se requiere reemplazarlo por uno nuevo para que el ciclo continúe.

#### 22. (Interfaz - Bolsa atascada / Bag Jam)
* **Pregunta**: Durante la operación, y ves que una bolsa plástica se dobló y quedó atrapada entre las mordazas de sellado impidiendo que bajen. ¿Qué reporte debes levantar de inmediato en tu interfaz?
* **Opciones**:
  * [ ] Out of Bags
  * [ ] Bad Seal
  * [x] **Reportar Bag Jam (Respuesta Correcta)**
  * [ ] Other Robot Issue
* **Explicación**: "Bag Jam" es la opción específica para cuando una bolsa queda atascada en cualquier parte del mecanismo de la Bagger.

#### 23. (Interfaz - Mal sellado / Bad Seal)
* **Pregunta**: Si detectas que la bolsa de un paquete quedó arrugada, quemada o mal cerrada en los extremos (aplica a Packie, Future, Fleetwood o Bagger), ¿qué falla reportamos?
* **Opciones**:
  * [x] **Bad Seal (Respuesta Correcta)**
  * [ ] Bag Jam
  * [ ] Out of Bags
  * [ ] Product Dropped
* **Explicación**: "Bad Seal" es el fallo que indica que el sellado de la bolsa quedó abierto, quemado, arrugado o defectuoso de alguna forma.

#### 24. (Interfaz - Sin producto global / Out of Product)
* **Pregunta**: Observas que la interfaz indica jobs no available. ¿Qué fault reportarías?
* **Opciones**:
  * [ ] Hospital Bin Full
  * [x] **Out of Product (Respuesta Correcta)**
  * [ ] Bin Location Adjustment Needed
  * [ ] Head Cam Out
* **Explicación**: "Out of Product" se reporta de forma global para todos los robots cuando se agota el producto en la zona o cuando no hay batch cargada en el sistema para continuar el trabajo.

#### 25. (Interfaz - Falla imprevista / Other)
* **Pregunta**: Durante tu turno, ocurre una falla extraña: y la interfaz del visor muestra cosas no vistas en la capacitación. ¿Qué reporte debes levantar al no existir una categoría específica?
* **Opciones**:
  * [ ] Reiniciar el robot automáticamente
  * [x] **Escalar la información con el supervisor en turno para validar si se levanta reporte bajo la opción Other para documentar la falla imprevista. (Respuesta Correcta)**
  * [ ] Apagar las cámaras
  * [ ] Pausar el simulador
* **Explicación**: "Other" se reserva para fallas y problemas imprevistos que no coinciden con ninguna de las opciones específicas provistas en el menú.

---

### 🔴 DC (Nivel Hard)

#### 26. (Phil - Producto no escaneado)
* **Pregunta**: Te encuentras operando en el robot Phil, recibes el error de "Producto no escaneado". ¿Qué debes hacer con el producto?
* **Opciones**:
  * [ ] Tirarlo a la basura
  * [ ] Empacarlo de todos modos
  * [x] **Apartar el producto y regresarlo al rack para revisión del cliente (Respuesta Correcta)**
  * [ ] Forzar el escáner y continuar
* **Explicación**: El producto debe apartarse para revisión posterior; el operador no debe tomar la decisión final.

#### 27. (Phil - Decisión de bolsa)
* **Pregunta**: Estás operando el robot Phil y ves que el tote tiene 7 productos. Al prepararte para el empaque, ¿qué decisión de sobrebolsas debes tomar?
* **Opciones**:
  * [ ] Colocarlos todos en una bolsa pequeña para ahorrar espacio
  * [x] **Elegir la bolsa de mayor tamaño disponible para el tote (Respuesta Correcta)**
  * [ ] Dividir el pedido en 2 bolsas pequeñas diferentes
  * [ ] Reportar Out of Product y esperar asistencia
* **Explicación**: De acuerdo con el consejo de operación del robot Phil, si el tote contiene 6 productos o más se ocupa la bolsa de mayor tamaño, y si tiene 5 productos o menos se ocupa la bolsa pequeña (medida estándar).

#### 28. (Phil - Falla en orden/impresión)
* **Pregunta**: Si tienes un problema con la orden en el robot Phil, no se imprime la etiqueta y continúa solicitando otro producto), ¿cuál es el procedimiento correcto?
* **Opciones**:
  * [ ] Dejar el tote abajo en el rack y esperar a que el robot se autocorrige
  * [x] **Ingresar todo al mismo tote, dejarlo arriba en el rack, levantar un pick fault, seleccionar order package y presionar "FAIL JOB" (Respuesta Correcta)**
  * [ ] Retirar los productos del tote y colocarlos de nuevo en el rack principal
  * [ ] Apagar la estación inmediatamente para detener el flujo
* **Explicación**: Ante problemas con la orden en el robot Phil, se debe ingresar todo al mismo tote y dejarlo en la parte de hasta arriba del rack. Luego, se levanta un pick fault, seleccionas order package y después presionas "FAIL JOB".

#### 29. (Simulación - Bolsa fuera de posición)
* **Pregunta**: En la Bagger, una bolsa queda fuera de posición. ¿Qué deberías de hacer?
* **Opciones**:
  * [ ] Cancelar el pedido y esperar instrucciones
  * [ ] Detener el proceso en donde esté, mandar el robot a posición de HOME
  * [x] **Retirar la bolsa, colocarla en la hospital bin (cambia según el workflow de posición), mandar el reprint label para que genere una nueva reimpresión del pedido en ese momento no terminado (Respuesta Correcta)**
  * [ ] Nada, continuar con el pedido
* **Explicación**: Se debe de retirar la bolsa y colocar en la hospital bin, mandar el reprint label que es el botón amarillo en la UI y continuar con el pedido, esto es por que si está fuera de posición, no va a cerrar la bolsa.

#### 30. (Simulación - Packie bolsa cerrada sin aire)
* **Pregunta**: Estás operando Packie y notas que el robot intenta colocar el producto pero la bolsa arrojada por la Bagger está completamente cerrada debido a falta de aire. ¿Qué debes hacer físicamente?
* **Opciones**:
  * [ ] Volver a reiniciar la estación robótica
  * [x] **Realizar un movimiento vertical de arriba a abajo con la bolsa para forzar que entre el aire en la posición correcta (Respuesta Correcta)**
  * [ ] Soplar manualmente dentro del área de la Bagger
  * [ ] Marcar la bolsa como defectuosa en el sistema y desecharla
* **Explicación**: De acuerdo con las pautas de operación, realizar un movimiento vertical de arriba a abajo obliga a que entre el aire en la posición correcta para que la bolsa se abra y proceder a ingresar la batch correspondiente.

---

### 🔴 Customer (Nivel Hard)

#### 31. (Interfaz - Bolsa atascada / Bag Jam)
* **Pregunta**: Durante la operación, y ves que una bolsa plástica se dobló y quedó atrapada en la barra de sellado impidiendo que salga o corte. ¿Qué reporte debes hacer?
* **Opciones**:
  * [ ] Arrancar la bolsa y darle reimprimir.
  * [ ] Bad Seal. Ya que no se puede continuar operando.
  * [x] **Intentar recuperar la falla haciendo el procedimiento de el display de la bagger. En caso de que siga sin salir reportar Bag Jam (Respuesta Correcta)**
  * [ ] Other Robot Issue
* **Explicación**: Primero debes de verificar el display de la bagger, dar clic en el error para que se borre y proceder a arrancar la bolsa, mandar el reprint label (boton color amarillo) y validar si ya salen las bolsas correctamente. "Bag Jam" es la opción específica para cuando una bolsa queda atascada en cualquier parte del mecanismo de la Bagger. En caso de que siga sin salir deberías de reportar Bag Jam.
