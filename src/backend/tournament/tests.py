from django.test import TestCase, Client
from django.core.exceptions import ValidationError
from django.urls import reverse  # used to test url endpoints

from api.models import User, UserProfile
from tournament.models import Tournament

import json  # used to serialize dict to json

# @note User changed to api.User
# @note email is uniquely required


class TournamentModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        """ sets up nine test users, one tournament and adds them to the class """

        cls.users = []
        cls.user_profiles = []
        for index in range(9):
            cls.users.append(User.objects.create_user(
                username=f'testuser{index}', password='1234', email=f'testuser{index}@some_domain.com'))
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


class TournamentEndPointTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        """ sets up a user to send the requests from """

        # creates setup once for this whole TestCase class
        cls.client = Client()
        cls.user_name = User.objects.create_user(
            username='testuser', password='1234', email='testuser@some_domain.com')
        cls.user_profile = UserProfile.objects.create(user=cls.user_name)

    def setUp(self):

        # setup for every test case
        self.client.login(username='testuser', password='1234')

    def test_create_tournament(self):
        """ checks create_tournament endpoint """

# TODO abstract code for faster test writing
        # valid data test
        url = reverse('create_tournament')
        data = {'tournament_name': 'tournament1'}
        response = self.client.post(url, json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Tournament.objects.filter(name="tournament1").exists())

        # invalid json test
        data = {}
        response = self.client.post(url, json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, 400)
