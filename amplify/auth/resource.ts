import { defineAuth } from '@aws-amplify/backend'
import { addUserToGroup } from "./add-user-to-group_renamed/resource"

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true
  },
  groups: ['ADMINS', 'user'],
  access: (allow) => [
    allow.resource(addUserToGroup).to(["addUserToGroup"])
  ],
  userAttributes: {
    email: { required: true, mutable: true },
    preferredUsername: { required: false, mutable: true }
  }
});
