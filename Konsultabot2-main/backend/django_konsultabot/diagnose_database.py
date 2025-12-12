#!/usr/bin/env python
"""
Comprehensive database diagnostic and fix script
Tests DNS resolution, PostgreSQL connection, and provides solutions
"""

import os
import sys
import socket
import subprocess
import platform
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / '.env'
if env_path.exists():
    load_dotenv(str(env_path))

# Also check parent directory
parent_env = BASE_DIR.parent / '.env'
if parent_env.exists():
    load_dotenv(str(parent_env))

def test_dns(hostname):
    """Test DNS resolution for a hostname"""
    print(f"[DNS] Testing DNS resolution for: {hostname}")
    try:
        # Try to resolve hostname
        result = socket.getaddrinfo(hostname, None)
        addresses = []
        for item in result:
            addr = item[4][0]
            if addr not in addresses:
                addresses.append(addr)
        
        print(f"[OK] DNS Resolution: SUCCESS")
        print(f"     Resolved to: {', '.join(addresses)}")
        
        # Check if IPv6 addresses are present
        has_ipv6 = any(':' in addr for addr in addresses)
        has_ipv4 = any('.' in addr and ':' not in addr for addr in addresses)
        
        if has_ipv6 and not has_ipv4:
            print(f"[WARN] Only IPv6 addresses found. Your system may not support IPv6.")
            print(f"       Solution: Add IPv4 override to hosts file (see below)")
        elif has_ipv4:
            print(f"[OK] IPv4 address found: {[a for a in addresses if '.' in a and ':' not in a][0]}")
        
        return True, addresses
    except socket.gaierror as e:
        print(f"[FAIL] DNS Resolution: FAILED")
        print(f"       Error: {e}")
        return False, []

def test_postgres_connection():
    """Test PostgreSQL connection using psycopg2"""
    print("\n" + "=" * 60)
    print("[TEST] Testing PostgreSQL Connection")
    print("=" * 60)
    
    DATABASE_URL = os.getenv('DATABASE_URL', '').strip()
    
    if not DATABASE_URL:
        print("[INFO] No DATABASE_URL found in environment")
        return False
    
    # Parse DATABASE_URL to extract hostname
    if DATABASE_URL.startswith('postgresql://') or DATABASE_URL.startswith('postgres://'):
        try:
            # Extract hostname from URL
            # Format: postgresql://user:pass@host:port/dbname
            parts = DATABASE_URL.split('@')
            if len(parts) > 1:
                host_part = parts[1].split('/')[0]
                hostname = host_part.split(':')[0]
                
                print(f"[INFO] Database URL found")
                print(f"       Host: {hostname}")
                
                # Test DNS first
                dns_ok, addresses = test_dns(hostname)
                
                if not dns_ok:
                    print("\n[FAIL] Cannot resolve hostname. Connection will fail.")
                    return False
                
                # Now test actual PostgreSQL connection
                print(f"\n[TEST] Attempting PostgreSQL connection...")
                try:
                    import psycopg2
                    from urllib.parse import urlparse
                    
                    parsed = urlparse(DATABASE_URL)
                    conn = psycopg2.connect(
                        host=parsed.hostname,
                        port=parsed.port or 5432,
                        database=parsed.path[1:] if parsed.path else 'postgres',
                        user=parsed.username,
                        password=parsed.password,
                        connect_timeout=5
                    )
                    conn.close()
                    print("[OK] PostgreSQL Connection: SUCCESS")
                    return True
                except ImportError:
                    print("[FAIL] psycopg2 not installed. Install with: pip install psycopg2-binary")
                    return False
                except Exception as e:
                    print(f"[FAIL] PostgreSQL Connection: FAILED")
                    print(f"       Error: {e}")
                    if "could not translate host name" in str(e).lower():
                        print("\n[TIP] This is a DNS resolution issue.")
                        print("      The hostname cannot be resolved to an IP address.")
                    return False
        except Exception as e:
            print(f"[FAIL] Error parsing DATABASE_URL: {e}")
            return False
    else:
        print("[INFO] DATABASE_URL is not a PostgreSQL URL")
        return False

def check_hosts_file():
    """Check if hosts file has the Supabase entry"""
    hosts_path = r'C:\Windows\System32\drivers\etc\hosts'
    if not os.path.exists(hosts_path):
        print("[WARN] Cannot find hosts file")
        return False
    
    try:
        with open(hosts_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'db.xfvjpiudllclwjzpvomz.supabase.co' in content:
                print("[OK] Found Supabase entry in hosts file")
                return True
            else:
                print("[FAIL] Supabase entry NOT found in hosts file")
                return False
    except PermissionError:
        print("[WARN] Cannot read hosts file (permission denied)")
        print("       Run this script as Administrator")
        return False
    except Exception as e:
        print(f"[WARN] Error reading hosts file: {e}")
        return False

def suggest_fix():
    """Provide fix suggestions"""
    print("\n" + "=" * 60)
    print("[FIX] SUGGESTIONS")
    print("=" * 60)
    
    DATABASE_URL = os.getenv('DATABASE_URL', '').strip()
    if not DATABASE_URL or 'supabase' not in DATABASE_URL.lower():
        print("[INFO] No Supabase DATABASE_URL detected")
        return
    
    print("\n[OPTION 1] Fix DNS Resolution (Recommended)")
    print("          Add this line to C:\\Windows\\System32\\drivers\\etc\\hosts:")
    print("          199.36.158.100   db.xfvjpiudllclwjzpvomz.supabase.co")
    print("\n          Steps:")
    print("          1. Open Notepad as Administrator")
    print("          2. Open: C:\\Windows\\System32\\drivers\\etc\\hosts")
    print("          3. Add the line above at the end")
    print("          4. Save the file")
    print("          5. Run: ipconfig /flushdns")
    print("          6. Test again with: python diagnose_database.py")
    
    print("\n[OPTION 2] Temporarily Use SQLite (Quick Fix)")
    print("          This will let your app work while you fix PostgreSQL:")
    print("          1. Rename .env to .env.backup")
    print("          2. Create new .env without DATABASE_URL")
    print("          3. Run: python manage.py migrate")
    print("          4. Your app will use SQLite (local database)")
    
    print("\n[OPTION 3] Enable IPv6 (Advanced)")
    print("          If your network supports IPv6:")
    print("          1. Check Windows IPv6 settings")
    print("          2. Ensure your network adapter has IPv6 enabled")
    print("          3. Test IPv6 connectivity")

def temporary_sqlite_fix():
    """Offer to temporarily disable DATABASE_URL to use SQLite"""
    print("\n" + "=" * 60)
    print("[FIX] TEMPORARY SQLITE FIX")
    print("=" * 60)
    
    env_path = BASE_DIR / '.env'
    if not env_path.exists():
        env_path = BASE_DIR.parent / '.env'
    
    if not env_path.exists():
        print("[FAIL] .env file not found")
        return
    
    # Check if running in non-interactive mode
    if not sys.stdin.isatty():
        print("[INFO] Running in non-interactive mode. Skipping SQLite fix.")
        print("[INFO] To enable SQLite temporarily, manually comment out DATABASE_URL in .env")
        return
    
    try:
        response = input("\n[?] Temporarily disable PostgreSQL and use SQLite? (y/n): ").strip().lower()
        if response != 'y':
            print("[INFO] Skipped. Fix DNS resolution instead.")
            return
    except (EOFError, KeyboardInterrupt):
        print("\n[INFO] Skipped. Fix DNS resolution instead.")
        return
    
    try:
        # Read current .env
        with open(env_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Create backup
        backup_path = env_path.with_suffix('.env.backup')
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print(f"[OK] Created backup: {backup_path}")
        
        # Comment out DATABASE_URL
        new_lines = []
        for line in lines:
            if line.strip().startswith('DATABASE_URL='):
                new_lines.append(f"# {line.strip()}  # Temporarily disabled - DNS issue\n")
                print(f"[OK] Commented out: DATABASE_URL")
            else:
                new_lines.append(line)
        
        # Write modified .env
        with open(env_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        
        print(f"[OK] Updated {env_path}")
        print("\n[NEXT] Steps:")
        print("       1. Run: python manage.py migrate")
        print("       2. Run: python manage.py runserver 0.0.0.0:8000")
        print("       3. Your app will now use SQLite")
        print("\n[TIP] To restore PostgreSQL later:")
        print(f"      1. Restore from: {backup_path}")
        print("      2. Fix DNS resolution (see Option 1 above)")
        print("      3. Run migrations again")
        
    except PermissionError:
        print("[FAIL] Permission denied. Run this script as Administrator")
    except Exception as e:
        print(f"[FAIL] Error: {e}")

def main():
    print("=" * 60)
    print("KonsultaBot Database Diagnostic Tool")
    print("=" * 60)
    print()
    
    # Check hosts file
    print("[CHECK] Checking hosts file...")
    hosts_ok = check_hosts_file()
    print()
    
    # Test PostgreSQL connection
    pg_ok = test_postgres_connection()
    
    # Provide suggestions
    if not pg_ok:
        suggest_fix()
        print()
        temporary_sqlite_fix()
    else:
        print("\n[OK] All checks passed! Your database connection should work.")
        print("     You can now run: python manage.py migrate")
    
    print("\n" + "=" * 60)

if __name__ == '__main__':
    main()

