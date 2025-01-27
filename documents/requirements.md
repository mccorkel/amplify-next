# Requirements

This document outlines both the functional and non-functional requirements crucial for the Cooperstown application’s success.

---

## 1. Functional Requirements

1. **User Registration & Login**
   - FR1: Users must be able to create an account with a valid email and password.
   - FR2: Users can reset their password via AWS Amplify’s built-in flow.

2. **Channel Management**
   - FR3: System auto-creates channels for each MLB team at deployment.
   - FR4: System provides a global “Upcoming Game” channel by default.
   - FR5: Admin users can moderate channels (e.g., remove messages or ban users).

3. **Message Posting & Retrieval**
   - FR6: Authenticated users can post messages in any channel they join.
   - FR7: Users can retrieve the last 50 (or more) messages from a channel.

4. **Old Timer AI Responses**
   - FR8: Each team channel has an “Old Timer” persona that responds with historical data and stats.
   - FR9: Users can mention the Old Timer in a channel or DM to request stats, game results, etc.

5. **RAG Flow Integration**
   - FR10: The system queries the vector DB for relevant context and passes it to an LLM to generate responses.
   - FR11: The Old Timer includes references or disclaimers where relevant.

6. **Direct Messaging**
   - FR12: Users can DM the Old Timer or other users in a private conversation channel.
   - FR13: DM messages are not visible to channel members.

7. **User Roles & Permissions**
   - FR14: Admin role can create or remove channels, moderate messages, and manage user roles.
   - FR15: Users have read/write access only to channels they’re members of.

---

## 2. Non-Functional Requirements

1. **Performance**
   - NFR1: Chat messages should appear within one second of being sent (95% of the time).
   - NFR2: The RAG flow must return responses within ~3 seconds on average (subject to LLM constraints).

2. **Scalability**
   - NFR3: Must support thousands of concurrent users in multiple channels without major slowdowns.
   - NFR4: Vector DB must handle an expanding dataset of MLB stats as the league’s history grows.

3. **Security**
   - NFR5: All channel messages are restricted to authenticated users, enforced by AWS Amplify.
   - NFR6: Admin actions are only accessible to authorized roles, preventing unauthorized moderation.

4. **Usability**
   - NFR7: Simple chat interface that’s intuitive for new users, including mobile-friendly design.
   - NFR8: Consistent brand styling and “MLB-themed” look for the landing page.

5. **Maintainability**
   - NFR9: Codebase must follow standard TypeScript and React best practices, ensuring easy onboarding of new developers.
   - NFR10: Automated tests for critical chat functionalities to catch regressions quickly.

6. **Reliability & Availability**
   - NFR11: 99.5% uptime target for the application across AWS Amplify.
   - NFR12: AWS region redundancy if usage scales globally or demands higher availability.

7. **Compliance**
   - NFR13: Adhere to standard data privacy policies; ensure user data is stored securely (Cognito, DynamoDB).
   - NFR14: Potential compliance with usage of MLB data or logos, following official guidelines.

---

## Conclusion

These functional and non-functional requirements provide a clear scope for the Cooperstown application. Meeting them ensures a stable, secure, and enjoyable experience that seamlessly integrates community chat with AI-driven baseball insights.