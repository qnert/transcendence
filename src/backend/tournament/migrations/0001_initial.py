# Generated by Django 4.2.13 on 2024-06-22 17:13

import datetime
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Tournament',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateField(default=datetime.date.today)),
                ('name', models.CharField(max_length=50, unique=True)),
                ('state', models.CharField(choices=[('setup', 'Setup'), ('playing', 'Playing'), ('finished', 'Finished')], default='setup', max_length=10)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='created_tournaments', to='api.userprofile')),
                ('participants', models.ManyToManyField(related_name='active_tournament', to='api.userprofile')),
            ],
            options={
                'ordering': ['name'],
            },
        ),
    ]
