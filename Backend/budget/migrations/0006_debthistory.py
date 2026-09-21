from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('budget', '0005_debt'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DebtHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(default='updated', max_length=50)),
                ('previous_total_amount', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('new_total_amount', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('previous_paid_amount', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('new_paid_amount', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('change_amount', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('reason', models.TextField(blank=True)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('debt', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='history', to='budget.debt')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='debt_histories', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
