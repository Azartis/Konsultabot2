"""
Get server IP information for mobile app configuration
"""
import socket
import json
import os

def get_local_ip():
    """Get the local IP address of this machine"""
    try:
        # Connect to a remote address to determine local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
        return local_ip
    except Exception:
        return "127.0.0.1"

def get_all_network_interfaces():
    """Get all available network interfaces"""
    import subprocess
    try:
        # Get all IP addresses on Windows
        result = subprocess.run(['ipconfig'], capture_output=True, text=True)
        lines = result.stdout.split('\n')
        ips = []
        for line in lines:
            if 'IPv4 Address' in line:
                ip = line.split(':')[-1].strip()
                if ip and ip != '127.0.0.1':
                    ips.append(ip)
        return ips
    except:
        return [get_local_ip()]

def create_server_config():
    """Create server configuration for mobile app"""
    local_ip = get_local_ip()
    all_ips = get_all_network_interfaces()
    
    config = {
        "primary_ip": local_ip,
        "all_ips": all_ips,
        "port": 8000,
        "endpoints": {
            "api_root": f"http://{local_ip}:8000/api/",
            "gemini": f"http://{local_ip}:8000/api/chat/simple-gemini/",
            "chat": f"http://{local_ip}:8000/api/chat/send/",
            "auth": f"http://{local_ip}:8000/api/users/"
        },
        "fallback_urls": [f"http://{ip}:8000/api/" for ip in all_ips]
    }
    
    return config

if __name__ == "__main__":
    config = create_server_config()
    print("🖥️  Server Configuration:")
    print("=" * 50)
    print(f"Primary IP: {config['primary_ip']}")
    print(f"All IPs: {', '.join(config['all_ips'])}")
    print(f"Port: {config['port']}")
    print("\n📱 Mobile App URLs:")
    print(f"API Root: {config['endpoints']['api_root']}")
    print(f"Gemini: {config['endpoints']['gemini']}")
    print(f"Chat: {config['endpoints']['chat']}")
    
    # Save to file for mobile app
    with open('server_config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"\n✅ Configuration saved to server_config.json")
    print("📱 Use this file to configure your mobile app!")
