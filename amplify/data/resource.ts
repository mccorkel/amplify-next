import { a, defineData } from "@aws-amplify/backend";
import { addUserToGroup } from "./add-user-to-group/resource";
import type { ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  Channel: a.model({
    name: a.string().required(),
    description: a.string(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).authorization((allow) => [allow.authenticated()]),

  Message: a.model({
    content: a.string().required(),
    channelId: a.string().required(),
    senderId: a.string().required(),
    attachmentPath: a.string(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).authorization((allow) => [allow.authenticated()]),

  User: a.model({
    email: a.string().required(),
    displayName: a.string().required(),
    profilePicture: a.string(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).authorization((allow) => [allow.authenticated()]),

ChannelMember: a.model({
    channelId: a.string().required(),
    userId: a.string().required(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).authorization((allow) => [allow.authenticated()]),

  addUserToGroup: a
    .mutation()
    .arguments({
      userId: a.string().required(),
      groupName: a.string().required(),
    })
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(addUserToGroup))
    .returns(a.json()),

  UserFavorite: a
    .model({
      userId: a.string(),
      channelId: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated().to(['create', 'update', 'delete', 'read']),
    ])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool"
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>