#!/bin/bash
# Abre la aplicación de la carnicería en el navegador.
# Si el servidor no está corriendo, lo inicia automáticamente.

cd "$(dirname "$0")" || exit 1
URL="http://localhost:3000"

if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  open "$URL"
  exit 0
fi

echo "Iniciando la carnicería..."
npm start &
SERVER_PID=$!

for _ in $(seq 1 120); do
  if lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

open "$URL"
echo ""
echo "Página abierta en $URL"
echo "Deja esta ventana abierta mientras uses la aplicación."
wait "$SERVER_PID"
