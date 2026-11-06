# Dron Guardián

Juego educativo 2D de gestión de amenazas con un dron sobre un mapa abstracto. No es un mapa real de Sachapera, una guía operativa, un sistema de alerta ni una predicción de incendios. No sustituye protocolos de seguridad ni entrenamiento certificado.

Las experiencias practican observación con niebla, contención ante viento cambiante y priorización de viviendas y accesos. Son mecánicas didácticas simplificadas; no sustituyen protocolos de bomberos, entrenamiento certificado, sistema de alerta ni modelo de emergencia real.

## Abrir el juego

Abre `index.html` (redirige a `dron_guardian.html`) mediante un servidor local y elige una de tres experiencias individuales, cada una con mecánicas propias:

- **Reconocimiento · inicial**: explora con niebla, descubre focos con el escáner y márcalos antes de agotar batería; gana al identificar dos de tres y pierde por tiempo o batería lejos de base.
- **Viento cambiante · intermedio**: contiene el autómata celular con barreras temporales de agua y reorienta la defensa ante avisos de cambio; gana si el sector protegido sigue intacto hasta el final.
- **Interfaz comunidad-monte · avanzado**: prioriza tres viviendas, un camino y frentes simultáneos con 2 cargas y una recarga; gana manteniendo dos viviendas seguras y el camino abierto.

En PC, usa `WASD`/flechas o haz clic en el mapa para volar; `Espacio` aplica la acción propia del modo, `R` recarga cuando las reglas lo permiten y **Terminar misión** muestra la evaluación. En móvil aparecen controles táctiles. **Pantalla completa** expande el simulador. Los resultados son didácticos y no describen decisiones para un incendio real.

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
├── dron_guardian_core.js
├── mode_recon.js
├── mode_wind.js
├── mode_interface.js
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
	├── diseno-modos.md
	├── relacion-juego-motor-cluster.md
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

`make performance-modes` mide cinco repeticiones por modo, serial, OpenMP (1, 2, 4 y 8 hilos) y MPI (1, 2 y 3 procesos). Para repetir diez veces con el clúster detenido: `REPEAT_COUNT=10 make performance-modes`. Genera `data/performance_modes.csv` y `data/performance_summary.csv` con medianas, mínimos, máximos, desviación estándar, speedup y eficiencia. `make memory-modes` genera `data/memory_modes.csv` para serial, OpenMP y MPI; en MPI registra la RSS del lanzador `mpirun`, no la suma de los ranks.

Para la demostración de recursos:

```sh
make demo-recursos
docker stats infrastructure-master-1 infrastructure-worker1-1 infrastructure-worker2-1
```

También se puede iniciar una carga de demostración con `./scripts/demo_recursos.sh --run` y tomar una captura de `docker stats` mientras corre.

## Alcance y validez

La interfaz y el motor de consola usan prototipos sintéticos independientes: el tablero web sirve para jugar y visualizar la idea; los programas C son la referencia para comparar serial, OpenMP y MPI. El algoritmo C simula propagación estocástica en una malla fija con terreno y viento simplificados. No representa meteorología observada, vegetación cartografiada ni riesgo operativo. Las mediciones deben repetirse en el equipo de laboratorio para el informe.

Documentación: [diseño de los tres juegos](docs/diseno-modos.md), [relación juego-motor-clúster](docs/relacion-juego-motor-cluster.md), [perfil Hito 1](docs/hito1-perfil-tecnico.md), [checklist Hito 2](docs/hito2-checklist.md) y [contexto factual para una IA redactora](docs/contexto-ia-documentacion.md).
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