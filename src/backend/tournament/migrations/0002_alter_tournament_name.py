# Generated by Django 4.2.13 on 2024-06-08 13:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tournament', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tournament',
            name='name',
            field=models.CharField(max_length=50, unique=True),
        ),
    ]
