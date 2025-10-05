from pymongo import MongoClient
import os

# MongoDB connection URI - replace with your actual connection string or environment variable
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")

client = MongoClient(MONGODB_URI)
db = client["your_database_name"]  # Replace with your MongoDB database name

def get_db():
    return db
