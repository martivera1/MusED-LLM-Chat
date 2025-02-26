import abcjs from 'https://cdn.jsdelivr.net/npm/abcjs@6.4.4/+esm';

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

    const isAbcNotation = (text) => {
        // Detectar si el texto contiene estructura básica de ABC
        return text.includes("X:") && text.includes("K:");
    };

    // const addRenderButton = (messageDiv, abcText) => {
    //     const buttonContainer = document.createElement("div");
    //     buttonContainer.className = "button-container";

    //     const renderButton = document.createElement("button");
    //     renderButton.className = "render-button";
    //     renderButton.textContent = "🎼 Render Score";
        
    //     // Almacenar la notación ABC en el botón
    //     renderButton.dataset.abc = abcText;

    //     renderButton.onclick = async () => {
    //         renderButton.disabled = true;
    //         await renderAbcNotation(renderButton.dataset.abc); // Renderizar el ABC específico
    //         abcRender.classList.add("visible");
    //     };

    //     buttonContainer.appendChild(renderButton);
    //     messageDiv.appendChild(buttonContainer);
    // };

    let currentRenderId = 0;
    const rendersHistory = {}; // Almacena { id: { abcText, element } }

    const renderAbcNotation = async (abcText, renderId = Date.now()) => {
        try {
            // Limpiar solo si es un nuevo render (no histórico)
            if (!rendersHistory[renderId]) {
                abcRender.innerHTML = '';
            }

            // Crear nuevo contenedor para cada render
            const renderContainer = document.createElement("div");
            renderContainer.id = `render-${renderId}`;
            renderContainer.className = "abc-score";
            
            // Renderizar en el nuevo contenedor
            abcjs.renderAbc(renderContainer, abcText, {
                responsive: "resize",
                staffwidth: abcRender.offsetWidth
            });

            // Añadir al historial
            rendersHistory[renderId] = {
                abcText,
                element: renderContainer
            };

            // Mostrar solo el último render
            abcRender.appendChild(renderContainer);
            currentRenderId = renderId;

            // Botones de navegación (opcional)
            // addNavigationControls(renderId);

        } catch (error) {
            console.error("Error al renderizar:", error);
            abcRender.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    };

    // const addNavigationControls = (currentId) => {
    //     const controls = document.createElement("div");
    //     controls.className = "render-controls";
    
    //     // Botón anterior
    //     const prevButton = document.createElement("button");
    //     prevButton.textContent = "◀";
    //     prevButton.onclick = () => showRender(currentId - 1);
    //     prevButton.disabled = currentId === 0;
    
    //     // Botón siguiente
    //     const nextButton = document.createElement("button");
    //     nextButton.textContent = "▶";
    //     nextButton.onclick = () => showRender(currentId + 1);
    //     nextButton.disabled = currentId === Object.keys(rendersHistory).length - 1;
    
    //     controls.appendChild(prevButton);
    //     controls.appendChild(nextButton);
    //     abcRender.prepend(controls);
    // };
    
    // Función para mostrar renders históricos
    // const showRender = (renderId) => {
    //     if (rendersHistory[renderId]) {
    //         abcRender.innerHTML = '';
    //         abcRender.appendChild(rendersHistory[renderId].element);
    //         currentRenderId = renderId;
    //         addNavigationControls(renderId);
    //     }
    // };

    const addRenderButton = (messageDiv, abcText) => {
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "button-container";
    
        const renderButton = document.createElement("button");
        renderButton.className = "render-button";
        renderButton.textContent = "🎼 Render Score";
        renderButton.dataset.abc = abcText;
    
        renderButton.onclick = async () => {
            try {
                renderButton.disabled = true;
                await renderAbcNotation(renderButton.dataset.abc);
                abcRender.classList.add("visible");
            } finally {
                renderButton.disabled = false; // Rehabilitar después de renderizar
            }
        };
    
        buttonContainer.appendChild(renderButton);
        messageDiv.appendChild(buttonContainer);
    };

    //renderAbcNotation();

    sendBtn.addEventListener("click", async () => {
        const question = questionInput.value.trim();
        if (!question) return;

        // Crear y agregar el mensaje del usuario con formato
        const userMessageDiv = document.createElement("div");
        userMessageDiv.classList.add("message", "user");
        userMessageDiv.innerHTML = formatText(question);
        chatbox.appendChild(userMessageDiv);

        if (isAbcNotation(question)) {
            addRenderButton(userMessageDiv, question); // Pasar el texto ABC
        }

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

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
            
                const chunk = decoder.decode(value, { stream: true });
                fullResponse += chunk;

                if (chunk.includes("ABC notation detected")) {
                    botMessageDiv.innerHTML += formatText(chunk) + "<br><br>";
                } else {
                    botMessageDiv.innerHTML += formatText(chunk);
                }

                // // Agregar solo el nuevo fragmento, sin sobrescribir
                //botMessageDiv.innerHTML += formatText(chunk);
            }
            
            // Hacer scroll solo una vez al final
            chatbox.scrollTop = chatbox.scrollHeight;            

            // //Si la respuesta menciona notación ABC, renderizarla
            // if (fullResponse.includes("ABC notation detected")) {
            //     // console.log("Detected");
            //     // await renderAbcNotation();
            //     // Crear el contenedor del botón
            //     const buttonContainer = document.createElement("div");
            //     buttonContainer.className = "button-container";

            //     // Crear el botón de renderizado
            //     const renderButton = document.createElement("button");
            //     renderButton.className = "render-button";
            //     renderButton.textContent = "Render Score";

            //     // Añadir el evento de clic al botón
            //     renderButton.onclick = async () => {
            //         renderButton.disabled = true; // Deshabilitar el botón mientras se renderiza
            //         await renderAbcNotation(); // Llamar a la función de renderizado
            //         abcRender.classList.add("visible"); // Mostrar el contenedor de la partitura
            //     };

            //     // Añadir el botón al contenedor
            //     buttonContainer.appendChild(renderButton);

            //     // Añadir el contenedor del botón al mensaje del bot
            //     botMessageDiv.appendChild(buttonContainer);

            //     // Añadir un mensaje adicional para guiar al usuario
            //     const infoMessage = document.createElement("div");
            //     infoMessage.className = "message bot";
            //     infoMessage.innerHTML = "Click the button to render the score.";
            //     chatbox.appendChild(infoMessage);

            //     // Hacer scroll al final del chat
            //     chatbox.scrollTop = chatbox.scrollHeight;
            // }
            // Verificar si la respuesta del bot contiene notación ABC
            if (isAbcNotation(fullResponse)) {
                addRenderButton(botMessageDiv, fullResponse); // Añadir botón al mensaje del bot
            }

            

        } catch (error) {
            const botMessageDiv = document.createElement("div");
            botMessageDiv.classList.add("message", "bot");
            botMessageDiv.innerHTML = `Error: ${error.message}`;
            chatbox.appendChild(botMessageDiv);
            chatbox.scrollTop = chatbox.scrollHeight;
        }
    });

    // const renderAbcNotation = async () => {
    //     try {
    //         const response = await fetch("/get_abc");
    //         if (!response.ok) throw new Error(`Error fetching ABC file: ${response.status} ${response.statusText}`);

    //         const abcText = await response.text();
    //         if (abcText.includes("K:") || abcText.includes("X:")) {
    //             console.log("Notación ABC válida detectada:", abcText);
    //             abcRender.style.width = "100%";
    //             abcRender.style.minHeight = "400px";
    //             abcjs.renderAbc("abc-render", abcText, { responsive: "resize", staffwidth: abcRender.offsetWidth });

    //             // Agregar mensaje del bot con formato
    //             const botMessageDiv = document.createElement("div");
    //             botMessageDiv.classList.add("message", "bot");
    //             botMessageDiv.innerHTML = "Score rendered.";
    //             chatbox.appendChild(botMessageDiv);
    //             chatbox.scrollTop = chatbox.scrollHeight;
    //         } else {
    //             console.error("Notación ABC no válida.");
    //             abcRender.innerHTML = "<p>La notación ABC no es válida.</p>";

    //             const botMessageDiv = document.createElement("div");
    //             botMessageDiv.classList.add("message", "bot");
    //             botMessageDiv.innerHTML = "Error: La notación ABC no es válida.";
    //             chatbox.appendChild(botMessageDiv);
    //             chatbox.scrollTop = chatbox.scrollHeight;
    //         }
    //     } catch (error) {
    //         console.error("Error al cargar la notación ABC:", error);
    //         abcRender.innerHTML = `<p>Error loading ABC notation: ${error.message}</p>`;

    //         const botMessageDiv = document.createElement("div");
    //         botMessageDiv.classList.add("message", "bot");
    //         botMessageDiv.innerHTML = `Error: ${error.message}`;
    //         chatbox.appendChild(botMessageDiv);
    //         chatbox.scrollTop = chatbox.scrollHeight;
    //     }
    // };

    // const renderAbcNotation = async (abcText) => {
    //     try {
    //         abcRender.innerHTML = "";
    //         abcRender.style.display = "block";
            
    //         if (abcText.includes("K:") || abcText.includes("X:")) {
    //             abcjs.renderAbc("abc-render", abcText, {
    //                 responsive: "resize",
    //                 staffwidth: abcRender.offsetWidth
    //             });
                
    //             // Mensaje de éxito opcional
    //             const successMsg = document.createElement("div");
    //             successMsg.classList.add("message", "bot");
    //             successMsg.innerHTML = "Partitura renderizada ✔️";
    //             chatbox.appendChild(successMsg);
    //         }
            
    //         abcRender.classList.add("visible");
    //     } catch (error) {
    //         console.error("Error al renderizar la notación ABC:", error);
    //         abcRender.innerHTML = `<p>Error: ${error.message}</p>`;
    //     }
    // };

});

