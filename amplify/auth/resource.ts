import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true
  },
  groups: ['user'],
  userAttributes: {
    email: { required: true, mutable: true },
    preferredUsername: { required: false, mutable: true }
  }
});
