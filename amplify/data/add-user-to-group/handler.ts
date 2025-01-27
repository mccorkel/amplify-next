import type { Schema } from "../resource";
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from "@aws-sdk/client-cognito-identity-provider";
import { PostConfirmationTriggerEvent } from 'aws-lambda';

// Get the user pool ID from environment variables
const userPoolId = process.env.AMPLIFY_AUTH_USERPOOL_ID;
const region = process.env.AMPLIFY_AUTH_REGION || 'us-west-2';

if (!userPoolId) {
  throw new Error("AMPLIFY_AUTH_USERPOOL_ID environment variable is not set");
}

type Handler = Schema["addUserToGroup"]["functionHandler"];
const client = new CognitoIdentityProviderClient({ region });

export const handler = async (event: Handler | PostConfirmationTriggerEvent) => {
  try {
    // Handle post confirmation trigger
    if ('triggerSource' in event && event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
      console.log('Post confirmation trigger for user:', event.userName);
      const command = new AdminAddUserToGroupCommand({
        Username: event.userName,
        GroupName: 'user',
        UserPoolId: userPoolId,
      });
      
      await client.send(command);
      console.log('Successfully added new user to user group');
      return event;
    }
    
    // Handle admin mutation
    if ('arguments' in event) {
      const { userId, groupName } = event.arguments;
      console.log(`Adding user ${userId} to group ${groupName} in user pool ${userPoolId}`);
      
      const command = new AdminAddUserToGroupCommand({
        Username: userId,
        GroupName: groupName,
        UserPoolId: userPoolId,
      });

      await client.send(command);
      
      return {
        success: true,
        message: "User added to group successfully"
      };
    }
    
    throw new Error('Invalid event type');
  } catch (error) {
    console.error("Error adding user to group:", error);
    throw error;
  }
}; 