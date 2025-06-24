from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import subprocess
from werkzeug.utils import secure_filename
from static.scripts.new_xml2abc import convert_xml_to_abc

app = Flask(__name__)

TEMP_DIR = os.path.join(os.path.dirname(__file__), 'temp_files') #"temp_files"
STATIC_SCRIPTS_DIR = "static/scripts"  

os.makedirs(TEMP_DIR, exist_ok=True)  


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    
    filename = secure_filename(file.filename)
    input_path = os.path.join(TEMP_DIR, filename)
    file.save(input_path)

    try:
    
        output_path = convert_xml_to_abc(input_path, TEMP_DIR)

        
        with open(output_path, 'r', encoding='utf-8') as f:
            abc_content = f.read()

       
        return jsonify({'abc': abc_content})

    except Exception as e:
        return jsonify({'error': str(e)})
    
@app.route('/update_abc', methods=['POST'])
def update_abc():
    data = request.get_json()

    if 'abc' not in data:
        return jsonify({'error': 'No ABC data provided'}), 400

    abc_content = data['abc']
    
    return jsonify({'abc': abc_content})

if __name__ == '__main__':
    app.run(debug=True)
