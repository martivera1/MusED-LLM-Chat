from flask import Flask, request, jsonify, send_from_directory
import os
import requests

app = Flask(__name__)

OLLAMA_URL = "http://localhost:11434"  # Puerto de Ollama
MODEL_NAME = "llama3.1"  # Nombre del modelo que estás utilizando

# Ruta para servir el archivo HTML
@app.route("/")
def index():
    return send_from_directory(os.getcwd(), "index.html")

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message")
    if not user_message:
        return jsonify({"error": "Mensaje vacío"}), 400

    # Enviar la solicitud al servicio Ollama
    response = requests.post(
        f"{OLLAMA_URL}/api/chat",
        json={"model": MODEL_NAME, "prompt": user_message},
    )

    if response.status_code != 200:
        return jsonify({"error": "Error al comunicarse con Ollama"}), 500

    # Respuesta del modelo
    response_data = response.json()
    model_response = response_data.get("response", "")

    return jsonify({"response": model_response})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
