# Hito 1: perfil técnico del proyecto

**Asignatura:** TEL-420 · Sistemas Paralelos  
**Proyecto:** Dron Guardián: simulación paralela de propagación de incendios para un simulador educativo 
**Equipo:** MOISES BENJAMIN VASQUEZ CONDORI - ABIGAIL QUISPE ROGELLANO

## Problema regional

Los incendios de vegetación en el Gran Chaco pueden amenazar comunidades, caminos y áreas productivas. Para mostrar por qué conviene evaluar muchos escenarios posibles, el proyecto simula la propagación de un frente de fuego sobre una malla y calcula con qué frecuencia alcanza una comunidad. La interfaz Dron Guardián convierte el escenario en una práctica didáctica de observación, prioridad de focos, uso limitado de agua y protección de rutas.

El prototipo utiliza terreno, viento e ignición sintéticos. No es un pronóstico para emergencias ni sustituye formación, protocolos de bomberos, coordinación institucional o certificación de pilotos de drones.

## Modelo matemático preliminar

El motor C representa el terreno como una malla de $24\times16$ celdas y evoluciona el fuego durante hasta 32 pasos. Cada simulación comienza con un foco en el borde occidental. Una celda vecina puede encenderse según una probabilidad simplificada dependiente de terreno y dirección del viento:

$$
p_{ij,d}=\min\left(0.72,\max\left(0.03,\;0.18+0.01r_{ij}+w_d\right)\right),
$$

con $r_{ij}\in\{0,\ldots,30\}$ como variación sintética reproducible del terreno, y $w_d=0.17$ a sotavento, $-0.09$ contra el viento y $0$ en las direcciones laterales. El evento aleatorio se genera desde una semilla determinista por escenario. Se registra impacto cuando el fuego alcanza la zona de la comunidad; opcionalmente, un cortafuego idealizado bloquea una columna de la malla.

Para $N$ escenarios, la probabilidad estimada de impacto es:

$$
\widehat{P}(\text{impacto})=\frac{1}{N}\sum_{i=0}^{N-1} I_i,
$$

siendo $I_i=1$ cuando el escenario $i$ alcanza la comunidad y $0$ en caso contrario.

## Arquitectura paralela elegida

Se utiliza C11 con una referencia secuencial, una versión OpenMP de memoria compartida y una versión MPI de memoria distribuida. Como cada escenario es independiente, se paraleliza el índice de escenario: OpenMP reduce los impactos con `reduction(+:hits)` y MPI reparte índices entre procesos y combina los conteos con `MPI_Reduce`. La semilla depende del escenario, no del hilo o rank, para comparar resultados de forma reproducible.

La infraestructura se empaqueta con Docker Compose en tres nodos Linux: `master`, `worker1` y `worker2`, conectados a una red bridge interna, con resolución DNS y SSH por clave para las pruebas MPI.

## Alcance e indicadores

La etapa inicial contrasta el conteo secuencial y paralelo con la misma semilla. Las pruebas preliminares usan hasta 100.000 escenarios; la comparación de rendimiento debe incluir tiempo, speedup $S_p=T_1/T_p$ y eficiencia $E_p=S_p/p$, y repetirse en el laboratorio para el informe. La animación y calificación de Dron Guardián son una interfaz educativa web; no llaman directamente a los binarios C y no se deben presentar como resultados del motor paralelo.

**Estado:** perfil técnico redactado con el estado actual. Completar nombres del equipo y comprobar si el docente acepta como validación inicial un modelo sintético antes de entregarlo.
