# Contexto verificado para redactar la documentación del proyecto

Usa este archivo como base factual para preparar el informe, diapositivas o guion de defensa. No inventes nombres de integrantes, número de equipo, repositorio remoto, fuentes bibliográficas, resultados ni validación de campo. Cuando falte un dato, déjalo como `[completar]` o pregúntalo.

## Identidad y propósito

- Nombre: **Dron Guardián**.
- Curso: TEL-420, Sistemas Paralelos.
- Contexto: Sachapera, Yacuiba, Gran Chaco, Bolivia.
- Problema: simular escenarios de propagación de fuego y estimar la fracción de escenarios que alcanza una comunidad; ofrecer una práctica educativa sobre observación, prioridad de focos, reserva de agua y protección de rutas.
- El juego es didáctico y sintético; no es un sistema de alerta, modelo de predicción operacional ni entrenamiento certificado para bomberos o pilotos.

## Proyecto en su estado actual

- Interfaz: `dron_guardian.html` y `dron_guardian_core.js`; las reglas están separadas en `mode_recon.js`, `mode_wind.js` y `mode_interface.js`. `index.html` redirige a la interfaz.
- Cada modo es una experiencia distinta: reconocimiento usa niebla, escaneo, marcado y batería; viento usa autómata celular, cambios anunciados y barreras temporales; interfaz gestiona estados de viviendas, camino y recursos limitados.
- Las partidas terminan con condición de victoria o derrota propia del modo, o con `Terminar misión`; la evaluación resume el resultado observado y su aprendizaje.
- Cada modo presenta objetivo, controles, qué observar, HUD y textos `lesson`, `observe`, `strategy` y `limit` específicos.
- Mapa y amenazas son abstractos y sintéticos; no representan una cartografía real de Sachapera ni un procedimiento de respuesta.
- La interfaz soporta controles de teclado, clic/tap para navegar, agua, recarga según reglas, pantalla completa y controles táctiles.
- Los controles de juego web se ejecutan en JavaScript dentro del navegador. La página no llama a los ejecutables C.

## Motor de simulación paralela

- Malla C: 24 × 16 celdas, propagación estocástica hasta 32 pasos, fuente inicial en el oeste, zona objetivo al este.
- Terreno sintético reproducible; probabilidad por transición basada en un valor de terreno y una bonificación según la dirección del viento. La función real se encuentra en `src/include/fire_model.h`; úsala como autoridad ante cualquier discrepancia con este resumen.
- El programa C calcula número y proporción de escenarios que alcanzan la comunidad. `-n` selecciona simulaciones, `-s` la semilla y `-b -1` no coloca cortafuego (`-b 12` bloquea una columna idealizada).
- Referencia secuencial: `src/sequential/fire_serial.c`.
- OpenMP: `src/parallel/fire_omp.c`; reparto por escenarios, `schedule(static|dynamic)`, reducción de impactos.
- MPI: `src/parallel/fire_mpi.c`; asignación cíclica de escenarios por rank y `MPI_Reduce`.
- Smoke test: `src/parallel/mpi_smoke.c`.
- Nodos: `master`, `worker1`, `worker2`; Compose, bridge interna, DNS y SSH por clave efímera en `infrastructure/`.

## Equipo y herramientas observadas

- Host: Dell OptiPlex Tower Plus 7010.
- CPU observada: Intel Core i7-13700, 24 CPU lógicas.
- Memoria visible para Linux: 31 GiB (máquina nominal de 32 GB).
- GCC 13.3.0, OpenMPI 4.1.6, Docker Engine 28.1.1.
- El contenedor se construye desde Ubuntu 24.04 e instala GCC/G++, OpenMP, OpenMPI y OpenSSH.

## Evidencia ejecutada

- `make clean all verify`: compilación de serial, OpenMP, MPI y smoke test sin advertencias; con 20.000 escenarios y semilla `20261104`, serial, 8 combinaciones OpenMP (1/2/4/8 hilos × static/dynamic) y MPI (3 ranks) reportaron exactamente 6.765 impactos; final `VERIFICACION_OK`.
- `make cluster-up` y `make cluster-test`: los tres contenedores iniciaron; cada nodo resolvió los tres nombres y pudo entrar por SSH a los otros; `mpi_smoke` imprimió 3 ranks; la simulación MPI de 20.000 escenarios reportó 6.765 impactos; final `CLUSTER_OK`.
- `make memory`: RSS máxima 1.744 KiB (aprox. 1,70 MiB) para OpenMP, 100.000 escenarios, 4 hilos.
- Benchmark preliminar de 100.000 escenarios (promedio de 3 repeticiones en este host): serial 2,015 s; OpenMP static/4 hilos 0,547 s; OpenMP static/8 hilos 0,288 s. No presentarlos como medición del laboratorio sin repetirlos allí.
- Pruebas de navegador de la versión reconstruida: bots completaron victorias y derrotas de los tres modos; se registraron pageerror/console.error, viewport de escritorio y móvil, cambio de modo sin recarga y diez reinicios por modo. La evidencia concreta debe tomarse de la ejecución actual de Playwright, no de pruebas de la versión anterior.

## Requisitos de hitos

- Hito 1: el perfil técnico está en `docs/hito1-perfil-tecnico.md`. Completar nombres y equipo.
- Hito 2 técnico: serial/paralelo, Compose de tres nodos, DNS/SSH, MPI, comparación y memoria fueron ejecutados en el entorno actual.
- Aún pendiente: publicar el repositorio en GitHub y reemplazar el marcador de URL de clonación; guardar capturas/salidas como evidencia de presentación; repetir medidas en el laboratorio si se exige esa estación concreta.
- La equivalencia de códigos verifica reproducibilidad entre implementaciones, no valida la física del modelo ni el comportamiento ante incendios reales.

## Guía para redactar entregables

1. Para el perfil de Hito 1, limitarse al problema regional, modelo probabilístico, volumen computacional y arquitectura elegida.
2. Para el informe técnico final, describir taxonomía/modelo de memoria, particionamiento, semillas, reducción, pruebas, tabla de rendimiento, speedup y eficiencia. No afirmar que ya se hicieron análisis de Amdahl/Gustafson, escalabilidad débil o 16 hilos si no se ejecutan y guardan esas pruebas.
3. Diferenciar claramente el simulador paralelo C de la interfaz educativa web.
4. Declarar datos sintéticos y supuestos; no afirmar uso de datos NASA ni validar resultados de campo.
5. Completar autores, docentes, citas verificadas, ID del repositorio y mediciones oficiales con información proporcionada por el equipo.
6. No presentar el juego como protocolo real de extinción; añadir fuentes oficiales de seguridad contra incendios y operación de drones solo después de comprobarlas.
