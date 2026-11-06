#!/bin/sh
set -eu
compose='docker compose -f infrastructure/compose.yaml'

$compose ps
printf '%s\n' 'Para la demostracion, abra otra terminal y ejecute mientras corre una carga:'
printf '%s\n' '  docker compose -f infrastructure/compose.yaml exec -T master /workspace/scripts/verify_modes.sh'
printf '%s\n' 'En esta terminal puede observar los contenedores con:'
printf '%s\n' '  docker stats infrastructure-master-1 infrastructure-worker1-1 infrastructure-worker2-1'
printf '%s\n' 'Una captura puntual se puede tomar con:'
printf '%s\n' '  docker stats --no-stream infrastructure-master-1 infrastructure-worker1-1 infrastructure-worker2-1'
if [ "${1:-}" = '--run' ]; then
    $compose exec -T master sh -lc 'mpirun --allow-run-as-root -np 3 /workspace/build/fire_mpi --config /workspace/data/interface.conf -n 500000 >/tmp/dron-guardian-demo.log 2>&1 & echo "MPI_PID=$!"'
    docker stats --no-stream infrastructure-master-1 infrastructure-worker1-1 infrastructure-worker2-1
fi
