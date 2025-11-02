from flask import Flask, request, jsonify
import pdfplumber
import re
import spacy
import logging
from flask_cors import CORS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEndpoint
from langchain.chains import RetrievalQA
import os

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

FAISS_INDEX_PATH = "faiss_index"

huggingface_api_key = "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"

llm = HuggingFaceEndpoint(
    repo_id="HuggingFaceH4/zephyr-7b-beta",
    temperature=0.3,
    huggingfacehub_api_token=huggingface_api_key,
    max_new_tokens=200  
)

spacy_model = spacy.load("en_core_web_sm")

# clean text
def clean_text(text):
    return re.sub(r"\s+", " ", text).strip()

# text into chunks
def split_into_chunks(text, max_chunk_size=512):
    doc = spacy_model(text)
    sentences = [sent.text.strip() for sent in doc.sents]
    chunks, current_chunk = [], ""
    for sentence in sentences:
        if len(current_chunk) + len(sentence) <= max_chunk_size:
            current_chunk += " " + sentence
        else:
            chunks.append(current_chunk.strip())
            current_chunk = sentence
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

# Process PDF file
def process_pdf(file):
    with pdfplumber.open(file) as pdf:
        content = "".join(page.extract_text() for page in pdf.pages if page.extract_text())
    return split_into_chunks(clean_text(content))

# Process TXT file
def process_text(content):
    return split_into_chunks(clean_text(content))

@app.route('/')
def home():
    return jsonify({"message": "Welcome to DocBot! Upload a document and start chatting."})

# Process document
@app.route('/api/process-document', methods=['POST'])
def process_document():
    try:
        file = request.files.get("file")
        
        if not file:
            return jsonify({"error": "No file provided!"}), 400
        
        logging.info(f"Processing file: {file.filename}")
        
        if file.filename.endswith(".txt"):
            content = file.read().decode("utf-8")
            chunks = process_text(content)
        elif file.filename.endswith(".pdf"):
            chunks = process_pdf(file)
        else:
            return jsonify({"error": "Unsupported file format!"}), 400

        #vector store
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        vector_store = FAISS.from_texts(chunks, embeddings)
        vector_store.save_local(FAISS_INDEX_PATH)

        return jsonify({
            "message": "File processed successfully!",
            "chunks": chunks,
            "vector_store_path": "faiss_index"
        })

    except Exception as e:
        logging.error(f"Error processing document: {str(e)}")
        return jsonify({"error": f"Error processing document: {str(e)}"}), 500

# Process Query
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_input = data.get("user_input", "")
        chunks = data.get("document_chunks", [])

        if not user_input or not chunks:
            return jsonify({"error": "Missing user input or document chunks!"}), 400

        logging.info(f"User input: {user_input}")
        
        # vector store from chunks
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        vector_store = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)

        # query-answering
        qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=vector_store.as_retriever())

        answer = qa_chain.run(user_input)

        logging.info(f"Answer generated: {answer}")
        return jsonify({"answer": answer})

    except Exception as e:
        logging.error(f"Error generating answer: {str(e)}")
        return jsonify({"error": f"Error generating answer: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
