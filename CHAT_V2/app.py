import os
import tempfile
import time
import re
from flask import Flask, render_template, request, jsonify,url_for,send_file,stream_with_context,Response
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama.llms import OllamaLLM
import uuid

app = Flask(__name__)
# Crear la carpeta temporal_files si no existe
BASE_DIR = os.path.abspath(os.path.dirname(__file__))  # Ruta base del proyecto
TEMP_DIR = os.path.join(BASE_DIR, "temporal_files")  # Carpeta temporal_files

if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)  # Crear la carpeta si no existe
    print(f"Directorio creado: {TEMP_DIR}")

template = """Question: {question}

Answer: Let's think step by step."""

prompt = ChatPromptTemplate.from_template(template)
model = OllamaLLM(model="llama3.1")
chain = prompt | model

abc_notation = None
#global abc_notation

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/canvas')
def canvas():
    return render_template('canvas.html')


# @app.route('/ask', methods=['POST'])
# def ask():
#     try:
#         data = request.get_json()
#         user_question = data.get("question", "")

#         if not user_question:
#             return jsonify({"response": "Please provide a question."})
        
#         # Improved regex to detect ABC notation anywhere in the message
#         import re
#         abc_pattern = re.compile(r"X:\d+\s+T:.*\s+L:\d+/\d+\s+M:\d+/\d+\s+I:linebreak\s+K:[A-G][#b]?.*(\||\|{2})", re.DOTALL)
        
#         abc_match = abc_pattern.search(user_question)
#         if abc_match:
#             global abc_notation
#             abc_notation = abc_match.group(0)  # Extraer solo la notación ABC detectada
#             # Crear el archivo en la carpeta temporal_files
#             abc_file_path = os.path.join(TEMP_DIR, "notation.abc.txt")
#             with open(abc_file_path, "w") as f:
#                 f.write(abc_notation)
            
#             print(f"ABC notation detected and stored: {abc_notation}")  # Debugging line
#             return jsonify({"response": "ABC notation detected. Redirecting to canvas..."})
        
#         # Process the question with the model
#         response = chain.invoke({"question": user_question})
#         return jsonify({"response": response})
#     except Exception as e:
#         return jsonify({"response": f"Error: {str(e)}"}), 500

@app.route('/ask', methods=['POST'])
def ask():
    try:
        data = request.get_json()
        user_question = data.get("question", "")
        print(f"Received question: {user_question}")
        if not user_question:
            return jsonify({"response": "Please provide a question."})
        import re
        # Improved regex to detect ABC notation anywhere in the message
        abc_pattern = re.compile(r"X:\d+\s+T:.*\s+L:\d+/\d+\s+M:\d+/\d+\s+I:linebreak\s+K:[A-G][#b]?.*(\||\|{2})", re.DOTALL)

        def generate_response():
            # Check for ABC notation
            abc_match = abc_pattern.search(user_question)
            if abc_match:
                global abc_notation
                abc_notation = abc_match.group(0)  # Extraer solo la notación ABC detectada
                
                unique_id = str(uuid.uuid4())[:8]
                abc_file_path = os.path.join(TEMP_DIR, f"notation_{unique_id}.abc.txt")
                # Crear el archivo en la carpeta temporal_files
                #abc_file_path = os.path.join(TEMP_DIR, "notation.abc.txt")
                with open(abc_file_path, "w") as f:
                    f.write(abc_notation)
                
                
                # Enviar una respuesta para redirigir al visor ABC
                yield "ABC notation detected"
                #return
            
            # Generar la respuesta progresivamente
            #yield "Chat: \n"  # Mensaje inicial
            response_stream = chain.invoke({"question": user_question})  # Simulación de streaming
            for chunk in response_stream.split(" "):  # Procesar palabra por palabra
                yield f"{chunk} "
                import time
                time.sleep(0.1)  # Simular retraso para streaming
        print("Returning streaming response...")
        return Response(stream_with_context(generate_response()), content_type="text/event-stream")

    except Exception as e:
        return jsonify({"response": f"Error: {str(e)}"}), 500
    

# @app.route('/get_abc', methods=['GET'])
# def get_abc():
#     global abc_notation
#     if abc_notation:
#         # Devuelve el archivo desde la carpeta temporal_files
#         abc_file_path = os.path.join(TEMP_DIR, "notation.abc.txt")
#         if os.path.exists(abc_file_path):
#             return send_file(abc_file_path, as_attachment=False, mimetype='text/plain')
#         else:
#             return jsonify({'error': 'ABC file not found.'}), 404
#     return jsonify({'error': 'No ABC notation available.'}), 404

@app.route('/get_abc', methods=['GET'])
def get_abc():
    # Obtener el archivo más reciente
    abc_files = sorted(
        [f for f in os.listdir(TEMP_DIR) if f.endswith(".abc.txt")],
        key=lambda x: os.path.getmtime(os.path.join(TEMP_DIR, x)),
        reverse=True
    )
    
    if abc_files:
        return send_file(
            os.path.join(TEMP_DIR, abc_files[0]),
            as_attachment=False,
            mimetype='text/plain'
        )
    return jsonify({'error': 'No ABC notation available.'}), 404

if __name__ == '__main__':
    app.run(debug=True)
