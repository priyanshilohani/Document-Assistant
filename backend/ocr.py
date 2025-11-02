import pytesseract
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import os
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS

@app.route("/")
def home():
    return jsonify({"message": "Welcome to the Flask server!"})

# Set the Tesseract OCR path 
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"  

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def preprocess_image(image_path):
    """Applies multiple preprocessing steps to enhance OCR accuracy."""
   
    # Read the image using OpenCV
    image = cv2.imread(image_path)

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply adaptive thresholding (binarization)
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,cv2.THRESH_BINARY, 11, 2)

    # Remove noise using median blur
    denoised = cv2.medianBlur(thresh, 3)

    # Apply dilation to strengthen characters
    kernel = np.ones((2,2), np.uint8)
    dilated = cv2.dilate(denoised, kernel, iterations=1)

    # Resize image to enhance small text
    resized = cv2.resize(dilated, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_CUBIC)

    # Save preprocessed image
    processed_path = image_path.replace(".png", "_processed.png")
    cv2.imwrite(processed_path, resized)

    return processed_path


@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    try:
        image = Image.open(file_path)
        extracted_text = pytesseract.image_to_string(image, lang="eng")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"text": extracted_text})

if __name__ == "__main__":
    app.run(port=5004, debug=True)

