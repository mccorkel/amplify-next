import { NextResponse } from "next/server";
import { embedText, queryPinecone, generateOldTimerResponse } from './utils';

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

export async function POST(request: Request) {
  console.log('[Server] Received chat request');
  try {
    // Log environment check
    console.log('[Server] Environment variables check:', {
      hasPineconeKey: !!process.env.PINECONE_API_KEY,
      hasPineconeIndex: !!process.env.PINECONE_INDEX,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY
    });

    // Validate request body
    const body = await request.json();
    if (!body || typeof body.message !== 'string' || !body.message.trim()) {
      console.error('[Server] Invalid request body:', body);
      return NextResponse.json(
        { error: "Invalid request: message is required" },
        { status: 400 }
      );
    }

    const message = body.message.trim();
    console.log('[Server] Processing message:', message.substring(0, 100));
    
    // Create embedding for the query
    console.log('[Server] Creating embedding...');
    const embedding = await embedText(message);
    if (!embedding) {
      console.error('[Server] Failed to create embedding');
      return NextResponse.json(
        { error: "Failed to create embedding for the message" },
        { status: 500 }
      );
    }
    console.log('[Server] Successfully created embedding');
    
    // Query Pinecone with the embedding
    console.log('[Server] Querying Pinecone...');
    const context = await queryPinecone(embedding);
    if (context === null) {
      console.error('[Server] Failed to query Pinecone');
      return NextResponse.json(
        { error: "Failed to retrieve relevant baseball knowledge" },
        { status: 500 }
      );
    }
    console.log('[Server] Successfully retrieved context from Pinecone, length:', context.length);
    
    // Generate response using the context
    console.log('[Server] Generating response...');
    const response = await generateOldTimerResponse(message, context);
    if (!response) {
      console.error('[Server] Failed to generate response');
      return NextResponse.json(
        { error: "Failed to generate Old Timer's response" },
        { status: 500 }
      );
    }
    
    console.log('[Server] Successfully generated response');
    return NextResponse.json({ response });
  } catch (error) {
    console.error("[Server] Error in chat route:", error);
    if (error instanceof Error) {
      console.error("[Server] Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: "Failed to process request: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
} 