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

            // if (data.abc.includes("K:") || data.abc.includes("X:")) {
            //     // Asegura que el área de partitura sea lo suficientemente grande para evitar que se corte
            //     abcjs.renderAbc("abc-render", data.abc, { responsive: "resize" });
            // } else {
            //     alert("El archivo convertido no parece estar en formato ABC legible.");
            // }
            if (data.abc.includes("K:") || data.abc.includes("X:")) {
                // Asegura que el área de partitura sea lo suficientemente grande para evitar que se corte
                const renderElement = document.getElementById('abc-render');
                const containerWidth = renderElement.offsetWidth; // Ancho del contenedor
                
                // Ajustar dinámicamente CSS si es necesario
                renderElement.style.width = "100%"; // O un valor más específico como "800px"
                renderElement.style.minHeight = "400px"; // Garantiza suficiente espacio vertical
            
                // Renderiza la partitura ajustada al ancho del contenedor
                abcjs.renderAbc("abc-render", data.abc, {
                    responsive: "resize",
                    staffwidth: containerWidth // Asegura que la partitura se ajuste al ancho disponible
                });
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

// // Función para guardar la partitura como PDF
// document.getElementById('save-pdf').addEventListener('click', async function() {
//     // Captura el elemento de la partitura en una imagen usando html2canvas
//     const abcRenderElement = document.getElementById('abc-render');
//     const canvas = await html2canvas(abcRenderElement, {
//         backgroundColor: "#FFFFFF"
//     });

//     // Convierte el canvas a una imagen PNG
//     const imgData = canvas.toDataURL('image/png');

//     // Configura y crea el PDF con jsPDF
//     const { jsPDF } = window.jspdf;
//     const pdf = new jsPDF('portrait', 'px', 'a4');

//     // Ajusta el tamaño de la imagen en el PDF
//     const pdfWidth = pdf.internal.pageSize.getWidth();
//     const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

//     pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
//     pdf.save('partitura.pdf'); // Guarda el PDF con el nombre 'partitura.pdf'
// });

// Función para guardar la partitura como PDF
document.getElementById('save-pdf').addEventListener('click', async function () {
    const abcRenderElement = document.getElementById('abc-render');

    // Usa html2canvas para capturar el contenido visible de #abc-render
    const canvas = await html2canvas(abcRenderElement, {
        backgroundColor: "#FFFFFF",
        scale: 2 // Aumenta la calidad del renderizado
    });

    // Convierte el canvas a una imagen
    const imgData = canvas.toDataURL('image/png');

    // Configuración inicial del PDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('portrait', 'px', 'a4'); // PDF en modo vertical (A4)

    const pdfWidth = pdf.internal.pageSize.getWidth(); // Ancho de la página A4
    const pdfHeight = pdf.internal.pageSize.getHeight(); // Altura de la página A4
    const imgWidth = pdfWidth; // Ajusta la imagen al ancho del PDF
    const imgHeight = (canvas.height * pdfWidth) / canvas.width; // Mantén la proporción

    let yOffset = 0; // Desplazamiento vertical inicial

    // Si la imagen es más alta que el PDF, divide en páginas
    while (yOffset < imgHeight) {
        const visibleHeight = Math.min(imgHeight - yOffset, pdfHeight); // Altura visible en la página
        const canvasPart = document.createElement('canvas');
        canvasPart.width = canvas.width;
        canvasPart.height = (visibleHeight * canvas.width) / pdfWidth;

        // Dibuja la parte visible del canvas
        const ctx = canvasPart.getContext('2d');
        ctx.drawImage(canvas, 0, yOffset, canvas.width, canvasPart.height, 0, 0, canvasPart.width, canvasPart.height);

        // Añade la imagen al PDF
        const partImgData = canvasPart.toDataURL('image/png');
        pdf.addImage(partImgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        yOffset += pdfHeight; // Mueve el desplazamiento
        if (yOffset < imgHeight) {
            pdf.addPage(); // Añade una nueva página si queda contenido
        }
    }

    // Guarda el PDF
    pdf.save('partitura.pdf');
});
