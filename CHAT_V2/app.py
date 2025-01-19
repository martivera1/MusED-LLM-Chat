from flask import Flask, request, jsonify, render_template
from flask_cors import CORS  # Importamos CORS
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama.llms import OllamaLLM

app = Flask(__name__)
CORS(app)

# Variable global para mantener el modelo de LangChain
model = OllamaLLM(model="llama3.1")

# Crear el prompt y la cadena con LangChain
template = """Question: {question}

Answer: Let's think step by step."""
prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model

# Ruta para servir el archivo HTML
@app.route('/')
def index():
    return render_template('index.html')  # Flask buscará este archivo en la carpeta 'templates'

# Ruta para iniciar la sesión de chat con llama3.1
@app.route('/start', methods=['GET'])
def start_chat():
    try:
        # Asegurarse de que el modelo está disponible
        return jsonify({"message": "Chat started. Ready to ask questions."})
    except Exception as e:
        return jsonify({"error": f"Error starting chat: {str(e)}"}), 500

# Ruta para enviar preguntas al modelo interactivo
@app.route('/ask', methods=['POST'])
def ask_model():
    user_input = request.json.get('question')
    
    # Verificar que la pregunta se ha recibido correctamente
    print(f"Recibido: {user_input}")
    
    if not user_input:
        return jsonify({"error": "No question provided"}), 400

    try:
        # Invocar el modelo LangChain/Ollama
        response = chain.invoke({"question": user_input})
        
        # Ver la respuesta del modelo antes de procesarla
        print(f"Respuesta del modelo: {response}")
        
        # Verificar el formato de la respuesta y cómo acceder a ella
        if isinstance(response, dict) and 'text' in response:
            return jsonify({"response": response['text']})
        else:
            return jsonify({"response": response})  # Si es solo una cadena, la devolvemos tal cual.
        
    except Exception as e:
        # En caso de error
        print(f"Error al procesar la solicitud: {str(e)}")
        return jsonify({"error": f"Exception occurred: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
