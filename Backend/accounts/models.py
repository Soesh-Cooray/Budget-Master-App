from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class NotificationSettings(models.Model):
    FREQUENCY_CHOICES = [
        ('none', 'None'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_settings')
    reminder_frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default='none')
    reminder_time = models.TimeField(null=True, blank=True)
    timezone = models.CharField(max_length=20, default='UTC', help_text='Timezone in GMT format (e.g., GMT+5:30)')
    
    def __str__(self):
        return f"{self.user.username} - {self.reminder_frequency}"

class UserPreferences(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_preferences')
    theme_mode = models.CharField(max_length=10, default='dark')
    reports_time_range = models.CharField(max_length=10, default='6')
    reports_start_date = models.CharField(max_length=35, blank=True, default='')
    reports_end_date = models.CharField(max_length=35, blank=True, default='')
    dashboard_start_date = models.CharField(max_length=35, blank=True, default='')
    dashboard_end_date = models.CharField(max_length=35, blank=True, default='')
    dashboard_preset = models.CharField(max_length=20, blank=True, default='')
    currency = models.CharField(max_length=10, default='USD')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} Preferences"

@receiver(post_save, sender=User)
def create_user_notification_settings(sender, instance, created, **kwargs):
    if created:
        NotificationSettings.objects.create(user=instance)
        UserPreferences.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_notification_settings(sender, instance, **kwargs):
    if hasattr(instance, 'notification_settings'):
        instance.notification_settings.save()
    if hasattr(instance, 'user_preferences'):
        instance.user_preferences.save()
