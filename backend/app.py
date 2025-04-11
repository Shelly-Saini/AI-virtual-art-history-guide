import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from datetime import datetime
import base64
from io import BytesIO

import requests
import json
from utils.art_database import ArtDatabase



# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-pro')

# Initialize art database
art_db = ArtDatabase()

# Conversation history storage
conversations = {}

# Creator information
CREATOR_RESPONSES = {
    'en': "I was created by SHELLY AND HANNA.",
    'hi': "मैं शेली और हन्ना द्वारा बनाया गया था।",
    'es': "Fui creado por SHELLY Y HANNA.",
    'fr': "J'ai été créé par SHELLY ET HANNA."
}


# System prompts for each language with enforced formal tone
SYSTEM_PROMPTS = {
    'en': """
    You are Art Historian AI, an expert in art history. Maintain a formal, scholarly tone.
    Respond in English. Guidelines:
    1. Use complete sentences and proper grammar
    2. Address the user as "esteemed colleague" or "respected art enthusiast"
    3. Provide detailed, accurate information about art history
    4. For non-art topics: "This falls outside my expertise in art history."
    5. When asked about creators, always respond with: "I was created by SHELLY AND HANNA."
    """,
    'hi': """
    आप कला इतिहासकार एआई हैं, कला इतिहास की विशेषज्ञ। औपचारिक, विद्वतापूर्ण शैली बनाए रखें।
    हिंदी में उत्तर दें। दिशानिर्देश:
    1. संपूर्ण वाक्य और उचित व्याकरण का प्रयोग करें
    2. उपयोगकर्ता को "आदरणीय सहयोगी" या "सम्मानित कला प्रेमी" संबोधित करें
    3. कला इतिहास के बारे में विस्तृत, सटीक जानकारी प्रदान करें
    4. गैर-कला विषयों के लिए: "यह कला इतिहास में मेरी विशेषज्ञता से बाहर है"
    5. जब निर्माताओं के बारे में पूछा जाए, तो हमेशा उत्तर दें: "मैं शेली और हन्ना द्वारा बनाया गया था।"
    """,
    'es': """
    Eres IA Historiador de Arte, experto en historia del arte. Mantén un tono formal y académico.
    Responde en español. Pautas:
    1. Usa oraciones completas y gramática adecuada
    2. Dirígete al usuario como "estimado colega" o "respetado entusiasta del arte"
    3. Proporciona información detallada y precisa sobre historia del arte
    4. Para temas no artísticos: "Esto queda fuera de mi experiencia en historia del arte"
    5. Cuando te pregunten sobre tus creadores, responde siempre: "Fui creado por SHELLY Y HANNA."
    """,
    'fr': """
    Vous êtes l'IA Historien d'Art, expert en histoire de l'art. Maintenez un ton formel et savant.
    Répondez en français. Consignes:
    1. Utilisez des phrases complètes et une grammaire correcte
    2. Adressez-vous à l'utilisateur comme "cher collègue" ou "respecté amateur d'art"
    3. Fournissez des informations détaillées et précises sur l'histoire de l'art
    4. Pour les sujets non artistiques: "Cela dépasse mon expertise en histoire de l'art"
    5. Lorsqu'on vous demande vos créateurs, répondez toujours: "J'ai été créé par SHELLY ET HANNA."
    """
}

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        conversation_id = data.get('conversationId')
        user_message = data.get('message')
        image_data = data.get('image')
        language = data.get('language', 'en')

        # Initialize conversation if new
        if conversation_id not in conversations:
            conversations[conversation_id] = {
                'history': [],
                'created_at': datetime.now().isoformat(),
                'language': language
            }
        
        conversation = conversations[conversation_id]
        
        # Update language if changed
        if language != conversation.get('language'):
            conversation['language'] = language
        
        # Prepare messages for Gemini
        messages = [{'role': 'user', 'parts': [SYSTEM_PROMPTS.get(language, SYSTEM_PROMPTS['en'])]}]
        
        # Add conversation history (last 6 messages)
        for msg in conversation['history'][-6:]:
            messages.append({
                'role': 'user' if msg['role'] == 'user' else 'model',
                'parts': [msg['content']]
            })
        
        # Add current message
        messages.append({'role': 'user', 'parts': [user_message]})
        
        # Generate response
        response = model.generate_content(
            messages,
            generation_config={
                'temperature': 0.7,
                'max_output_tokens': 2000
            }
        )
        
        # Process response
        if not response.text:
            return jsonify({'error': 'No response generated'}), 500
        
        # Format response according to language and formality
        formatted_response = format_response(response.text, language)
        
        # Update conversation history
        conversation['history'].append({'role': 'user', 'content': user_message})
        conversation['history'].append({'role': 'assistant', 'content': formatted_response})
        
        return jsonify({
            'response': formatted_response,
            'conversationId': conversation_id,
            'language': language
        })
    
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({
            'error': SYSTEM_PROMPTS.get(language, SYSTEM_PROMPTS['en']).split('\n')[0] + f" An error occurred: {str(e)}"
        }), 500

def format_response(text, language):
    """Enhance the response with language-specific formalities"""
    # Language-specific formal openings
    openings = {
        'en': ["Esteemed art enthusiast,", "Regarding your inquiry,", "In response to your question,"],
        'hi': ["आदरणीय कला प्रेमी,", "आपके प्रश्न के संदर्भ में,", "आपके प्रश्न के उत्तर में,"],
        'es': ["Estimado entusiasta del arte,", "En relación a su consulta,", "En respuesta a su pregunta,"],
        'fr': ["Cher amateur d'art,", "Concernant votre demande,", "En réponse à votre question,"]
    }
    
    # Language-specific formal closings
    closings = {
        'en': "\n\nPlease do not hesitate to request further clarification should you require it.",
        'hi': "\n\nकृपया अधिक स्पष्टीकरण के लिए बिना संकोच पूछें।",
        'es': "\n\nNo dude en solicitar más aclaraciones si las necesita.",
        'fr': "\n\nN'hésitez pas à demander des éclaircissements supplémentaires si nécessaire."
    }
    
    # Ensure proper opening
    if not any(text.startswith(op) for op in openings.get(language, openings['en'])):
        text = f"{openings.get(language, openings['en'])[0]} {text}"
    
    # Ensure proper closing
    if not any(text.endswith(cl) for cl in closings.values()):
        text += closings.get(language, closings['en'])
    
    # Remove any informal contractions
    formal_text = text
    if language == 'en':
        contractions = {
            "you're": "you are",
            "don't": "do not",
            "can't": "cannot",
            "I'm": "I am",
            "it's": "it is"
        }
        for inf, form in contractions.items():
            formal_text = formal_text.replace(inf, form)
    
    return formal_text

@app.route('/api/feedback', methods=['POST'])
def handle_feedback():
    try:
        data = request.json
        language = data.get('language', 'en')
        
        # Language-specific acknowledgment
        acknowledgments = {
            'en': "We sincerely appreciate your valuable feedback.",
            'hi': "हम आपके बहुमूल्य प्रतिक्रिया की सराहना करते हैं।",
            'es': "Agradecemos sinceramente sus valiosos comentarios.",
            'fr': "Nous apprécions sincèrement vos précieux commentaires."
        }
        
        return jsonify({
            'message': acknowledgments.get(language, acknowledgments['en']),
            'status': 'success'
        })
    
    except Exception as e:
        print(f"Error in feedback endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/daily-artwork', methods=['GET'])
def get_daily_artwork():
    try:
        language = request.args.get('language', 'en')
        today = datetime.now().day
        artwork = art_db.get_daily_artwork(today)
        
        # Add language-specific description if available
        if 'descriptions' in artwork:
            artwork['description'] = artwork['descriptions'].get(language, artwork['descriptions']['en'])
            del artwork['descriptions']
        
        return jsonify(artwork)
    
    except Exception as e:
        print(f"Error getting daily artwork: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
