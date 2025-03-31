import apiService, { ApiService } from './ApiService';
import notificationService from './NotificationService';
import templateService from './TemplateService';
import authService, { AuthService } from './AuthService';
import networkService from './NetworkService';

export {
  apiService,
  ApiService,
  notificationService,
  templateService,
  authService,
  AuthService,
  networkService
};

// Default export for convenience
export default {
  api: apiService,
  auth: authService,
  network: networkService,
  templates: templateService,
  notifications: notificationService
};
