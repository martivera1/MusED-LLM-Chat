import requests

OLLAMA_URL = "http://localhost:11434"  # Puerto de Ollama
MODEL_NAME = "llama3.1"  # Modelo que queremos usar

# Mensaje de prueba
user_message = "Hola, ¿cómo estás?"

# Enviar la solicitud al servicio Ollama
response = requests.post(
    f"{OLLAMA_URL}/api/chat",
    json={"model": MODEL_NAME, "prompt": user_message},
)

if response.status_code == 200:
    response_data = response.json()
    model_response = response_data.get("response", "")
    print("Respuesta del modelo:", model_response)
else:
    print("Error al comunicarse con Ollama:", response.status_code)
