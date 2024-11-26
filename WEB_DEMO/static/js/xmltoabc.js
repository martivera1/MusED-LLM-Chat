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

// Función para guardar la partitura como PDF optimizado
document.getElementById('save-pdf').addEventListener('click', async function () {
    const abcRenderElement = document.getElementById('abc-render');

    // Configuración inicial para html2canvas
    const canvas = await html2canvas(abcRenderElement, {
        backgroundColor: "#FFFFFF",
        scale: 4 // Alta calidad para impresión
    });

    // Convertir el contenido capturado en una imagen
    const imgData = canvas.toDataURL('image/png');

    // Configuración inicial del PDF (tamaño A4 en milímetros)
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('portrait', 'mm', 'a4'); // Modo vertical

    // Dimensiones de la página A4
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

    // Dimensiones de la imagen (proporcional al tamaño A4)
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    // Variable para rastrear la posición de inicio de cada página
    let yOffset = 0;

    // Mientras haya contenido para agregar al PDF, seguimos dividiendo la imagen
    while (yOffset < imgHeight) {
        const remainingHeight = imgHeight - yOffset;
        const visibleHeight = Math.min(remainingHeight, pdfHeight);

        // Crear un canvas temporal para recortar partes de la imagen
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = (visibleHeight * canvas.width) / pdfWidth;

        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(
            canvas,
            0, yOffset, // Origen en la imagen principal (usamos yOffset para ajustar el inicio de cada página)
            canvas.width, tempCanvas.height, // Dimensiones a recortar
            0, 0, // Origen en el canvas temporal
            tempCanvas.width, tempCanvas.height // Dimensiones en el canvas temporal
        );

        // Añadir la parte recortada al PDF
        const partImgData = tempCanvas.toDataURL('image/png');
        pdf.addImage(partImgData, 'PNG', 0, 0, imgWidth, (visibleHeight * imgWidth) / pdfWidth);

        // Actualizamos el offset para la siguiente página
        yOffset += visibleHeight; // Mover el desplazamiento para la próxima página

        // Si aún hay contenido para agregar, se añade una nueva página
        if (yOffset < imgHeight) {
            pdf.addPage(); // Añadir nueva página si queda contenido
        }
    }

    // Guardar el PDF final
    pdf.save('score.pdf');
});

