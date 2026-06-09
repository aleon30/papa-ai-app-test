import json
import os

import azure.functions as func
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


def _normalize_endpoint(endpoint: str) -> str:
    endpoint = endpoint.strip().rstrip('/')

    if "/openai/v1" not in endpoint:
        if "/api/projects/" in endpoint:
            endpoint = endpoint.replace("/api/projects/", "/openai/v1/")
        else:
            endpoint = f"{endpoint}/openai/v1"

    if "api-version=" not in endpoint:
        separator = "&" if "?" in endpoint else "?"
        endpoint = f"{endpoint}{separator}api-version=2024-10-21"

    return endpoint


def _get_client():
    endpoint = os.getenv("MY_ENDPOINT")
    api_key = os.getenv("MY_KEY")

    if not endpoint or not api_key:
        raise ValueError("Faltan las variables de entorno MY_ENDPOINT o MY_KEY. Configúralas en Azure Static Web Apps.")

    return OpenAI(base_url=_normalize_endpoint(endpoint), api_key=api_key)


def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        data = req.get_json()
        user_message = (data or {}).get("message", "") if isinstance(data, dict) else ""

        if not user_message.strip():
            return func.HttpResponse(
                body=json.dumps({"error": "Mensaje vacío"}),
                mimetype="application/json",
                status_code=400,
            )

        client = _get_client()
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
                {"role": "user", "content": user_message},
            ],
        )

        response_text = completion.choices[0].message.content
        return func.HttpResponse(
            body=json.dumps({"response": response_text}),
            mimetype="application/json",
            status_code=200,
        )
    except Exception as exc:
        return func.HttpResponse(
            body=json.dumps({"error": str(exc)}),
            mimetype="application/json",
            status_code=500,
        )
