#!/usr/bin/env python3
"""
Simple HTTP server for serving the Vibe Recipe PWA
Run this to serve the app properly for mobile installation
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# Change to the directory containing this script
os.chdir(Path(__file__).parent)

PORT = 8080

class PWAHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add PWA-friendly headers
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def guess_type(self, path):
        mimetype = super().guess_type(path)
        # Ensure manifest.json has correct MIME type
        if path.endswith('.json'):
            return 'application/json'
        return mimetype

def main():
    try:
        with socketserver.TCPServer(("", PORT), PWAHandler) as httpd:
            print(f"🍽️  Vibe Recipe App Server")
            print(f"📱 Serving at: http://localhost:{PORT}")
            print(f"🌐 Network access: http://{get_local_ip()}:{PORT}")
            print(f"\n📋 Instructions:")
            print(f"   1. Open the URL above on your phone's browser")
            print(f"   2. Look for 'Add to Home Screen' or 'Install App' option")
            print(f"   3. Install the app to use it like a native mobile app")
            print(f"\n🛑 Press Ctrl+C to stop the server")
            
            # Try to open in default browser
            try:
                webbrowser.open(f'http://localhost:{PORT}')
            except:
                pass
                
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print(f"\n👋 Server stopped")
    except OSError as e:
        if e.errno == 10048:  # Port already in use
            print(f"❌ Port {PORT} is already in use. Try a different port or close other applications.")
        else:
            print(f"❌ Error starting server: {e}")

def get_local_ip():
    """Get the local IP address for network access"""
    import socket
    try:
        # Connect to a remote address to determine local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except:
        return "localhost"

if __name__ == "__main__":
    main()