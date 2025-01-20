from flask import Flask, render_template, request, jsonify
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama.llms import OllamaLLM

app = Flask(__name__)

template = """Question: {question}

Answer: Let's think step by step."""

prompt = ChatPromptTemplate.from_template(template)
model = OllamaLLM(model="llama3.1")
chain = prompt | model

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ask', methods=['POST'])
def ask():
    try:
        data = request.get_json()
        user_question = data.get("question", "")

        if not user_question:
            return jsonify({"response": "Please provide a question."})

        # Process the question with the model
        response = chain.invoke({"question": user_question})
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"response": f"Error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
