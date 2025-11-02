from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk
import re
import os
from collections import Counter
from werkzeug.utils import secure_filename
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize

# ---------- Runtime-safe NLTK bootstrap ----------
def ensure_nltk():
    try:
        nltk.data.find("tokenizers/punkt")
    except LookupError:
        nltk.download("punkt")
    try:
        nltk.data.find("corpora/stopwords")
    except LookupError:
        nltk.download("stopwords")

ensure_nltk()
# -------------------------------------------------

app = Flask(__name__)

# CORS: restrict to your deployed frontend origin (set env FRONTEND_ORIGIN)
frontend_origin = os.getenv("FRONTEND_ORIGIN", "*")
CORS(app, resources={r"/*": {"origins": frontend_origin}})

# Use /tmp on Render (ephemeral storage)
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "/tmp/uploads")
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

        for header in headers:
            if re.match(rf"^{header}\b", line, re.IGNORECASE):
                current_section = header
                break

        if current_section:
            if not re.match(rf"^{current_section}\b", line, re.IGNORECASE):
                sections[current_section] += line + "\n"

    return sections

def extract_keywords(text, num_keywords=5):
    words = word_tokenize(text.lower())
    stop_words = set(stopwords.words("english"))
    filtered_words = [w for w in words if w.isalnum() and w not in stop_words]
    most_common_words = Counter(filtered_words).most_common(num_keywords)
    return ", ".join([w for w, _ in most_common_words])

def format_document(sections, format_type):
    formatted_text = ""
    section_number = 1

    for header, content in sections.items():
        content = content.strip()

        if header.lower() not in ["abstract", "references"]:
            numbered_header = f"{section_number}. {header}"
            section_number += 1
        else:
            numbered_header = header

        if not content:
            formatted_text += f"**{numbered_header}**\n\n"
        else:
            if header in ["Methodology", "Materials and Methods"] and "\n" in content:
                content = "\n".join(
                    f"- {ln.strip()}" if ln.strip() and not ln.strip().startswith("-") else ln
                    for ln in content.split("\n")
                )
            formatted_text += f"**{numbered_header}**\n{content}\n\n"

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
    return jsonify({"ok": True}), 200

@app.route("/upload", methods=["POST"])
def upload_file():
    format_type = request.form.get("format", "IEEE")

    if "manual_text" in request.form:
        raw_text = request.form["manual_text"]
    elif "file" in request.files:
        file = request.files["file"]
        filename = secure_filename(file.filename or "input.txt")
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)
        with open(filepath, "r", encoding="utf-8") as f:
            raw_text = f.read()
    else:
        return jsonify({"error": "No input provided"}), 400

    sections = parse_sections(raw_text, format_type)
    formatted_text = format_document(sections, format_type)
    return jsonify({"formatted_text": formatted_text})

if __name__ == "__main__":
    # Render sets $PORT; default to 5005 for local dev
    port = int(os.getenv("PORT", "5005"))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
