
import os
import re
from collections import Counter
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

def _ensure_nltk():
    try:
        # Will raise LookupError if missing
        _ = stopwords.words("english")
    except LookupError:
        nltk.download("stopwords")
    try:
        _ = word_tokenize("test")
    except LookupError:
        nltk.download("punkt")

# --- App / Config ---
app = Flask(__name__)

FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN")  # e.g., https://your-app.vercel.app
if FRONTEND_ORIGIN:
    CORS(app, resources={r"/*": {"origins": [FRONTEND_ORIGIN]}})
else:
    # Dev-friendly fallback
    CORS(app)

# Use /tmp on Render (ephemeral but writable). Works locally too.
UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "/tmp/uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

SECTION_HEADERS = {
    "IEEE": ["Abstract", "Introduction", "Literature Review", "Methodology", "Results", "Conclusion", "References"],
    "Springer": ["Abstract", "Introduction", "Background", "Methods", "Results", "Discussion", "Conclusion", "References"],
    "Elsevier": ["Abstract", "Introduction", "Materials and Methods", "Results", "Discussion", "Conclusion", "References"]
}

def parse_sections(text, format_type):
    headers = SECTION_HEADERS.get(format_type, SECTION_HEADERS["IEEE"])
    sections = {header: "" for header in headers}
    current_section = None

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue

        # Detect header switch if line begins with a known header (case-insensitive)
        for header in headers:
            if re.match(rf"^{header}", line, re.IGNORECASE):
                current_section = header
                break

        if current_section:
            # Avoid duplicating the section title line itself
            if not re.match(rf"^{current_section}", line, re.IGNORECASE):
                sections[current_section] += line + "\n"

    return sections

def extract_keywords(text, num_keywords=5):
    _ensure_nltk()
    words = word_tokenize(text.lower())
    stop_words = set(stopwords.words("english"))
    filtered_words = [w for w in words if w.isalnum() and w not in stop_words]
    most_common = Counter(filtered_words).most_common(num_keywords)
    return ", ".join([w for w, _ in most_common])

def format_document(sections, format_type):
    formatted_text = ""
    section_number = 1

    for header, content in sections.items():
        content = content.strip()

        if header.lower() not in {"abstract", "references"}:
            numbered_header = f"{section_number}. {header}"
            section_number += 1
        else:
            numbered_header = header

        if not content:
            formatted_text += f"**{numbered_header}**\n\n"
        else:
            # Preserve bullets for common “methods” sections
            if header in ["Methodology", "Materials and Methods"] and "\n" in content:
                content = "\n".join(
                    f"- {line.strip()}" if line.strip() and not line.strip().startswith("-") else line
                    for line in content.split("\n")
                )
            formatted_text += f"**{numbered_header}**\n{content}\n\n"

    # Add Keywords after Abstract if present
    if "Abstract" in sections and sections["Abstract"].strip():
        full_text = " ".join(sections.values())
        keywords = extract_keywords(full_text)
        formatted_text = formatted_text.replace(
            f"**Abstract**\n{sections['Abstract'].strip()}",
            f"**Abstract**\n{sections['Abstract'].strip()}\n\n**Keywords**\n{keywords}"
        )

    return formatted_text.strip()

@app.route("/healthz", methods=["GET"])
def healthz():
    return jsonify({"ok": True})

@app.route("/upload", methods=["POST"])
def upload_file():
    format_type = request.form.get("format", "IEEE")

    # manual_text takes precedence when provided
    if "manual_text" in request.form:
        raw_text = request.form["manual_text"]
    elif "file" in request.files:
        f = request.files["file"]
        filename = secure_filename(f.filename or "input.txt")
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        f.save(filepath)
        with open(filepath, "r", encoding="utf-8") as fh:
            raw_text = fh.read()
    else:
        return jsonify({"error": "No input provided"}), 400

    sections = parse_sections(raw_text, format_type)
    formatted_text = format_document(sections, format_type)
    return jsonify({"formatted_text": formatted_text})

def create_app():
    return app

if __name__ == "__main__":
    # Local dev server; Render uses gunicorn (see render.yaml below)
    port = int(os.environ.get("PORT", "5005"))
    app.run(host="0.0.0.0", port=port)
