from flask import Flask, request, jsonify
from pymongo import MongoClient
import bcrypt
import jwt
import datetime
from flask_cors import CORS
import os
from datetime import datetime, timedelta, timezone

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000"]}}, supports_credentials=True)

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default_secret_key")

#MongoDB Connection
try:
    mongo_client = MongoClient("mongodb://localhost:27017/")
    db = mongo_client["DocAssist"]
    users_collection = db["users"]
    print("Connected to MongoDB successfully!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")

#signup 
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "All fields are required!"}), 400

    existing_user = users_collection.find_one({"$or": [{"username": username}, {"email": email}]})
    if existing_user:
        return jsonify({"error": "Username or email already exists!"}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    new_user = {
        "user_id": email,
        "username": username,
        "email": email,
        "password": hashed_password.decode('utf-8'),
    }

    try:
        users_collection.insert_one(new_user)
        return jsonify({"message": "User registered successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#login 
@app.route("/login", methods=["POST"])
def login_user():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"error": "Invalid credentials"}), 400

        if bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):

            #Increase token expiration 
            access_token = jwt.encode({
                "user_id": user["email"],
                "username": user["username"],
                "exp": datetime.now(timezone.utc) + timedelta(hours=2)  
            }, SECRET_KEY, algorithm="HS256")

            refresh_token = jwt.encode({
                "user_id": user["email"],
                "exp": datetime.now(timezone.utc) + timedelta(days=7)  
            }, SECRET_KEY, algorithm="HS256")

            return jsonify({
                "message": "Login successful",
                "access_token": access_token,
                "refresh_token": refresh_token
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 400
    except Exception as e:
        return jsonify({"error": f"Error during login: {e}"}), 500


if __name__ == "__main__":
    app.run(debug=False, port=5001)




