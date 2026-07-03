# Base de Conocimientos Central (Troubleshooting)

Esta es la información de nuestra base de datos local que se usa para alimentar a la IA y que ahora servirá para el **Buscador de Respaldo (Fallback)**. Las palabras clave han sido optimizadas e incluyen ahora todos los consejos operativos por robot.

| ID | Síntoma (Symptom) | Palabras Clave (Keywords) |
|---|---|---|
| ERR-KIN-001 | El hombro del robot comienza a visualizarse en la pantalla operativa / pérdida de alineación | hombro shoulder visible veo el hombro pantalla camara alineacion perdida desalineado fuera de rango posicion mala |
| ERR-ROB-007 | Falla de brazos: Uno o ambos brazos del robot se quedan congelados, no responden a comandos o se mueven de forma errática. | brazo brazo izquierdo brazo derecho congelado frozen arm no mueve no responde erratico trabado atorado bloqueado left arm right arm un solo brazo |
| ERR-ROB-008 | Falla de grippers (pinzas): El gripper no abre, no cierra o no tiene fuerza de agarre. | gripper pinza pinzas dedos no agarra no abre no cierra sin fuerza agarre suelto flojo left gripper right gripper mano se cae suelta |
| ERR-ROB-009 | Falla de cámaras: Pérdida de señal de video o interferencia en la retroalimentación visual del robot. | camara camaras sin video perdida señal interferencia negro pantalla negra head cam wrist cam out cabeza muñeca imagen congelada no veo nada visual no sirve |
| ERR-ROB-010 | Falla de cuello: El cuello del robot no puede girar, está rígido o se atascó al intentar seguir visualmente un punto. | cuello neck rigido no gira atascado bloqueado neck frozen no voltea cabeza trabada no puedo mirar no muevo la vista |
| ERR-ROB-011 | Falla en chest (pecho): El torso o pecho del robot se encuentra congelado o dejó de moverse/rotar completamente. | pecho torso chest frozen cintura congelado no rota no gira bloqueado tronco sin movimiento robot tieso del cuerpo |
| ERR-ROB-012 | Robot no se mueve: El robot se mantiene completamente estático y no responde a ningún comando de movimiento autónomo o manual. | robot estatico no responde no mueve nada funciona autonomy not working congelado total sin reaccion parado quieto bloqueado muerto paralizado |
| ERR-MEC-002 | Qué hacer en caso de que el objeto sea cilíndrico | objeto cilindrico lata botella producto redondo tubo resbala rueda se cae de las pinzas dificil agarrar no lo puedo tomar |
| ERR-MEC-013 | Qué hacer en caso de que un objeto se caiga | objeto caido tirado en piso se cayo se me cayo paquete caido dropped item product dropped piso suelo caer recojer item |
| ERR-MEC-014 | Qué hacer en caso de que no imprima la etiqueta (Bagger / Impresora Integrada) | etiqueta no imprime no sale label bagger fallo de impresion impresora integrada out of labels sin etiqueta no saca etiqueta bagger label error de bolsa |
| ERR-MEC-016 | Qué hacer en caso de que la impresora de etiquetas (pegado manual) no saque la etiqueta | impresora manual pegado manual etiqueta no sale pedal amarillo boton amarillo reprint label pausa led luz pausada no imprime etiqueta atorada |
| ERR-NET-003 | Alta latencia, congelamiento intermitente de cámaras o pérdida crítica de paquetes | latencia alta ping alto internet lento camara congelada delay retraso perdida paquetes red inestable lag conexion falla wifi malo network slow latency packet loss |
| ERR-SW-004 | Qué hacer en caso de que el robot no se mueva (no se mueve en teleop pero sí en auto) | teleop no mueve modo manual control manual joystick no funciona no responde solo auto funciona mueve en auto pero no teleop |
| ERR-SW-005 | El robot muestra el aviso o estado de sistema 'held for software dev' | held for software dev cartel desarrollo bloqueado por desarrollo reservado dev aviso software mensaje pantalla no disponible lukas kyle malcolm |
| ERR-SEC-006 | Incursión de personal o Warehouse Representative en el espacio de trabajo físico del robot | persona en celda intruso espacio trabajo incursion intrusion alguien entro warehouse rep personal ajeno seguridad hombre en area seguridad riesgo |
| ERR-BAG-001 | La bagger escupe de forma abrupta la bolsa o no imprime más (Out of Bags) | bagger sin bolsas out of bags tira bolsas no saca bolsa escupe bolsa repetido se acabaron bolsas rollo vacio no dispensa no embolsa bolsa agotada tira basura |
| ERR-BAG-002 | Bolsa atascada en Bagger (Bag Jam) | bag jam bolsa atascada trabada atorada machucada bagger bolsa prensada atoron atasco mecanismo bloqueado |
| ERR-BAG-003 | Bolsa arrugada, quemada o mal sellada en los extremos (Bad Seal) | bad seal bolsa arrugada quemada derretida mal sellada sello malo rota abierta sellado incorrecto bolsa defectuosa bagger sello despegada |
| ERR-BIN-001 | Robot deposita el paquete terminado en un contenedor equivocado (Package Dropped in Wrong Bin) | bin equivocado contenedor incorrecto cajon mal canasta mala paquete mal lugar wrong bin paquete ruta incorrecta deposito erroneo tire paquete mal |
| ERR-BIN-002 | El contenedor de paquetes terminados listos para envío está lleno (Package Bin Full) | bin lleno canasta llena cesto rebosa contenedor lleno desborda package bin full no caben mas paquetes salida llena ya no cabe |
| ERR-BIN-003 | El contenedor de artículos rechazados o defectuosos está lleno (Hospital Bin Full) | hospital bin lleno contenedor defectuosos caja mermas rechazados lleno descarte lleno hospital bin full canasta rota llena |
| ERR-BIN-004 | Alineación incorrecta del robot con el bin físico o necesidad de reubicar contenedores (Bin Location Adjustment Needed) | bin mal alineado chueco contenedor fuera lugar movido reubicacion ajuste bin location adjustment needed contenedor desplazado no atina al bin |
| ERR-PRO-001 | Falta de productos en la zona de alimentación (Out of Product) - Global | out of product sin productos no hay cajas no hay producto vacio zona alimentacion vacia no job available no active batch lote vacio sin lote sin trabajo banda vacia sin insumo |
| ERR-SW-006 | La aplicación en el visor/headset se congela, se cierra inesperadamente o no responde (App Not Working) | app no funciona aplicacion se cierra gafas bug crashea se congela headset meta quest visor no responde app not working reiniciar app app muerta |
| ERR-KIN-003 | Cómo utilizar el modo AUTO | modo auto autonomo como activo automatico autonomia como usar activar auto boton a joystick letra a control autonomo automatico |
| ERR-MEC-015 | Retiro correcto de etiquetas (labels) del gripper | etiqueta pegada label pegada gripper pinza sucia quitar etiqueta retirar label adherida bagger raspar como quito pegatina |
| ERR-PED-001 | No aparece el botón de los pedales / No tengo activos los pedales | pedal no aparece pie boton pedal inactivos sin pedales boton pedal no sale workflow falta pedal pedal desactivado no sirve pie |
| ERR-ROB-013 | El workflow solicita escanear el producto pero indica que el producto no ha sido encontrado (Aplica solo para robots Mabel y Fleetwood) | escanear producto lector no encontrado scan not found skip verificacion saltar scan pedal amarillo mabel fleetwood barcode codigo barras no lee |
| ERR-BAG-004 | La embolsadora no está sellando bien / falla de sellado en bolsa (Aplica solo para robot Monty) | monty embolsadora mala maquina bolsas sello malo no sella bien bad seal bolsa mal sellada altura bolsa ajuste sellado fail job |
| packie-2.0__1 | Consejo Operativo para manifest.eco | manifest.eco consejo tip recomendacion operativo |
| packie-2.0__2 | Consejo Operativo para manifest.eco | manifest.eco consejo tip recomendacion operativo |
| packie-2.0__3 | Consejo Operativo para manifest.eco | manifest.eco consejo tip recomendacion operativo |
| packie-2.0__4 | Consejo Operativo para manifest.eco | manifest.eco consejo tip recomendacion operativo |
| packie-2.0__5 | Consejo Operativo para manifest.eco | manifest.eco consejo tip recomendacion operativo |
| packie-2.0__6 | Consejo Operativo para manifest.eco | manifest.eco consejo tip recomendacion operativo |
| packie-2.0__7 | Consejo Operativo para manifest.eco | manifest.eco consejo tip recomendacion operativo |
| future-2.0__1 | Consejo Operativo para Future 2.0 | future 2.0 consejo tip recomendacion operativo |
| future-2.0__2 | Consejo Operativo para Future 2.0 | future 2.0 consejo tip recomendacion operativo |
| future-2.0__3 | Consejo Operativo para Future 2.0 | future 2.0 consejo tip recomendacion operativo |
| future-2.0__4 | Consejo Operativo para Future 2.0 | future 2.0 consejo tip recomendacion operativo |
| future-2.0__5 | Consejo Operativo para Future 2.0 | future 2.0 consejo tip recomendacion operativo |
| future-2.0__6 | Consejo Operativo para Future 2.0 | future 2.0 consejo tip recomendacion operativo |
| future-2.0__7 | Consejo Operativo para Future 2.0 | future 2.0 consejo tip recomendacion operativo |
| captain-pack-sparrow__1 | Consejo Operativo para Captain Pack Sparrow | captain pack sparrow consejo tip recomendacion operativo |
| captain-pack-sparrow__2 | Consejo Operativo para Captain Pack Sparrow | captain pack sparrow consejo tip recomendacion operativo |
| captain-pack-sparrow__3 | Consejo Operativo para Captain Pack Sparrow | captain pack sparrow consejo tip recomendacion operativo |
| packasaurus__1 | Consejo Operativo para Packasaurus | packasaurus consejo tip recomendacion operativo |
| packasaurus__2 | Consejo Operativo para Packasaurus | packasaurus consejo tip recomendacion operativo |
| packasaurus__3 | Consejo Operativo para Packasaurus | packasaurus consejo tip recomendacion operativo |
| packasaurus__4 | Consejo Operativo para Packasaurus | packasaurus consejo tip recomendacion operativo |
| packasaurus__5 | Consejo Operativo para Packasaurus | packasaurus consejo tip recomendacion operativo |
| packasaurus__6 | Consejo Operativo para Packasaurus | packasaurus consejo tip recomendacion operativo |
| fleetwood-pack__1 | Consejo Operativo para Packemon | packemon consejo tip recomendacion operativo |
| fleetwood-pack__2 | Consejo Operativo para Packemon | packemon consejo tip recomendacion operativo |
| fleetwood-pack__3 | Consejo Operativo para Packemon | packemon consejo tip recomendacion operativo |
| fleetwood-pack__4 | Consejo Operativo para Packemon | packemon consejo tip recomendacion operativo |
| fleetwood-pack__5 | Consejo Operativo para Packemon | packemon consejo tip recomendacion operativo |
| fleetwood-pack__6 | Consejo Operativo para Packemon | packemon consejo tip recomendacion operativo |
| fleetwood-pack__7 | Consejo Operativo para Packemon | packemon consejo tip recomendacion operativo |
| phil__1 | Consejo Operativo para Phil | phil consejo tip recomendacion operativo |
| phil__2 | Consejo Operativo para Phil | phil consejo tip recomendacion operativo |
| phil__3 | Consejo Operativo para Phil | phil consejo tip recomendacion operativo |
| phil__4 | Consejo Operativo para Phil | phil consejo tip recomendacion operativo |
| phil__5 | Consejo Operativo para Phil | phil consejo tip recomendacion operativo |
| phil__6 | Consejo Operativo para Phil | phil consejo tip recomendacion operativo |
| phil__7 | Consejo Operativo para Phil | phil consejo tip recomendacion operativo |
| mercury__1 | Consejo Operativo para Outerspace | outerspace consejo tip recomendacion operativo |
| mercury__2 | Consejo Operativo para Outerspace | outerspace consejo tip recomendacion operativo |
| mercury__3 | Consejo Operativo para Outerspace | outerspace consejo tip recomendacion operativo |
| mercury__4 | Consejo Operativo para Outerspace | outerspace consejo tip recomendacion operativo |
| venus__1 | Consejo Operativo para Venus | venus consejo tip recomendacion operativo |
| venus__2 | Consejo Operativo para Venus | venus consejo tip recomendacion operativo |
| venus__3 | Consejo Operativo para Venus | venus consejo tip recomendacion operativo |
| venus__4 | Consejo Operativo para Venus | venus consejo tip recomendacion operativo |
| mabel__1 | Consejo Operativo para Mountainy | mountainy consejo tip recomendacion operativo |
| mabel__2 | Consejo Operativo para Mountainy | mountainy consejo tip recomendacion operativo |
| mabel__3 | Consejo Operativo para Mountainy | mountainy consejo tip recomendacion operativo |
| monty__1 | Consejo Operativo para Monty | monty consejo tip recomendacion operativo |
| monty__2 | Consejo Operativo para Monty | monty consejo tip recomendacion operativo |
| monty__3 | Consejo Operativo para Monty | monty consejo tip recomendacion operativo |
| monty__4 | Consejo Operativo para Monty | monty consejo tip recomendacion operativo |
| box-fold__1 | Consejo Operativo para Internal | internal consejo tip recomendacion operativo |
| box-fold__2 | Consejo Operativo para Internal | internal consejo tip recomendacion operativo |
| tower-stack-unstack__1 | Consejo Operativo para Tower Stack/Unstack | tower stack/unstack consejo tip recomendacion operativo |
| tower-stack-unstack__2 | Consejo Operativo para Tower Stack/Unstack | tower stack/unstack consejo tip recomendacion operativo |
| tower-stack-unstack__3 | Consejo Operativo para Tower Stack/Unstack | tower stack/unstack consejo tip recomendacion operativo |
| pick-sort__1 | Consejo Operativo para Pick Sort | pick sort consejo tip recomendacion operativo |
| bagger-label__1 | Consejo Operativo para Tote | tote consejo tip recomendacion operativo |
| bagger-label__2 | Consejo Operativo para Tote | tote consejo tip recomendacion operativo |
| bagger-label__3 | Consejo Operativo para Tote | tote consejo tip recomendacion operativo |
| bagger-label__4 | Consejo Operativo para Tote | tote consejo tip recomendacion operativo |
| bagger-label__5 | Consejo Operativo para Tote | tote consejo tip recomendacion operativo |
| bagger-label__6 | Consejo Operativo para Tote | tote consejo tip recomendacion operativo |
| siemens__1 | Consejo Operativo para SIEMENS | siemens consejo tip recomendacion operativo |
| msqc__1 | Consejo Operativo para Missouri Star | missouri star consejo tip recomendacion operativo |
| buddy__1 | Consejo Operativo para Shipcube | shipcube consejo tip recomendacion operativo |
| max__1 | Consejo Operativo para Max | max consejo tip recomendacion operativo |
| mojo__1 | Consejo Operativo para Mojo | mojo consejo tip recomendacion operativo |
