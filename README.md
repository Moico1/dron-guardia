# Dron Guardián

Simulador educativo 2D de respuesta a incendios en Sachapera, Yacuiba. Una persona pilota el dron; el frente de fuego es IA, avanza según combustible y condiciones del escenario, se puede suprimir y reaparece tras una pausa de recuperación. Cada misión termina con evaluación de tiempo protegido, integridad comunitaria y focos controlados.

El tablero enseña conceptos simplificados de viento, enfriamiento, reserva de agua y protección de rutas. No sustituye protocolos de bomberos, entrenamiento certificado, sistema de alerta ni modelo de emergencia real.

## Abrir el juego

Abre `index.html` (redirige a `dron_guardian.html`) directamente en el navegador y elige uno de seis escenarios individuales:

- **Reconocimiento · inicial · 30 s**: 3 focos, 4 cargas y 3 recargas; practica acercamiento y descarga precisa.
- **Monte arbolado · inicial+ · 35 s**: 7 focos, combustible continuo, 4 cargas y 2 recargas.
- **Viento cambiante · intermedio · 40 s**: 6 focos y giro de viento a los 20 s.
- **Focos secundarios · avanzado · 45 s**: 8 focos y 3 cargas; prioriza focos alejados y gestiona una recarga.
- **Interfaz comunidad-monte · avanzado+ · 50 s**: 9 focos y 3 cargas; defiende el perímetro y rutas de viviendas.
- **Ladera seca · experto · 55 s**: 10 focos, 2 cargas, ráfagas y propagación más rápida cuesta arriba.

En PC, usa `WASD`/flechas o haz clic en el mapa para volar; `Espacio` descarga agua, `R` recarga en la zona turquesa (con intentos limitados) y **Terminar misión** cierra antes del límite. Cada escenario cambia la posición de base, dron, comunidad y frente. **Pantalla completa** expande el simulador al monitor. La evaluación final es didáctica, no una certificación profesional.

## Clonar

El proyecto todavía no tiene una URL GitHub asignada. Después de publicar el repositorio del equipo, clónalo con `git clone <URL-del-repositorio>` y entra a su carpeta. Para levantar los contenedores desde el repositorio clonado:

```sh
docker compose -f infrastructure/compose.yaml up -d --build
```

## Estructura

```text
.
├── index.html
├── dron_guardian.html
├── dron_guardian_training.js
├── infrastructure/
│   ├── Dockerfile
│   ├── compose.yaml
│   ├── hosts
│   └── cluster_entrypoint.sh
├── src/
│   ├── include/fire_model.h
│   ├── sequential/fire_serial.c
│   └── parallel/fire_omp.c, fire_mpi.c, mpi_smoke.c
├── data/
├── scripts/
└── docs/
	├── hito1-perfil-tecnico.md
	├── hito2-checklist.md
	└── contexto-ia-documentacion.md
```

## Compilar y probar en el host

Requisitos: GCC, OpenMP, OpenMPI (`mpicc`, `mpirun`) y Make.

```sh
make
make verify
```

`make verify` contrasta la cantidad de escenarios que alcanzan el poblado entre la referencia serial, OpenMP (1, 2, 4 y 8 hilos; schedules static y dynamic) y MPI (3 procesos). Todos usan el mismo generador determinista por escenario.

```sh
./build/fire_serial -n 20000 -s 20261104 -b -1
./build/fire_omp -n 20000 -s 20261104 -b -1 -t 4 -S static
mpirun --allow-run-as-root -np 3 ./build/fire_mpi -n 20000 -s 20261104 -b -1
```

`-b -1` indica que no hay cortafuego; `-b 12` simula un cortafuego en la columna 12. `-s` controla la semilla. Los tiempos reportados son de cálculo.

## Clúster local de tres nodos

Requisitos: Docker Engine y el plugin Docker Compose. La primera compilación descarga la imagen base e instala GCC/G++, OpenMP, OpenMPI y OpenSSH.

```sh
make cluster-up
make cluster-test
make cluster-down
```

Compose crea `master`, `worker1` y `worker2` en una red bridge interna. Se genera una clave SSH efímera en un volumen Docker compartido al iniciar; los nodos autorizan esa clave para las pruebas internas. No se publica SSH al host.

## Medición

```sh
make benchmark
make memory
```

`make benchmark` genera `data/benchmark.csv` con tres repeticiones, dos tamaños de carga y varios conteos de hilos. `make memory` muestra el máximo de memoria residente reportado por `/usr/bin/time -v`.

## Alcance y validez

La interfaz y el motor de consola usan prototipos sintéticos independientes: el tablero web sirve para jugar y visualizar la idea; los programas C son la referencia para comparar serial, OpenMP y MPI. El algoritmo C simula propagación estocástica en una malla fija con terreno y viento simplificados. No representa meteorología observada, vegetación cartografiada ni riesgo operativo. Las mediciones deben repetirse en el equipo de laboratorio para el informe.

Documentación: [perfil Hito 1](docs/hito1-perfil-tecnico.md), [checklist Hito 2](docs/hito2-checklist.md) y [contexto factual para una IA redactora](docs/contexto-ia-documentacion.md).
# Dron Guardia
