from abc_xml_converter import convert_xml2abc
import os

def convert_xml_to_abc(input_file_path, output_directory):
    """
    Convierte un archivo XML a ABC, elimina los caracteres '$' y lo guarda en el directorio especificado.
    :param input_file_path: Ruta del archivo XML a convertir.
    :param output_directory: Directorio donde se guardará el archivo convertido.
    :return: Ruta del archivo convertido sin los caracteres '$'.
    """
    try:
        # Convertir el archivo XML a ABC
        output_filename = f"{os.path.splitext(os.path.basename(input_file_path))[0]}.abc"
        output_path = os.path.join(output_directory, output_filename)
        
        # Convertir el archivo XML a ABC y guardarlo en el directorio de salida
        convert_xml2abc(file_to_convert=input_file_path, output_directory=output_directory)

        # Leer el contenido del archivo ABC generado
        with open(output_path, 'r', encoding='utf-8') as file:
            abc_content = file.read()

        # Eliminar todos los caracteres '$'
        abc_content = abc_content.replace('$', '')

        # Sobrescribir el archivo con el contenido limpio
        with open(output_path, 'w', encoding='utf-8') as file:
            file.write(abc_content)

        return output_path  # Devolver la ruta del archivo ABC convertido

    except Exception as e:
        raise RuntimeError(f"Error al convertir XML a ABC: {e}")