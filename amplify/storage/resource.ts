import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'amplify-next',
  isDefault: true,
  access: (allow) => ({
    // Profile pictures - anyone can view, only users can modify
    'profile-pictures/*': [
      allow.guest.to(['read']),
      allow.groups(['user']).to(['read', 'write', 'delete'])
    ],
    
    // Message attachments - only users can access
    'messages/*': [
      allow.groups(['user']).to(['read', 'write', 'delete'])
    ]
  })
}); 