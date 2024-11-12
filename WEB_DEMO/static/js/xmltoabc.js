// Importa ABC.js como un módulo ES6
import abcjs from 'https://cdn.jsdelivr.net/npm/abcjs@6.4.4/+esm';

document.getElementById('upload-form').addEventListener('submit', function(event) {
    event.preventDefault();

    var fileInput = document.getElementById('file');
    var formData = new FormData();
    formData.append('file', fileInput.files[0]);

    // Enviar el archivo al servidor
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            // Mostrar el contenido ABC en texto y en partitura
            document.getElementById('abc-text').textContent = data.abc;

            if (data.abc.includes("K:") || data.abc.includes("X:")) {
                // Asegura que el área de partitura sea lo suficientemente grande para evitar que se corte
                abcjs.renderAbc("abc-render", data.abc, { responsive: "resize" });
            } else {
                alert("El archivo convertido no parece estar en formato ABC legible.");
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});
// Función para actualizar la partitura desde el área de texto
document.getElementById('update-btn').addEventListener('click', function() {
    const updatedAbc = document.getElementById('abc-text').value;

    fetch('/update_abc', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ abc: updatedAbc })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            abcjs.renderAbc("abc-render", updatedAbc, { responsive: "resize" });
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});