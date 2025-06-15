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


prompt = ChatPromptTemplate.from_template("""Question: {question}

Answer:
(Please work through the problem step by step in your internal reasoning, but do not print those private thoughts. When you’ve finished thinking, output only the final reasoning under the heading "Final Reasoning:”.)""")

model = OllamaLLM(model="llama3.1:8b")
memory = ConversationBufferMemory(memory_key="history", return_messages=True)
conversation = ConversationChain(llm=model, memory=memory)
chain = prompt | model


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/ask', methods=['POST'])
def ask():

    try:
        data = request.get_json()
        user_question = data.get("question", "")
        use_super = data.get("use_super",True)
        use_text = data.get("use_text",False)
        use_empty = data.get("use_empty", False)
        
        print(f"Received question: {user_question}")
        
        
        if use_text:
            pre_prompt = load_txt_as_str("prompts/text_prompt.txt")
            print("\033[92m" + "✅ LYRICS PROMPT ACTIVATED" + "\033[0m")

        elif use_super:
            pre_prompt = load_txt_as_str("prompts/super_prompt.txt")
            print("\033[93m" + "🔼 SUPER PROMPT ACTIVATED" + "\033[0m")

        elif use_empty:
            pre_prompt = load_txt_as_str("prompts/empty_prompt.txt")
            print("🟡 EMPTY PROMPT ACTIVATED")

        else:
            pre_prompt = ""
            print("\033[91m" + "⚠️ NO PROMPT" + "\033[0m")
            

        full_prompt = pre_prompt + user_question if pre_prompt else user_question
        if not user_question:
            return jsonify({"response": "Please provide a question."})
        

        def generate_response():

            try:
                response = conversation.run(full_prompt)
                for chunk in response.split(" "):
                    yield f"{chunk} "
                    time.sleep(0.1)

            except Exception as e:
                yield f"Error generating response: {str(e)}"

        print("Returning streaming response...")
        return Response(stream_with_context(generate_response()), content_type="text/event-stream")

    except Exception as e:
        return jsonify({"response": f"Errrror: {str(e)}"}), 500



@app.route('/reset_chat', methods=['POST'])
def reset_chat():
    try:
        global conversation
        conversation = ConversationChain(
            llm=model,
            memory=ConversationBufferMemory(memory_key="history", return_messages=True)
        )
        
        
        print("\033[92m" + "✅ Conversación reiniciada" + "\033[0m")
        return jsonify({"status": "success"}), 200
    
    except Exception as e:
        print("\033[91m" + f"⚠️ Error al reiniciar: {str(e)}" + "\033[0m")
        return jsonify({"status": "error", "message": str(e)}), 500




if __name__ == '__main__':
    app.run(debug=True)
