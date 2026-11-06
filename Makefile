CC ?= gcc
MPICC ?= mpicc
CFLAGS ?= -O3 -march=native -std=c11 -Wall -Wextra -Wpedantic
OPENMP_FLAGS = -fopenmp

.PHONY: all clean verify verify-modes smoke-omp benchmark performance-modes memory memory-modes demo-recursos cluster-up cluster-test cluster-down

all: build/fire_serial build/fire_omp build/fire_mpi build/mpi_smoke

build:
	mkdir -p build

build/fire_serial: src/sequential/fire_serial.c src/include/fire_model.h | build
	$(CC) $(CFLAGS) $< -o $@

build/fire_omp: src/parallel/fire_omp.c src/include/fire_model.h | build
	$(CC) $(CFLAGS) $(OPENMP_FLAGS) $< -o $@

build/fire_mpi: src/parallel/fire_mpi.c src/include/fire_model.h | build
	$(MPICC) $(CFLAGS) $< -o $@

build/mpi_smoke: src/parallel/mpi_smoke.c | build
	$(MPICC) $(CFLAGS) $< -o $@

verify: all
	./scripts/verify.sh

verify-modes: all
	./scripts/verify_modes.sh

smoke-omp:
	./scripts/smoke_omp.sh

benchmark: all
	./scripts/benchmark.sh

performance-modes: all
	./scripts/performance_modes.sh

memory: all
	./scripts/memory.sh

memory-modes: all
	./scripts/memory_modes.sh

demo-recursos:
	./scripts/demo_recursos.sh

cluster-up:
	docker compose -f infrastructure/compose.yaml up -d --build

cluster-test:
	./scripts/test_cluster.sh

cluster-down:
	docker compose -f infrastructure/compose.yaml down

clean:
	rm -rf build
