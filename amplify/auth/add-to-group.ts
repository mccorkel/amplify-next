import { PostConfirmationTriggerEvent } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({});

export const handler = async (event: PostConfirmationTriggerEvent) => {
  try {
    await client.send(
      new AdminAddUserToGroupCommand({
        GroupName: 'user',
        UserPoolId: event.userPoolId,
        Username: event.userName
      })
    );
    
    console.log(`Successfully added user ${event.userName} to group 'user'`);
  } catch (error) {
    console.error('Error adding user to group:', error);
    throw error;
  }
  
  return event;
}; 