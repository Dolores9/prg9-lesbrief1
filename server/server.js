import express from 'express'
import cors from 'cors'
import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const model = new AzureChatOpenAI({ temperature: 0.3 })
const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});
const vectorStore = await FaissStore.load("vectordatabase", embeddings); 
console.log(vectorStore);

const app = express();
const port = 3000;
const chatHistory = [];

app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
console.log('Test voo GET')
})

app.post("/api/ask", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "No messages provided." });
    }

    console.log("Performing similarity search...");
    const lastUserMessage = messages.filter(m => m.role === "user").slice(-1)[0]?.content || "";

    const relevantDocs = await vectorStore.similaritySearch(lastUserMessage, 3);
    const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");

    // Voeg een system prompt toe die de context uitlegt
    const promptMessages = [
      { role: "system", content: `Gebruik alleen de volgende context om de vragen te beantwoorden:\n\n${context}` },
      ...messages
    ];

    console.log("🤖 Asking the AI model...");
    const response = await model.invoke(promptMessages);

    console.log("\nAnswer found:");
    console.log(response.content);

    res.json({ content: response.content });

  } catch (error) {
    console.error("Error processing question:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});


app.post("/api/weather", async (req, res) => {
  try {
    const { location, question } = req.body;

    if (!location) {
      return res.status(400).json({ error: "Locatie ontbreekt." });
    }

    // 🔍 Geolocatie ophalen
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({ error: "Locatie niet gevonden." });
    }

    const { latitude, longitude, name } = geoData.results[0];
    console.log(`Locatie gevonden: ${name}`);

    // 🌤️ Weerdata ophalen
    const weatherUrl = `${process.env.WEATHER_API_URL}&latitude=${latitude}&longitude=${longitude}`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    const maxTemp = weatherData.daily.temperature_2m_max[0];
    const minTemp = weatherData.daily.temperature_2m_min[0];
    const currentTemp = weatherData.current.temperature_2m;
    const weatherCode = weatherData.current.weathercode;

    // 🌦️ Beschrijving van het weer op basis van code
    const codeMap = {
      0: "helder",
      1: "grotendeels helder",
      2: "gedeeltelijk bewolkt",
      3: "bewolkt",
      45: "mistig",
      48: "rijp of mist",
      51: "lichte motregen",
      53: "matige motregen",
      55: "dichte motregen",
      61: "lichte regen",
      63: "matige regen",
      65: "zware regen",
      80: "regenbuien",
      95: "onweer",
    };
    const condition = codeMap[weatherCode] || "onbekende weersomstandigheden";

    const weatherContext = `De temperatuur is momenteel ${currentTemp}°C. Het maximum vandaag is ${maxTemp}°C en het minimum ${minTemp}°C. De omstandigheden zijn: ${condition}.`;

    // 💬 AI prompt met concreet adviesverzoek
    const prompt = [
      {
        role: "system",
        content:
          "Je bent een slimme AI-assistent die advies geeft over de beste werkplek op basis van het weer. Analyseer de temperatuur en weersomstandigheden. Geef altijd een duidelijk en concreet advies, zoals: 'Vandaag kun je het beste buiten werken', 'Blijf vandaag binnen vanwege regen', of 'Thuiswerken is aan te raden door kou of onweer'. Gebruik eenvoudige taal."
      },
      {
        role: "user",
        content: `Weerdata: ${weatherContext}\nVraag: ${question || "Waar kan ik vandaag het beste werken?"}`
      }
    ];

    // 🤖 AI-invoking
    const aiResponse = await model.invoke(prompt);

    res.json({ content: aiResponse.content });

  } catch (err) {
    console.error("Fout bij weerdata ophalen of verwerken:", err);
    res.status(500).json({ error: "Weerdata ophalen mislukt." });
  }
});




app.listen(port, () => {
  console.log(`De server draait op http://localhost:${port}`);
});
