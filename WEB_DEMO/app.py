# from flask import Flask, request, jsonify, render_template
# import subprocess
# import os

# app = Flask(__name__)

# @app.route('/')
# def serve_index():
#     print("Serving index.html")
#     return render_template('index.html')  # Serve index.html from the templates folder

# @app.route('/convert', methods=['POST'])
# def convert():
#     data = request.get_json()
#     file_content = data.get('fileContent')

#     # Define temporary input and output file paths
#     input_file = r"C:/Users/Martí/OneDrive/Desktop/UPF/4rt/TFG/testxml.mxl"  # Temporary input file
#     output_file = r"C:/Users/Martí/OneDrive/Desktop/UPF/4rt/TFG/output.abc"  # Output file

#     print("Writing content to temporary input file...")
#     # Write the content to the temporary input file
#     with open(input_file, 'w') as f:
#         f.write(file_content)

#     python_path = r"C:/Users/Martí/AppData/Local/Programs/Python/Python38/python.exe"

#     # Command to run xml2abc.py
#     command = [
#         python_path, r'C:/Users/Martí/OneDrive/Desktop/UPF/4rt/TFG/static/scripts/xml2abc.py',
#         input_file,
#         '-x', '-u', '-c', '6', '-n', '80', '-m', '0', '-o', output_file
#     ]

#     print(f"Executing command: {' '.join(command)}")
    
#     # Execute the command
#     try:
#         subprocess.run(command, check=True)
#         print("Command executed successfully.")

#         # Read the output ABC notation
#         print("Reading output from ABC file...")
#         with open(output_file, 'r') as f:
#             abc_notation = f.read()
        
#         print("ABC notation successfully retrieved.")
#         return jsonify({'abcNotation': abc_notation})

#     except subprocess.CalledProcessError as e:
#         print(f"Error executing command: {e}")
#         return jsonify({'error': str(e)}), 500
#     finally:
#         # # Clean up temporary files
#         # print("Cleaning up temporary files...")
#         # if os.path.exists(input_file):
#         #     os.remove(input_file)
#         #     print(f"Deleted temporary input file: {input_file}")
#         # if os.path.exists(output_file):
#         #     os.remove(output_file)
#         #     print(f"Deleted output file: {output_file}")
#         print("done")

# if __name__ == '__main__':
#     app.run(debug=True)
from flask import Flask, request, jsonify, render_template
from pathlib import Path
import subprocess
import os


app = Flask(__name__)

@app.route('/')
def serve_index():
    return render_template('index.html')  # Serve index.html from the templates folder

@app.route('/convert', methods=['POST'])
def convert():
    data = request.get_json()
    file_content = data.get('fileContent')

    # Define temporary input and output file paths
    input_file = Path("C:/Users/Martí/OneDrive/Desktop/UPF/4rt/TFG/testxml.mxl")
    output_file = Path("C:/Users/Martí/OneDrive/Desktop/UPF/4rt/TFG/output.abc")
    xml2abc_path = Path("C:/Users/Martí/OneDrive/Desktop/UPF/4rt/TFG/static/scripts/xml2abc.py")
    python_executable = Path("C:/Users/Martí/AppData/Local/Programs/Python/Python38/python.exe")

    # Write the content to the temporary input file
    with open(input_file, 'w', encoding='utf-8') as f:
        f.write(file_content)

    # Print paths for debugging
    print(f"Input File: {input_file}")
    print(f"Output File: {output_file}")
    print(f"XML2ABC Path: {xml2abc_path}")

    # Command to run xml2abc.py
    command = [
        str(python_executable),
        str(xml2abc_path),
        str(input_file),
        '-x', '-u', '-c', '6', '-n', '80', '-m', '0', '-o', str(output_file)
    ]

    print(f"Running command: {command}")  # Debug print

    # Execute the command
    try:
        result = subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print("Command executed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {e}")
        print(f"Output: {e.output.decode()}")
        print(f"Error Output: {e.stderr.decode('latin-1', errors='replace')}")
        return jsonify({'error': str(e)}), 500

    # Read the output ABC notation
    with open(output_file, 'r', encoding='utf-8') as f:
        abc_notation = f.read()
    
    return jsonify({'abcNotation': abc_notation})

if __name__ == '__main__':
    app.run(debug=True)
