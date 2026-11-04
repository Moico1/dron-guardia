#!/bin/sh
set -eu

mkdir -p /run/sshd /root/.ssh /shared/ssh
chmod 700 /root/.ssh
if [ "${ROLE:-worker}" = master ] && [ ! -s /shared/ssh/id_ed25519 ]; then
    ssh-keygen -q -t ed25519 -N '' -f /shared/ssh/id_ed25519
fi
attempt=0
while [ ! -s /shared/ssh/id_ed25519.pub ]; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 60 ]; then
        printf '%s\n' 'No se generó la clave SSH compartida.' >&2
        exit 1
    fi
    sleep 1
done
cp /shared/ssh/id_ed25519 /root/.ssh/id_ed25519
cp /shared/ssh/id_ed25519.pub /root/.ssh/authorized_keys
chmod 600 /root/.ssh/id_ed25519 /root/.ssh/authorized_keys
printf 'Host *\n  IdentityFile /root/.ssh/id_ed25519\n  StrictHostKeyChecking no\n  UserKnownHostsFile /dev/null\n  LogLevel ERROR\n' > /root/.ssh/config
chmod 600 /root/.ssh/config
exec /usr/sbin/sshd -D -e
