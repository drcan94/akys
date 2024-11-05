export const env = {
  API_URL: __DEV__
    ? 'http://localhost:3000'
    : 'https://api.anesthesiaclinic.com',
  FIREBASE_CONFIG: {
    apiKey: 'your-api-key',
    authDomain: 'your-auth-domain',
    projectId: 'your-project-id',
    storageBucket: 'your-storage-bucket',
    messagingSenderId: 'your-messaging-sender-id',
    appId: 'your-app-id',
  },
};