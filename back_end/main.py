from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserQuery(BaseModel):
    query: str


# 1. AI Setup & Database

print("Loading AI Model (Sentence-Transformer)...")
model = SentenceTransformer('all-MiniLM-L6-v2')

print("Loading movies from Database...")
# Reason: We read the 398 movies from the file we just fetched
try:
    with open("movies.json", "r", encoding="utf-8") as file:
        movies_db = json.load(file)
    print(f"Loaded {len(movies_db)} movies successfully.")
except Exception as e:
    print("Error loading movies.json. Did you run build_db.py?", e)
    movies_db = []

print("Creating FAISS Index (This might take a few seconds)...")
# Reason: We take the descriptions of all 398 movies and convert them to numbers
descriptions = [movie["desc"] for movie in movies_db]
embeddings = model.encode(descriptions)

# Creating the search database
dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(np.array(embeddings))

print(" AI Backend is Ready to receive 398 movies search!")

# 2.(The Search Route)

@app.post("/api/recommend")
async def recommend_movies(user_request: UserQuery):
    sentence = user_request.query
    print(f"User searched for: {sentence}")
    
    # 1. Convert user sentence to embeddings
    query_embedding = model.encode([sentence])
    
    # 2. Search within 398 movies for the top 3 closest
    distances, indices = index.search(np.array(query_embedding), 3)
    
    # 3. Compile the result
    top_movies = [movies_db[i] for i in indices[0]]
        
    return {
        "hero": {
            "id": top_movies[0]["id"],
            "Justification": "Best semantic match based on your search."
        },
        "alternatives": [
            {"id": top_movies[1]["id"], "confidence": 0.90},
            {"id": top_movies[2]["id"], "confidence": 0.85}
        ]
    }