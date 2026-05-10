import requests
import json
import time

# 
# Put your TMDB API key here
API_KEY = "086cfe05dd16828e37291d2f37293a38"

movies_data = []

print("Fetching movies from TMDB... .")

#
# Reason: We loop through the first 20 pages of TMDB popular movies (400 movies total)
for page in range(1, 21): 
    url = f"https://api.themoviedb.org/3/movie/popular?api_key={API_KEY}&language=en-US&page={page}"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if "results" in data:
            for movie in data["results"]:
           
                # Reason: We make sure the movie has an overview so the AI can understand it
                if movie.get("overview"): 
                    movies_data.append({
                        "id": movie["id"],
                        "title": movie["title"],
                        "desc": movie["overview"]
                    })
        
        # Sleep for a fraction of a second to avoid rate-limiting by TMDB
        time.sleep(0.1) 
        print(f"Page {page} fetched successfully.")
        
    except Exception as e:
        print(f"Error fetching page {page}: {e}")

# Reason: We save the fetched movies into a JSON file so our main server can read it later
with open("movies.json", "w", encoding="utf-8") as file:
    json.dump(movies_data, file, indent=4)

print(f"\n Success! Saved {len(movies_data)} movies to 'movies.json'.")
