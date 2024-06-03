# Generated by Django 4.2.13 on 2024-06-03 17:19

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('api', '0014_alter_userprofile_profile_picture_url_friendship_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='GameResult',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user_score', models.IntegerField()),
                ('opponent_score', models.IntegerField()),
                ('is_win', models.BooleanField()),
                ('date_played', models.DateTimeField(default=django.utils.timezone.now)),
                ('opponent_profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='game_results_opp', to='api.userprofile')),
                ('user_profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='game_results', to='api.userprofile')),
            ],
        ),
    ]