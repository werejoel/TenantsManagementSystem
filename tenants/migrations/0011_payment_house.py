# Generated by Django 5.1.4 on 2025-01-30 07:56

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0010_alter_tenant_house'),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='house',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='tenants.house'),
        ),
    ]
