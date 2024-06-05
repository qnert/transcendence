from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from tournament.models import Tournament

# TODO doesnt exist anymore, need to change
from api.models import UserProfile


class TournamentModelTestCase(TestCase):

    @classmethod
    def setUpTestData(cls):
        """ sets up nine test users, one tournament and adds them to the class """

        cls.users = []
        cls.user_profiles = []
        for index in range(9):
            cls.users.append(User.objects.create_user(username=f'testuser{index}', password='1234'))
            cls.user_profiles.append(UserProfile.objects.create(user=cls.users[index]))
        cls.host = cls.users[0]
        cls.host_profile = cls.user_profiles[0]
        cls.tournament = Tournament.objects.create(name='Test Tournament', created_by=cls.host_profile)

    def test_tournament_creation(self):
        """ checks for tournament creation and host presence in class and database """

        self.assertIsNotNone(self.tournament)
        self.assertTrue(Tournament.objects.filter(name='Test Tournament').exists())

        self.assertEqual(self.tournament.created_by, self.host_profile)
        self.assertEqual(self.tournament.participants.get(id=self.host_profile.id), self.host_profile)

    def test_tournament_max_player_limit(self):
        """ checks add_participant method and 8-player limit """

        for i in range(8):
            self.tournament.add_participant(self.user_profiles[i])

        with self.assertRaises(ValidationError):
            self.tournament.add_participant(self.user_profiles[8])

        self.assertEqual(self.tournament.participants.count(), 8)

    def test_remove_player(self):
        """ checks remove_participant method """

        self.assertEqual(self.tournament.participants.count(), 1)
        self.tournament.remove_participant(self.host_profile)
        self.assertEqual(self.tournament.participants.count(), 0)

    def test_printing(self):
        """ checks __str__ method """

        print()
        print(self.tournament)
        print()
