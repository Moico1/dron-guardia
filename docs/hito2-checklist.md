# Hito 2: revisión de avance

Este checklist separa lo implementado de lo que debe ejecutarse y registrarse en el laboratorio. No marcar como demostrado aquello que no tenga salida o captura de una ejecución real.

## Requisitos del hito

| Requisito docente | Estado en el proyecto | Evidencia / acción para la revisión |
|---|---|---|
| Clúster virtualizado de 3 nodos (1 master + 2 workers) | Validado en Docker Compose: los tres contenedores están activos | `make cluster-up`; `docker compose -f infrastructure/compose.yaml ps` |
| Red interna bridge, resolución de nombres y SSH sin contraseña | Validado desde master: DNS resolvió worker1/worker2 y ambos aceptaron SSH | `make cluster-test`; salida mostró los dos hostnames remotos |
| GCC/G++ con OpenMP y OpenMPI, smoke test | Compilación local sin warnings; `mpi_smoke` devolvió 3 ranks dentro del clúster | `make`, `make verify` y `make cluster-test` |
| Código secuencial de referencia | Implementado en `src/sequential/fire_serial.c` | `./build/fire_serial -n 20000 -s 20261104 -b -1` |
| Verificación de correctitud | Equivalencia serial/OpenMP/MPI comprobada con semilla fija; no equivale a validación científica del modelo de incendio | `make verify`; salida: `VERIFICACION_OK` |
| Huella de memoria inicial | Medida: 1.744 KiB RSS máxima (aprox. 1,70 MiB) para OpenMP, 100.000 escenarios, 4 hilos | `make memory`; valor reportado por `/usr/bin/time -v` |
| Primera versión paralela | OpenMP por escenarios y MPI con partición cíclica y reducción | `make verify`; también ejecutada en los 3 nodos con `make cluster-test` |
| Estructura oficial del repositorio | Carpetas `src/`, `infrastructure/`, `data/`, `scripts/`, `docs/` creadas | Estructura local lista; falta crear/publicar el remoto GitHub del equipo |
| README con clonación y arranque de contenedores | Instrucciones incluidas; aún no existe URL de GitHub | Publicar el repositorio y agregar su URL después de crear el remoto |

## Datos verificados en el entorno de desarrollo

- Host: Dell OptiPlex Tower Plus 7010, Intel Core i7-13700, 24 CPU lógicas y 31 GiB de RAM visibles para Linux.
- GCC 13.3.0, OpenMPI 4.1.6 y Docker Engine 28.1.1 están instalados.
- Las tres implementaciones C compilaron con `-Wall -Wextra -Wpedantic`.
- En una prueba local de 10.000 escenarios, serial, OpenMP (4 hilos) y MPI (3 procesos) reportaron 3.384 impactos con la misma semilla.
- `make verify` pasó con 20.000 escenarios: serial, 8 combinaciones OpenMP y MPI reportaron 6.765 impactos.
- `make cluster-test` pasó: resolución de nombres, SSH a dos workers, smoke test MPI de 3 ranks y simulación distribuida con 20.000 escenarios.
- `make memory` midió 1.744 KiB (aprox. 1,70 MiB) de RSS máxima con 100.000 escenarios y cuatro hilos.
- Benchmark preliminar de 100.000 escenarios: serial promedio 2,015 s; OpenMP static con 4 hilos 0,547 s y con 8 hilos 0,288 s. Son datos de esta máquina, no resultados del laboratorio aún.
- Dron Guardián se probó en navegador con seis escenarios de un jugador, ahora de 30–55 s. Se verificaron capacidad de tanque y recargas limitadas por nivel, finalización manual, calificación de partida incompleta, repetición/restablecimiento y posiciones diferenciadas.
- En PC a 1366×768 el documento cabe en la ventana sin scroll global; el canvas mantiene 8:5 y el botón de pantalla completa se activa correctamente. El nivel intermedio gira el viento a los 28 s; el avanzado inicia con cuatro cargas.
- En la versión actual, terminar en el segundo 0 mostró «Requiere práctica · 30/100» y el desglose tiempo 0/30, comunidad 30/30 y focos 0/40, con consejo sobre la situación elegida.
- El clúster permanece levantado para poder demostrarlo; detenerlo con `make cluster-down`.

## Guion de demostración (10 minutos)

1. Elegir una de las seis situaciones y explicar qué aprendizaje y diferencia de dificultad tiene.
2. Volar hasta un foco, descargar agua, usar **Terminar misión** y mostrar la calificación si se cierra antes de completar el objetivo.
3. En una segunda prueba, suprimir el frente y señalar la pausa de reaparición variable para controlar focos residuales.
4. Mostrar el código serial como referencia y explicar que cada escenario C usa una semilla determinista propia.
5. Ejecutar `make verify`; señalar que serial, schedules OpenMP y MPI producen el mismo conteo.
6. Ejecutar `make cluster-up` y `make cluster-test`; mostrar los tres nodos, DNS, SSH y smoke test MPI.
7. Mostrar la evaluación del juego y las lecciones; aclarar que es material didáctico y que las mediciones deben repetirse en el laboratorio.

## Límites que deben explicarse

- La propagación y el terreno son sintéticos y simplificados; no deben presentarse como pronóstico real de incendios.
- El juego web es una interfaz interactiva de aprendizaje. El motor C mide las mismas ideas algorítmicas, pero el cálculo de la página no invoca los binarios C.
- La calificación de la misión es una métrica de juego y no certifica competencia de bomberos ni reemplaza protocolos de seguridad.
- El repositorio local aún no está publicado en GitHub; se necesita crear el remoto del equipo y añadir su URL al README.
- Los datos de rendimiento son preliminares de la máquina de desarrollo y no sustituyen la repetición en el laboratorio asignado.

## Pendiente para cierre administrativo del Hito 2

1. Crear/publicar el repositorio GitHub del equipo y sustituir el marcador de URL de clonación en este README.
2. Conservar capturas/salidas del clúster y de `make memory` como evidencia de la revisión.
3. Si el docente espera validación del modelo físico además de equivalencia de implementaciones, añadir una prueba analítica o contraste con datos de incendios; el prototipo actual solo es sintético.
4. Completar nombres y número de equipo en `docs/hito1-perfil-tecnico.md`; entregar el perfil dentro del límite solicitado.
