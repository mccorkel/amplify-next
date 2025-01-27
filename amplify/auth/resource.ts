import { defineAuth } from "@aws-amplify/backend";
import { addUserToGroup } from "../data/add-user-to-group/resource";

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ["ADMINS", "user"],
  access: (allow) => [
    allow.resource(addUserToGroup).to(["addUserToGroup"])
  ],
  triggers: {
    postConfirmation: addUserToGroup
  }
});
