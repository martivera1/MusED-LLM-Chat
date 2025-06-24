import abcjs from 'https://cdn.jsdelivr.net/npm/abcjs@6.4.4/+esm';

document.getElementById('upload-form').addEventListener('submit', function(event) {
    event.preventDefault();

    var fileInput = document.getElementById('file');
    var formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            document.getElementById('abc-text').textContent = data.abc;

            
            if (data.abc.includes("K:") || data.abc.includes("X:")) {
                // Asegura que el área de partitura sea lo suficientemente grande para evitar que se corte
                const renderElement = document.getElementById('abc-render');
                const containerWidth = renderElement.offsetWidth; // Ancho del contenedor
                
                renderElement.style.width = "100%"; // O un valor más específico como "800px"
                renderElement.style.minHeight = "400px"; // Garantiza suficiente espacio vertical
            
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



document.getElementById('save-pdf').addEventListener('click', async function () {
    const abcRenderElement = document.getElementById('abc-render');

    const canvas = await html2canvas(abcRenderElement, {
        backgroundColor: "#FFFFFF",
        scale: 4
    });

    const imgData = canvas.toDataURL('image/png');

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('portrait', 'mm', 'a4'); // Modo vertical

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let yOffset = 0;

    while (yOffset < imgHeight) {
        const remainingHeight = imgHeight - yOffset;
        const visibleHeight = Math.min(remainingHeight, pdfHeight);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = (visibleHeight * canvas.width) / pdfWidth;

        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(
            canvas,
            0, yOffset, 
            canvas.width, tempCanvas.height, 
            0, 0, 
            tempCanvas.width, tempCanvas.height 
        );


        const partImgData = tempCanvas.toDataURL('image/png');
        pdf.addImage(partImgData, 'PNG', 0, 0, imgWidth, (visibleHeight * imgWidth) / pdfWidth);


        yOffset += visibleHeight; 

    
        if (yOffset < imgHeight) {
            pdf.addPage(); 
        }
    }


    pdf.save('score.pdf');
});

