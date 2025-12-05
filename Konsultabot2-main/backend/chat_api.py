from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

logger = logging.getLogger(__name__)

# API token for mobile clients (set in environment or .env)
API_TOKEN = os.getenv('API_TOKEN')


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route('/api/chat', methods=['POST'])
def chat():
    # Simple token check for mobile clients
    if API_TOKEN:
        header_token = request.headers.get('X-API-KEY') or request.args.get('api_key')
        if not header_token or header_token != API_TOKEN:
            return jsonify({'error': 'unauthorized'}), 401

    data = request.get_json(force=True)
    if not data or 'message' not in data:
        return jsonify({'error': 'missing message'}), 400

    message = data['message']
    system = data.get('system')

    try:
        # Attempt to use server-side gemini helper
        from gemini_helper import ask_gemini
        resp = ask_gemini(message, system_instruction=system if system else None)
        return jsonify({'response': resp})
    except Exception as e:
        logger.exception('Error calling Gemini')
        return jsonify({'error': str(e)}), 500


def run(host='127.0.0.1', port=5000):
    app.run(host=host, port=port, debug=False)


if __name__ == '__main__':
    run()
