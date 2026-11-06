# Diseño de los tres juegos web

## Marco común

Dron Guardián es un juego 2D educativo en Canvas 2D con mapa abstracto de celdas, no un mapa real de Sachapera. No es una guía operativa, un sistema de alerta ni una predicción de incendios. Las reglas son demostrativas y no sustituyen protocolos ni entrenamiento certificado.

Los tres juegos comparten el piloto, el movimiento con WASD/flechas, navegación por clic o toque, descarga con Espacio, recarga con R cuando el modo la permite, botón de finalizar, pantalla completa, controles táctiles y una evaluación al terminar. Cada experiencia administra su propio reloj, mapa, HUD y condición de victoria/derrota. Reiniciar crea una partida nueva sin estado, agua ni temporizadores heredados.

## Reconocimiento: explorar y detectar

- **Clave:** `recon`.
- **Duración:** 45 segundos, propuesta de diseño.
- **Mapa:** cuadrícula abstracta de 24 x 16. Al inicio solo se ve el entorno de la base; el resto permanece cubierto por niebla. Los focos y el punto de entrada existen en posiciones separadas del estado visible.
- **Mecánica:** el dron tiene batería que disminuye al volar y un radio de escaneo. Las celdas se descubren al entrar en rango. El viento y el punto de entrada se revelan al escanear las zonas que los contienen.
- **Marcado:** clic/tap sobre una celda descubierta o tecla M marca/desmarca un foco sospechoso. Un acierto suma; una falsa alarma resta. Las marcas se pueden corregir antes de terminar.
- **Agua:** una sola descarga de práctica muestra el alcance; no extingue ni decide la victoria.
- **Victoria:** marcar correctamente al menos 2/3 focos antes de agotar tiempo o batería.
- **Derrota:** batería agotada lejos de la base antes de alcanzar el mínimo; el tiempo agotado sin el mínimo también termina en derrota.
- **HUD:** batería, porcentaje explorado, marcas correctas/total descubierto, tiempo, carga de agua de práctica.
- **Evaluación:** informa focos identificados, falsas alarmas, cobertura explorada y si se reservó batería para volver.
- **Aprendizaje:** observar antes de actuar, recorrer sectores con intención y planificar el regreso.
- **Límite mostrado:** niebla y escaneo son abstracciones; el mapa no es geográfico y los focos no son observaciones reales.

Un bot puede ganar escaneando sectores y marcando las posiciones reveladas; puede perder agotando batería en un extremo del mapa.

## Viento cambiante: contener y anticipar

- **Clave:** `wind`.
- **Duración:** 45 segundos, propuesta de diseño.
- **Mapa:** tablero propio de 24 x 16 celdas visibles, con incendio inicial en el oeste y zona protegida en el este.
- **Mecánica:** autómata celular visible. El fuego se expande a celdas vecinas con probabilidad didáctica sesgada por el viento. El jugador no persigue focos: descarga sobre celdas para dejar una barrera temporal que frena nuevas igniciones en esas celdas.
- **Viento:** rota entre direcciones predefinidas. Cada cambio avisa con cuenta regresiva de 5 segundos e indicador de dirección futura; las barreras vencen y requieren reconsiderar su ubicación.
- **Agua:** reserva limitada; cada descarga crea una línea corta de celdas húmedas. La recarga solo se realiza en la base y consume tiempo de vuelo de ida/vuelta.
- **Victoria:** la zona protegida permanece sin fuego durante todo el reloj.
- **Derrota:** cualquier celda de la zona protegida se enciende.
- **HUD:** dirección actual/próxima del viento, cuenta regresiva, agua, celdas quemadas y estado de la zona.
- **Evaluación:** explica el estado de la zona, los cambios de viento atendidos, barreras útiles y reserva de agua.
- **Aprendizaje:** el viento altera la prioridad; una barrera útil al inicio puede quedar mal orientada después.
- **Límite mostrado:** propagación, viento y barreras son probabilísticos y sintéticos; no representan condiciones ambientales reales.

Un bot puede ganar conteniendo las celdas del corredor hacia la zona y reajustando tras avisos; puede perder dejando avanzar fuego hasta la zona.

## Interfaz comunidad-monte: priorizar y proteger

- **Clave:** `interface`.
- **Duración:** 50 segundos, propuesta de diseño.
- **Mapa:** tablero distinto, con comunidad de viviendas al centro/este, base al oeste, camino principal entre ambos y frentes por lados diferentes.
- **Mecánica:** gestionar prioridades. Hay tres viviendas con estados `segura`, `amenazada` y `afectada`. Las descargas enfrían un foco/celda seleccionada temporalmente; el agua es muy limitada y hay una sola recarga en base.
- **Eventos:** un frente secundario aparece a mitad de partida; un foco distante amenaza el camino. El juego muestra avisos de amenaza antes de resolver el daño.
- **Camino:** el frente puede cortarlo. Si queda cortado mientras el dron está fuera de la base, la misión se pierde.
- **Victoria:** terminar el tiempo conservando al menos dos viviendas seguras y el camino abierto.
- **Derrota:** quedan afectadas la mayoría de las viviendas, o se corta el camino mientras el dron está fuera de base.
- **HUD:** lista de viviendas y estado, camino, agua, recargas, amenazas próximas y ubicación del dron respecto de base.
- **Evaluación:** cuenta viviendas protegidas/afectadas, estado final del camino, prioridades atendidas y agua reservada para la retirada.
- **Aprendizaje:** priorizar personas y rutas por encima del tamaño visual del foco; conservar reserva para regresar.
- **Límite mostrado:** viviendas, accesos y focos son símbolos abstractos, no infraestructura ni protocolos reales.

Un bot puede ganar atendiendo primero el corredor de la comunidad y el camino; puede perder ignorando amenazas hasta afectar dos viviendas o cortar la ruta con el dron fuera.

## Cambios frente al juego anterior

El juego anterior utilizaba el mismo ciclo de persecución y descarga para todos los modos, variando principalmente duración, cantidad de focos, propagación y recursos. El nuevo diseño reemplaza esos escenarios parametrizados por tres bucles distintos: exploración con niebla y marcado, contención con barreras de agua y gestión de prioridades comunitarias. Se eliminan del juego web los estados y textos de los modos anteriores que no forman parte de estas tres experiencias.

Los archivos `data/recon.conf`, `data/wind.conf` y `data/interface.conf` no controlan el juego web. Continúan representando tamaños de carga sintéticos del motor C, sobre su malla fija de 24 x 16.
