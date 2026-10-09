export const environment = {
  production: true,
  // on AKS the ingress sends /api to the api service, so the same host is used
  apiUrl: '/api'
};
