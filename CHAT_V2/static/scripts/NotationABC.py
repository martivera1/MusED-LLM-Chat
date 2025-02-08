# import re

# def ordenar_abcjs(input_text):
#     """
#     Reordena la notación ABCJS para que quede en el formato esperado.
    
#     Para los tokens:
#       - Los encabezados fijos (X:, T:, L:, M:, I:, K:) se dejan tal como están.
#       - Los tokens V: se separan en dos líneas si en su contenido aparece una barra '|'.
#       - Los tokens w: se dividen en dos líneas, separando el encabezado (hasta el último carácter '|' de la parte de cabecera)
#         y el contenido, que se coloca en la línea siguiente con indentación.
#     """
#     # Separamos la cadena en tokens cada vez que aparece alguno de los marcadores conocidos.
#     tokens = re.split(r'(?=(?:X:|T:|M:|L:|K:|I:|V:|w:))', input_text)
#     processed_tokens = []
    
#     for token in tokens:
#         token = token.strip()
#         if not token:
#             continue

#         if token.startswith("V:"):
#             # Para tokens V:, se separa si se detecta al menos una barra en el contenido.
#             m = re.match(r'^(V:\S+)\s+(.*)$', token)
#             if m and "|" in m.group(2):
#                 header = m.group(1)
#                 content = m.group(2).strip()
#                 processed_tokens.append(header)
#                 processed_tokens.append(" " + content)
#             else:
#                 processed_tokens.append(token)
        
#         elif token.startswith("w:"):
#             # Para tokens w:, buscamos capturar la parte de encabezado que termina en uno o más '|'
#             # y el resto del contenido.
#             m = re.match(r'^(w:\s*.*?\|+)\s+(.*)$', token)
#             if m:
#                 header = m.group(1)
#                 content = m.group(2).strip()
#                 processed_tokens.append(header)
#                 processed_tokens.append(" " + content)
#             else:
#                 processed_tokens.append(token)
        
#         else:
#             # Otros encabezados se dejan sin cambios.
#             processed_tokens.append(token)
    
#     # Reordenar: colocar primero los encabezados fijos (X:, T:, L:, M:, I:, K:)
#     header_order = {"X:": None, "T:": None, "L:": None, "M:": None, "I:": None, "K:": None}
#     others = []
#     for token in processed_tokens:
#         found = False
#         for key in header_order:
#             if token.startswith(key):
#                 header_order[key] = token
#                 found = True
#                 break
#         if not found:
#             others.append(token)
    
#     final_lines = []
#     for key in ["X:", "T:", "L:", "M:", "I:", "K:"]:
#         if header_order[key]:
#             final_lines.append(header_order[key])
#     final_lines.extend(others)
    
#     return "\n".join(final_lines)

# def guardar_en_archivo(contenido, nombre_archivo="notacion_abc_corregida.txt"):
#     """
#     Guarda el contenido en un archivo de texto.
    
#     :param contenido: La notación ABC ya ordenada.
#     :param nombre_archivo: Nombre del archivo destino.
#     """
#     with open(nombre_archivo, "w", encoding="utf-8") as archivo:
#         archivo.write(contenido)
#     print(f"La notación ABC corregida se ha guardado en '{nombre_archivo}'.")

# # Ejemplo de uso:
# input_text = (
#     "X: 1 T: Cooley's M: 4/4 L: 1/8 R: reel K: Emin |:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD| EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:| |:gf|eB B2 efge|eB B2 gedB|A2 FA DAFA|A2 FA defg| eB B2 eBgB|eB B2 defg|afe^c dBAF|DEFD E2:|"

# )

# notacion_corregida = ordenar_abcjs(input_text)
# print("=== NOTACIÓN CORREGIDA ===")
# print(notacion_corregida)
# guardar_en_archivo(notacion_corregida)
import re

def ordenar_abcjs(input_text):
    """
    Para la notación ABC en una sola línea, separa la parte de encabezados (X:, T:, M:, L:, R:, K:)
    y la parte de notación musical (a partir del primer '|'). Luego, inserta saltos de línea:
      - En los encabezados, para que cada campo quede en su propia línea.
      - En el cuerpo, donde se encuentre una barra vertical seguida de espacio.
    
    Ejemplo de entrada:
      X: 1 T: Cooley's M: 4/4 L: 1/8 R: reel K: Emin |:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD| EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:| |:gf|eB B2 efge|eB B2 gedB|A2 FA DAFA|A2 FA defg| eB B2 eBgB|eB B2 defg|afe^c dBAF|DEFD E2:|
    
    Resultado esperado:
      X: 1
      T: Cooley's
      M: 4/4
      L: 1/8
      R: reel
      K: Emin
      |:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD|
      EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:|
      |:gf|eB B2 efge|eB B2 gedB|A2 FA DAFA|A2 FA defg|
      eB B2 eBgB|eB B2 defg|afe^c dBAF|DEFD E2:|
    """
    # 1. Separamos el bloque de encabezados del cuerpo.
    # Suponemos que la notación musical comienza en la primera aparición de una barra vertical.
    pos = input_text.find("|")
    if pos != -1:
        header_block = input_text[:pos].strip()
        body_block = input_text[pos:].strip()
    else:
        header_block = input_text.strip()
        body_block = ""
    
    # 2. Insertar saltos de línea en el bloque de encabezados.
    # Se asume que los encabezados son: X:, T:, M:, L:, R:, K:
    # Para ello, insertamos un salto de línea antes de cada uno (excepto el primero "X:")
    for key in ["T:", "M:", "L:", "R:", "K:"]:
        header_block = re.sub(r'\s*' + re.escape(key), r'\n' + key, header_block)
    
    header_block = header_block.strip()
    
    # 3. En el cuerpo, insertamos un salto de línea después de una barra vertical seguida de espacio.
    # Esto rompe el cuerpo en líneas donde se esperan cambios de sistema.
    body_block = re.sub(r'(\|)\s+', r'\1\n', body_block).strip()
    
    # 4. Combinar encabezados y cuerpo
    if body_block:
        return header_block + "\n" + body_block
    else:
        return header_block

def guardar_en_archivo(contenido, nombre_archivo="notacion_abc_corregida.txt"):
    """
    Guarda el contenido en un archivo de texto.
    """
    with open(nombre_archivo, "w", encoding="utf-8") as archivo:
        archivo.write(contenido)
    print(f"La notación ABC corregida se ha guardado en '{nombre_archivo}'.")

# Ejemplo de uso con el nuevo caso:
input_text = (
    "X:1 T:Title L:1/8 M:4/4 I:linebreak K:F V:1 treble nm=\"Voice\" V:1 d'bge fedc | fafa .c'.a.c'.a | _egeg .b.g.b.g | fafa .c'.a.c'.a | d'bge f4 |] (d'4 b4) | z8 | %7 w: |||||Fingering1 *|| (d'4 b4) | z8 | (g4 e4) | z8 | (g4 e4) | (d'2 b2) z4 | (d'2 b2) z4 | (g2 e2) z4 | (g2 e2) z4 | %16 w: |||||Fingering2 *|||| (d'b) z2 (ge) z2 | d'b z2 ge z2 | d'2 b2 g2 e2 | z8 | d'2 b2 g2 e2 | z8 | (d'b)(ge) z4 | %23 w: Fingering3 * * *||Fingering3 * * *||||Fingering4 * * *| !tenuto!d'!tenuto!b!tenuto!g!tenuto!e z4 | .d'.b.g.e z4 | %25 w: ||"

)

notacion_corregida = ordenar_abcjs(input_text)
print("=== NOTACIÓN CORREGIDA ===")
print(notacion_corregida)
guardar_en_archivo(notacion_corregida)
