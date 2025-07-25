# Generated by Django 5.1.5 on 2025-07-21 11:20

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0015_tenant_user'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tenant',
            name='phone',
            field=models.CharField(help_text='Contact phone number', max_length=15, validators=[django.core.validators.RegexValidator(message="Phone number must be entered in the format: '+256705672545'. Up to 15 digits allowed.", regex='^\\+256\\d{9}$')]),
        ),
    ]
