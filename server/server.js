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

    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({ error: "Locatie niet gevonden." });
    }

    const { latitude, longitude, name } = geoData.results[0];
    console.log(`Locatie gevonden: ${name}`);

    const weatherUrl = `${process.env.WEATHER_API_URL}&latitude=${latitude}&longitude=${longitude}`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    const weatherContext = `Het maximum van vandaag is ${weatherData.daily.temperature_2m_max[0]}°C. Het huidige uurtemperatuur is ${weatherData.current.temperature_2m}°C.`;

    const prompt = [
  ["system", "Beantwoord de vraag op basis van de weergegevens. Als tijdstippen worden genoemd (zoals 'vanavond'), probeer dan de relevante delen van de data te gebruiken. Geef een bruikbaar advies."],
  ["user", `Weerdata: ${weatherContext}\nVraag van gebruiker: ${question || "Wat kan ik vandaag verwachten?"}`],
];


    const aiResponse = await model.invoke(prompt);

    res.json({ content: aiResponse.content });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Weerdata ophalen mislukt." });
  }
});


app.listen(port, () => {
  console.log(`De server draait op http://localhost:${port}`);
});
