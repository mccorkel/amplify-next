import { PreSignUpTriggerEvent } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({});

export const handler = async (event: PreSignUpTriggerEvent) => {
  try {
    const { userPoolId, userName } = event;
    
    const addToGroupCommand = new AdminAddUserToGroupCommand({
      GroupName: 'user',
      UserPoolId: userPoolId,
      Username: userName
    });

    await cognitoClient.send(addToGroupCommand);
    console.log(`Successfully added user ${userName} to group 'user'`);
    
    return event;
  } catch (error) {
    console.error('Error adding user to group:', error);
    throw error;
  }
}; 