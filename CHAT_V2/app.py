from flask import Flask, render_template, request, jsonify,url_for
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama.llms import OllamaLLM

app = Flask(__name__)

template = """Question: {question}

Answer: Let's think step by step."""

prompt = ChatPromptTemplate.from_template(template)
model = OllamaLLM(model="llama3.1")
chain = prompt | model

abc_notation = "X:1T:Test TitleL:1/8M:4/4I:linebreakK:C"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/canvas')
def canvas():
    return render_template('canvas.html')


@app.route('/ask', methods=['POST'])
def ask():
    try:
        data = request.get_json()
        user_question = data.get("question", "")

        if not user_question:
            return jsonify({"response": "Please provide a question."})
        
        # Detectar notación ABC con una expresión regular básica
        import re
        abc_pattern = re.compile(r"X:\d+\s+T:.*\s+L:\d+/\d+\s+M:\d+/\d+\s+I:linebreak\s+K:[A-G][#b]?")
        if abc_pattern.search(user_question):
            abc_notation = user_question  # Guardar la notación ABC detectada
            return jsonify({"response": "ABC notation detected. Redirecting to canvas..."})
        
        # Process the question with the model
        response = chain.invoke({"question": user_question})
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"response": f"Error: {str(e)}"}), 500
    

@app.route('/get_abc', methods=['GET'])
def get_abc():
    # Devolver la notación ABC al cliente (si existe)
    global abc_notation
    print("Current abc_notation:", abc_notation)
    if abc_notation:
        return jsonify({'abc': abc_notation})
    return jsonify({'error': 'No ABC notation available.'}), 404


if __name__ == '__main__':
    app.run(debug=True)
