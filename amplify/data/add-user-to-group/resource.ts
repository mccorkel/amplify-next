import { defineFunction } from '@aws-amplify/backend';

export const addUserToGroup = defineFunction({
  entry: './handler.ts',
  environment: {
    AMPLIFY_AUTH_USERPOOL_ID: process.env.AMPLIFY_AUTH_USERPOOL_ID || '',
    AMPLIFY_AUTH_REGION: process.env.AMPLIFY_AUTH_REGION || 'us-west-2'
  }
}); 