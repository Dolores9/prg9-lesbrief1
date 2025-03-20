import express from 'express'
import cors from 'cors'
import { ChatOpenAI } from "@langchain/openai";
import { vectorStore } from './vector.js';


const model = new ChatOpenAI({
  temperature: 0.3,
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiVersion: process.env.OPENAI_API_VERSION,
  azureOpenAIApiInstanceName: process.env.INSTANCE_NAME,
  azureOpenAIApiDeploymentName: process.env.ENGINE_NAME,
})

const app = express();
const port = 3000;
const chatHistory = [];


console.log(vectorStore);

app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
console.log('Test voo GET')
})

app.post("/api/ask", async (req, res) => {
  try {
      const { question } = req.body;

      // ✅ Check if a question was provided
      if (!question) {
          return res.status(400).json({ error: "No question provided." });
      }

      // ✅ Check if vectorStore is available (document must be uploaded first)
      if (!vectorStore) {
          return res.status(400).json({ error: "No document processed. Please upload a document first." });
      }

      console.log("🔍 Performing similarity search...");
      const relevantDocs = await vectorStore.similaritySearch(question, 3);
      const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");

      console.log("🤖 Asking the AI model...");
      const response = await model.invoke([
          ["system", "Use the following context to answer the user's question. Only use information from the context."],
          ["user", `Context: ${context}\n\nQuestion: ${question}`]
      ]);

      console.log("\nAnswer found:");
      console.log(response.content);

      res.json({ content: response.content });

  } catch (error) {
      console.error("❌ Error processing question:", error);
      res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(port, () => {
  console.log("De server draait op http:${port}");
});
