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

pre_super_prompt = """
<<SYSTEM MESSAGE START>>  
You are an expert ABC-notation generator.  
**STRICTLY** output **only** the ABC notation block (no comments, no reasoning, no extra tokens).  
<<SYSTEM MESSAGE END>>

You are an expert ABC‑notation parser and generator. Here are some instructions of how ABC notation works, read carefully:

1. Read or build files with two parts:  
   • Header (metadata), fields on separate lines in this order **in this exact order**:  
    X:<index>  
    T:<title> (multiple lines ok)  
    M:<meter> (e.g. 4/4, 6/8, C, C|)  
    L:<default note length> (fraction e.g. 1/8, 1/4)  
    [Optional fields: R:<rhythm>, Q:<tempo>, C:<composer>, S:<source>, O:<origin>, N:<notes>, Z:<transcriber>, W:<lyrics>, B:<book>]  
    K:<key> (e.g. G, Gm, C, Dorian, A =C, HP)  

2. Body (melody text) **— ensure each bar’s total equals exactly the meter’s unit count**:  
   • Notes A–G uppercase = octave at/below middle C; lowercase = above.  
   • Octave shifts: comma "," lowers one; apostrophe “ʼ” raises one (repeat for more).  
   • Durations based on L:
     - Numbers after a note indicate multiples of the base length (L: field). For instance, C2 means a note twice the base length.  
     - Shorten: append “/” or “/n” (C/, C/2, C/4…)  **Explicit divisors**: “/” or “/n” (C/, C/2, C/4…). 
     - Lengthen: append integer (C2, C3, C4…)  **Explicit multipliers**: integer after note (C2 = 2× base length).
     - Rests: “z” + same modifiers (z4, z/2…)  
   • Dotted rhythms: “>” lengthens first note 1.5× and shortens the next; “<” does inverse. (Example: "A>F" "B<D") 

3. Accidentals & key signatures:
   • The accidental ALWAYS goes BEFORE the note we want to alterate "_C" or "^F" 
   • Prefix note: ^ = sharp, ^^ = double‑sharp; _ = flat, __ = double‑flat; = = natural.  
   • Global key in K: applies accidentals, supports modes full or 3‑letter, case‑insensitive. 
   • NEVER use "#" or "b" for accidentals, the only correct characters for this alterations are ^ = sharp, ^^ = double‑sharp; _ = flat, __ = double‑flat; = = natural.

4. Barlines & repeats:  
   • “|” single, “||” double.  
   • Repeats: “|: … :|”, “::” shortcut.  
   • Numbered: “[1 … :| [2 …” (omit extra “|” if aligns).
   • A compass is delimited by two bars "| |". 

   5. Common time (4/4): four quarter-note beats per measure, with a primary accent on beat 1 and a secondary on beat 3. In ABC notation, declare  
    ```
    M:4/4    % sets meter to common time
    ```
    If you use  
    ```
    L:1/8    % default note length = eighth note
    ```
    then a quarter-note is written as `2` (two eighths), and each bar must total `8` units.  
    Example:
    ```
    X:1
    M:4/4
    L:1/8
    K:C
    C2 D2 E2 F2 | G2 A2 B2 c2 ||
    ```

    Example:
    ```
    X:1
    T:Progression
    M:4/4
    L:1/8
    K:C
    C2 E2 G2 E2 | F2 A2 c2 A2 | G2 B2 d2 B2 | E2 G2 C2 z2 ||
    ```

---
"""

post_super_prompt = """ 

TASK_TEMPLATE:
Use this template **EXACTLY** to make the task:

X: 1
T: 
R: reel
M: 4/4
L: 1/8
K:
|here the notes| %compass1: (here sum note units)
|here the notes | %compass2: (here sum note units)
|here the notes|| %compass3: (here sum note units)

**VALIDATION(internal):**  
After the ABC block, add a line:  
Validation: bar1=8, bar2=8, bar3=8

**IMPORTANT FINAL INSTRUCTIONS**
- Use explicit durations (numeric values).
- Ensure each compass sums to EXACTLY 8 units.
- **ONLY OUTPUT THE ABC NOTATION BLOCK**, with no leading or trailing commentary or analysis.
- If you reason, do not print it. **Your single final response must be the ABC text only.**
"""


app = Flask(__name__)
TEMP_DIR = os.path.join(os.path.abspath(os.path.dirname(__file__)), "temporal_files")
os.makedirs(TEMP_DIR, exist_ok=True)


# Configurar el model
prompt = ChatPromptTemplate.from_template("""Question: {question}

Answer:
(Please work through the problem step by step in your internal reasoning, but do not print those private thoughts. When you’ve finished thinking, output only the final reasoning under the heading "Final Reasoning:”.)""")

#prompt = ChatPromptTemplate.from_template("""Question: {question}""") #per veure si canvia i no raona tant i va més al punt.
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
        full_prompt = pre_super_prompt +  "\nTASK:\n" + user_question+post_super_prompt
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
