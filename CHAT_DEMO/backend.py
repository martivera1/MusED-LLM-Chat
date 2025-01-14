from flask import Flask, render_template, request, jsonify
import random
# from transformers import AutoModelForCausalLM, AutoTokenizer
# import torch

app = Flask(__name__)

# Simulated chat responses
responses = [
    "That's an interesting question! Let me think about it.",
    "I'm not sure about that. Could you provide more context?",
    "Based on my knowledge, I would say...",
    "That's a complex topic. Here's what I understand:",
    "Great question! Here's my perspective:",
]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ask', methods=['POST'])
def ask():
    question = request.json['question']
    # For now, we'll just return a random response
    response = random.choice(responses)
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(debug=True)