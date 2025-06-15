import abcjs from 'https://cdn.jsdelivr.net/npm/abcjs@6.4.4/+esm';


const formatText = (text) => {
    return text.replace(/\n/g, "<br>")
               .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
};

//ABC DETECTION
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

//ABC RENDER
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
    let currentPrompt = "music expert";

    document.getElementById('choose-prompt').addEventListener('click', () => {
        if (currentPrompt === "music expert") {
            currentPrompt = "lyrics expert";
        } else if (currentPrompt === "lyrics expert") {
            currentPrompt = "empty";
        } else {
            currentPrompt = "music expert";
        }

        prompt_button.innerHTML = `Click to change Prompt<br>Current: (${currentPrompt.charAt(0).toUpperCase() + currentPrompt.slice(1)})`;
        console.log(`✅ Prompt seleccionat: ${currentPrompt.toUpperCase()}`);
    });
    
    //SCORE VISUALIZER
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

    //REDIMENSION SCORE
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

    //RENDER BUTTON
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

    //CHAT INTERACTION
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
                    use_super: currentPrompt === "music expert",
                    use_text: currentPrompt === "lyrics expert",
                    use_empty: currentPrompt === "empty"
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

                if (isFirstChunk) {
                    botMessageDiv.innerHTML = formatText(chunk);
                    isFirstChunk = false;
                } else {
                    botMessageDiv.innerHTML += formatText(chunk);
                }

                if (chunk.includes("ABC notation detected")) {
                    botMessageDiv.innerHTML += "<br><br>";
                }

                chatbox.scrollTop = chatbox.scrollHeight;
            }

            if (isAbcNotation(fullResponse)) {
                addRenderButton(botMessageDiv, fullResponse);
            }
        } catch (error) {
            const errorDiv = document.querySelector(".message.bot:last-child");
            if (errorDiv) {
                errorDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
            }
            console.error("Error:", error);
        }
    });

    restartBtn.addEventListener('click', async () => {
        chatbox.innerHTML = '';
        abcRender.innerHTML = '';
        
        try {
            const response = await fetch("/reset_chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            
            if (!response.ok) throw new Error("Error restarting the chat");
            
            console.log("%c♻️ Chat restarted correctly", 
                "color: #00cc00; font-weight: bold; font-size: 12px;");
        } catch (error) {
            console.error("%c❌ Error restarting the chat: " + error.message, 
                "color: #ff0000; font-weight: bold;");
        }
    });
});
