import abcjs from 'https://cdn.jsdelivr.net/npm/abcjs@6.4.4/+esm';


document.addEventListener("DOMContentLoaded", () => {

    const sendBtn = document.getElementById("send-btn");
    const questionInput = document.getElementById("question");
    const chatbox = document.getElementById("chatbox");
    const abcVisualizer = document.getElementById("abc-visualizer");
    const abcRender = document.getElementById("abc-render");
    const resizer = document.querySelector(".resizer");
  
    //REDIMENSIONAR PARTITURA (ARRASTRE)///////////////////////////////
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
        e.preventDefault(); // Prevent text selection
    });
    
    function onMouseMove(e) {
        if (!isResizing) return;
        
        const currentX = e.clientX;
        const deltaX = currentX - initialX;
        let newWidth = initialWidth - deltaX;
        
        // Apply constraints (300px min, 80% of window max)
        newWidth = Math.max(600, Math.min(newWidth, window.innerWidth * 0.8));
        abcVisualizer.style.width = `${newWidth}px`;
    }
    
    function stopResizing() {
        isResizing = false;
        document.body.classList.remove('resizing');
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", stopResizing);
    }
    /////////////////////////////////////////////////////////////////////////////////
    


    //// FORMAT TEXT NEGRETA////////////
    const formatText = (text) => {
      return text.replace(/\n/g, "<br>")
                 .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    };

  ///////////DETECCIÓ DE NOTACIÓ ABC///////////////////////
    function isAbcNotation(text) {
        //return text.includes("X:") && text.includes("K:");
        let foundValidX = false;
        let foundValidK = false;
        let musicDetected = false;
        let passedK = false;
    
        const lines = text.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Ignorar líneas vacías/comentarios
            if (!trimmed || trimmed.startsWith('%')) continue;
    
            // 1. Verificar cabeceras X: y K: con formato válido
            if (/^X:\s*\d+(\s|$)/i.test(trimmed)) { // X: seguido de número
                foundValidX = true;
            }
            
            if (/^K:\s*[A-Ga-g](#|b)?m?(\s|$)/i.test(trimmed)) { // K: con tonalidad
                foundValidK = true;
                passedK = true; // Marca para buscar música después
                continue;
            }
    
            // 2. Buscar música SOLO después de K:
            if (passedK) {
                // Patrón para notas/barras/símbolos musicales
                if (/[A-Ga-gzZ|\[\](){}:_^=]/.test(trimmed)) {
                    musicDetected = true;
                }
            }
        }
    
        return foundValidX && foundValidK && musicDetected;      
    };

/////HISTORIAL RENDERITZACIÓ////////////
  const rendersHistory = {}; // Almacena { id: { abcText, element } }


//////RENDERITZACIÓ ABC////
  const renderAbcNotation = async (abcText, renderId = Date.now()) => {
      var currentRenderId;
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

/////BOTÓ RENDERITZACIÓ/////
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

////INTERACCIÓ XAT/////
  sendBtn.addEventListener("click", async () => {
      const question = questionInput.value.trim();
      if (!question) return;

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
          const reader = response.body.getReader();
          const decoder = new TextDecoder("utf-8");


          if (!response.ok) throw new Error("Failed to fetch response");

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
          }
          // Hacer scroll solo una vez al final
          chatbox.scrollTop = chatbox.scrollHeight;            
          // Verificar si la respuesta del bot contiene notación ABC
          if (isAbcNotation(fullResponse)) {
              addRenderButton(botMessageDiv, fullResponse); // Añadir botón al mensaje del bot
          }
        }
        catch (error) {
          chatbox.innerHTML += `<div class="message bot">Error: ${error.message}</div>`;
      }
    
  });




  
  

});


