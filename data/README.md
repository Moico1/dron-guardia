# Datos

El prototipo utiliza terreno y escenarios generados de forma determinista en el código; no requiere descargas ni datasets externos. Los archivos `recon.conf`, `wind.conf` e `interface.conf` son configuraciones sintéticas de carga para relacionar los tres modos web con el motor C. Sus tamaños de simulación y las etiquetas de malla pequeña, media y grande son propuestas, no datos reales.

Cada archivo incluye `mesh_width`, `mesh_height`, `initial_fires`, `wind_intensity`, `wind_changes`, `wind_change_at_ms`, `seed` y `simulations`. La malla ejecutable sigue siendo `24 x 16`, porque es fija en `src/include/fire_model.h`; el motor actual no cambia el viento durante una simulación. En `wind.conf`, `wind_changes=yes` y `wind_change_at_ms=20000` documentan el modo web, pero se leen como metadatos y no alteran la propagación C.

El motor acepta una configuración con `-c`:

```sh
./build/fire_serial -c data/recon.conf
./build/fire_omp -c data/wind.conf -t 4 -S static
mpirun --allow-run-as-root -np 3 ./build/fire_mpi -c data/interface.conf
```

La malla configurada debe coincidir con la malla C actual de `24 x 16`. Las mediciones crudas `performance_modes.csv` se generan con `make performance-modes` y están excluidas de Git.

`performance_summary.csv` y `memory_modes.csv` se versionan como evidencia de medicion en este entorno (`nproc=4`, `MemTotal=12258180 kB`, aproximadamente 11,69 GiB). Este equipo no es la Dell OptiPlex 7010 del laboratorio; hay que repetir las mediciones alli.

En `memory_modes.csv`, `max_rss_kb` es el pico individual mayor entre los ranks MPI y `suma_rank_rss_kb` suma la RSS maxima reportada por cada rank. Cada proceso se mide con `/usr/bin/time -v`; serial y OpenMP registran la RSS de su proceso. La suma MPI puede contar paginas compartidas más de una vez.