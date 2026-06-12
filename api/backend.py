import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient

load_dotenv()

app = Flask(__name__)
CORS(app)

client = OpenAI(
    base_url=os.getenv("MY_ENDPOINT"),
    api_key=os.getenv("MY_KEY")
)

# Upload the training and validation dataset files to Microsoft Foundry with the SDK.
training_file_name = 'training_set.jsonl'
validation_file_name = 'validation_set.jsonl'

training_response = client.files.create(file=open(training_file_name, "rb"), purpose="fine-tune")
validation_response = client.files.create(file=open(validation_file_name, "rb"), purpose="fine-tune")
training_file_id = training_response.id
validation_file_id = validation_response.id

service_endpoint = os.getenv("MY_ENDPOINT")
index_name = os.environ["AZURE_SEARCH_INDEX_NAME"]
key = os.getenv("MY_KEY")

search_client = SearchClient(service_endpoint, index_name, AzureKeyCredential(key))

def buscar_contexto(query):
    
    return "Contenido recuperado de tus manuales de salud mental..."

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'Mensaje vacío'}), 400
        
        completion = client.chat.completions.create(
            training_file=training_file_id,
            validation_file=validation_file_id,
            model="gpt-oss-120b",
            max_tokens=4000,
            temperature=0.7,
            top_p=1.0,
            stop=[],
            presence_penalty=0.0,
            frequency_penalty=0.0,
            extra_body={ "trainingType": "GlobalStandard" },
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
