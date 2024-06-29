from django.test import TestCase
from django.core.exceptions import ValidationError
from api.models import User, UserProfile
from tournament.models import Tournament, MAX_PARTICIPANTS


class TournamentModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        """ sets up nine test users, one tournament and adds them to the class """
        cls.users = []
        cls.user_profiles = []
        for index in range(MAX_PARTICIPANTS + 1):
            cls.users.append(User.objects.create_user(
                username=f'testuser{index}', password='1234', email=f'testuser{index}@some_domain.com'))
            cls.user_profiles.append(UserProfile.objects.create(user=cls.users[index]))
        cls.host_profile = cls.user_profiles[0]
        cls.tournament = Tournament.objects.create(name='Test Tournament', created_by=cls.host_profile)

    def test_tournament_creation(self):
        """ checks for tournament creation and initial participants count """
        self.assertIsNotNone(self.tournament)
        self.assertTrue(Tournament.objects.filter(name='Test Tournament').exists())
        self.assertEqual(self.tournament.created_by, self.host_profile)
        self.assertEqual(self.tournament.participants.count(), 0)

    def test_tournament_creation_default_state(self):
        """ checks default tournament state """
        tournament = Tournament.objects.create(name='State Tournament', state='playing', created_by=self.host_profile)
        self.assertEqual(tournament.get_state(), 'setup')

    def test_tournament_add_participant_limit(self):
        """ checks add_participant method and max_player_limit """
        for i in range(MAX_PARTICIPANTS):
            self.tournament.add_participant(self.user_profiles[i])
        with self.assertRaises(ValidationError):
            self.tournament.add_participant(self.user_profiles[MAX_PARTICIPANTS])
        self.assertEqual(self.tournament.participants.count(), MAX_PARTICIPANTS)

    def test_tournament_add_same_user(self):
        """ checks adding the same user twice to a tournament """
        self.tournament.add_participant(self.user_profiles[0])
        with self.assertRaises(ValidationError):
            self.tournament.add_participant(self.user_profiles[0])

    def test_remove_player(self):
        """ checks remove_participant method """
        count_initial = self.tournament.get_participant_count()
        self.tournament.add_participant(self.user_profiles[0])
        self.assertEqual(self.tournament.get_participant_count(), count_initial + 1)
        self.tournament.remove_participant(self.user_profiles[0])
        self.assertEqual(self.tournament.get_participant_count(), count_initial)

    def test_delete_if_empty(self):
        """ checks delete if empty method """
        self.tournament.delete_if_empty()
        self.assertFalse(Tournament.objects.filter(name='Test Tournament').exists())

    def test_advancing_state(self):
        """ checks advanving tournament state """
        self.assertEqual(self.tournament.get_state(), 'setup')
        self.tournament.advance_state()
        self.assertEqual(self.tournament.get_state(), 'playing')
        self.tournament.advance_state()
        self.assertEqual(self.tournament.get_state(), 'finished')

    def test_get_host(self):
        """ checks for correct get_host method """
        # calling it on empty particpants should raise ValidationError
        with self.assertRaises(ValidationError):
            self.tournament.get_host()
        self.tournament.add_participant(self.user_profiles[0])
        self.assertEqual(self.tournament.get_host(), self.tournament.participants.first())

    def test_tournament_user_default_values(self):
        """ checks for default values in a tournament user """
        self.tournament.add_participant(self.user_profiles[0])
        tournament_user = self.tournament.participants.first()
        self.assertFalse(tournament_user.is_ready)
        self.assertEqual(tournament_user.wins, 0)
        self.assertEqual(tournament_user.losses, 0)
        self.assertEqual(tournament_user.goals_scored, 0)
        self.assertEqual(tournament_user.goals_conceded, 0)


# class TournamentEndPointTest(TestCase):
#
#    @classmethod
#    def setUpTestData(cls):
#        """ sets up a user to send the requests from """
#
#        cls.client = Client()
#        cls.username = User.objects.create_user(
#            username='testuser', password='1234', email='testuser@some_domain.com')
#        cls.user_profile = UserProfile.objects.create(user=cls.username)
#
#    def setUp(self):
#        """ sets up a user to send the requests from """
#
#        self.client.login(username='testuser', password='1234')
#
#    def test_create_tournament(self):
#        """ checks create_tournament endpoint """
#
#        url = reverse('create')
#        data = {'tournament_name': 'tournament1'}
#        response = self.client.post(url, json.dumps(data), content_type='application/json')
#        self.assertEqual(response.status_code, 201)
#        self.assertTrue(Tournament.objects.filter(name="tournament1").exists())
