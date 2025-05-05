import os
import re
import uuid
import time
from flask import Flask, render_template, request, jsonify, send_file, Response, stream_with_context
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama.llms import OllamaLLM
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

def load_txt_as_str(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        return content
    except FileNotFoundError:
        print(f"The file '{file_path}' was not found.")
        return None
    except Exception as e:
        print(f"An error occurred while reading the file: {e}")
        return None






app = Flask(__name__)
TEMP_DIR = os.path.join(os.path.abspath(os.path.dirname(__file__)), "temporal_files")
os.makedirs(TEMP_DIR, exist_ok=True)


# Configurar el model
prompt = ChatPromptTemplate.from_template("""Question: {question}

Answer:
(Please work through the problem step by step in your internal reasoning, but do not print those private thoughts. When you’ve finished thinking, output only the final reasoning under the heading "Final Reasoning:”.)""")

#prompt = ChatPromptTemplate.from_template("""Question: {question}""") #per veure si canvia i no raona tant i va més al punt.
model = OllamaLLM(model="llama3.1:8b")
memory = ConversationBufferMemory(memory_key="history", return_messages=True)
conversation = ConversationChain(llm=model, memory=memory)
chain = prompt | model


@app.route('/')
def index():
    return render_template('index.html')

# @app.route('/ask', methods=['POST'])
# def ask():
#     try:
#         data = request.get_json()
#         user_question = data.get("question", "")
#         print(f"Received question: {user_question}")
#         if not user_question:
#             return jsonify({"response": "Please provide a question."})
#         import re
#         # Improved regex to detect ABC notation anywhere in the message
#         abc_pattern = re.compile(r"X:\d+\s+T:.*\s+L:\d+/\d+\s+M:\d+/\d+\s+I:linebreak\s+K:[A-G][#b]?.*(\||\|{2})", re.DOTALL)

#         def generate_response():
#             # Check for ABC notation
#             abc_match = abc_pattern.search(user_question)
#             if abc_match:
#                 global abc_notation
#                 abc_notation = abc_match.group(0)  # Extraer solo la notación ABC detectada
                
#                 unique_id = str(uuid.uuid4())[:8]
#                 abc_file_path = os.path.join(TEMP_DIR, f"notation_{unique_id}.abc.txt")
#                 # Crear el archivo en la carpeta temporal_files
#                 #abc_file_path = os.path.join(TEMP_DIR, "notation.abc.txt")
#                 with open(abc_file_path, "w") as f:
#                     f.write(abc_notation)
                
                
#                 # Enviar una respuesta para redirigir al visor ABC
#                 yield "ABC notation detected"
#                 #return
            
#             # Generar la respuesta progresivamente
#             response_stream = chain.invoke({"question": user_question})  # Simulación de streaming
#             for chunk in response_stream.split(" "):  # Procesar palabra por palabra
#                 yield f"{chunk} "
#                 import time
#                 time.sleep(0.1)  # Simular retraso para streaming
#         print("Returning streaming response...")
#         return Response(stream_with_context(generate_response()), content_type="text/event-stream")

#     except Exception as e:
#         return jsonify({"response": f"Errrror: {str(e)}"}), 500

@app.route('/ask', methods=['POST'])
def ask():
    pre_super_prompt = load_txt_as_str("prompts/super_prompt.txt")

    #post_super_prompt = load_txt_as_str("prompts/post_super_prompt.txt")
    try:
        data = request.get_json()
        user_question = data.get("question", "")
        use_super = data.get("use_super",True)
        use_text = data.get("use_text",False)
        # print(f"Received question: {user_question}")
        # use_super = data.get("use_super", "true").lower() == "true"
        # use_text = data.get("use_text", "false").lower() == "true"
        
        # 2. Debug detallado
        print(f"\n--- PARÁMETROS RECIBIDOS ---")
        print(f"use_super: {use_super} ({type(use_super)})")
        print(f"use_text: {use_text} ({type(use_text)})")

        # Cargar el prompt seleccionado
        if use_text:
            pre_prompt = load_txt_as_str("prompts/text_prompt.txt")
            print("\033[92m" + "✅ LYRICS PROMPT ACTIVATED" + "\033[0m")
        elif use_super:
            pre_prompt = load_txt_as_str("prompts/super_prompt.txt")
            print("\033[93m" + "🔼 SUPER PROMPT ACTIVATED" + "\033[0m")
        else:
            pre_prompt = ""
            print("\033[91m" + "⚠️ NO PROMPT" + "\033[0m")
            

        full_prompt = pre_prompt + user_question if pre_prompt else user_question
        if not user_question:
            return jsonify({"response": "Please provide a question."})
        
        print(f"Using {'super' if use_super else 'text'} prompt")

        # Regex mejorado para detectar notación ABC en cualquier parte del mensaje
        abc_pattern = re.compile(r"X:\d+\s+T:.*\s+L:\d+/\d+\s+M:\d+/\d+\s+I:linebreak\s+K:[A-G][#b]?.*(\||\|{2})", re.DOTALL)
        #full_prompt = pre_super_prompt  + user_question
        def generate_response():
            # Verificar si hay notación ABC
            abc_match = abc_pattern.search(user_question)
            if abc_match:
                global abc_notation
                abc_notation = abc_match.group(0)  # Extraer la notación detectada

                unique_id = str(uuid.uuid4())[:8]
                abc_file_path = os.path.join(TEMP_DIR, f"notation_{unique_id}.abc.txt")
                with open(abc_file_path, "w") as f:
                    f.write(abc_notation)
                
                # Responder para redirigir al visor ABC
                yield "ABC notation detected"
                #return

            try:
                # Generar la respuesta usando la conversación con memoria (la cadena añade el historial automáticamente)
                response = conversation.run(full_prompt) #anteriorment hi havia user_question.

                # Simular respuesta progresiva, enviándola por partes
                for chunk in response.split(" "):
                    yield f"{chunk} "
                    time.sleep(0.1)  # Simular retraso para streaming

            except Exception as e:
                yield f"Error generating response: {str(e)}"

        print("Returning streaming response...")
        return Response(stream_with_context(generate_response()), content_type="text/event-stream")

    except Exception as e:
        return jsonify({"response": f"Errrror: {str(e)}"}), 500


@app.route('/get_abc', methods=['GET'])
def get_abc():
    abc_files = sorted(
        [f for f in os.listdir(TEMP_DIR) if f.endswith(".abc.txt")],
        key=lambda x: os.path.getmtime(os.path.join(TEMP_DIR, x)),
        reverse=True
    )
    if abc_files:
        return send_file(os.path.join(TEMP_DIR, abc_files[0]), as_attachment=False, mimetype='text/plain')
    return jsonify({'error': 'No ABC notation available.'}), 404







if __name__ == '__main__':
    app.run(debug=True)
