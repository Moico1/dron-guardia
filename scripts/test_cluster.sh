#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
compose='docker compose -f infrastructure/compose.yaml'
$compose ps
for source in master worker1 worker2; do
	$compose exec -T "$source" sh -lc 'set -e; for target in master worker1 worker2; do getent hosts "$target"; if [ "$target" != "$(hostname)" ]; then ssh "$target" hostname; fi; done'
done
$compose exec -T master sh -lc 'mpirun --allow-run-as-root --hostfile /workspace/infrastructure/hosts -np 3 /workspace/build/mpi_smoke'
$compose exec -T master mpirun --allow-run-as-root --hostfile /workspace/infrastructure/hosts -np 3 /workspace/build/fire_mpi -n 20000 -s 20261104 -b -1
printf '%s\n' 'CLUSTER_OK nodos=3 ssh=ok mpi=ok'
