import json
import os
from datetime import datetime

class ArtDatabase:
    def __init__(self):
        # In a real app, this would connect to a proper database
        self.artworks = self._load_sample_data()
    
    def _load_sample_data(self):
        return [
            {
                "id": 1,
                "title": "Mona Lisa",
                "artist": "Leonardo da Vinci",
                "period": "High Renaissance",
                "year": "1503–1519",
                "style": "Portrait",
                "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/1200px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
                "description": "The Mona Lisa is a half-length portrait painting by Italian artist Leonardo da Vinci. Considered an archetypal masterpiece of the Italian Renaissance, it has been described as 'the best known, the most visited, the most written about, the most sung about, the most parodied work of art in the world'."
            },
            {
                "id": 2,
                "title": "The Starry Night",
                "artist": "Vincent van Gogh",
                "period": "Post-Impressionism",
                "year": "1889",
                "style": "Landscape",
                "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/The_Starry_Night.jpg/1280px-The_Starry_Night.jpg",
                "description": "The Starry Night is an oil-on-canvas painting by Dutch Post-Impressionist painter Vincent van Gogh. Painted in June 1889, it depicts the view from the east-facing window of his asylum room at Saint-Rémy-de-Provence, just before sunrise, with the addition of an imaginary village."
            },
            {
                "id": 3,
                "title": "The Great Wave off Kanagawa",
                "artist": "Hokusai",
                "period": "Ukiyo-e",
                "year": "1829–1833",
                "style": "Woodblock print",
                "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/1280px-Tsunami_by_hokusai_19th_century.jpg",
                "description": "The Great Wave off Kanagawa is a woodblock print by Japanese ukiyo-e artist Hokusai, published in 1831 in the late Edo period as the first print in Hokusai's series Thirty-six Views of Mount Fuji."
            },
            {
                "id": 4,
                "title": "The Persistence of Memory",
                "artist": "Salvador Dalí",
                "period": "Surrealism",
                "year": "1931",
                "style": "Surrealist painting",
                "image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/d/dd/The_Persistence_of_Memory.jpg/1200px-The_Persistence_of_Memory.jpg",
                "description": "The Persistence of Memory is a 1931 painting by artist Salvador Dalí, and is one of his most recognizable works. The well-known surrealist piece introduces the image of the soft melting pocket watch."
            }
        ]
    
    def get_daily_artwork(self, day_of_month=None):
        if day_of_month is None:
            day_of_month = datetime.now().day
        
        # Simple rotation based on day of month
        index = day_of_month % len(self.artworks)
        return self.artworks[index]
    
    def recognize_artwork(self, image):
        # In a real app, this would use image recognition
        # For now, we'll just return None
        return None
    
    def search_artworks(self, query):
        # Simple search implementation
        query = query.lower()
        results = []
        
        for artwork in self.artworks:
            if (query in artwork['title'].lower() or 
                query in artwork['artist'].lower() or 
                query in artwork['period'].lower() or 
                query in artwork['style'].lower()):
                results.append(artwork)
        
        return results