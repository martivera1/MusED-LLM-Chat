import abcjs from 'https://cdn.jsdelivr.net/npm/abcjs@6.4.4/+esm';

document.addEventListener("DOMContentLoaded", () => {
    const sendBtn = document.getElementById("send-btn");
    const questionInput = document.getElementById("question");
    const chatbox = document.getElementById("chatbox");
    const abcVisualizer = document.getElementById("abc-visualizer");
    const abcRender = document.getElementById("abc-render");
    const resizer = document.querySelector(".resizer");

    // BOTÓN CERRAR VISUALIZADOR
    const closeBtn = document.getElementById('close-abc');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            abcVisualizer.classList.add('hidden');
        });
    }
    
    const openBtn = document.getElementById('open-abc');
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            abcVisualizer.classList.remove('hidden');
        });
    }

    // REDIMENSIONAR PARTITURA (ARRASTRE) /////
    let isResizing = false;
    let initialX;
    let initialWidth;

    resizer.addEventListener("mousedown", (e) => {
        isResizing = true;
        initialX = e.clientX;
        initialWidth = abcVisualizer.offsetWidth;
        document.body.classList.add('resizing');
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", stopResizing);
        e.preventDefault();
    });
    
    function onMouseMove(e) {
        if (!isResizing) return;
        
        const currentX = e.clientX;
        const deltaX = currentX - initialX;
        let newWidth = initialWidth - deltaX;
        
        newWidth = Math.max(600, Math.min(newWidth, window.innerWidth * 0.8));
        abcVisualizer.style.width = `${newWidth}px`;
    }
    
    function stopResizing() {
        isResizing = false;
        document.body.classList.remove('resizing');
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", stopResizing);
    }

    ///////////////////////////////////////

    // FORMATO DE TEXTO ////
    const formatText = (text) => {
        return text.replace(/\n/g, "<br>")
                   .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    };
    ///////////////////////

    // DETECCIÓN DE NOTACIÓN ABC
    function isAbcNotation(text) {
        let foundValidX = false;
        let foundValidK = false;
        let musicDetected = false;
        let passedK = false;
    
        const lines = text.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            if (!trimmed || trimmed.startsWith('%')) continue;
    
            if (/^X:\s*\d+(\s|$)/i.test(trimmed)) {
                foundValidX = true;
            }
            
            if (/^K:\s*[A-Ga-g](#|b)?\s*(maj|min|m|dorian|mixolydian)?(\s|$)/i.test(trimmed)) {
                foundValidK = true;
                passedK = true;
                continue;
            }
    
            if (passedK) {
                if (/[A-Ga-gzZ|\[\](){}:_^=]/.test(trimmed)) {
                    musicDetected = true;
                }
            }
        }
        return foundValidX && foundValidK && musicDetected;      
    };

    // HISTORIAL DE RENDERIZACIÓN
    const rendersHistory = {};

    // RENDERIZACIÓN ABC
    const renderAbcNotation = async (abcText, renderId = Date.now()) => {
        try {
            if (!rendersHistory[renderId]) {
                abcRender.innerHTML = '';
            }

            const renderContainer = document.createElement("div");
            renderContainer.id = `render-${renderId}`;
            renderContainer.className = "abc-score";
            
            abcjs.renderAbc(renderContainer, abcText, {
                responsive: "resize",
                staffwidth: abcRender.offsetWidth
            });

            rendersHistory[renderId] = {
                abcText,
                element: renderContainer
            };

            abcRender.appendChild(renderContainer);
        } catch (error) {
            console.error("Error al renderizar:", error);
            abcRender.innerHTML = `<p>Error: ${error.message}</p>`;
        }
    };

    // BOTÓN DE RENDERIZACIÓN
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
                renderButton.disabled = false;
            }
        };

        buttonContainer.appendChild(renderButton);
        messageDiv.appendChild(buttonContainer);
    };

    // INTERACCIÓN PRINCIPAL DEL CHAT
    sendBtn.addEventListener("click", async () => {
        const question = questionInput.value.trim();
        if (!question) return;

        // Mensaje del usuario
        const userMessageDiv = document.createElement("div");
        userMessageDiv.classList.add("message", "user");
        userMessageDiv.innerHTML = formatText(question);
        chatbox.appendChild(userMessageDiv);

        if (isAbcNotation(question)) {
            addRenderButton(userMessageDiv, question);
        }

        questionInput.value = "";
        chatbox.scrollTop = chatbox.scrollHeight;

        try {
            // Crear mensaje del bot con spinner inmediatamente
            const botMessageDiv = document.createElement("div");
            botMessageDiv.classList.add("message", "bot");
            botMessageDiv.innerHTML = `
                <div class="spinner-container">
                    <div class="spinner"></div>
                </div>
            `;
            chatbox.appendChild(botMessageDiv);
            chatbox.scrollTop = chatbox.scrollHeight;

            const response = await fetch("/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question }),
            });

            if (!response.ok) throw new Error("Error en la respuesta del servidor");

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let isFirstChunk = true;
            let fullResponse = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullResponse += chunk;

                // Manejar primer chunk
                if (isFirstChunk) {
                    botMessageDiv.innerHTML = formatText(chunk);
                    isFirstChunk = false;
                } else {
                    botMessageDiv.innerHTML += formatText(chunk);
                }

                // Manejar detección de ABC
                if (chunk.includes("ABC notation detected")) {
                    botMessageDiv.innerHTML += "<br><br>";
                }

                chatbox.scrollTop = chatbox.scrollHeight;
            }

            // Verificar ABC al finalizar
            if (isAbcNotation(fullResponse)) {
                addRenderButton(botMessageDiv, fullResponse);
            }
        } catch (error) {
            // Manejar errores eliminando el spinner
            const errorDiv = document.querySelector(".message.bot:last-child");
            if (errorDiv) {
                errorDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
            }
            console.error("Error:", error);
        }
    });
});