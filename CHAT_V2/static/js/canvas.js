// document.addEventListener("DOMContentLoaded", () => {
//   // Elementos del DOM
//   const chatbox = document.getElementById("chatbox");
//   const input = document.getElementById("question");
//   const sendBtn = document.getElementById("send-btn");
//   const abcVisualization = document.getElementById("abc-visualization");

//   // Cargar partitura ABC desde localStorage
//   const abcNotation = localStorage.getItem("abcNotation");
//   if (abcNotation) {
//       renderABCNotation(abcNotation);
//       addMessageToChat("bot", "Aquí tienes tu partitura en formato ABC.");
//   }

//   // Enviar mensaje desde el canvas
//   sendBtn.addEventListener("click", () => {
//       const message = input.value.trim();
//       if (message) {
//           addMessageToChat("user", message);

//           // Respuesta genérica de la IA
//           setTimeout(() => {
//               addMessageToChat("bot", "Gracias por tu mensaje. Puedes enviarme otra partitura si lo deseas.");
//           }, 500);

//           input.value = "";
//       }
//   });

//   // Renderizar partitura con abcjs
//   function renderABCNotation(abc) {
//       abcjs.renderAbc("abc-visualization", abc);
//   }

//   // Añadir mensajes al chat
//   function addMessageToChat(sender, text) {
//       const messageDiv = document.createElement("div");
//       messageDiv.classList.add("message", sender);
//       messageDiv.innerHTML = `<p>${text}</p>`;
//       chatbox.appendChild(messageDiv);
//       chatbox.scrollTop = chatbox.scrollHeight;
//   }
// });
import abcjs from 'https://cdn.jsdelivr.net/npm/abcjs@6.4.4/+esm';

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM completamente cargado.");

    // Verifica que abcjs esté disponible
    if (typeof abcjs === "undefined") {
        console.error("Error: abcjs no está definido. Asegúrate de que la librería se haya cargado correctamente.");
        return;
    } else {
        console.log("abcjs está correctamente cargado.");
    }

    const chatbox = document.getElementById("chatbox");
    const questionInput = document.getElementById("question");
    const sendBtn = document.getElementById("send-btn");
    const abcContainer = document.getElementById("abc-container"); // Contenedor para la notación ABC en texto
    const abcRender = document.getElementById("abc-render"); // Contenedor para la partitura

    console.log("Elementos del DOM obtenidos:", { chatbox, questionInput, sendBtn, abcContainer, abcRender });

    // Cargar la notación ABC desde el backend
    try {
        console.log("Iniciando solicitud para obtener la notación ABC...");
        const response = await fetch("/get_abc");
        console.log("Respuesta recibida:", response);

        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Datos recibidos del backend:", data);

        if (data.abc) {
            console.log("Notación ABC recibida:", data.abc);

            // Mostrar la notación ABC en texto
            abcContainer.innerHTML = `<pre>${data.abc}</pre>`;
            console.log("Notación ABC mostrada en el contenedor de texto.");

            // Renderizar la partitura si la notación ABC es válida
            if (data.abc.includes("K:") || data.abc.includes("X:")) {
                console.log("Notación ABC válida detectada.");

                // Asegura que el área de partitura sea lo suficientemente grande
                abcRender.style.width = "100%";
                abcRender.style.minHeight = "400px";
                console.log("Estilos aplicados al contenedor de la partitura.");

                // Renderiza la partitura
                console.log("Iniciando renderización de la partitura...");
                abcjs.renderAbc("abc-render", data.abc, {
                    responsive: "resize",
                    staffwidth: abcRender.offsetWidth // Ajusta al ancho disponible
                });
                console.log("Partitura renderizada correctamente.");
            } else {
                console.log("La notación ABC no es válida.");
                abcRender.innerHTML = "<p>La notación ABC no es válida.</p>";
            }
        } else {
            console.log("No se recibió notación ABC del backend.");
            abcContainer.innerHTML = "<p>No ABC notation available.</p>";
        }
    } catch (error) {
        console.error("Error al cargar la notación ABC:", error);
        abcContainer.innerHTML = `<p>Error loading ABC notation: ${error.message}</p>`;
    }

    // Configurar interacción con el chat
    sendBtn.addEventListener("click", async () => {
        const question = questionInput.value.trim();
        if (!question) return;

        console.log("Pregunta enviada:", question);
        chatbox.innerHTML += `<div class="message user">${question}</div>`;
        questionInput.value = "";

        try {
            console.log("Enviando pregunta al backend...");
            const response = await fetch("/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question }),
            });

            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Respuesta del backend recibida:", data);

            const formattedResponse = data.response.replace(
                /\*\*(.*?)\*\*/g,
                "<strong>$1</strong>"
            );

            chatbox.innerHTML += `<div class="message bot">${formattedResponse}</div>`;
            chatbox.scrollTop = chatbox.scrollHeight;
            console.log("Respuesta del bot mostrada en el chat.");
        } catch (error) {
            console.error("Error al enviar la pregunta:", error);
            chatbox.innerHTML += `<div class="message bot">Error: ${error.message}</div>`;
        }
    });
});