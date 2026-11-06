# Auditoría Fase 0

**Proyecto:** Dron Guardián  
**Asignatura:** TEL-420 · Sistemas Paralelos · UAJMS  
**Docente:** Ing. Elias Cassal Baldiviezo  
**Repositorio:** https://github.com/Moico1/dron-guardia  
**Fecha:** 2026-11-06  
**Alcance:** auditoría previa a las fases de corrección. No se modificaron archivos durante la auditoría.

## Comandos ejecutados

```sh
rg --files | sort
 git status --short
find src infrastructure data scripts docs -type f -print0 | xargs -0 wc -l
make verify
docker compose -f infrastructure/compose.yaml ps
make cluster-test
make memory
docker compose -f infrastructure/compose.yaml config --quiet
find . -maxdepth 3 -type f -print | sort
find scripts -maxdepth 1 -type f -printf '%M %p\n' | sort
git diff -- README.md | sed -n '1,180p'
git log -3 --oneline
```

La auditoría se ejecutó con el clúster ya levantado. El clúster no se detuvo.

## Hito 1: perfil técnico

| Requisito | Estado | Evidencia |
|---|---|---|
| Problema regional: Gran Chaco, Sachapera, Yacuiba | Cumple | `docs/hito1-perfil-tecnico.md`, sección “Problema regional”. |
| Modelo matemático de autómata celular | Cumple | `docs/hito1-perfil-tecnico.md`, sección “Modelo matemático preliminar”; `src/include/fire_model.h`. |
| Combustible, viento discreto y probabilidad de ignición | Cumple | `src/include/fire_model.h`, cálculo de `terrain`, `wind` y `probability`. |
| Focos secundarios | No aplica al motor C | Los focos secundarios pertenecen al juego web; el motor C modela propagación sintética sobre una malla y no implementa focos secundarios separados. |
| Arquitectura de clúster | Cumple | `docs/hito1-perfil-tecnico.md`; `infrastructure/compose.yaml`. |
| Informe IEEE con 8 secciones | Falta | No existe todavía un esqueleto IEEE en `docs/`. |
| Resumen y Abstract | Falta | No existe informe IEEE. |
| Introducción regional | Parcial | Está en el perfil técnico, pero no dentro de un informe IEEE. |
| Marco teórico: Flynn, memoria y redes | Falta | No hay sección documentada. |
| Arquitectura, CPU/RAM, contenedores y diagrama | Parcial | Compose existe, pero falta preparar formalmente diagrama y datos para el informe. |
| Implementación OpenMP/MPI y particionamiento | Cumple | `src/parallel/fire_omp.c` y `src/parallel/fire_mpi.c`. |
| Tablas de tiempos, speedup y eficiencia | Parcial | `scripts/benchmark.sh` genera tiempos de serial y OpenMP, pero no MPI, speedup ni eficiencia. |
| Amdahl y Gustafson | Falta | No hay mediciones ni análisis documentado. |
| Conclusiones, impacto y referencias | Falta | No existe informe IEEE ni bibliografía verificada. |

## Hito 2A: infraestructura

| Requisito | Estado | Evidencia |
|---|---|---|
| Tres nodos: `master`, `worker1`, `worker2` | Cumple | `infrastructure/compose.yaml`; `docker compose ps` mostró los tres contenedores activos. |
| Red bridge interna | Cumple | `infrastructure/compose.yaml`, red `cluster` con `driver: bridge`. |
| Resolución DNS entre contenedores | Cumple | `make cluster-test` resolvió `master`, `worker1` y `worker2`. |
| SSH sin contraseña | Cumple | `infrastructure/cluster_entrypoint.sh` instala la clave compartida; `make cluster-test` conectó a los workers. |
| GCC/G++ instalados en contenedores | Cumple | `infrastructure/Dockerfile` instala `build-essential gcc g++`. |
| OpenMP instalado y probado | Parcial | OpenMP se compila y valida dentro de `make verify`, pero no hay smoke test OpenMP independiente. |
| OpenMPI instalado | Cumple | `infrastructure/Dockerfile` instala `openmpi-bin libopenmpi-dev`. |
| Smoke test MPI | Cumple | `src/parallel/mpi_smoke.c`; `make cluster-test` produjo `MPI_SMOKE_OK` para 3 ranks. |
| Clúster operativo | Cumple | `docker compose ps` mostró `master`, `worker1` y `worker2` en estado `Up`. |

## Hito 2B: código paralelo

| Requisito | Estado | Evidencia |
|---|---|---|
| Versión secuencial finalizada | Cumple | `src/sequential/fire_serial.c`. |
| Datos sintéticos preliminares | Cumple | `src/include/fire_model.h` implementa malla, terreno y viento sintéticos. |
| Validación de correctitud reproducible | Cumple | `make verify` produjo `incendios=6765` en serial, todas las variantes OpenMP y MPI con semilla `20261104`. |
| Huella de memoria inicial | Cumple, con alcance limitado | `make memory` produjo `Maximum resident set size: 2056 kbytes`, solo OpenMP, 100.000 simulaciones y 4 hilos. |
| Primera versión OpenMP | Cumple | `src/parallel/fire_omp.c`. |
| Primera versión MPI | Cumple | `src/parallel/fire_mpi.c`. |
| Correctitud MPI dentro del clúster | Cumple | `make cluster-test` produjo `simulaciones=20000 incendios=6765`. |

## Hito 2C: estructura y README

| Requisito | Estado | Evidencia |
|---|---|---|
| Carpeta `src/` | Cumple | Existe y contiene serial, OpenMP, MPI y headers. |
| Carpeta `infrastructure/` | Cumple | Existe Compose, Dockerfile, hosts y entrypoint. |
| Carpeta `data/` | Parcial | Existe, pero solo contiene `.gitkeep` y `data/README.md`. |
| Carpeta `scripts/` | Cumple | Existen benchmark, memoria, clúster y verificación. |
| Carpeta `docs/` | Cumple | Existen perfil, checklist, contexto y esta auditoría. |
| README con clonación | Parcial | Existe `git clone <URL-del-repositorio>`; la URL real queda registrada arriba y aún falta incorporarla al README en una fase posterior. |
| README con arranque Docker | Cumple | `README.md` documenta `docker compose -f infrastructure/compose.yaml up -d --build`. |
| README con apertura mediante `python3 -m http.server 8765` | Falta | README indicaba abrir HTML directamente y no documentaba ese comando. |
| README alineado con tres modos | Falta | README todavía describía seis escenarios. |

## Hito 2D: demostración de laboratorio

| Requisito | Estado | Evidencia |
|---|---|---|
| Levantar clúster con un comando | Cumple | `Makefile`, objetivo `cluster-up`; `make cluster-up`. |
| Ejecutar prueba de conectividad | Cumple | `scripts/test_cluster.sh`. |
| Comparar secuencial contra paralelo | Cumple | `scripts/verify.sh`. |
| Mostrar recursos con `docker stats` o `htop` | Falta | No existe script ni comando documentado para esta demostración. |
| Guion de demostración de 10 minutos | Parcial | `docs/hito2-checklist.md` incluye un guion, pero aún habla de seis escenarios y no incluye `docker stats`. |

## Requisitos específicos de las fases posteriores

| Requisito | Estado | Evidencia |
|---|---|---|
| Tres archivos de parámetros en `data/`: `recon`, `wind`, `interface` | Falta | `data/` no contenía esos archivos. |
| Parámetros con malla, focos, viento y semilla | Falta | No existía formato de configuración para esos datos. |
| Simulador C lee esas configuraciones | Falta | `src/sequential/fire_serial.c` solo aceptaba `-n`, `-s` y `-b`. |
| Documento juego web ↔ motor C ↔ clúster | Falta | No existía página específica; había separación conceptual parcial en `docs/contexto-ia-documentacion.md`. |
| Smoke test OpenMP separado | Falta | No existía `scripts/smoke_omp.sh` ni equivalente. |
| Smoke test MPI entre nodos | Cumple | `scripts/test_cluster.sh`. |
| Script serial vs paralelo para los tres modos | Falta | `scripts/verify.sh` solo ejecutaba una carga fija de 20.000 simulaciones. |
| T1 para los tres modos | Falta | `scripts/benchmark.sh` usaba 10.000 y 100.000 simulaciones, no los tres modos. |
| Memoria para los tres modos | Falta | `scripts/memory.sh` solo medía OpenMP con una carga fija. |
| Correctitud para los tres modos | Falta | La correctitud C estaba validada para una carga fija, pero no existían configuraciones por modo. |
| Esqueleto IEEE con 8 secciones | Falta | No existía ese archivo. |

## Puntos que no aplican al juego web

| Punto | Estado | Evidencia |
|---|---|---|
| N1: paralelizar o ejecutar el juego web en el clúster | No aplica | El juego usa Canvas y JavaScript en navegador; `dron_guardian.html` carga `dron_guardian_training.js`. |
| N2: speedup, eficiencia, Amdahl y Gustafson del juego web | No aplica | Las mediciones corresponden al motor C, no al juego. |
| N3: validación matemática exacta del juego | No aplica | El juego usa `Math.random()` y reglas didácticas; el motor C usa semilla fija. |

## Hallazgos principales

1. El clúster funcionaba en la fecha de auditoría. `make cluster-test` terminó con `MPI_SMOKE_OK` para tres ranks, simulación MPI con `incendios=6765` y `CLUSTER_OK nodos=3 ssh=ok mpi=ok`.
2. La correctitud C estaba verificada para la carga actual. `make verify` terminó con `VERIFICACION_OK simulaciones=20000 semilla=20261104`.
3. La interfaz web mostraba seis escenarios: `recon`, `woodland`, `wind`, `secondary`, `interface` y `hills`.
4. No existían datos de configuración por modo ni mecanismo para que el motor C los leyera.
5. No existía un smoke test OpenMP independiente.
6. No existía medición por los tres modos.
7. No existía el esqueleto IEEE solicitado.
8. `README.md` tenía cambios locales previos relacionados con la instalación de OpenMPI. Esos cambios se conservaron y no se modificaron durante la auditoría.
9. El repositorio remoto real informado por el equipo es `https://github.com/Moico1/dron-guardia`.
10. El clúster quedó levantado después de la auditoría y no se detuvo.

## Estado de transición

La Fase 0 queda cerrada. La siguiente intervención autorizada es la Fase 1: reducir la selección web a exactamente tres modos (`recon`, `wind` e `interface`).
