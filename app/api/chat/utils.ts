import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

if (!process.env.PINECONE_API_KEY) {
  throw new Error("Missing PINECONE_API_KEY environment variable");
}

if (!process.env.PINECONE_INDEX) {
  throw new Error("Missing PINECONE_INDEX environment variable");
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const index = pinecone.index(process.env.PINECONE_INDEX);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function embedText(input: string): Promise<number[] | null> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: input
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error creating embedding:", error);
    return null;
  }
}

export async function queryPinecone(vector: number[], topK = 3): Promise<string | null> {
  try {
    const queryResponse = await index.query({
      vector,
      topK,
      includeMetadata: true
    });
    
    if (!queryResponse.matches?.length) return null;
    
    return queryResponse.matches
      .map(match => (match.metadata?.text as string) ?? "")
      .join("\n");
  } catch (error) {
    console.error("Error querying Pinecone:", error);
    return null;
  }
}

export async function generateOldTimerResponse(userMessage: string, context: string): Promise<string | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a friendly baseball historian who speaks in a folksy manner." },
        { role: "user", content: `You are an "Old Timer" baseball historian.
Context from baseball knowledge base:
${context}
---
Answer the user in a friendly, folksy tone. If the context doesn't contain relevant information, 
you can draw from your general baseball knowledge, but prioritize the context if available.
User message: "${userMessage}"` }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    return completion.choices[0].message.content ?? null;
  } catch (error) {
    console.error("Error generating response:", error);
    return null;
  }
} 
