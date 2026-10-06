export const environment = {
  production: false,
  apiUrl: `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3000`,
  cdnUrl: 'https://d24jkgof7wi3hx.cloudfront.net',
  aptabaseKey: '',
};
