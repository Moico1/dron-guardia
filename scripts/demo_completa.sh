#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

pause() {
    message=$1
    printf '\nPAUSA: %s\n' "$message"
    if [ "${DEMO_NO_PAUSE:-0}" != 1 ] && [ -t 0 ]; then
        printf 'Presione Enter para continuar... '
        read -r answer
    fi
}

printf '%s\n' 'DEMO 1/6: Iniciar el clúster (master + 2 workers).'
make cluster-up
pause 'Mostrar los tres contenedores en estado Up.'

printf '%s\n' 'DEMO 2/6: Probar bridge, DNS, SSH y smoke MPI entre nodos.'
make cluster-test
make smoke-omp
pause 'Señalar resolución de nombres, SSH y pruebas smoke.'

printf '%s\n' 'DEMO 3/6: Verificar el resultado secuencial y paralelo.'
make verify
make verify-modes
pause 'Comparar las firmas de los tres modos.'

printf '%s\n' 'DEMO 4/6: Lanzar una carga y tomar una muestra de docker stats.'
./scripts/demo_recursos.sh --run
pause 'Comentar CPU y memoria observadas en los tres contenedores.'

printf '%s\n' 'DEMO 5/6: Preparar el juego web.'
if curl -fsS --max-time 2 http://127.0.0.1:8765/dron_guardian.html >/dev/null 2>&1; then
    printf '%s\n' 'El servidor HTTP ya responde.'
else
    python3 -m http.server 8765 --bind 0.0.0.0 >/tmp/dron-guardia-http.log 2>&1 &
    printf 'Servidor HTTP iniciado (PID %s).\n' "$!"
fi
printf '%s\n' 'Abra http://localhost:8765/dron_guardian.html en el navegador.'
pause 'Mostrar las experiencias recon, wind e interface.'

printf '%s\n' 'DEMO 6/6: Preguntas y límites del prototipo.'
printf '%s\n' 'Recordar que las mediciones actuales no son de la Dell OptiPlex 7010.'
printf '%s\n' 'DEMO_COMPLETA_OK'