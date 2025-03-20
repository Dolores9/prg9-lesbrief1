let controller;
let chatHistory = [];

const chatForm = document.getElementById("chatForm");
const uploadForm = document.getElementById("uploadForm");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const chatHistoryElement = document.getElementById("chatHistory");
const errorElement = document.getElementById("error");
const responseElement = document.getElementById("response");
const fileInput = document.getElementById("fileInput");

// chatForm.addEventListener("submit", async (event) => {
//   event.preventDefault();
// console.log("werkt");

//   submitBtn.disabled = true; // Voorkomt dubbelklikken

//   controller = new AbortController();
//   const { signal } = controller;

//   const question = document.getElementById("Argument").value.trim();

//   if (question.length === 0) {
//     errorElement.innerText = "Voer ten minste één argument in.";
//     submitBtn.disabled = false;
//     return;
//   }

//   try {
//     const response = await fetch("http://localhost:3000/api/ask", {
//       mode: "cors",
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ prompt: question.value }),
//       //todo file
//       signal,
//     });

//     if (!response.ok) {
//       throw new Error("HTTP-fout: ${response.status}");
//     }

//     const data = await response.json();

//     chatHistory.push(data.content);
//     localStorage.setItem("chatHistory", JSON.stringify(chatHistory));

//     updateChatHistory();
//     responseElement.innerText = data.content;
//   } catch (error) {
//     console.error("Er is een fout opgetreden:", error);
//     errorElement.innerText = error.message;
//   } finally {
//     submitBtn.disabled = false;
//   }
// });

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