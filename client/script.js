let controller;
let chatHistory = [];

const chatForm = document.getElementById("chatForm");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const chatHistoryElement = document.getElementById("chatHistory");
const errorElement = document.getElementById("error");
const responseElement = document.getElementById("response");
const fileInput = document.getElementById("fileInput");
const weatherForm = document.getElementById("weatherForm");
const locationInput = document.getElementById("locationInput");
const weatherQuestionInput = document.getElementById("weatherQuestion");
const weatherSubmitBtn = document.getElementById("weatherSubmitBtn");
const weatherResponse = document.getElementById("weatherResponse");

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
console.log("werkt");

  submitBtn.disabled = true; 

  controller = new AbortController();
  const { signal } = controller;

  const question = document.getElementById("Question").value.trim();

  if (question.length === 0) {
    errorElement.innerText = "Voer ten minste één vraag in.";
    submitBtn.disabled = false;
    return;
  }
  try {
    const response = await fetch("http://localhost:3000/api/ask", {
      mode: "cors",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
      signal,
    });

    if (!response.ok) {
      throw new Error("HTTP-fout: ${response.status}");
    }

    const data = await response.json();

    chatHistory.push(data.content);
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));

    updateChatHistory();
    responseElement.innerText = data.content;
  } catch (error) {
    console.error("Er is een fout opgetreden:", error);
    errorElement.innerText = error.message;
  } finally {
    submitBtn.disabled = false;
  }
});

weatherForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const location = locationInput.value.trim();
  const question = weatherQuestionInput.value.trim();

  if (!location) return;

  weatherSubmitBtn.disabled = true;
  weatherResponse.innerText = "AI denkt na over het weer...";

  try {
    const res = await fetch("http://localhost:3000/api/weather", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, question }),
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

const updateChatHistory = () => {
  chatHistoryElement.innerHTML = "";
  chatHistory.forEach((message) => {
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    chatHistoryElement.appendChild(messageElement);
  });
};

const cancelAPICall = () => {
  if (controller) {
    controller.abort();
    console.log("API call geannuleerd.");
  } else {
    console.error("Geen actieve API-call om te annuleren.");
  }
};

cancelBtn.addEventListener("click", cancelAPICall);