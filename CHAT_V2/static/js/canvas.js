import abcjs from 'https://cdn.jsdelivr.net/npm/abcjs@6.4.4/+esm';

// document.addEventListener("DOMContentLoaded", async () => {
//     const chatbox = document.getElementById("chatbox");
//     const questionInput = document.getElementById("question");
//     const sendBtn = document.getElementById("send-btn");
//     const abcRender = document.getElementById("abc-render"); // Contenedor para la partitura

//     // Cargar la notación ABC desde el backend
//     try {
//         const response = await fetch("/get_abc");

//         if (!response.ok) {
//             throw new Error(`Error fetching ABC file: ${response.status} ${response.statusText}`);
//         }

//         // Leer el contenido del archivo como texto
//         const abcText = await response.text();

//         // Renderizar la partitura si la notación ABC es válida
//         if (abcText.includes("K:") || abcText.includes("X:")) {
//             console.log("Notación ABC válida detectada:", abcText);

//             abcRender.style.width = "100%";
//             abcRender.style.minHeight = "400px";

//             // Renderizar la notación ABC
//             abcjs.renderAbc("abc-render", abcText, {
//                 responsive: "resize",
//                 staffwidth: abcRender.offsetWidth, // Ajusta al ancho disponible
//             });
//         } else {
//             console.error("Notación ABC no válida.");
//             abcRender.innerHTML = "<p>La notación ABC no es válida.</p>";
//         }
//     } catch (error) {
//         console.error("Error al cargar la notación ABC:", error);
//         abcRender.innerHTML = `<p>Error loading ABC notation: ${error.message}</p>`;
//     }

//     // Configurar interacción con el chat
//     sendBtn.addEventListener("click", async () => {
//         const question = questionInput.value.trim();
//         if (!question) return;
    
//         chatbox.innerHTML += `<div class="message user">${question}</div>`;
//         questionInput.value = "";
    
//         try {
//           const response = await fetch("/ask", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ question }),
//           });
    
//           if (!response.ok) throw new Error("Failed to fetch response");
    
//           const reader = response.body.getReader();
//           const decoder = new TextDecoder("utf-8");
    
//           let botMessage = `<div class="message bot">`;
//           chatbox.innerHTML += botMessage;
    
//           let abcDetected = false;
    
//           while (true) {
//             const { done, value } = await reader.read();
//             if (done) break;
    
//             const chunk = decoder.decode(value, { stream: true });
    
//             if (chunk.includes("ABC notation detected")) {
//               abcDetected = true;
//               break;
//             }
    
//             botMessage += chunk;
//             chatbox.lastChild.innerHTML = botMessage;
//             chatbox.scrollTop = chatbox.scrollHeight;
//           }
    
//           if (abcDetected) {
//             // chatbox.lastChild.innerHTML = `<div class="message bot">Redirecting to ABC viewer...</div>`;
//             // setTimeout(() => {
//             //   window.location.href = "/canvas";
//             // }, 500);
//             try {
//                 const response = await fetch("/get_abc");
        
//                 if (!response.ok) {
//                     throw new Error(`Error fetching ABC file: ${response.status} ${response.statusText}`);
//                 }
        
//                 // Leer el contenido del archivo como texto
//                 const abcText = await response.text();
        
//                 // Renderizar la partitura si la notación ABC es válida
//                 if (abcText.includes("K:") || abcText.includes("X:")) {
//                     console.log("Notación ABC válida detectada:", abcText);
        
//                     abcRender.style.width = "100%";
//                     abcRender.style.minHeight = "400px";
        
//                     // Renderizar la notación ABC
//                     abcjs.renderAbc("abc-render", abcText, {
//                         responsive: "resize",
//                         staffwidth: abcRender.offsetWidth, // Ajusta al ancho disponible
//                     });
//                 } else {
//                     console.error("Notación ABC no válida.");
//                     abcRender.innerHTML = "<p>La notación ABC no es válida.</p>";
//                 }
//             } catch (error) {
//                 console.error("Error al cargar la notación ABC:", error);
//                 abcRender.innerHTML = `<p>Error loading ABC notation: ${error.message}</p>`;
//             }

//           } else {
//             botMessage += "</div>";
//             chatbox.lastChild.innerHTML = botMessage;
//           }
//         } catch (error) {
//           chatbox.innerHTML += `<div class="message bot">Error: ${error.message}</div>`;
//         }
//       });
//     });



// document.addEventListener("DOMContentLoaded", async () => {
//     const chatbox = document.getElementById("chatbox");
//     const questionInput = document.getElementById("question");
//     const sendBtn = document.getElementById("send-btn");
//     const abcRender = document.getElementById("abc-render"); // Contenedor para la partitura

//     // Función para renderizar la notación ABC
//     const renderAbcNotation = async () => {
//         try {
//             const response = await fetch("/get_abc");

//             if (!response.ok) {
//                 throw new Error(`Error fetching ABC file: ${response.status} ${response.statusText}`);
//             }

//             // Leer el contenido del archivo como texto
//             const abcText = await response.text();

//             // Renderizar la partitura si la notación ABC es válida
//             if (abcText.includes("K:") || abcText.includes("X:")) {
//                 console.log("Notación ABC válida detectada:", abcText);

//                 abcRender.style.width = "100%";
//                 abcRender.style.minHeight = "400px";

//                 // Renderizar la notación ABC
//                 abcjs.renderAbc("abc-render", abcText, {
//                     responsive: "resize",
//                     staffwidth: abcRender.offsetWidth, // Ajusta al ancho disponible
//                 });

//                 // Mostrar un mensaje en el chat indicando que se ha renderizado la partitura
//                 chatbox.innerHTML += `<div class="message bot">Score rendered.</div>`;
//                 chatbox.scrollTop = chatbox.scrollHeight;
//             } else {
//                 console.error("Notación ABC no válida.");
//                 abcRender.innerHTML = "<p>La notación ABC no es válida.</p>";
//                 chatbox.innerHTML += `<div class="message bot">Error: La notación ABC no es válida.</div>`;
//                 chatbox.scrollTop = chatbox.scrollHeight;
//             }
//         } catch (error) {
//             console.error("Error al cargar la notación ABC:", error);
//             abcRender.innerHTML = `<p>Error loading ABC notation: ${error.message}</p>`;
//             chatbox.innerHTML += `<div class="message bot">Error: ${error.message}</div>`;
//             chatbox.scrollTop = chatbox.scrollHeight;
//         }
//     };

//     // Cargar y renderizar la notación ABC al inicio
//     renderAbcNotation();

//     // Configurar interacción con el chat
//     sendBtn.addEventListener("click", async () => {
//         const question = questionInput.value.trim();
//         if (!question) return;

//         // Mostrar la pregunta del usuario en el chat
//         chatbox.innerHTML += `<div class="message user">${question}</div>`;
//         questionInput.value = "";
//         chatbox.scrollTop = chatbox.scrollHeight;

//         try {
//             const response = await fetch("/ask", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ question }),
//             });

//             if (!response.ok) throw new Error("Failed to fetch response");

//             const reader = response.body.getReader();
//             const decoder = new TextDecoder("utf-8");

//             let botMessage = `<div class="message bot">`;
//             chatbox.innerHTML += botMessage;

//             let fullResponse = ""; // Almacena la respuesta completa del backend

//             while (true) {
//                 const { done, value } = await reader.read();
//                 if (done) break;

//                 const chunk = decoder.decode(value, { stream: true });
//                 fullResponse += chunk; // Acumula la respuesta completa

//                 // Mostrar la respuesta del bot en el chat
//                 botMessage += chunk;
//                 chatbox.lastChild.innerHTML = botMessage;
//                 chatbox.scrollTop = chatbox.scrollHeight;
//             }

            

//             // Cerrar el mensaje del bot
//             botMessage += "</div>";
//             chatbox.lastChild.innerHTML = botMessage;

//             // Verificar si la respuesta contiene notación ABC
//             if (fullResponse.includes("ABC notation detected")) {
//                 // // Mostrar un mensaje en el chat indicando que se ha detectado notación ABC
//                 // chatbox.innerHTML += `<div class="message bot">Detectada notación ABC. Renderizando partitura...</div>`;
//                 // chatbox.scrollTop = chatbox.scrollHeight;
//                 console.log("Detected")

//                 // Renderizar la notación ABC
//                 await renderAbcNotation();
//             }



//         } catch (error) {
//             chatbox.innerHTML += `<div class="message bot">Error: ${error.message}</div>`;
//             chatbox.scrollTop = chatbox.scrollHeight;
//         }
//     });
// });

document.addEventListener("DOMContentLoaded", async () => {
    const chatbox = document.getElementById("chatbox");
    const questionInput = document.getElementById("question");
    const sendBtn = document.getElementById("send-btn");
    const abcRender = document.getElementById("abc-render");

    const formatText = (text) => {
        return text
            .replace(/\n/g, "<br>") // Respeta saltos de línea
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); // Convierte **texto** en negrita
    };

    const renderAbcNotation = async () => {
        try {
            const response = await fetch("/get_abc");
            if (!response.ok) throw new Error(`Error fetching ABC file: ${response.status} ${response.statusText}`);

            const abcText = await response.text();
            if (abcText.includes("K:") || abcText.includes("X:")) {
                console.log("Notación ABC válida detectada:", abcText);
                abcRender.style.width = "100%";
                abcRender.style.minHeight = "400px";
                abcjs.renderAbc("abc-render", abcText, { responsive: "resize", staffwidth: abcRender.offsetWidth });

                // Agregar mensaje del bot con formato
                const botMessageDiv = document.createElement("div");
                botMessageDiv.classList.add("message", "bot");
                botMessageDiv.innerHTML = "Score rendered.";
                chatbox.appendChild(botMessageDiv);
                chatbox.scrollTop = chatbox.scrollHeight;
            } else {
                console.error("Notación ABC no válida.");
                abcRender.innerHTML = "<p>La notación ABC no es válida.</p>";

                const botMessageDiv = document.createElement("div");
                botMessageDiv.classList.add("message", "bot");
                botMessageDiv.innerHTML = "Error: La notación ABC no es válida.";
                chatbox.appendChild(botMessageDiv);
                chatbox.scrollTop = chatbox.scrollHeight;
            }
        } catch (error) {
            console.error("Error al cargar la notación ABC:", error);
            abcRender.innerHTML = `<p>Error loading ABC notation: ${error.message}</p>`;

            const botMessageDiv = document.createElement("div");
            botMessageDiv.classList.add("message", "bot");
            botMessageDiv.innerHTML = `Error: ${error.message}`;
            chatbox.appendChild(botMessageDiv);
            chatbox.scrollTop = chatbox.scrollHeight;
        }
    };

    renderAbcNotation();

    sendBtn.addEventListener("click", async () => {
        const question = questionInput.value.trim();
        if (!question) return;

        // Crear y agregar el mensaje del usuario con formato
        const userMessageDiv = document.createElement("div");
        userMessageDiv.classList.add("message", "user");
        userMessageDiv.innerHTML = formatText(question);
        chatbox.appendChild(userMessageDiv);

        questionInput.value = "";
        chatbox.scrollTop = chatbox.scrollHeight;

        try {
            const response = await fetch("/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question }),
            });

            if (!response.ok) throw new Error("Failed to fetch response");

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            // Crear un nuevo div para el mensaje del bot
            const botMessageDiv = document.createElement("div");
            botMessageDiv.classList.add("message", "bot");
            chatbox.appendChild(botMessageDiv);
            chatbox.scrollTop = chatbox.scrollHeight;

            let fullResponse = "";

            // while (true) {
            //     const { done, value } = await reader.read();
            //     if (done) break;

            //     const chunk = decoder.decode(value, { stream: true });
            //     fullResponse += chunk;

            //     // Actualizar el mensaje con formato
            //     botMessageDiv.innerHTML = formatText(fullResponse);
            //     chatbox.scrollTop = chatbox.scrollHeight;
            // }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
            
                const chunk = decoder.decode(value, { stream: true });
            
                // Agregar solo el nuevo fragmento, sin sobrescribir
                botMessageDiv.innerHTML += formatText(chunk);
            }
            
            // Hacer scroll solo una vez al final
            chatbox.scrollTop = chatbox.scrollHeight;            

            // Si la respuesta menciona notación ABC, renderizarla
            if (fullResponse.includes("ABC notation detected")) {
                console.log("Detected");
                await renderAbcNotation();
            }

        } catch (error) {
            const botMessageDiv = document.createElement("div");
            botMessageDiv.classList.add("message", "bot");
            botMessageDiv.innerHTML = `Error: ${error.message}`;
            chatbox.appendChild(botMessageDiv);
            chatbox.scrollTop = chatbox.scrollHeight;
        }
    });
});

