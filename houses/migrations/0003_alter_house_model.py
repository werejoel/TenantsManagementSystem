# Generated by Django 5.1.4 on 2025-01-30 17:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('houses', '0002_alter_house_model'),
    ]

    operations = [
        migrations.AlterField(
            model_name='house',
            name='model',
            field=models.CharField(choices=[('1BHK', 'One Bedroom'), ('2BHK', 'Two Bedroom'), ('3BHK', 'Three Bedroom'), ('FULL', 'Full House'), ('AIRBNB', 'Airbnb'), ('single_shop', 'Single Shop'), ('2in1_shop', '2-in-1 Shop'), ('3in1_shop', '3-in-1 Shop')], max_length=30),
        ),
    ]
