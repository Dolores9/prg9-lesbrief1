import { AzureOpenAIEmbeddings, OpenAIEmbeddings } from "@langchain/openai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0.9,
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiVersion: process.env.OPENAI_API_VERSION,
    azureOpenAIApiInstanceName: process.env.INSTANCE_NAME,
    azureOpenAIApiDeploymentName: process.env.DEPLOYMENT_NAME,
  })

let vectorStore


// Load and split the text document and save it into vectorstore

async function createVectorstore() {

    console.log("Loading document...");
    const loader = new TextLoader("myfile.txt");
    const docs = await loader.load();
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
    });
    const splitDocs = await textSplitter.splitDocuments(docs);
    console.log(`Document split into ${splitDocs.length} chunks`);
    console.log("Creating vector store...");

    // Create vector store in FAISS and save it to disk so you can load it later
    vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
    await vectorStore.save("vectordatabase");
}

export async function loadVectorStore() {
  vectorStore = await FaissStore.load("vectordatabase", embeddings);
}

export async function loadVectorStore() {
  vectorStore = await FaissStore.load("vectordatabase", embeddings);
  return vectorStore
}

// vector store maken en opslaan hoeft maar 1x, daarna kan deze regel uitgecomment worden
// await createVectorstore()
await loadVectorStore()



