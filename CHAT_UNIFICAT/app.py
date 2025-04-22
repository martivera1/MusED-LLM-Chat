import os
import re
import uuid
import time
from flask import Flask, render_template, request, jsonify, send_file, Response, stream_with_context
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama.llms import OllamaLLM
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory

super_prompt = """You are an expert ABC‑notation parser and generator. Here are some instructions of how ABC notation works, read carefully:

1. Read or build files with two parts:  
   • Header (metadata), fields on separate lines in this order:  
    X:<index>  
    T:<title> (multiple lines ok)  
    M:<meter> (e.g. 4/4, 6/8, C, C|)  
    L:<default note length> (fraction e.g. 1/8, 1/4)  
    [Optional fields: R:<rhythm>, Q:<tempo>, C:<composer>, S:<source>, O:<origin>, N:<notes>, Z:<transcriber>, W:<lyrics>, B:<book>]  
    K:<key> (e.g. G, Gm, C#, Dorian, A =C, HP)  

2. Body (melody text):  
   • Notes A–G uppercase = octave at/below middle C; lowercase = above.  
   • Octave shifts: comma "," lowers one; apostrophe “ʼ” raises one (repeat for more).  
   • Durations based on L:
     - Numbers after a note indicate multiples of the base length (L: field). For instance, C2 means a note twice the base length.  
     - Shorten: append “/” or “/n” (C/, C/2, C/4…)  
     - Lengthen: append integer (C2, C3, C4…)  
     - Rests: “z” + same modifiers (z4, z/2…)  
   • Dotted rhythms: “>” lengths first note & shortens next; “<” does inverse.  

3. Accidentals & key signatures:  
   • Prefix note: ^ = sharp, ^^ = double‑sharp; _ = flat, __ = double‑flat; = = natural.  
   • Global key in K: applies accidentals, supports modes full or 3‑letter, case‑insensitive.  

4. Barlines & repeats:  
   • “|” single, “||” double.  
   • Repeats: “|: … :|”, “::” shortcut.  
   • Numbered: “[1 … :| [2 …” (omit extra “|” if aligns).  

7. When generating or parsing, always maintain spacing for readability.

Example minimal ABC tune your output must match:  
X:1  
T:My Tune  
M:4/4  
L:1/8  
K:G  
GABc d2e2|f2g2 g4||

Another example:  
X:1  
T:Beams  
M:4/4  
L:1/8  
K:C  
A B c d AB cd|ABcd ABc2|]  

---
"""


app = Flask(__name__)
TEMP_DIR = os.path.join(os.path.abspath(os.path.dirname(__file__)), "temporal_files")
os.makedirs(TEMP_DIR, exist_ok=True)


# Configurar el model
prompt = ChatPromptTemplate.from_template("""Question: {question}\n\nAnswer: Let's think step by step.""")
model = OllamaLLM(model="llama3.1")
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
    try:
        data = request.get_json()
        user_question = data.get("question", "")
        print(f"Received question: {user_question}")
        if not user_question:
            return jsonify({"response": "Please provide a question."})

        # Regex mejorado para detectar notación ABC en cualquier parte del mensaje
        abc_pattern = re.compile(r"X:\d+\s+T:.*\s+L:\d+/\d+\s+M:\d+/\d+\s+I:linebreak\s+K:[A-G][#b]?.*(\||\|{2})", re.DOTALL)
        full_prompt = super_prompt + "\nTASK:\n" + user_question
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
