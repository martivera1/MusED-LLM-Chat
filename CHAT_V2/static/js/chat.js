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
  
        // Show the bot's response
        chatbox.innerHTML += `<div class="message bot">${data.response}</div>`;
        chatbox.scrollTop = chatbox.scrollHeight;
      } catch (error) {
        chatbox.innerHTML += `<div class="message bot">Error: ${error.message}</div>`;
      }
    });
  });
  