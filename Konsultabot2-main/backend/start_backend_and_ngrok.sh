#!/usr/bin/env bash
# start_backend_and_ngrok.sh
# Usage: cd backend && ./start_backend_and_ngrok.sh

PORT=${1:-8000}

echo "Starting Django on 0.0.0.0:${PORT}..."
# Check for manage.py in current dir or django_konsultabot
if [ -f "manage.py" ]; then
  python3 manage.py runserver 0.0.0.0:${PORT} > django.log 2>&1 & DJANGO_PID=$!
elif [ -f "django_konsultabot/manage.py" ]; then
  cd django_konsultabot
  python3 manage.py runserver 0.0.0.0:${PORT} > ../django.log 2>&1 & DJANGO_PID=$!
  cd ..
else
  echo "Error: manage.py not found"
  exit 1
fi
echo "Django PID: $DJANGO_PID"
sleep 1

# Start ngrok (must be installed)
if [ -x "./ngrok" ]; then
  ./ngrok http ${PORT} --log=stdout > ngrok.log 2>&1 & NGROK_PID=$!
elif command -v ngrok >/dev/null 2>&1; then
  ngrok http ${PORT} --log=stdout > ngrok.log 2>&1 & NGROK_PID=$!
else
  echo "ngrok binary not found. Please install ngrok or place it in backend/."
  exit 1
fi
echo "ngrok PID: $NGROK_PID"
echo "Waiting for ngrok to initialize..."

# Poll local API for URL
NGROK_API="http://127.0.0.1:4040/api/tunnels"
PUBLIC_URL=""
for i in $(seq 1 30); do
  # try to get tunnels
  if curl -s $NGROK_API >/tmp/ngrok_tunnels.json; then
    PUBLIC_URL=$(cat /tmp/ngrok_tunnels.json | grep -oE '"public_url":"https?://[^"]+' | sed 's/\"public_url\":\"//g' | head -n 1)
    if [ -n "$PUBLIC_URL" ]; then
      echo "Ngrok public URL: $PUBLIC_URL"
      echo "$PUBLIC_URL" > .ngrok-last-url
      break
    fi
  fi
  sleep 1
done

if [ -z "$PUBLIC_URL" ]; then
  echo "Failed to obtain ngrok URL. Check ngrok process and logs (ngrok.log)."
  exit 1
fi

# Optionally call Node sync script in project root
if [ -f ../sync_ngrok_url.js ]; then
  echo "Running sync_ngrok_url.js to update mobile config..."
  (cd .. && node ./backend/sync_ngrok_url.js)
fi

echo "Done. Keep this terminal open while testing the APK."

