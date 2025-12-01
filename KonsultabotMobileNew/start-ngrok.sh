#!/bin/bash
# Bash script to start Ngrok and update Expo config
# Usage: ./start-ngrok.sh

echo "🚀 Starting Ngrok for Konsultabot Backend..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ Ngrok is not installed or not in PATH"
    echo "📥 Install Ngrok from: https://ngrok.com/download"
    exit 1
fi

# Check if backend is running on port 8000
if curl -s http://localhost:8000/api/health/ > /dev/null 2>&1; then
    echo "✅ Backend is running on port 8000"
else
    echo "⚠️  Backend is not running on port 8000"
    echo "💡 Start your Django backend first: python manage.py runserver"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Start Ngrok in background
echo "🌐 Starting Ngrok tunnel..."
ngrok http 8000 > /dev/null 2>&1 &
NGROK_PID=$!

# Wait for Ngrok to start
sleep 3

# Get Ngrok public URL from API
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$PUBLIC_URL" ]; then
    echo "✅ Ngrok tunnel established!"
    echo "🌐 Public URL: $PUBLIC_URL"
    
    # Update .env file
    if [ -f .env ]; then
        if grep -q "EXPO_PUBLIC_NGROK_URL=" .env; then
            sed -i.bak "s|EXPO_PUBLIC_NGROK_URL=.*|EXPO_PUBLIC_NGROK_URL=$PUBLIC_URL|" .env
        else
            echo "EXPO_PUBLIC_NGROK_URL=$PUBLIC_URL" >> .env
        fi
    else
        echo "EXPO_PUBLIC_NGROK_URL=$PUBLIC_URL" > .env
    fi
    
    echo "✅ Updated .env file with Ngrok URL"
    
    # Save Ngrok URL to a file for reference
    echo "$PUBLIC_URL" > ngrok-url.txt
    echo "📝 Ngrok URL saved to ngrok-url.txt"
    
    echo ""
    echo "📱 Next steps:"
    echo "1. Restart Expo: npx expo start --clear"
    echo "2. The app will now use: $PUBLIC_URL/api"
    echo ""
    echo "⚠️  Note: Ngrok URL changes each time you restart (free plan)"
    echo "💡 Use: ngrok http 8000 --domain=your-domain.ngrok-free.app (for static domain)"
    echo ""
    echo "🛑 To stop Ngrok, press Ctrl+C"
    echo ""
    echo "⏳ Ngrok is running. Press Ctrl+C to stop..."
    
    # Wait for user to stop
    trap "echo ''; echo '🛑 Stopping Ngrok...'; kill $NGROK_PID 2>/dev/null; exit" INT
    wait $NGROK_PID
else
    echo "❌ Could not get Ngrok public URL"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

