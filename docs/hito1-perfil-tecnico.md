# Hito 1: perfil técnico del proyecto

**Asignatura:** TEL-420 · Sistemas Paralelos  
**Proyecto:** Dron Guardián: simulación paralela de propagación de incendios para un simulador educativo
**Equipo:** MOISES BENJAMIN VASQUEZ CONDORI - ABIGAIL QUISPE ROGELLANO
**Docente:** Ing. Elias Cassal Baldiviezo

## Problema regional

El proyecto toma como contexto regional el Gran Chaco y las referencias geográficas de Sachapera y Yacuiba, sin representar ninguna de ellas como un mapa real. Para estudiar cómo cambia el resultado entre muchos escenarios, simula la propagación de un frente de fuego sobre una malla y estima con qué frecuencia llega a una comunidad. La web es una práctica didáctica de observación, prioridad de focos, uso limitado de agua y protección de rutas.

El prototipo utiliza terreno, viento e ignición sintéticos. No es un pronóstico para emergencias ni sustituye formación, protocolos de bomberos, coordinación institucional o certificación de pilotos de drones.

## Modelo matemático preliminar

El motor C representa el terreno como una malla fija de $24\times16$ celdas y evoluciona el fuego durante hasta 32 pasos. Una celda vecina puede encenderse según una probabilidad simplificada del terreno sintético y la dirección del viento:

$$
p_{ij,d}=\min\left(0.72,\max\left(0.03,\;0.18+0.01r_{ij}+w_d\right)\right),
$$

Aquí $r_{ij}\in\{0,\ldots,30\}$ es variación sintética reproducible del terreno y $w_d$ representa un ajuste simplificado por dirección. La semilla determinista depende del escenario. Se cuenta un impacto si el fuego alcanza la zona de la comunidad; opcionalmente, un cortafuego idealizado bloquea una columna.

Para $N$ escenarios, la probabilidad estimada de impacto es:

$$
\widehat{P}(\text{impacto})=\frac{1}{N}\sum_{i=0}^{N-1} I_i,
$$

siendo $I_i=1$ cuando el escenario $i$ alcanza la comunidad y $0$ en caso contrario.

## Arquitectura paralela elegida

Se utiliza C11 con una referencia secuencial, una versión OpenMP de memoria compartida y una versión MPI de memoria distribuida. Como los escenarios son independientes, OpenMP reparte índices entre hilos y suma con `reduction(+:hits)`; MPI distribuye índices entre procesos y combina los conteos con `MPI_Reduce`. La semilla depende del escenario, no del hilo o rank.

La infraestructura se empaqueta con Docker Compose en tres nodos Linux: `master`, `worker1` y `worker2`, conectados a una red bridge interna, con resolución DNS y SSH por clave para las pruebas MPI.

## Alcance e indicadores

La correctitud se contrasta con la misma semilla. El rendimiento se expresa como tiempo, speedup $S_p=T_1/T_p$ y eficiencia $E_p=S_p/p$; las mediciones disponibles son de un host de cuatro CPUs visibles y cerca de 11,69 GiB, no de la Dell OptiPlex 7010 del laboratorio. La web corre en el navegador y no llama a los binarios C; no es objeto de paralelización ni de medición de speedup.

**Alcance:** terreno, viento y probabilidades sintéticos; no es un pronóstico ni una herramienta operativa. Falta repetir las mediciones en el equipo de laboratorio.
