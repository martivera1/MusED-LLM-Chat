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

document.addEventListener("DOMContentLoaded", async () => {
    const chatbox = document.getElementById("chatbox");
    const questionInput = document.getElementById("question");
    const sendBtn = document.getElementById("send-btn");
    const abcContainer = document.getElementById("abc-container"); // Contenedor para la notación ABC
  
    // Cargar la notación ABC desde el backend
    try {
      const response = await fetch("/get_abc");
      const data = await response.json();
      if (data.abc) {
        abcContainer.innerHTML = `<pre>${data.abc}</pre>`;
      } else {
        abcContainer.innerHTML = "<p>No ABC notation available.</p>";
      }
    } catch (error) {
      abcContainer.innerHTML = `<p>Error loading ABC notation: ${error.message}</p>`;
    }
  
    // Configurar interacción con el chat
    sendBtn.addEventListener("click", async () => {
      const question = questionInput.value.trim();
      if (!question) return;
  
      chatbox.innerHTML += `<div class="message user">${question}</div>`;
      questionInput.value = "";
  
      try {
        const response = await fetch("/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });
  
        if (!response.ok) throw new Error("Failed to fetch response");
  
        const data = await response.json();
        const formattedResponse = data.response.replace(
          /\*\*(.*?)\*\*/g,
          "<strong>$1</strong>"
        );
  
        chatbox.innerHTML += `<div class="message bot">${formattedResponse}</div>`;
        chatbox.scrollTop = chatbox.scrollHeight;
      } catch (error) {
        chatbox.innerHTML += `<div class="message bot">Error: ${error.message}</div>`;
      }
    });
  });
  