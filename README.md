# Dron Guardián

Simulador educativo 2D de respuesta a incendios en Sachapera, Yacuiba. Una persona pilota el dron; el frente de fuego es IA, avanza según combustible y condiciones del escenario, se puede suprimir y reaparece tras una pausa de recuperación. Cada misión termina con evaluación de tiempo protegido, integridad comunitaria y focos controlados.

El tablero enseña conceptos simplificados de viento, enfriamiento, reserva de agua y protección de rutas. No sustituye protocolos de bomberos, entrenamiento certificado, sistema de alerta ni modelo de emergencia real.

## Abrir el juego

Abre `index.html` (redirige a `dron_guardian.html`) mediante un servidor local y elige uno de tres modos individuales:

- **Reconocimiento · inicial · 30 s**: 3 focos, 4 cargas y 3 recargas; practica acercamiento y descarga precisa.
- **Viento cambiante · intermedio · 40 s**: 6 focos y giro de viento a los 20 s.
- **Interfaz comunidad-monte · avanzado+ · 50 s**: 9 focos, 3 cargas y 1 recarga; defiende el perímetro y rutas de viviendas.

En PC, usa `WASD`/flechas o haz clic en el mapa para volar; `Espacio` descarga agua, `R` recarga en la zona turquesa (con intentos limitados) y **Terminar misión** cierra antes del límite. Cada modo cambia la posición de base, dron, comunidad y frente. **Pantalla completa** expande el simulador al monitor. La evaluación final es didáctica, no una certificación profesional.

```sh
python3 -m http.server 8765
```

Abre `http://localhost:8765/index.html`.

## Clonar

Clona el repositorio del equipo y entra a su carpeta:

```sh
git clone https://github.com/Moico1/dron-guardia.git
cd dron-guardia
```

Para levantar los contenedores desde el repositorio clonado:

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
make smoke-omp
make verify-modes
```

`make verify` contrasta la cantidad de escenarios que alcanzan el poblado entre la referencia serial, OpenMP (1, 2, 4 y 8 hilos; schedules static y dynamic) y MPI (3 procesos). Todos usan el mismo generador determinista por escenario.

```sh
./build/fire_serial -n 20000 -s 20261104 -b -1
./build/fire_omp -n 20000 -s 20261104 -b -1 -t 4 -S static
mpirun --allow-run-as-root -np 3 ./build/fire_mpi -n 20000 -s 20261104 -b -1
```

`-b -1` indica que no hay cortafuego; `-b 12` simula un cortafuego en la columna 12. `-s` controla la semilla. Los tiempos reportados son de cálculo.

Las cargas sintéticas de los tres modos C se ejecutan con:

```sh
./build/fire_serial --config data/recon.conf
./build/fire_omp --config data/wind.conf -t 4 -S static
mpirun --allow-run-as-root -np 3 ./build/fire_mpi --config data/interface.conf
```

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
make performance-modes
make memory-modes
```

`make benchmark` genera `data/benchmark.csv` con tres repeticiones, dos tamaños de carga y varios conteos de hilos. `make memory` muestra el máximo de memoria residente reportado por `/usr/bin/time -v`.

`make performance-modes` mide cinco repeticiones por modo, serial, OpenMP (1, 2, 4 y 8 hilos) y MPI (1, 2 y 3 procesos). Genera `data/performance_modes.csv` y `data/performance_summary.csv` con medianas, mínimos, máximos, speedup y eficiencia. `make memory-modes` genera `data/memory_modes.csv` para serial, OpenMP y MPI; en MPI registra la RSS del lanzador `mpirun`, no la suma de los ranks.

Para la demostración de recursos:

```sh
make demo-recursos
docker stats infrastructure-master-1 infrastructure-worker1-1 infrastructure-worker2-1
```

También se puede iniciar una carga de demostración con `./scripts/demo_recursos.sh --run` y tomar una captura de `docker stats` mientras corre.

## Alcance y validez

La interfaz y el motor de consola usan prototipos sintéticos independientes: el tablero web sirve para jugar y visualizar la idea; los programas C son la referencia para comparar serial, OpenMP y MPI. El algoritmo C simula propagación estocástica en una malla fija con terreno y viento simplificados. No representa meteorología observada, vegetación cartografiada ni riesgo operativo. Las mediciones deben repetirse en el equipo de laboratorio para el informe.

Documentación: [perfil Hito 1](docs/hito1-perfil-tecnico.md), [checklist Hito 2](docs/hito2-checklist.md), [relación juego-motor-clúster](docs/relacion-juego-motor-cluster.md) y [contexto factual para una IA redactora](docs/contexto-ia-documentacion.md).
# Dron Guardia
 pc uni
cd ~/dron-guardia

sudo apt update
sudo apt install -y build-essential openmpi-bin libopenmpi-dev

command -v mpicc
mpicc --version

make clean
make verify


cd ~/dron-guardia
sudo apt update
sudo apt install -y build-essential openmpi-bin libopenmpi-dev
make verify