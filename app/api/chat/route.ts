import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { NextResponse } from "next/server";

// Check for required environment variables
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

async function embedText(input: string): Promise<number[] | null> {
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

async function queryPinecone(vector: number[], topK = 3): Promise<string> {
  try {
    const queryResponse = await index.query({
      vector,
      topK,
      includeMetadata: true
    });
    
    if (!queryResponse.matches?.length) return "";
    
    return queryResponse.matches
      .map(match => (match.metadata?.text as string) ?? "")
      .join("\n");
  } catch (error) {
    console.error("Error querying Pinecone:", error);
    return "";
  }
}

async function generateOldTimerResponse(userMessage: string, context: string): Promise<string> {
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

    return completion.choices[0].message.content ?? "Sorry, I'm having trouble right now.";
  } catch (error) {
    console.error("Error generating response:", error);
    return "Sorry, I'm having trouble accessing my baseball memories right now.";
  }
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    // Create embedding for the query
    const embedding = await embedText(message);
    if (!embedding) {
      return NextResponse.json({ error: "Failed to create embedding" }, { status: 500 });
    }
    
    // Query Pinecone with the embedding
    const context = await queryPinecone(embedding);
    
    // Generate response using the context
    const response = await generateOldTimerResponse(message, context);
    
    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
} 