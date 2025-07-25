# Generated by Django 5.1.4 on 2025-01-27 07:53

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='House',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('model', models.CharField(choices=[('1BHK', 'One Bedroom'), ('2BHK', 'Two Bedroom'), ('3BHK', 'Three Bedroom')], max_length=10)),
                ('price', models.PositiveIntegerField()),
                ('location', models.CharField(max_length=255)),
                ('is_occupied', models.BooleanField(default=False)),
            ],
        ),
    ]
