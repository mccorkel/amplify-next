import { NextResponse } from "next/server";
import { embedText, queryPinecone, generateOldTimerResponse } from './utils';

export async function POST(request: Request) {
  try {
    // Check for required environment variables
    if (!process.env.PINECONE_API_KEY) {
      return NextResponse.json({ error: "Missing PINECONE_API_KEY environment variable" }, { status: 500 });
    }

    if (!process.env.PINECONE_INDEX) {
      return NextResponse.json({ error: "Missing PINECONE_INDEX environment variable" }, { status: 500 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY environment variable" }, { status: 500 });
    }

    console.log('[Server] Received chat request');
    
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
    console.error("[Server] Unhandled error in chat route:", error);
    // Return the full error details in a structured format
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : String(error)
    }, { status: 500 });
  }
} 