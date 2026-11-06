# Hito 2: revisión de avance

Este checklist separa lo implementado de lo que debe ejecutarse y registrarse en el laboratorio. No marcar como demostrado aquello que no tenga salida o captura de una ejecución real.

## Requisitos del hito

| Requisito docente | Estado en el proyecto | Evidencia / acción para la revisión |
|---|---|---|
| Clúster virtualizado de 3 nodos (1 master + 2 workers) | Validado en Docker Compose: los tres contenedores están activos | `make cluster-up`; `docker compose -f infrastructure/compose.yaml ps` |
| Red interna bridge, resolución de nombres y SSH sin contraseña | Validado desde master: DNS resolvió worker1/worker2 y ambos aceptaron SSH | `make cluster-test`; salida mostró los dos hostnames remotos |
| GCC/G++ con OpenMP y OpenMPI, smoke test | Smoke MPI y smoke OpenMP independiente validados en host y `master` | `make smoke-omp`; `docker compose -f infrastructure/compose.yaml exec -T master /workspace/scripts/smoke_omp.sh` |
| Código secuencial de referencia | Implementado en `src/sequential/fire_serial.c` | `./build/fire_serial -n 20000 -s 20261104 -b -1` |
| Verificación de correctitud | Equivalencia serial/OpenMP/MPI comprobada con semilla fija; no equivale a validación científica del modelo de incendio | `make verify`; salida: `VERIFICACION_OK` |
| Huella de memoria inicial | Medida por modo para serial, OpenMP y MPI; MPI se reporta como RSS del lanzador `mpirun` | `make memory-modes`; valores en `data/memory_modes.csv` |
| Primera versión paralela | OpenMP por escenarios y MPI con partición cíclica y reducción | `make verify`; también ejecutada en los 3 nodos con `make cluster-test` |
| Estructura oficial del repositorio | Carpetas `src/`, `infrastructure/`, `data/`, `scripts/`, `docs/` creadas | Estructura local lista; repositorio remoto: `https://github.com/Moico1/dron-guardia` |
| README con clonación y arranque de contenedores | Instrucciones incluidas con URL real | `git clone https://github.com/Moico1/dron-guardia.git`; `make cluster-up` |
| Correctitud por los tres modos | Validada en host y `master`; serial, OpenMP y MPI coincidieron | `make verify-modes`; salida `VERIFY_MODES_OK` |
| Rendimiento por modo | Medido con 5 repeticiones, medianas, mínimos, máximos, speedup y eficiencia | `make performance-modes`; `data/performance_*.csv` |
| Huella de memoria por modo | Medida para serial, OpenMP y MPI con `/usr/bin/time -v` | `make memory-modes`; `data/memory_modes.csv` |

## Datos verificados en la ejecución actual

- Hardware visible durante la medición: `nproc=4`, `MemTotal=12258180 kB` (aprox. 11,69 GiB). No se afirma que esta medición corresponda a toda la capacidad nominal de la Dell OptiPlex del laboratorio.
- GCC 13.3.0, OpenMPI 4.1.6 y Docker Engine 28.1.1 están instalados.
- Las tres implementaciones C compilaron con `-Wall -Wextra -Wpedantic`.
- `make verify` pasó con 20.000 escenarios: serial, 8 combinaciones OpenMP y MPI reportaron 6.765 impactos.
- `make cluster-test` pasó: resolución de nombres, SSH a dos workers, smoke test MPI de 3 ranks y simulación distribuida con 20.000 escenarios.
- `make smoke-omp` produjo `OPENMP_SMOKE_OK hilos=4`; el mismo script pasó dentro de `master`.
- `make verify-modes` produjo `VERIFY_MODES_OK`; los tres modos coincidieron entre serial, OpenMP y MPI. El script también pasó dentro de `master`.
- `make performance-modes` ejecutó 5 repeticiones por modo para serial, OpenMP con 1/2/4/8 hilos y MPI con 1/2/3 procesos. Los resultados completos están en `data/performance_modes.csv` y `data/performance_summary.csv`.
- `make memory-modes` midió serial, OpenMP y MPI para los tres modos con `/usr/bin/time -v`; los resultados completos están en `data/memory_modes.csv`.
- Dron Guardián se probó en navegador con tres modos de un jugador: vuelo, descarga, recarga, finalización manual, evaluación, repetición y regreso al selector.
- En PC a 1366×768 el canvas mantiene 8:5 y el botón de pantalla completa se activa correctamente. El modo `wind` del juego gira el viento a los 20 s; el motor C documenta ese cambio como metadato porque no soporta viento temporal.
- En la versión actual, terminar en el segundo 0 mostró «Requiere práctica · 30/100» y el desglose tiempo 0/30, comunidad 30/30 y focos 0/40, con consejo sobre la situación elegida.
- El clúster permanece levantado para poder demostrarlo; detenerlo con `make cluster-down`.

## Guion de demostración (10 minutos)

1. Abrir el juego con `python3 -m http.server 8765` y elegir uno de los tres modos; explicar su aprendizaje y dificultad.
2. Volar hasta un foco, descargar agua, usar **Terminar misión** y mostrar la calificación si se cierra antes de completar el objetivo.
3. En una segunda prueba, suprimir el frente y señalar la pausa de reaparición variable para controlar focos residuales.
4. Mostrar el código serial como referencia y explicar que cada escenario C usa una semilla determinista propia.
5. Ejecutar `make verify` y `make verify-modes`; señalar que serial, OpenMP y MPI producen el mismo conteo con cada configuración.
6. Ejecutar `make cluster-up`, `make cluster-test` y el smoke OpenMP en `master`; mostrar los tres nodos, DNS, SSH y smoke tests.
7. Ejecutar `make performance-modes` y `make memory-modes`; explicar T1, speedup, eficiencia y RSS con datos medidos.
8. Ejecutar `docker stats` mientras corre `./scripts/demo_recursos.sh --run` y mostrar recursos de los tres contenedores.
9. Mostrar la evaluación de uno de los tres modos y sus lecciones; aclarar que es material didáctico y que las mediciones deben repetirse en el laboratorio.

## Límites que deben explicarse

- La propagación y el terreno son sintéticos y simplificados; no deben presentarse como pronóstico real de incendios.
- El juego web es una interfaz interactiva de aprendizaje. El motor C mide las mismas ideas algorítmicas, pero el cálculo de la página no invoca los binarios C.
- La calificación de la misión es una métrica de juego y no certifica competencia de bomberos ni reemplaza protocolos de seguridad.
- Las cifras de rendimiento y memoria deben repetirse en la estación oficial de laboratorio si la ejecución actual no corresponde a ella.

## Pendiente para cierre administrativo del Hito 2

1. Conservar capturas/salidas del clúster, `docker stats`, rendimiento y memoria como evidencia de la revisión.
2. Si el docente espera validación del modelo físico además de equivalencia de implementaciones, añadir una prueba analítica o contraste con datos de incendios; el prototipo actual solo es sintético.
3. Completar nombres y número de equipo en `docs/hito1-perfil-tecnico.md`; entregar el perfil dentro del límite solicitado.
