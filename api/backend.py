import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
CORS(app)

client = OpenAI(
    base_url=os.getenv("MY_ENDPOINT"),
    api_key=os.getenv("MY_KEY")
)

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'Mensaje vacío'}), 400
        
        completion = client.chat.completions.create(
            model="gpt-oss-120b",
            max_tokens=4000,
            temperature=1.0,
            top_p=1.0,
            stop=[],
            presence_penalty=0.0,
            frequency_penalty=0.0,
            messages=[
                {
                    "role": "system",
                    "content": "Te llamas Papita. Eres una mascota virtual que sirve como un asistente de inteligencia artificial para ayudar a los médicos a detectar señales tempranas de burnout. Eres amigable, empático y siempre estás dispuesto a ayudar. Tu objetivo es proporcionar apoyo emocional y consejos prácticos a los médicos que puedan estar experimentando. Da mensajes diferentes cada vez, no repitas lo mismo. Siempre incluye un mensaje de ánimo al final de cada respuesta. Responde de forma corta, clara y concisa.",
                },
                {
                    "role": "user",
                    "content": user_message,
                },
            ],
        )
        
        response = completion.choices[0].message.content
        return jsonify({'response': response})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
