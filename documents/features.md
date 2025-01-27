# Features Overview

Below is a comprehensive outline of the main features in the Cooperstown application. Each feature description includes its purpose, functionality, edge cases, business rules, and validation requirements.

---

## 1. Team Channels

### Purpose
- Provide dedicated chat channels for every MLB team.

### Functionality
- A single channel is created for each MLB team upon application initialization.
- Users can join a team channel to discuss events, stats, and news specific to that team.
- Each channel has an “Old Timer” AI user available to answer team-specific questions.

### Edge Cases
- **No messages yet**: A channel might have no messages if it has just been created or if no one has posted.
- **Non-existent channel**: Attempts to join a channel with an invalid team name or ID should trigger a “Channel not found” response.
- **Team name collisions**: Must ensure no duplicate channels for the same team are created.

### Business Rules
- Only authenticated users can access or post in team channels.
- Old Timer is recognized by a special role or user attribute for each channel.

### Validation Requirements
- The channel name must be recognized as a valid MLB team or the user sees an error.
- The user must be authenticated before posting messages.

---

## 2. Upcoming Game Channel

### Purpose
- A dedicated chat for discussing upcoming MLB games in a single shared space.

### Functionality
- Automatically created upon app deployment (1 global channel).
- Displays pinned or scheduled events for the next MLB games.
- Users can discuss predictions, strategies, or relevant news.

### Edge Cases
- **No upcoming games**: If no upcoming MLB games are found, the channel might show a placeholder or a “No upcoming games” message.
- **Archived content**: Past game discussion may be archived or remain in the channel.

### Business Rules
- Available to all authenticated users, similar to team channels.
- Old Timer can optionally provide game predictions if the relevant data is retrieved from the vector DB.

### Validation Requirements
- Must exist only once. The name “Upcoming Game” channel is fixed in the system.
- Users must be authenticated to participate.

---

## 3. Old Timer AI in Each Channel

### Purpose
- Provide AI-driven historical and statistical knowledge for each channel’s specific topic.

### Functionality
- Each team channel has one Old Timer user that responds with RAG-based (Retrieval-Augmented Generation) answers.
- The Old Timer fetches relevant info from the vector database and uses an LLM to provide rich, historically grounded insights.

### Edge Cases
- **No relevant data found**: The Old Timer may fail gracefully, stating it has no data on the query.
- **LLM rate limit or API downtime**: Must handle third-party errors or downtime with a fallback or error message.

### Business Rules
- Old Timer is a special user role that cannot be changed by normal members.
- The AI’s replies should remain on-topic and follow the user’s channel context (particularly for the correct MLB team).

### Validation Requirements
- The system must confirm that a valid channel/team name is associated with the Old Timer’s request so the correct vector data is retrieved.
- Must validate user’s request content for malicious or disallowed inputs (e.g., filtering or sanitizing if necessary).

---

## 4. Direct Messages (DM) with Old Timer

### Purpose
- Let users privately query the Old Timer for stats or historical data in a 1-on-1 conversation.

### Functionality
- Users can start a private conversation with the Old Timer for more personalized Q&A.
- The same RAG pipeline is used, but restricted to the user and the AI participant.

### Edge Cases
- **Permission**: If a user DMs the Old Timer about a team they are not a member of, the Old Timer might have limited context or politely decline if team data is locked.
- **AI persona mismatch**: Ensure the “Old Timer” persona is consistent in both channel and DM contexts.

### Business Rules
- DM also requires authentication. Anonymous users cannot DM the Old Timer.
- Chat logs are private to the user, but admin or compliance logs may still be stored.

### Validation Requirements
- Must validate that the user is indeed messaging an approved AI user entity.
- Enforce rate limits or usage policy if users spam the AI.

---

## 5. Authentication & Access Control

### Purpose
- Restrict chat features to only registered or authenticated users.

### Functionality
- Users sign up or log in via AWS Amplify's built-in authentication.
- Auth state determines whether the user can see or interact with chat channels.

### Edge Cases
- **User session expiration**: Session or token expiration requires re-authentication.
- **Forgot password**: Users can reset their password through an Amplify-provided flow.

### Business Rules
- Certain roles (e.g., “admin”) have elevated permissions to moderate or create channels.
- Standard users can post messages in existing channels, but cannot create new ones beyond the system defaults.

### Validation Requirements
- Amplify ensures strong password and identity checks.
- Must pass a valid session token to interact with the protected chat routes.

---

## 6. RAG Flow & Vector Database

### Purpose
- Dynamically augment Old Timer’s LLM responses with relevant baseball data.

### Functionality
- On each AI query, the system extracts keywords from the user input and queries the Google vector DB for relevant chunked data.
- Retrieved data is appended to the LLM prompt, providing context for the Old Timer’s final response.

### Edge Cases
- **Sparse data**: Some teams might have limited data in the vector store, leading to less detailed responses.
- **Incorrect data**: Potential for vector retrieval mismatches if the query is ambiguous or indexing is incomplete.

### Business Rules
- The system always attempts to retrieve updated or newly ingested baseball statistics in real time.
- Must handle large volumes of data for all MLB teams, ensuring performance is not degraded.

### Validation Requirements
- The system ensures the retrieved context matches the correct channel/team.
- Must handle incomplete or partial results gracefully.

---

## 7. Admin Privileges

### Purpose
- Allow certain users to moderate channels and manage user roles.

### Functionality
- Admin users can ban or mute abusive users, delete spam messages, and update channel descriptions.
- Admins handle the creation or management of any new channels beyond the default ones.

### Edge Cases
- **Revoking admin**: Need a fallback if an admin accidentally revokes their own role.
- **Overlapping roles**: A user might be an admin in some channels but not others (if that emerges as a requirement).

### Business Rules
- Only admin users can perform direct database actions (e.g., forcibly removing channels or messages).
- Admin privileges are assigned via the Amplify cognito user groups or internal roles.

### Validation Requirements
- The system checks each admin action for valid authorization tokens.
- Must handle concurrency if multiple admins edit the same channel simultaneously.

---

## 8. Notifications (Future Enhancement)

### Purpose
- Alert users to new messages or responses from the Old Timer in their subscribed channels.

### Functionality
- Could push real-time notifications via WebSockets or push notifications for important messages.

### Edge Cases
- **User unsubscribed**: Some users might opt out of notifications or have them disabled.
- **High volume**: A popular channel might flood a user with too many notifications.

### Business Rules
- Must respect user notification preferences.
- Possibly combined with daily or weekly digest if real-time notifications are not feasible.

### Validation Requirements
- Each message event triggers notification logic, ensuring the user has subscribed or not.
- The system must confirm the user’s device or token is valid for push notifications.

---

## Conclusion

Each feature in Cooperstown plays a critical role in providing baseball fans an engaging chat environment, powered by an AI persona with real data. By clarifying the purpose, functionality, edge cases, and validations, we ensure a robust user experience that’s both feature-rich and reliable.