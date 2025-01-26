document.addEventListener("DOMContentLoaded", () => {
  const chatbox = document.getElementById("chatbox");
  const questionInput = document.getElementById("question");
  const sendBtn = document.getElementById("send-btn");

  sendBtn.addEventListener("click", async () => {
    const question = questionInput.value.trim();
    if (!question) return;

    // Show the user's message
    chatbox.innerHTML += `<div class="message user">${question}</div>`;
    questionInput.value = "";

    // Send the question to the backend
    try {
      const response = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");

      const data = await response.json();

      // Si se detecta notación ABC, redirigir a canvas.html
      if (data.response.includes("ABC notation detected")) {
        window.location.href = "/canvas";
        return;
      }      

      // Process bot response: replace **text** with <strong>text</strong>
      const formattedResponse = data.response.replace(
        /\*\*(.*?)\*\*/g, // Detect text between ** (non-greedy)
        "<strong>$1</strong>" // Replace with <strong>text</strong>
      );

      // Show the bot's response
      chatbox.innerHTML += `<div class="message bot">${formattedResponse}</div>`;
      chatbox.scrollTop = chatbox.scrollHeight;
    } catch (error) {
      chatbox.innerHTML += `<div class="message bot">Error: ${error.message}</div>`;
    }
  });
});


