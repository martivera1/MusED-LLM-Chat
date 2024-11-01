#from music21 import *

# def convert_to_abc(file_path):
#     # Load the file (MIDI/XML)
#     score = converter.parse(file_path)
    
#     # Convert to ABC notation
#     abc_string = score.write('abc')
#     return abc_string

# def save_abc_to_file(abc_string, output_path):
#     with open(output_path, 'w') as f:
#         f.write(abc_string)

# # Example usage:
# file_path = 'C:/Users/Martí/OneDrive/Desktop/UPF/4rt/TFG/MIDI_XML_to_ABC/Chopin+-+Nocturne+op.9+No.2.midi'  # or .midi
# output_path = 'C:/Users/Martí/OneDrive/Desktop/UPF/4rt/TFG/MIDI_XML_to_ABC/output.txt'
# abc_string = convert_to_abc(file_path)
# save_abc_to_file(abc_string, output_path)
from music21 import *

from music21 import converter

def convert_midi_to_abc(file_path):
    # Load the file (MIDI/XML)
    score = converter.parse(file_path)

    # Write the score to ABC format
    abc_string = score.write('abc')
    
    return abc_string

def save_abc_to_file(abc_string, output_path):
    with open(output_path, 'w') as f:
        f.write(abc_string)



# Example usage:
file_path = 'C:/Users/Martí/OneDrive/Desktop/UPF/4rt/TFG/MIDI_XML_to_ABC/Henri+Kling,+Etude+#9+from+40+Characteristic+Etudes++Scott+Leger,+Horn.midi'  # or .midi
output_path = 'C:/Users/Martí/OneDrive/Desktop/UPF/4rt/TFG/MIDI_XML_to_ABC/output.abc'
abc_string = convert_midi_to_abc(file_path)
save_abc_to_file(abc_string, output_path)

