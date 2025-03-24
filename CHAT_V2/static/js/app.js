import abcjs from 'https://cdn.jsdelivr.net/npm/abcjs@6.4.4/+esm';

document.addEventListener("DOMContentLoaded", () => {
    const chatbox = document.getElementById("chatbox");
    const questionInput = document.getElementById("question");
    const sendBtn = document.getElementById("send-btn");
    const abcRender = document.getElementById("abc-render");
    let rendersHistory = {};
    let currentRenderId = 0;

    // Función para cambiar entre vistas
    // Cambiar entre vistas: Si showCanvas es true, se muestran ambas secciones lado a lado
    window.toggleView = (showCanvas = false) => {
        const chatSection = document.getElementById("chat-section");
        const canvasSection = document.getElementById("canvas-section");
        
        if (showCanvas) {
            chatSection.style.display = "flex";      // Mantiene visible el chat
            canvasSection.style.display = "flex";      // Muestra la partitura
        } else {
            chatSection.style.display = "flex";
            canvasSection.style.display = "none";
        }
    };

    const formatText = (text) => {
        return text
            .replace(/\n/g, "<br>")
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    };

    const isAbcNotation = (text) => {
        return text.includes("X:") && text.includes("K:");
    };

    const renderAbcNotation = async (abcText) => {
        try {
            abcRender.innerHTML = '';
            const renderId = Date.now();
            
            const renderContainer = document.createElement("div");
            renderContainer.className = "abc-score";
            
            abcjs.renderAbc(renderContainer, abcText, {
                responsive: "resize",
                staffwidth: abcRender.offsetWidth
            });

            rendersHistory[renderId] = { abcText, element: renderContainer };
            currentRenderId = renderId;
            
            abcRender.appendChild(renderContainer);
            toggleView(true);

        } catch (error) {
            console.error("Error al renderizar:", error);
            abcRender.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    };

    const addRenderButton = (messageDiv, abcText) => {
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "button-container";

        const renderButton = document.createElement("button");
        renderButton.className = "render-button";
        renderButton.textContent = "🎼 Render Score";
        renderButton.onclick = () => renderAbcNotation(abcText);

        buttonContainer.appendChild(renderButton);
        messageDiv.appendChild(buttonContainer);
    };

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
});