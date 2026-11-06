# Relacion entre juego web, motor C y cluster

## Componentes separados

Dron Guardian tiene dos componentes que no deben confundirse. El juego web (`dron_guardian.html`, `dron_guardian_core.js` y `mode_recon.js`, `mode_wind.js`, `mode_interface.js`) ofrece tres experiencias educativas 2D ejecutadas en el navegador. El motor C (`src/`) ejecuta muchas simulaciones sinteticas independientes de propagacion y es el componente que se compara en serial, OpenMP y MPI.

El navegador no invoca los binarios C. Los nombres `recon`, `wind` e `interface` tambien identifican cargas pequenas, medias y grandes para el motor C; no existe equivalencia matematica entre una partida y una ejecucion C. Los archivos `data/*.conf` describen esas cargas C, no reglas ni mapas del juego.

## Configuraciones y capacidades reales

`data/recon.conf`, `data/wind.conf` y `data/interface.conf` usan clave=valor y son datos sinteticos. Sus focos iniciales, intervalos y combustible se derivan de los parametros reales del juego:

| Modo | Focos | Viento del juego | Combustible | Simulaciones C |
|---|---:|---|---:|---:|
| recon | 3 | No cambia | 0.90 | 5.000 propuesta |
| wind | 6 | Cambia a los 20 s | 1.20 | 20.000 propuesta |
| interface | 9 | No cambia | 1.38 | 50.000 propuesta |

Las cantidades de simulaciones son propuestas de progresion pequena, media y grande. La malla propuesta tambien se etiqueta en cada archivo como pequena, media o grande, pero el motor actual solo soporta `24 x 16`: `FIRE_WIDTH` y `FIRE_HEIGHT` son constantes en `src/include/fire_model.h`. Por eso cada archivo conserva `mesh_width=24` y `mesh_height=16`, y el lector rechaza otra malla sin cambiar la propagacion.

El juego web `wind` cambia el viento y permite crear barreras temporales de agua; el motor C actual no modela ni el cambio de viento ni la contencion: usa coeficientes discretos fijos por direccion dentro de `fire_model.h`. `wind_changes` y `wind_change_at_ms` se leen como metadatos de procedencia, pero no se aplican al calculo. `wind_intensity`, intervalos, focos y combustible tambien documentan la relacion didactica; no son parametros fisicos configurables por el motor actual.

## Lectura y comparacion

Serial, OpenMP y MPI aceptan `-c` o `--config`, y mantienen `-n`, `-s` y `-b` para el flujo existente:

```sh
make
./build/fire_serial --config data/recon.conf
./build/fire_omp --config data/wind.conf -t 4 -S static
mpirun --allow-run-as-root -np 3 ./build/fire_mpi --config data/interface.conf
```

La configuracion aporta simulaciones, semilla y cortafuego. La semilla por escenario permite comparar exactamente las tres implementaciones. El resultado es la cantidad de simulaciones sinteticas que alcanzan la comunidad C; no es una prediccion real ni el puntaje de una partida.

## Cluster

`infrastructure/compose.yaml` levanta `master`, `worker1` y `worker2` en una red bridge. `scripts/test_cluster.sh` verifica resolucion DNS, SSH sin contrasena, el smoke test MPI y una ejecucion distribuida. El juego web no necesita el cluster y se abre con:

```sh
python3 -m http.server 8765
```

Luego se visita `http://localhost:8765/index.html`.

## Puntos que no aplican al juego

- **N1:** no se paraleliza ni se ejecuta el juego web en el cluster porque su logica Canvas/JavaScript corre en el navegador.
- **N2:** speedup, eficiencia, Amdahl y Gustafson se miden solo sobre el motor C, no sobre una partida web.
- **N3:** no se exige validacion matematica exacta del juego porque usa reglas didacticas y eventos de juego; la validacion reproducible del motor C se hace con semilla fija y comparacion serial/OpenMP/MPI. El juego se valida mediante criterios funcionales y partidas de prueba.

Todo el modelo C y el juego son sinteticos y no sustituyen protocolos de emergencia, meteorologia observada ni entrenamiento certificado. El mapa del juego es abstracto y no corresponde a una cartografia de Sachapera.
