#!/usr/bin/env python3
"""
Example script that uses the mlb-statsapi library to query MLB stats for a team.
Then, you could transform/clean the data to feed into a vector DB or use it for further analytics.
"""

import sys
import statsapi

def get_team_info(team_id: int):
    """
    Fetch basic info about the team including roster, schedule, etc.
    """
    # Example: get the team's official name
    team_data = statsapi.lookup_team(team_id)
    if not team_data:
        print(f"No data found for team_id={team_id}")
        return

    team_name = team_data[0].get('teamName', 'Unknown Team')
    print(f"Team Name: {team_name}")

    # Example: get the current roster
    # This returns a dictionary with player info
    roster = statsapi.get('team_roster', {'teamId': team_id})
    print(f"Total Rostered Players: {len(roster.get('roster', []))}")

    # Example: get schedule for current season (some queries require year or start/end date)
    # Let's query upcoming next 5 days (or you can pass a date range)
    schedule_data = statsapi.schedule(team=team_id, start_date='08/15/2024', end_date='08/20/2024')
    if schedule_data:
        print(f"Upcoming {team_name} Games from 08/15 to 08/20/2024:")
        for game in schedule_data:
            print(f"  - {game['game_date']} vs. {game['away_name']} at {game['home_name']}")

    # You can also gather stats for a single player
    # e.g. statsapi.player_stats() for a given MLBAM player ID
    # e.g. 592450 = Mookie Betts, just as an example:
    # player_data = statsapi.player_stats(player_id=592450, type='season')
    # print("Mookie Betts 2024 Stats:", player_data)

def main():
    """
    Example usage:
    python3 query_mlb_stats.py 147
    147 = Yankees
    """
    if len(sys.argv) < 2:
        print("Usage: python query_mlb_stats.py <TEAM_ID>")
        sys.exit(1)

    team_id = int(sys.argv[1])
    get_team_info(team_id)

if __name__ == "__main__":
    main()