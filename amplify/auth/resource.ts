import { defineAuth } from "@aws-amplify/backend";

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true
  },
  // Define user attributes
  userAttributes: {
    // Custom display name with constraints
    "custom:display_name": {
      dataType: "String",
      mutable: true,
      maxLen: 16,
      minLen: 1,
    },
    // Profile picture URL
    "custom:profile_picture": {
      dataType: "String",
      mutable: true,
      maxLen: 2048,
      minLen: 1,
    },
    // Required standard attributes
    email: { required: true, mutable: true }
  }
});
