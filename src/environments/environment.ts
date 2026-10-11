export const environment = {
  production: false,
  apiUrl: `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3000`,
  cdnUrl: 'https://d24jkgof7wi3hx.cloudfront.net',
  aptabaseKey: '',
  cognitoUserPoolId: 'eu-central-1_zaCsVfORI',
  cognitoClientId: '7ebbp6lua6aeeacs1v2gess462',
  cognitoRegion: 'eu-central-1',
};
