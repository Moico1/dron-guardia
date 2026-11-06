# Hito 2: revisión de avance

Este checklist separa lo implementado de lo que debe ejecutarse y registrarse en el laboratorio. No marcar como demostrado aquello que no tenga salida o captura de una ejecución real.

## Requisitos del hito

| Requisito | Estado | Evidencia comprobada |
|---|---|---|
| 3.1: clúster de 1 master + 2 workers, arranque con un comando | Cumple | `make cluster-up`; `docker compose -f infrastructure/compose.yaml ps` mostró los tres contenedores `Up`. |
| 3.2: red bridge y nombres | Cumple | `make cluster-test`; `compose.yaml` declara `driver: bridge`; salida `getent hosts` para master, worker1 y worker2. |
| 3.3: SSH sin contraseña | Cumple | `make cluster-test`; SSH remoto devolvió `worker1` y `worker2` sin pedir contraseña. |
| 3.4: gcc/g++, OpenMP y MPI smoke tests | Cumple | GCC/G++ 13.3.0; Open MPI 4.1.6; `make smoke-omp` dio `OPENMP_SMOKE_OK hilos=4`; `make cluster-test` dio `MPI_SMOKE_OK rank=0..2 size=3`. |
| 3.5: referencia serial, correctitud en los tres modos y memoria | Cumple | `make verify` dio 6765; `make verify-modes` dio `VERIFY_MODES_OK`; `data/performance_summary.csv` y `data/memory_modes.csv`. |
| 3.6: primera versión paralela | Cumple | `src/parallel/fire_omp.c`, `src/parallel/fire_mpi.c`; `make verify` y `make cluster-test`. |
| 3.7: estructura del repositorio | Cumple | Contenido en `src/`, `infrastructure/`, `data/`, `scripts/` y `docs/`. |
| 3.8: README con clonación, arranque, scripts y juego | Cumple | `README.md`; URL de GitHub, `make cluster-up`, pruebas, y `python3 -m http.server 8765`. |
| Demostración técnica completa | Parcial | Guion cronometrado agregado abajo; ejecución de `scripts/demo_completa.sh` pendiente de registrar en esta versión. |

## Datos verificados en la ejecución actual

- Hardware visible durante la medición: `nproc=4`, `MemTotal=12258180 kB` (aprox. 11,69 GiB). No se afirma que esta medición corresponda a toda la capacidad nominal de la Dell OptiPlex del laboratorio.
- GCC/G++ 13.3.0, Open MPI 4.1.6 y Docker 29.8.1 se comprobaron en esta ejecución.
- Las tres implementaciones C compilaron con `-Wall -Wextra -Wpedantic`.
- `make verify` pasó con 20.000 escenarios: serial, 8 combinaciones OpenMP y MPI reportaron 6.765 impactos.
- `make cluster-test` pasó: resolución de nombres, SSH a dos workers, smoke test MPI de 3 ranks y simulación distribuida con 20.000 escenarios.
- `make smoke-omp` produjo `OPENMP_SMOKE_OK hilos=4`; el mismo script pasó dentro de `master`.
- `make verify-modes` produjo `VERIFY_MODES_OK`; los tres modos coincidieron entre serial, OpenMP y MPI. El script también pasó dentro de `master`.
- `REPEAT_COUNT=10 ./scripts/performance_modes.sh` se ejecutó con Docker Compose detenido. Los CSV guardan mediana, mínimo, máximo y desviación poblacional; el equipo medido no es la OptiPlex 7010.
- `make memory-modes` midió procesos serial/OpenMP y cada rank MPI con `/usr/bin/time -v`; el CSV incluye máximo individual y suma de RSS por ranks.
- El juego presenta tres experiencias: reconocimiento con niebla/batería, contención con barreras y viento cambiante, y priorización de viviendas/camino. La ejecución de navegador actual solo confirmó carga del selector a 390×844; el click automatizado no se estabilizó. Bots de victoria/derrota, diez reinicios y FPS quedan pendientes de evidencia reproducible.
- El clúster permanece levantado para poder demostrarlo; detenerlo con `make cluster-down`.

## Demostración del juego (1 minuto)

1. **0–10 s:** mostrar la selección de tres experiencias y leer el aviso: mapa abstracto, juego sintético, no operativo.
2. **10–25 s:** iniciar `recon`; volar hacia niebla, dejar que el escáner revele un foco y marcarlo con clic o `M`. Señalar batería y porcentaje explorado.
3. **25–40 s:** cambiar a `wind`; mostrar la cuadrícula, viento actual/próximo y una línea de barrera con `Espacio`.
4. **40–55 s:** cambiar a `interface`; señalar estados de viviendas, amenaza del camino y agua; priorizar un sector antes de descargar.
5. **55–60 s:** terminar manualmente una partida para mostrar la evaluación y cerrar recordando los límites educativos.

## Guion cronometrado de demostración (10 minutos)

| Tiempo | Actividad |
|---|---|
| 0:00–1:00 (1 min) | `make cluster-up`; mostrar master y dos workers. |
| 1:00–2:00 (1 min) | `make cluster-test`; señalar DNS, SSH sin contraseña y smoke MPI. |
| 2:00–5:00 (3 min) | Ejecutar `make verify-modes`; comparar firmas serial/OpenMP/MPI en `recon`, `wind` e `interface`. |
| 5:00–7:00 (2 min) | `./scripts/demo_recursos.sh --run`; observar `docker stats` y explicar que es una muestra puntual. |
| 7:00–8:00 (1 min) | Abrir `http://localhost:8765/dron_guardian.html`; mostrar los tres modos y sus límites educativos. |
| 8:00–10:00 (2 min) | Preguntas y respuestas; aclarar mediciones pendientes en la Dell OptiPlex 7010. |

Las duraciones son el guion de exposición, no una medición de cronómetro. `scripts/demo_completa.sh` ejecuta las comprobaciones técnicas con pausas para la presentación.

## Límites que deben explicarse

- La propagación y el terreno son sintéticos y simplificados; no deben presentarse como pronóstico real de incendios.
- El juego web es una interfaz interactiva de aprendizaje. El motor C mide las mismas ideas algorítmicas, pero el cálculo de la página no invoca los binarios C.
- La calificación de la misión es una métrica de juego y no certifica competencia de bomberos ni reemplaza protocolos de seguridad.
- Las cifras de rendimiento y memoria deben repetirse en la estación oficial de laboratorio si la ejecución actual no corresponde a ella.

## Pendiente para cierre administrativo del Hito 2

1. Repetir rendimiento y memoria en la Dell OptiPlex 7010.
2. Ejecutar y guardar evidencia de bots de victoria/derrota, diez reinicios, viewport móvil y FPS.
3. Confirmar con el docente que la web queda fuera de la paralelización; el motor paralelo evaluado es C.
4. Si se requiere validar un modelo físico, contrastarlo con datos reales; el actual es sintético.
