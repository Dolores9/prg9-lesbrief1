let controller;
let messages = JSON.parse(localStorage.getItem("messages")) || [];

const chatForm = document.getElementById("chatForm");
const submitBtn = document.getElementById("submitBtn");
const chatHistoryElement = document.getElementById("chatHistory");
const errorElement = document.getElementById("error");
const responseElement = document.getElementById("response");

function updateChatHistory() {
  chatHistoryElement.innerHTML = "";
  messages.forEach(({ role, content }) => {
    const p = document.createElement("p");
    p.className = role === "user" ? "user-message" : role === "assistant" ? "assistant-message" : "system-message";
    p.textContent = `${role === "user" ? "Vraag" : role === "assistant" ? "Antwoord" : "Systeem"}: ${content}`;
    chatHistoryElement.appendChild(p);
  });
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitBtn.disabled = true;
  errorElement.innerText = "";
  responseElement.innerText = "";

  const questionInput = document.getElementById("Question");
  const question = questionInput.value.trim();

  if (!question) {
    errorElement.innerText = "Voer ten minste één vraag in.";
    submitBtn.disabled = false;
    return;
  }

  // Voeg de vraag toe aan messages met rol 'user'
  messages.push({ role: "user", content: question });
  updateChatHistory();

  try {
    const response = await fetch("http://localhost:3000/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) throw new Error(`HTTP-fout: ${response.status}`);

    const data = await response.json();

    // Voeg het antwoord toe aan messages met rol 'assistant'
    messages.push({ role: "assistant", content: data.content });

    // Sla messages op in localStorage
    localStorage.setItem("messages", JSON.stringify(messages));

    updateChatHistory();

    responseElement.innerText = data.content;
    questionInput.value = "";
  } catch (error) {
    console.error("Er is een fout opgetreden:", error);
    errorElement.innerText = error.message;
  } finally {
    submitBtn.disabled = false;
  }
});

updateChatHistory();

weatherForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const weatherQuestionInput = document.getElementById("weatherQuestion");
  
  const location = locationInput.value.trim();
  const weatherQuestion = weatherQuestionInput.value.trim();

  if (!location) return;

  console.log('kaas');
  weatherSubmitBtn.disabled = true;
  weatherResponse.innerText = "AI denkt na over het weer...";

  try {
    const res = await fetch("http://localhost:3000/api/weather", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, weatherQuestion }),
    });

    if (!res.ok) throw new Error("Fout bij ophalen van weerdata");

    const data = await res.json();
    weatherResponse.innerText = data.content;
  } catch (err) {
    console.error(err);
    weatherResponse.innerText = "Er is iets misgegaan.";
  } finally {
    weatherSubmitBtn.disabled = false;
  }
});

const cancelAPICall = () => {
  if (controller) {
    controller.abort();
    console.log("API call geannuleerd.");
  } else {
    console.error("Geen actieve API-call om te annuleren.");
  }
};

cancelBtn.addEventListener("click", cancelAPICall);