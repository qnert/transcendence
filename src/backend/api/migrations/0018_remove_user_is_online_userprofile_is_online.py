# Generated by Django 4.2.13 on 2024-06-08 12:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0017_user_is_online'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='is_online',
        ),
        migrations.AddField(
            model_name='userprofile',
            name='is_online',
            field=models.BooleanField(default=False),
        ),
    ]