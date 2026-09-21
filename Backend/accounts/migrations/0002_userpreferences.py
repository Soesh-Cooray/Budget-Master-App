import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='UserPreferences',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('theme_mode', models.CharField(default='dark', max_length=10)),
                ('reports_time_range', models.CharField(default='6', max_length=10)),
                ('reports_start_date', models.CharField(blank=True, default='', max_length=35)),
                ('reports_end_date', models.CharField(blank=True, default='', max_length=35)),
                ('dashboard_start_date', models.CharField(blank=True, default='', max_length=35)),
                ('dashboard_end_date', models.CharField(blank=True, default='', max_length=35)),
                ('dashboard_preset', models.CharField(blank=True, default='', max_length=20)),
                ('currency', models.CharField(default='USD', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='user_preferences', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
