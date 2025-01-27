#!/usr/bin/env python3
import os
import openai

openai.api_key = os.environ.get("OPENAI_API_KEY", "YOUR_KEY_HERE")

def embed_text_snippets(text_snippets):
    """
    Direct usage of openai.Embedding.create() with openai>=1.0.0
    """
    embeddings = []
    for snippet in text_snippets:
        if not snippet.strip():
            continue
        response = openai.Embedding.create(
            model="text-embedding-ada-002",
            input=snippet
        )
        vector = response["data"][0]["embedding"]  # This is your embedding list
        embeddings.append((snippet, vector))
    return embeddings

def main():
    # Example usage
    text_chunks = [
        "The quick brown fox jumps over the lazy dog.",
        "Baseball is America's pastime."
    ]
    results = embed_text_snippets(text_chunks)
    for snippet, embedding in results:
        print("Snippet:", snippet)
        print("Embedding (first 5 dims):", embedding[:5])
        print("-"*40)

if __name__ == "__main__":
    main()