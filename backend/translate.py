from flask import Flask, request, jsonify
from flask_cors import CORS
from googletrans import Translator
import re

app = Flask(__name__)
CORS(app, resources={r"/translate": {"origins": "*"}})

translator = Translator()

def preprocess_text(text):
    """Preprocess text by performing various cleaning steps."""
    text = text.strip()  # Remove leading/trailing spaces
    text = re.sub(r'\s+', ' ', text)  # Replace multiple spaces with a single space
    text = text.lower()  # Convert to lowercase
    text = re.sub(r'[^a-zA-Z0-9 .,!?]', '', text)  # Remove special characters except punctuation
    text = re.sub(r'\d+', '', text)  # Remove numbers
    return text

def log_request(data):
    """Log the incoming request data for debugging purposes."""
    print("Received Request:", data)

def validate_language_code(lang):
    """Validate if the provided language code is in the correct format."""
    return re.match(r'^[a-z]{2}(-[A-Z]{2})?$', lang) is not None


@app.route('/translate', methods=['POST'])
def translate_text():
    data = request.json
    text = data.get("text", "")
    target_lang = data.get("target_lang", "en")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    try:
        translated = translator.translate(text, dest=target_lang)  # No async
        return jsonify({"translated_text": translated.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5006)

