# Implementation Details

This document describes the technical approach for building and deploying the Cooperstown application.

---

## 1. Development Approach

1. **Agile Methodology**
   - We use a sprint-based approach with short development cycles.
   - Regular sprint retrospectives help refine features and adapt to changing requirements.

2. **Coding Standards**
   - Use ESLint + Prettier for consistent formatting.
   - Follow standard React/Next.js best practices for file structure and naming conventions.

3. **Version Control**
   - Hosted on GitHub, with feature branches merged via pull requests.
   - Enforce code reviews to maintain code quality.

4. **Testing**
   - Unit tests using Jest and React Testing Library.
   - Integration tests for critical flows (authentication, message posting) are implemented before going to production.

---

## 2. Timeline Estimates

- **MVP Landing Page & Auth**: 2 weeks
- **Core Chat (Team Channels + AI Old Timer)**: 4 weeks
- **Integration with Vector DB**: 2 weeks
- **Admin Tools & Additional Features**: 2–3 weeks
- **Testing & Hardening**: 2 weeks

Total approximate time: 10–11 weeks for a stable MVP release.

---

## 3. Technical Guidelines

1. **Framework**
   - **Next.js 13** with App Router for modern file-based routing.
   - **React** for the component-based UI.

2. **Amplify & Cloud Services**
   - **AWS Amplify** Gen 2 for backend orchestration (Auth, Data).
   - **Amazon Cognito** for user authentication.
   - **Amazon DynamoDB** or Amplify-provisioned data store for user data, messages, channels, etc.

3. **Vector Database**
   - **Google’s Vector DB** for storing baseball historical/statistical data.
   - RAG queries pass user text to the vector store, retrieving relevant context before hitting the LLM.

4. **LLM Services**
   - Initially, an external service like **OpenAI** or a **Hugging Face** endpoint.
   - The system passes the user input plus vector context to the LLM with an “Old Timer” persona prompt.

5. **Frontend**
   - **Tailwind CSS** for styling.
   - **TypeScript** for type safety.

---

## 4. Architecture & Database Design

1. **User Model**
   - Fields: `id`, `email`, `displayName`, `profilePicture`, `createdAt`, `updatedAt`.

2. **Channel Model**
   - Fields: `id`, `name`, `description`, `createdAt`, `updatedAt`.
   - 30 channels for MLB teams plus an “upcoming games” channel.
   - Relationship: Many messages. Also many `ChannelMember` records.

3. **Message Model**
   - Fields: `id`, `content`, `channelId`, `senderId`, `attachmentPath`, `createdAt`, `updatedAt`.

4. **ChannelMember**
   - Links user IDs to channel IDs for membership and role tracking.

5. **AI Persona**
   - Possibly stored as a synthetic “User” with a special `role: "OLD_TIMER"` attribute or a separate entity.

---

## 5. Cloud Services

1. **Hosting & Deployment**
   - **AWS Amplify** Gen 2 for continuous deployment from Git.
   - Automatic environment creation for staging/production.

2. **Authentication**
   - **Amazon Cognito** with Amplify’s auth library on the frontend.
   - Protected routes in Next.js for chat features.

3. **Vector DB**
   - Stored externally in Google Cloud.
   - Ingest MLB data sets (e.g., historical data, stats, rosters) into vector embeddings.

4. **RAG Pipeline**
   - For each Old Timer message, we call a microservice (or serverless function) that:
     1. Extracts relevant keywords from user prompt.
     2. Queries the vector DB for top matching data chunks.
     3. Constructs a final prompt including the user query + data chunks.
     4. Sends this to the LLM.
     5. Returns the result to the Next.js app for display.

---

## Conclusion

The Cooperstown application follows a modern, scalable approach using Next.js, Amplify, and external vector DB for RAG-based AI. Adhering to best coding practices and AWS security guidelines ensures a performant solution that can evolve with new features over time.