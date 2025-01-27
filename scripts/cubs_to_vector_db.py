#!/usr/bin/env python3
"""
cubs_to_vector_db.py

Fetches comprehensive historical data for the Chicago Cubs (teamID=112) via mlb-statsapi,
focusing on more recent seasons where data is more reliable.
Embeds the data using OpenAI and stores it in Pinecone.
"""

import os
import statsapi
from openai import OpenAI
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
import time
from tqdm import tqdm

# New Pinecone library usage
from pinecone import Pinecone, ServerlessSpec

# Configuration - using environment variables only
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.environ.get("PINECONE_ENV")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required")
if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY environment variable is required")
if not PINECONE_ENVIRONMENT:
    raise ValueError("PINECONE_ENV environment variable is required")

CUBS_TEAM_ID = 112
START_YEAR = 1900  # Starting from 1900 as earlier data is less reliable
CURRENT_YEAR = datetime.now().year

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

def get_team_history() -> List[str]:
    """Fetch basic team history and achievements."""
    history = [
        "The Chicago Cubs are one of baseball's oldest and most historic franchises. "
        "Founded in 1876 as the Chicago White Stockings, they became the Cubs in 1903. "
        "They play their home games at historic Wrigley Field, which opened in 1914. "
        "The Cubs have won three World Series championships (1907, 1908, and 2016), "
        "breaking a 108-year championship drought with their 2016 victory. "
        "They've won 17 National League pennants and are known for legendary players "
        "like Ernie Banks, Ron Santo, Billy Williams, and Ryne Sandberg."
    ]
    return history

def get_season_stats(year: int) -> List[str]:
    """Fetch team statistics for a specific season."""
    try:
        stats = []
        
        # Get schedule for the season
        schedule = statsapi.schedule(team=CUBS_TEAM_ID, start_date=f"{year}-01-01", end_date=f"{year}-12-31")
        
        if schedule:
            # Calculate W-L record
            wins = len([g for g in schedule if g.get('status') == 'Final' and 
                       ((g.get('home_id') == CUBS_TEAM_ID and g.get('home_score', 0) > g.get('away_score', 0)) or
                        (g.get('away_id') == CUBS_TEAM_ID and g.get('away_score', 0) > g.get('home_score', 0)))])
            losses = len([g for g in schedule if g.get('status') == 'Final' and 
                         ((g.get('home_id') == CUBS_TEAM_ID and g.get('home_score', 0) < g.get('away_score', 0)) or
                          (g.get('away_id') == CUBS_TEAM_ID and g.get('away_score', 0) < g.get('home_score', 0)))])
            
            if wins + losses > 0:
                stats.append(f"In {year}, the Cubs finished with a {wins}-{losses} record.")
        
        return stats
    except Exception as e:
        print(f"Error fetching {year} season stats: {e}")
        return []

def get_game_results(year: int) -> List[str]:
    """Fetch game results for a specific season."""
    try:
        games = []
        
        # Get schedule for the entire season
        schedule = statsapi.schedule(team=CUBS_TEAM_ID, start_date=f"{year}-03-01", end_date=f"{year}-11-30")
        
        for game in schedule:
            if game.get('status') == 'Final':
                games.append(
                    f"On {game.get('game_date')}, "
                    f"the {game.get('away_name')} played at {game.get('home_name')}. "
                    f"Final score: {game.get('away_name')} {game.get('away_score')}, "
                    f"{game.get('home_name')} {game.get('home_score')}."
                )
        
        return games
    except Exception as e:
        print(f"Error fetching {year} game results: {e}")
        return []

def get_postseason_data(year: int) -> List[str]:
    """Fetch postseason information for a specific season."""
    try:
        postseason = []
        
        # Get schedule for potential postseason months
        schedule = statsapi.schedule(
            team=CUBS_TEAM_ID,
            start_date=f"{year}-10-01",
            end_date=f"{year}-11-15"
        )
        
        playoff_games = [g for g in schedule if g.get('game_type', '').upper() != 'R']
        
        if playoff_games:
            postseason.append(f"Cubs postseason appearances in {year}:")
            for game in playoff_games:
                postseason.append(
                    f"{game.get('game_type')}: {game.get('away_name')} at {game.get('home_name')}, "
                    f"Score: {game.get('away_score')}-{game.get('home_score')}"
                )
        
        return postseason
    except Exception as e:
        print(f"Error fetching {year} postseason data: {e}")
        return []

def get_all_cubs_data() -> List[str]:
    """
    Fetch comprehensive Cubs data including history, season stats,
    game results, and postseason appearances.
    """
    all_data = []
    
    # 1. Get team history
    print("Fetching team history...")
    all_data.extend(get_team_history())
    
    # 2. Iterate through seasons
    for year in tqdm(range(START_YEAR, CURRENT_YEAR + 1), desc="Fetching historical data"):
        # Add year header
        all_data.append(f"\n=== {year} Season ===")
        
        # Get season stats
        all_data.extend(get_season_stats(year))
        
        # Get game results (sample of important games)
        games = get_game_results(year)
        if games:
            # Only keep opening day, last game of season, and any games with high run totals
            all_data.append(games[0])  # Opening Day
            all_data.append(games[-1])  # Last game
        
        # Get postseason data
        all_data.extend(get_postseason_data(year))
        
        # Add a small delay to avoid rate limiting
        time.sleep(0.1)
    
    return all_data

def embed_text_snippets(text_snippets: List[str], chunk_size: int = 1000) -> List[tuple]:
    """
    Create embeddings for text snippets, chunking long texts if necessary.
    """
    embeddings = []
    for snippet in tqdm(text_snippets, desc="Creating embeddings"):
        if not snippet.strip():
            continue
            
        # Split long texts into smaller chunks
        if len(snippet) > chunk_size:
            words = snippet.split()
            chunks = []
            current_chunk = []
            current_length = 0
            
            for word in words:
                if current_length + len(word) + 1 <= chunk_size:
                    current_chunk.append(word)
                    current_length += len(word) + 1
                else:
                    chunks.append(" ".join(current_chunk))
                    current_chunk = [word]
                    current_length = len(word)
            
            if current_chunk:
                chunks.append(" ".join(current_chunk))
        else:
            chunks = [snippet]
        
        # Create embeddings for each chunk
        for chunk in chunks:
            try:
                response = client.embeddings.create(
                    model="text-embedding-ada-002",
                    input=chunk
                )
                vector = response.data[0].embedding
                embeddings.append((chunk, vector))
                
                # Add a small delay to avoid rate limiting
                time.sleep(0.1)
            except Exception as e:
                print(f"Error creating embedding: {e}")
                continue
    
    return embeddings

def upsert_into_pinecone(embeddings: List[tuple], index_name: str = "cubs-index"):
    """
    Use Pinecone to store the embedded text with metadata.
    """
    # Create the Pinecone client
    pc = Pinecone(api_key=PINECONE_API_KEY)
    
    # Check if index exists
    existing_indexes = pc.list_indexes().names()
    if index_name not in existing_indexes:
        print(f"Creating new index '{index_name}'...")
        pc.create_index(
            name=index_name,
            dimension=1536,  # dimension for text-embedding-ada-002
            metric='cosine',
            spec=ServerlessSpec(
                cloud='aws',
                region=PINECONE_ENVIRONMENT
            )
        )
    
    # Get the index
    index = pc.Index(index_name)
    
    # Prepare vectors for upsert
    vectors_to_upsert = []
    for snippet, vector in tqdm(embeddings, desc="Preparing vectors"):
        vectors_to_upsert.append((
            str(uuid.uuid4()),
            vector,
            {"text": snippet, "source": "mlb-chicago-cubs"}
        ))
        
        # Upsert in batches of 100
        if len(vectors_to_upsert) >= 100:
            index.upsert(vectors=vectors_to_upsert)
            vectors_to_upsert = []
    
    # Upsert any remaining vectors
    if vectors_to_upsert:
        index.upsert(vectors=vectors_to_upsert)

def main():
    print("Starting Cubs historical data collection...")
    
    # 1. Fetch all Cubs data
    text_snippets = get_all_cubs_data()
    if not text_snippets:
        print("No data was collected. Aborting.")
        return
    
    print(f"Collected {len(text_snippets)} text snippets")
    
    # 2. Create embeddings
    embedded_data = embed_text_snippets(text_snippets)
    print(f"Created {len(embedded_data)} embeddings")
    
    # 3. Store in Pinecone
    upsert_into_pinecone(embedded_data)
    print("Data successfully stored in Pinecone")

if __name__ == "__main__":
    main()