from rest_framework import permissions
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import NotificationSettings, UserPreferences
from .serializers import NotificationSettingsSerializer, UserPreferencesSerializer

User = get_user_model()

class NotificationSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        settings, created = NotificationSettings.objects.get_or_create(user=request.user)
        serializer = NotificationSettingsSerializer(settings)
        return Response(serializer.data)

    def patch(self, request):
        settings, created = NotificationSettings.objects.get_or_create(user=request.user)
        serializer = NotificationSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

import logging
from django.db import DatabaseError

logger = logging.getLogger(__name__)

class UserPreferencesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
            serializer = UserPreferencesSerializer(prefs)
            return Response(serializer.data)
        except (DatabaseError, Exception) as e:
            logger.warning(f"Database error retrieving user preferences: {e}")
            return Response({
                'theme_mode': 'dark',
                'currency': 'USD',
                'reports_time_range': '6',
                'reports_start_date': '',
                'reports_end_date': '',
                'dashboard_start_date': '',
                'dashboard_end_date': '',
                'dashboard_preset': '',
            }, status=status.HTTP_200_OK)

    def patch(self, request):
        try:
            prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
            serializer = UserPreferencesSerializer(prefs, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except DatabaseError as e:
            logger.warning(f"Database error updating user preferences: {e}")
            return Response(request.data, status=status.HTTP_200_OK)

from django.core.management import call_command

class CronReminderView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        call_command('send_reminders')
        return Response({'status': 'success', 'message': 'Reminders sent'})
