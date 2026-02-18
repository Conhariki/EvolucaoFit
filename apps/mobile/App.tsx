import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import Navigation from '@/navigation';
import { notificationService } from './src/services/notification.service';

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    const setupNotifications = async () => {
      await notificationService.configureNotifications();
      await notificationService.registerForPushNotifications();
    };

    setupNotifications();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </QueryClientProvider>
  );
} 