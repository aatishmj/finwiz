from pymongo import MongoClient
import os

# MongoDB connection URI - replace with your actual connection string or environment variable
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")

client = MongoClient(MONGODB_URI)
db = client["trada_db"]  # Use the same database name as frontend

def get_db():
    return db
