"""
Simple script to get your local IP address for mobile app configuration
"""
import socket

def get_local_ip():
    try:
        # Connect to a remote address to determine local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
        return local_ip
    except Exception:
        return "127.0.0.1"

if __name__ == "__main__":
    ip = get_local_ip()
    print(f"Your local IP address: {ip}")
    print(f"Django server should run on: http://{ip}:8000")
    print(f"Update app.json apiUrl to: http://{ip}:8000/api")
