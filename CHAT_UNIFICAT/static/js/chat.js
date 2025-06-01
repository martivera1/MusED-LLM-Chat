import abcjs from 'https://cdn.jsdelivr.net/npm/abcjs@6.4.4/+esm';

// ============ FUNCIONES INDEPENDIENTES DEL DOM ============

// FORMATO DE TEXTO
const formatText = (text) => {
    return text.replace(/\n/g, "<br>")
               .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
};

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
        
        if (/^K:\s*[A-Ga-g](#|b)?\s*(maj|min|m|dorian|mixolydian|minor|major)?(\s|$)/i.test(trimmed)) {
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

// RENDERIZACIÓN ABC
const rendersHistory = {};

const renderAbcNotation = async (abcText, renderId = Date.now()) => {
    try {
        if (!rendersHistory[renderId]) {
            document.getElementById("abc-render").innerHTML = '';
        }

        const renderContainer = document.createElement("div");
        renderContainer.id = `render-${renderId}`;
        renderContainer.className = "abc-score";
        
        abcjs.renderAbc(renderContainer, abcText, {
            responsive: "resize",
            staffwidth: document.getElementById("abc-render").offsetWidth
        });

        rendersHistory[renderId] = {
            abcText,
            element: renderContainer
        };

        document.getElementById("abc-render").appendChild(renderContainer);
    } catch (error) {
        console.error("Error al renderizar:", error);
        document.getElementById("abc-render").innerHTML = `<p>Error: ${error.message}</p>`;
    }
};

// ============ CÓDIGO DEPENDIENTE DEL DOM ============
document.addEventListener("DOMContentLoaded", () => {
    const sendBtn = document.getElementById("send-btn");
    const questionInput = document.getElementById("question");
    const chatbox = document.getElementById("chatbox");
    const abcVisualizer = document.getElementById("abc-visualizer");
    const abcRender = document.getElementById("abc-render");
    const resizer = document.querySelector(".resizer");
    const prompt_button = document.getElementById('choose-prompt');
    const restartBtn = document.getElementById('restart-chat');

    //CHANGE PROMPT///
    let isSuperPromptActive = true;

    // Añade este evento después de los demás event listeners
    document.getElementById('choose-prompt').addEventListener('click', () => {
        isSuperPromptActive = !isSuperPromptActive;
        
        prompt_button.textContent = `Choose Prompt (${isSuperPromptActive ? 'Super' : 'Lyrics'})`;

        console.log(`%c✅ Prompt seleccionado: ${isSuperPromptActive ? 'SUPER (músico experto)' : 'TEXT (asistente general)'}`, 
        'color: #2ecc71; font-weight: bold; font-size: 12px;');

        console.log(`Botón actualizado a: "${prompt_button.textContent}"`);
    });
    
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
                body: JSON.stringify({ 
                    question: question, 
                    use_super: isSuperPromptActive,
                    use_text: !isSuperPromptActive
                }),

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

    // Añade este event listener después de los demás
    restartBtn.addEventListener('click', async () => {
        // Limpiar la interfaz
        chatbox.innerHTML = '';
        abcRender.innerHTML = '';
        
        try {
            // Reiniciar la conversación en el backend
            const response = await fetch("/reset_chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            
            if (!response.ok) throw new Error("Error al reiniciar el chat");
            
            console.log("%c♻️ Chat restarted correctly", 
                "color: #00cc00; font-weight: bold; font-size: 12px;");
        } catch (error) {
            console.error("%c❌ Error restarting the chat: " + error.message, 
                "color: #ff0000; font-weight: bold;");
        }
    });
});
