# User Flow

This document describes the journey of a typical user as they sign up, browse channels, interact with the Old Timer AI, and manage their account in the Cooperstown application.

---

## 1. Landing Page (Unauthenticated)

1. **Visitor Accesses Site**
   - Sees the publicly accessible homepage highlighting features and the Cooperstown brand.

2. **Explore**
   - Can read about how the application works.
   - Limited content: cannot view or post in channels until authenticated.

3. **Sign Up or Sign In**
   - Clicking “Get Started” or “Sign In” triggers Amplify’s Auth UI.

---

## 2. Registration & Login Flow

1. **Registration**
   - User enters email and password.
   - AWS Cognito handles account creation and verification.
   - If email verification is enabled, user must confirm via link or code.

2. **Login**
   - Once credentials are validated, Cognito returns a session token.
   - The user is redirected to the main chat interface or the next protected page they tried to access.

3. **Post-Login**
   - Access to channels is granted based on authenticated state.
   - A unique user ID is associated with every post or channel membership.

---

## 3. Main Chat Interface

1. **Channel List**
   - Displays all available channels: 30 MLB team channels plus “Upcoming Game” channel.
   - Possibly a short description or count of unread messages for each channel.

2. **Joining a Channel**
   - User selects a channel, instantly sees message history (pulling from DynamoDB).
   - The Old Timer is present in each team channel as a pinned user.

3. **Posting a Message**
   - User types in the message box; upon sending, the message is stored in DynamoDB.
   - The UI updates immediately (optimistic update), followed by a success or error from the backend.

---

## 4. Old Timer Interaction (RAG Flow)

1. **User Mentions Old Timer**
   - The user includes “@OldTimer” or a special mention that triggers the AI logic.

2. **Lookup in Vector DB**
   - The system sends the user message to a microservice or serverless function.
   - The function extracts key words or topics, queries Google’s vector DB for relevant baseball data.

3. **LLM Processing**
   - The retrieved context is appended to an LLM prompt, ensuring the response is historically accurate.
   - The LLM returns a text answer adopting the Old Timer persona.

4. **AI Reply**
   - The message is posted by the Old Timer in the channel or DM, visible to all channel members (or just the user in a DM).

---

## 5. Direct Messages (DM)

1. **User Opens DM**
   - Optionally, the user can DM the Old Timer or another user.
   - A unique channel (or conversation) ID is generated if it doesn’t exist.

2. **Message Exchange**
   - Messages are stored privately, not visible to channel-based queries.
   - Old Timer’s RAG logic is similar, except the user has a 1-on-1 context.

---

## 6. Admin Tools & Moderation

1. **Admin Login**
   - An admin user logs in similarly, but they have additional privileges.

2. **Moderation Actions**
   - Admin can delete offensive messages or ban a user from a channel.
   - They can also edit channel descriptions or create new channels beyond the default set.

3. **Notifications**
   - Admin might receive alerts for flagged content.
   - Future expansions can allow custom moderation dashboards.

---

## 7. Logout & Session Management

1. **User Logout**
   - The user explicitly logs out or the session token expires after a set period.

2. **Re-login**
   - If the user tries to access protected routes post-logout, they are redirected to Amplify’s sign-in screen.

---

## Data Flow Diagram (High-Level)
[ User ] –> [ Next.js Frontend ] –> [ Cognito Auth ]
|
v
[ Amplify Data / DynamoDB ]
|
v
[ Google Vector DB (for RAG) ]
|
v
[ LLM (Old Timer Persona) ]
1. User sends request from the Next.js frontend.
2. Cognito verifies authentication.
3. DynamoDB is used to store/retrieve channel messages.
4. For AI queries, the system calls the vector DB and then an LLM, returning responses as “Old Timer.”

---

## Conclusion

The Cooperstown user flow emphasizes an intuitive chat experience backed by advanced AI data retrieval. From first visiting the landing page to full-fledged channel interactions, users engage with a robust, real-time environment that merges baseball community discussions and powerful historical insights.