FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc g++ make openmpi-bin libopenmpi-dev \
    openssh-client openssh-server procps time ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace
COPY . /workspace
RUN make clean all
COPY infrastructure/cluster_entrypoint.sh /usr/local/bin/cluster-entrypoint
RUN chmod +x /usr/local/bin/cluster-entrypoint scripts/*.sh
ENTRYPOINT ["/usr/local/bin/cluster-entrypoint"]
