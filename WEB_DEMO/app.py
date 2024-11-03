from flask import Flask, render_template, request, jsonify
import os
import subprocess
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Directorio para archivos temporales
TEMP_DIR = "temp_files"
os.makedirs(TEMP_DIR, exist_ok=True)  # Crea la carpeta si no existe

# Ruta para la página principal
@app.route('/')
def index():
    return render_template('index.html')

# Ruta para manejar la subida de archivos y la conversión
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    # Guardar el archivo en la carpeta 'temp_files'
    filename = secure_filename(file.filename)
    input_path = os.path.join(TEMP_DIR, filename)
    file.save(input_path)

    # Definir el archivo de salida
    output_filename = f"{os.path.splitext(filename)[0]}.abc"
    output_path = os.path.join(TEMP_DIR, output_filename)
    FILE_PATH = os.path.join(TEMP_DIR, "xmlfile.abc", "xmlfile.abc")

    print(input_path)
    print(output_path)
    try:
        # Construir el comando para ejecutar xml2abc.py con los argumentos necesarios
        command = [
            "python3.8", "./static/scripts/xml2abc.py",
            input_path, "-x", "-u", "-c", "6", "-n", "80", "-m", "0", "-o", output_path
        ]

        # Ejecutar el comando y capturar cualquier salida o error
        result = subprocess.run(command, capture_output=True, text=True)

        # Verificar si hubo un error en la ejecución
        if result.returncode != 0:
            return jsonify({'error': result.stderr})

        # Leer el contenido del archivo ABC generado
        with open(FILE_PATH, 'r') as f:
            abc_content = f.read()

        # Devolver el contenido ABC como respuesta
        return jsonify({'abc': abc_content})

    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
