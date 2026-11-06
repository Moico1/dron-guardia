# Reporte final para PDF: Dron Guardián

## 1. Datos del proyecto

- **Proyecto:** Dron Guardián
- **Asignatura:** TEL-420 Sistemas Paralelos
- **Docente:** Ing. Elias Cassal Baldiviezo
- **Repositorio:** https://github.com/Moico1/dron-guardia
- **Fecha de preparación:** 2026-11-06
- **Hash del último commit previo a este reporte:** `174bbe9` (cierre de evidencia y demostración del Hito 2). El commit que agrega este documento se informa en el cierre de Git; un documento no puede contener el hash de su propio commit sin crear una referencia circular.
- **Equipo medido:** Linux, `nproc=4`, `MemTotal=12258180 kB` (aprox. 11,69 GiB), según `/proc` y los CSV versionados. No es la Dell OptiPlex 7010 del laboratorio.

## 2. Resumen en 6 líneas

Dron Guardián combina un motor C de simulación con tres experiencias web educativas de incendios sintéticos.
El motor compara una versión serial, una paralela con OpenMP y otra con MPI.
Las pruebas conservaron la misma firma serial/OpenMP/MPI y `make verify` produjo 6765 impactos.
El clúster de contenedores tiene master y dos workers, con red bridge, nombres y SSH probados.
Se midieron rendimiento y memoria en un host de cuatro CPUs visibles, no en la computadora oficial del laboratorio.
Faltan medir en la OptiPlex, verificar bots/reinicios/FPS del juego en navegador, consultar al docente y hacer push.

## 3. Tabla de cumplimiento

| Requisito | Estado | Evidencia comprobada |
|---|---|---|
| Hito 1: problema regional (Gran Chaco, Sachapera, Yacuiba) | Parcial | `docs/hito1-perfil-tecnico.md` menciona el Gran Chaco y Sachapera/Yacuiba como contexto, no como mapas reales. Falta respaldar el contexto con fuentes regionales verificadas. |
| Hito 1: modelo matemático de autómata celular | Cumple | `src/include/fire_model.h`: malla fija 24x16, pasos discretos, probabilidad por terreno/dirección, estado local por escenario. Perfil en `docs/hito1-perfil-tecnico.md`. |
| Hito 1: arquitectura de clúster | Cumple | `infrastructure/compose.yaml`: master + worker1 + worker2, red bridge; `make cluster-test` pasó SSH y MPI distribuido. |
| Hito 2 - 3.1: un master y dos workers, arranque de un comando | Cumple | `make cluster-up`; `docker compose -f infrastructure/compose.yaml ps` mostró los tres contenedores activos. |
| Hito 2 - 3.2: bridge y resolución de nombres | Cumple | `make cluster-test`; Compose declara `driver: bridge`; `getent hosts` resolvió master, worker1 y worker2. |
| Hito 2 - 3.3: SSH sin contraseña | Cumple | `make cluster-test`; SSH remoto devolvió `worker1` y `worker2` sin solicitud de contraseña. |
| Hito 2 - 3.4: gcc/g++, OpenMP y MPI smoke tests | Cumple | GCC/G++ 13.3.0, Open MPI 4.1.6; `make smoke-omp` dio `OPENMP_SMOKE_OK hilos=4`; clúster: `MPI_SMOKE_OK rank=0..2 size=3`. |
| Hito 2 - 3.5: referencia serial, correctitud en los tres modos y memoria | Cumple | `make verify`: 20.000 simulaciones, semilla 20261104, 6765 impactos. `make verify-modes`: `VERIFY_MODES_OK`. Memoria en `data/memory_modes.csv`. |
| Hito 2 - 3.6: primera versión paralela | Cumple | `src/parallel/fire_omp.c`, `src/parallel/fire_mpi.c`; `make verify` y `make cluster-test` pasaron. |
| Hito 2 - 3.7: estructura del repositorio | Cumple | Hay contenido en `src/`, `infrastructure/`, `data/`, `scripts/` y `docs/`. |
| Hito 2 - 3.8: README con clonación, arranque, scripts y juego | Cumple | `README.md` incluye URL, `make cluster-up`, pruebas y `python3 -m http.server 8765`. Clon local limpio compiló y pasó pruebas. |
| Demostración técnica | Parcial | `scripts/demo_completa.sh` se ejecutó hasta `DEMO_COMPLETA_OK` en 19,92 s sin pausas. Es duración de automatización, no exposición humana de diez minutos. El guion de 10 minutos está en `docs/hito2-checklist.md`. |

## 4. Lo que no aplica por ser un juego

- **N1:** No se paraleliza el juego web; corre dentro del navegador, usa `Math.random` y sus modos son ejercicios didácticos, no el motor de cómputo evaluado.
- **N2:** No se mide speedup del juego; los tiempos de interfaz y animación no representan el rendimiento del motor C.
- **N3:** El clúster ejecuta el motor C serial/OpenMP/MPI; la página web es una experiencia independiente y no invoca esos binarios.

## 5. Resultados medidos

Todas las mediciones de rendimiento se tomaron con el clúster Docker detenido, diez repeticiones por variante, en Linux con `nproc=4` y `MemTotal=12258180 kB`. El host NO es la Dell OptiPlex 7010. Los datos completos de las diez repeticiones (mediana, mínimo, máximo y desviación estándar poblacional) están en `data/performance_modes.csv`; el resumen con speedup/eficiencia está en `data/performance_summary.csv`.

### Correctitud por modo

| Modo | Simulaciones | Semilla | Serial = OpenMP = MPI (firma de salida) |
|---|---:|---:|---|
| recon | 5000 | 20261104 | `5000,1687,20261104,-1` |
| wind | 20000 | 20261105 | `20000,6794,20261105,-1` |
| interface | 50000 | 20261106 | `50000,16961,20261106,-1` |

`make verify` es una verificación aparte: 20000 simulaciones, semilla `20261104`, serial/OpenMP/MPI dieron `incendios=6765`.

### Tiempo, speedup y eficiencia

Tiempos en segundos; `T1` es la mediana serial del mismo modo. Speedup = `T1 / Tp`; eficiencia = `speedup / trabajadores`. Se muestra el host medido: 4 CPUs visibles, 12258180 kB RAM, distinto de OptiPlex 7010.

| Modo | Variante | Trabajadores | Mediana s | Speedup | Eficiencia |
|---|---|---:|---:|---:|---:|
| recon | serial (T1) | 1 | 0.128505 | 1.000000 | 1.000000 |
| recon | OpenMP | 1 | 0.125609 | 1.023056 | 1.023056 |
| recon | OpenMP | 2 | 0.067189 | 1.912590 | 0.956295 |
| recon | OpenMP | 4 | 0.075373 | 1.704921 | 0.426230 |
| recon | OpenMP | 8 | 0.060066 | 2.139397 | 0.267425 |
| recon | MPI | 1 | 0.136524 | 0.941263 | 0.941263 |
| recon | MPI | 2 | 0.072194 | 1.779996 | 0.889998 |
| recon | MPI | 3 | 0.051861 | 2.477874 | 0.825958 |
| wind | serial (T1) | 1 | 0.531481 | 1.000000 | 1.000000 |
| wind | OpenMP | 1 | 0.505598 | 1.051193 | 1.051193 |
| wind | OpenMP | 2 | 0.249119 | 2.133442 | 1.066721 |
| wind | OpenMP | 4 | 0.250809 | 2.119067 | 0.529767 |
| wind | OpenMP | 8 | 0.181507 | 2.928157 | 0.366020 |
| wind | MPI | 1 | 0.534239 | 0.994838 | 0.994838 |
| wind | MPI | 2 | 0.277093 | 1.918060 | 0.959030 |
| wind | MPI | 3 | 0.163537 | 3.249913 | 1.083304 |
| interface | serial (T1) | 1 | 1.269745 | 1.000000 | 1.000000 |
| interface | OpenMP | 1 | 1.224413 | 1.037023 | 1.037023 |
| interface | OpenMP | 2 | 0.593359 | 2.139927 | 1.069964 |
| interface | OpenMP | 4 | 0.523478 | 2.425594 | 0.606398 |
| interface | OpenMP | 8 | 0.434856 | 2.919921 | 0.364990 |
| interface | MPI | 1 | 1.355125 | 0.936995 | 0.936995 |
| interface | MPI | 2 | 0.677752 | 1.873466 | 0.936733 |
| interface | MPI | 3 | 0.401485 | 3.162621 | 1.054207 |

### Repeticiones de wind

Los valores siguientes son diez repeticiones por fila. Min, max y desviación están en segundos. Hardware: mismo host de cuatro CPUs visibles, no OptiPlex 7010.

| Variante | Trabajadores | Mediana | Mínimo | Máximo | Desviación |
|---|---:|---:|---:|---:|---:|
| Serial | 1 | 0.531481 | 0.455299 | 0.632030 | 0.053120 |
| OpenMP | 1 | 0.505598 | 0.457610 | 0.561914 | 0.034385 |
| OpenMP | 2 | 0.249119 | 0.232599 | 0.273968 | 0.016393 |
| OpenMP | 4 | 0.250809 | 0.130466 | 0.262034 | 0.056117 |
| OpenMP | 8 | 0.181507 | 0.161730 | 0.225076 | 0.017642 |
| MPI | 1 | 0.534239 | 0.475935 | 0.671012 | 0.046465 |
| MPI | 2 | 0.277093 | 0.264373 | 0.304494 | 0.011507 |
| MPI | 3 | 0.163537 | 0.157509 | 0.249616 | 0.029511 |

### Huella de memoria

RSS máximo de proceso, en KiB, medido con `/usr/bin/time -v`. Para MPI se midió cada rank por separado; `max rank` es el pico individual más alto y `suma RSS` suma el pico reportado por cada rank. La suma puede contar páginas compartidas más de una vez. Hardware: 4 CPUs visibles y 12258180 kB RAM, no la OptiPlex 7010.

| Modo | Variante | Trabajadores | RSS proceso / max rank KiB | Suma RSS ranks KiB |
|---|---|---:|---:|---:|
| recon | Serial | 1 | 1708 | 1708 |
| recon | OpenMP | 1/2/4/8 | 1960 / 1976 / 2104 / 2072 | No aplica |
| recon | MPI | 1 | 15852 | 15852 |
| recon | MPI | 2 | 16012 | 31976 |
| recon | MPI | 3 | 16056 | 47820 |
| wind | Serial | 1 | 1704 | 1704 |
| wind | OpenMP | 1/2/4/8 | 1916 / 1916 / 2088 / 2088 | No aplica |
| wind | MPI | 1 | 15824 | 15824 |
| wind | MPI | 2 | 16020 | 31936 |
| wind | MPI | 3 | 15896 | 47424 |
| interface | Serial | 1 | 1708 | 1708 |
| interface | OpenMP | 1/2/4/8 | 1908 / 1908 / 2072 / 1848 | No aplica |
| interface | MPI | 1 | 15980 | 15980 |
| interface | MPI | 2 | 16120 | 32152 |
| interface | MPI | 3 | 15880 | 47416 |

## 6. Hallazgos y limitaciones honestas

- **Acumulación OpenMP:** `src/parallel/fire_omp.c` usa `reduction(+:hits)`; cada hilo acumula un parcial privado que se combina al final. No hay un incremento compartido por iteración.
- **Aleatorio y estado:** `src/include/fire_model.h` inicializa un `uint64_t state` local a cada escenario a partir de semilla e índice del escenario. `fire_random_next(&state)` modifica ese estado local. No se comparte estado del generador entre hilos.
- **Falso compartido:** cada iteración mantiene mallas y estado en variables locales/stack. No se observa un arreglo de resultados contiguos escrito por hilos. El runtime podría ubicar parciales de reducción próximos en memoria, pero no se midieron contadores de caché; no hay evidencia para atribuir la anomalía a falso compartido.
- **Anomalía citada:** se indicó previamente OpenMP 4 hilos con speedup 2.19 y MPI 3 procesos con 2.92. Esos valores no coinciden con el CSV histórico versionado en `09e996b`: allí `wind` registraba OpenMP 4 = 2.043788 y MPI 3 = 3.267361. No existe aquí un CSV respaldando exactamente 2.19/2.92.
- **Repetición nueva:** con diez repeticiones, OpenMP 4 dio speedup 2.119067 y MPI 3 dio 3.249913. Para OpenMP 2, speedup mediano fue 2.133442 y eficiencia 1.066721, muy próxima a la eficiencia 1.064 citada. Su desviación fue 0.016393 s. El CSV anterior versionado daba speedup 2.261044 y eficiencia 1.130522. La variación es suficiente para advertir inestabilidad entre corridas, pero no demuestra que sea la única causa de la eficiencia superior a uno: la superlinealidad permanece en la mediana nueva. No se atribuye a un defecto del conteo o RNG.
- No se aplicó una optimización al motor C: la inspección no encontró una carrera ni un estado compartido incorrecto, y la evidencia no identifica una causa concreta. `make verify` siguió dando 6765.
- **Sobresuscripción:** el host muestra 4 CPUs y la variante OpenMP de 8 hilos ejecuta más hilos que CPUs visibles. Su eficiencia en `wind` fue 0.366020; más hilos no significan más núcleos ni eficiencia lineal.
- **recon:** su carga dura alrededor de 0.13 s en serial, por lo que los costos fijos pesan más que en cargas largas. Aun así, los datos no respaldan decir que casi no acelera: OpenMP con 2 hilos dio 1.912590 y MPI con 3 procesos 2.477874. Su mejora fue menor que `wind` e `interface` con 3 trabajadores MPI, y OpenMP con 4 hilos bajó a 1.704921.
- **MPI en un host:** el clúster usa tres contenedores sobre una sola máquina y una red bridge. Verifica ejecución distribuida entre procesos/contenedores, no rendimiento de una red física entre equipos.
- **Viento C:** `wind.conf` documenta cambio de viento, pero el motor C actual mantiene un viento simplificado fijo. El viento variable sí es una mecánica del juego web, no una dinámica implementada en C.
- **Memoria MPI:** fue posible medir por rank con `/usr/bin/time -v`; para `wind`, el máximo individual fue 15896 KiB y la suma fue 47424 KiB con 3 ranks. La suma RSS puede contar memoria compartida y no equivale a memoria física única del clúster.

## 7. El juego

- **Reconocimiento:** explorar zonas con niebla, localizar y marcar al menos dos focos; se pierde por agotar batería o tiempo antes de completar la meta. La condición está descrita en la interfaz de selección y `mode_recon.js`.
- **Viento cambiante:** crear barreras temporales y anticipar giros; se gana manteniendo el sector protegido y se pierde si el fuego lo alcanza. `mode_wind.js` contiene la mecánica y evaluación.
- **Interfaz comunidad-monte:** priorizar viviendas y camino usando cargas limitadas; se gana conservando al menos dos viviendas seguras y el camino abierto, y se pierde si las amenazas comprometen esos objetivos. `mode_interface.js` contiene las reglas.
- **Evidencia web de esta ejecución:** el juego respondió desde `http://localhost:8765/dron_guardian.html`; el clon respondió HTTP 200 para `index.html` y `dron_guardian.html`. La vista cargó con viewport 390x844 y mostró controles táctiles. La automatización no consiguió activar la selección de modo en esta sesión; no se registra una prueba de partida exitosa.
- El código tiene el parámetro `?testScale` y telemetría `DronGuardian.getSnapshot()` con FPS, pero no se obtuvo una lectura numérica de FPS en esta ejecución. Tampoco se registraron bots de victoria/derrota ni diez reinicios por modo. Por la regla de evidencia, esas pruebas quedan pendientes; no se afirma que bots hayan usado `?testScale` en una corrida verificable.
- No se probó en teléfono físico ni en la Dell OptiPlex 7010. El juego web no se paraleliza ni se incluye en mediciones de speedup.

## 8. Pendientes que dependen del estudiante

- Repetir rendimiento y memoria en la Dell OptiPlex 7010 y sustituir/adjuntar sus CSV, identificando el hardware.
- Jugar personalmente los tres modos; completar pruebas registradas de bots de victoria/derrota con `?testScale`, diez reinicios por modo y lectura de FPS; probar teléfono físico.
- Confirmar con el docente que el juego web queda fuera del alcance de paralelización y que el motor C es el componente paralelo evaluado.
- Hacer push cuando se decida: `git push origin main`.
- Preparar el informe IEEE, fuera del alcance de este cierre.

## 9. Guía de defensa en clase

### a) Proyecto en tres frases

Dron Guardián es un juego educativo con tres experiencias sobre incendios de vegetación simplificados. Aparte, un programa en C calcula muchos escenarios con una versión serial, otra OpenMP y otra MPI. Comparamos sus resultados y tiempos, pero no afirmamos que el modelo prediga incendios reales.

### b) Qué es el clúster y por qué hay tres contenedores

Un clúster es un grupo de computadoras que cooperan en una tarea. Aquí son tres contenedores: un master que coordina y dos workers que ayudan a ejecutar procesos. Como analogía, el master es quien reparte pedidos y los workers son dos estaciones que preparan partes del pedido.

### c) Serial, OpenMP y MPI con cajeros

Serial es una sola caja que atiende a todos. OpenMP son varias cajas dentro de la misma tienda y comparten el mismo almacén. MPI son cajas que trabajan en tiendas separadas y deben comunicarse para juntar los resultados. En este proyecto los tres contenedores comparten una sola máquina física.

### d) Speedup y eficiencia

Speedup compara cuánto tarda la versión serial con cuánto tarda la paralela. En `wind`, el serial tuvo mediana 0.531481 s y OpenMP con dos hilos 0.249119 s: speedup 2.133442. Eficiencia divide ese speedup entre los hilos; dio 1.066721, un valor mayor que uno que puede aparecer por variación de medición y cachés, pero no debe prometerse como una regla.

### e) Qué se paraleliza y por qué no el juego

Se distribuyen escenarios independientes del motor C. El juego corre en el navegador, usa su propio reloj y azar, y sirve para aprender; no es el cálculo que medimos en paralelo.

### f) Qué muestra cada modo

`recon` enseña a explorar con niebla y administrar batería. `wind` enseña a contener el fuego con barreras cuando cambia la dirección del viento. `interface` enseña a priorizar viviendas y caminos con recursos limitados.

### g) Qué no hace el sistema

No predice incendios reales, no usa mapas ni pronósticos meteorológicos observados, no representa protocolos reales de emergencia y no mide speedup del juego web. El clúster de prueba no son tres computadoras físicas.

### h) Guion oral de 2 a 3 minutos

“Mi proyecto se llama Dron Guardián. Tiene tres modos educativos en una página web y un motor C que simula muchos escenarios de fuego sobre una cuadrícula. La página es didáctica; no es una herramienta para decidir acciones ante una emergencia.

Para el motor hice una versión serial, una con OpenMP y otra con MPI. Serial es una caja, OpenMP varias cajas en la misma tienda, y MPI cajas que se coordinan entre estaciones. Para probar MPI usamos tres contenedores: un master y dos workers, conectados por una red interna. En este entorno esos contenedores comparten una sola computadora.

Con 20.000 simulaciones y semilla 20261104, las tres variantes dieron 6765 impactos. También comparamos los tres modos y las firmas serial, OpenMP y MPI coincidieron. En `wind`, OpenMP con dos hilos tardó una mediana de 0.249119 segundos frente a 0.531481 serial; el speedup fue 2.133442. Es una medición de mi entorno Linux, no de la OptiPlex del laboratorio, y debo repetirla allí.

El modelo usa terreno sintético y reglas simplificadas. No modela el clima real y el programa C no cambia el viento durante la corrida. Por eso presento los resultados como una comparación de implementaciones, no como pronóstico.”

### i) Diez preguntas probables y respuestas cortas

1. **¿Por qué OpenMP y MPI tienen tiempos distintos?** OpenMP comparte memoria; MPI inicia procesos separados y coordina resultados. También hay costos de planificación y variación del host. No se midió una causa única.
2. **¿Por qué `recon` casi no acelera?** Su corrida serial dura cerca de 0.13 s; para una carga corta, la coordinación y la precisión del cronómetro pesan más.
3. **¿Qué es sobresuscripción?** Ejecutar más hilos que CPUs disponibles. Aquí hay cuatro CPUs visibles y se probaron ocho hilos; no equivale a tener ocho núcleos.
4. **¿Por qué usar MPI si solo hay una máquina?** Para verificar reparto entre procesos, comunicación y reducción, y probar el flujo del clúster. No demuestra rendimiento de una red real entre computadores.
5. **¿Qué es una semilla?** Es el valor inicial del generador pseudoaleatorio. Repetirla y derivar el estado por número de escenario permite comparar el mismo conjunto de casos.
6. **¿Cómo saben que el paralelo da lo mismo?** `make verify` comparó 20.000 casos y obtuvo 6765; `make verify-modes` comparó las firmas de los tres modos y dio `VERIFY_MODES_OK`.
7. **¿Por qué eficiencia mayor que uno?** La mediana OpenMP de dos hilos fue 0.249119 s, menor que la mitad de la serial de 0.531481 s. Puede influir el ruido, caché o frecuencia; no hay medición que identifique la causa exacta.
8. **¿El juego usa MPI o OpenMP?** No. Se ejecuta en el navegador; MPI y OpenMP se usan en el motor C separado.
9. **¿El modelo representa el viento cambiante del modo web?** No. El archivo de configuración lo anota como metadato, pero el motor C actual no altera el viento durante una simulación.
10. **¿Son resultados de la computadora del laboratorio?** No. Se midió en Linux con cuatro CPUs visibles y unos 11.69 GiB. La Dell OptiPlex 7010 queda pendiente.
