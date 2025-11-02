from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from bson.objectid import ObjectId
from dotenv import load_dotenv
import os
import jwt  # manual decoding
import datetime
import logging


load_dotenv()


app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "supersecretkey123")
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"

CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})
jwt_manager = JWTManager(app)

try:
    mongo_client = MongoClient("mongodb://localhost:27017/")
    db = mongo_client["DocAssist"]                # ✅ Correct DB
    documents_collection = db["documents"]        # ✅ Correct Collection
    logging.info("Connected to MongoDB successfully!")
except Exception as e:
    logging.error(f"Error connecting to MongoDB: {e}")
    exit(1)


# 🔐 JWT secret
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default_secret_key")

# ------------------------------------------------
# ✅ Extract user_id from JWT
# ------------------------------------------------
def get_user_id_from_token():
    token = None

    # First try header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    else:
        token = request.cookies.get("token")  # fallback to cookie

    if not token:
        return None, {"error": "Token missing!"}, 401

    try:
        print(f"🔐 Incoming token: {token}")

        # Inspect payload without verifying to debug
        unverified_payload = jwt.decode(token, options={"verify_signature": False})
        print(f"📦 Unverified Payload: {unverified_payload}")

        # Now try to decode properly
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        print(f"✅ Token successfully verified")

        user_id = decoded_token.get("user_id")
        if not user_id:
            return None, {"error": "Invalid token: user_id missing!"}, 401

        return user_id, None, 200

    except jwt.ExpiredSignatureError:
        print("⚠️ Token expired")
        return None, {"error": "Token has expired!"}, 401

    except jwt.InvalidTokenError as e:
        print(f"❌ Invalid Token Error: {e}")
        return None, {"error": "Invalid token!"}, 401

# ------------------------------------------------
# 📦 Fetch documents for user
# ------------------------------------------------
def fetch_documents_for_user(user_id):
    print(f"📥 Fetching documents for user_id: {user_id}")
    user_docs = list(documents_collection.find({"user_id": user_id}))
    for doc in user_docs:
        doc["_id"] = str(doc["_id"])
    return user_docs

# ------------------------------------------------
# 🌐 Routes
# ------------------------------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "👋 Welcome to NotesDrive Backend!"}), 200

@app.route("/get-document/<doc_id>", methods=["GET"])
def get_document(doc_id):
    print(f"\n📨 Fetching document /get-document/{doc_id}")
    user_id, error, status = get_user_id_from_token()
    if error:
        return jsonify(error), status

    try:
        # Try finding by document_id first
        document = documents_collection.find_one({"document_id": doc_id, "user_id": user_id})

        # If not found, try finding by _id (ObjectId)
        if not document:
            try:
                document = documents_collection.find_one({"_id": ObjectId(doc_id), "user_id": user_id})
            except:
                pass  # Ignore invalid ObjectId conversion

        if not document:
            return jsonify({"error": "Document not found"}), 404

        document["_id"] = str(document["_id"])  # Convert ObjectId to string
        return jsonify({
            "document_name": document.get("document_name", ""),
            "timestamp": document.get("timestamp", ""),
            "content": document.get("document", "")
        }), 200
    except Exception as e:
        print(f"❌ Fetch Error: {str(e)}")
        return jsonify({"error": "Server error"}), 500
    
@app.route("/get-user-documents", methods=["GET"])
def get_user_documents():
    print("\n📨 Request to /get-user-documents")
    user_id, error, status = get_user_id_from_token()
    if error:
        print("❌ Token issue or user_id error:", error)
        return jsonify(error), status

    try:
        user_docs = fetch_documents_for_user(user_id)
        print(f"📤 Found {len(user_docs)} documents")
        return jsonify({"documents": user_docs}), 200
    except Exception as e:
        print(f"💥 Server error while fetching docs: {str(e)}")
        return jsonify({"error": "Server error"}), 500

@app.route("/delete-document/<string:doc_id>", methods=["DELETE"])
def delete_document(doc_id):
    print(f"\n🗑️ Request to delete /delete-document/{doc_id}")
    
    # Extract user_id from JWT token
    user_id, error, status = get_user_id_from_token()
    if error:
        print("❌ Token issue or user_id error:", error)
        return jsonify(error), status

    try:
        # Validate doc_id format
        try:
            object_id = ObjectId(doc_id)
        except:
            return jsonify({"error": "Invalid document ID format"}), 400

        # Find the document and ensure the user owns it
        document = documents_collection.find_one({"_id": object_id, "user_id": user_id})
        if not document:
            return jsonify({"error": "Document not found or unauthorized"}), 404

        # Delete the document
        documents_collection.delete_one({"_id": object_id})
        print(f"✅ Document {doc_id} deleted successfully")
        
        return jsonify({"message": "Document deleted successfully"}), 200

    except Exception as e:
        print(f"❌ Delete Error: {str(e)}")
        return jsonify({"error": "Server error"}), 500

@app.route("/get-user-documents/<user_id>", methods=["GET"])
def get_user_documents_by_id(user_id):
    # Optional: Validate the token
    token_user_id, error, status = get_user_id_from_token()
    if error:
        return jsonify(error), status

    if token_user_id != user_id:
        return jsonify({"error": "Unauthorized access"}), 403

    try:
        user_docs = fetch_documents_for_user(user_id)
        return jsonify({"documents": user_docs}), 200
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": "Server error"}), 500

@app.route("/update-document/<doc_id>", methods=["PUT"])
def update_document(doc_id):
    print(f"\n📨 Request to update /update-document/{doc_id}")
    user_id, error, status = get_user_id_from_token()
    if error:
        return jsonify(error), status

    data = request.get_json()
    content = data.get("content")
    if not content:
        return jsonify({"error": "Content is required"}), 400

    try:
        result = documents_collection.update_one(
            {"_id": ObjectId(doc_id), "user_id": user_id},
            {"$set": {"content": content}}
        )
        if result.modified_count == 0:
            return jsonify({"error": "Update failed or document not found"}), 404
        return jsonify({"message": "Document updated successfully"}), 200
    except Exception as e:
        print(f"❌ Update Error: {str(e)}")
        return jsonify({"error": "Server error"}), 500

# ------------------------------------------------
# 🧪 Debug Headers
# ------------------------------------------------
@app.before_request
def debug_headers():
    print("\n📩 Incoming Request Headers:")
    for k, v in request.headers.items():
        print(f"🔸 {k}: {v}")
    print("🍪 Incoming Cookies:", request.cookies)

# ------------------------------------------------
# 🔃 Run App
# ------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5008)
