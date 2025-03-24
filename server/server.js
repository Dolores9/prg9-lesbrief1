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
      const { question } = req.body;

      if (!question) {
          return res.status(400).json({ error: "No question provided." });
      }

      console.log("Performing similarity search...");
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
      console.error("Error processing question:", error);
      res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(port, () => {
  console.log(`De server draait op http://localhost:${port}`);
});
