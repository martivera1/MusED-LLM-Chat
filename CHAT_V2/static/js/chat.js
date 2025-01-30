// document.addEventListener("DOMContentLoaded", () => { //sttreaming chat.
//   //Obtain elements necessaries for interaction of the chat.
//   const chatbox = document.getElementById("chatbox");
//   const questionInput = document.getElementById("question");
//   const sendBtn = document.getElementById("send-btn");

//   sendBtn.addEventListener("click", async () => {
//     const question = questionInput.value.trim(); //we obtain what the user sends
//     if (!question) return; //no question case

//     // Show the user's message
//     chatbox.innerHTML += `<div class="message user">${question}</div>`;
//     questionInput.value = "";

//     // Send the question to the backend --> HTTP REQUEST
//     try {
//       const response = await fetch("/ask", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question }),
//       });

//       if (!response.ok) throw new Error("Failed to fetch response");

//       const data = await response.json();

//       //Si se detecta notación ABC, redirigir a canvas.html
//       if (data.response.includes("ABC notation detected")) {
//         window.location.href = "/canvas";
//         return;
//       }      

//       // Process bot response: replace **text** with <strong>text</strong>
//       const formattedResponse = data.response.replace(
//         /\*\*(.*?)\*\*/g, // Detect text between ** (non-greedy)
//         "<strong>$1</strong>" // Replace with <strong>text</strong>
//       );

//       // Show the bot's response
//       chatbox.innerHTML += `<div class="message bot">${formattedResponse}</div>`;
//       chatbox.scrollTop = chatbox.scrollHeight;
//     } catch (error) {
//       chatbox.innerHTML += `<div class="message bot">Error: ${error.message}</div>`;
//     }
//   });
// });


document.addEventListener('DOMContentLoaded', () => {
  const sendBtn = document.getElementById("send-btn");
  const questionInput = document.getElementById("question");
  const chatbox = document.getElementById("chatbox");

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

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let botMessage = `<div class="message bot">`;
      chatbox.innerHTML += botMessage;

      let abcDetected = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        if (chunk.includes("ABC notation detected")) {
          abcDetected = true;
          break;
        }

        botMessage += chunk;
        chatbox.lastChild.innerHTML = botMessage;
        chatbox.scrollTop = chatbox.scrollHeight;
      }

      if (abcDetected) {
        chatbox.lastChild.innerHTML = `<div class="message bot">Redirecting to ABC viewer...</div>`;
        setTimeout(() => {
          window.location.href = "/canvas";
        }, 500);
      } else {
        botMessage += "</div>";
        chatbox.lastChild.innerHTML = botMessage;
      }
    } catch (error) {
      chatbox.innerHTML += `<div class="message bot">Error: ${error.message}</div>`;
    }
  });
});




