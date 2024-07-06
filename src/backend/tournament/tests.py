from django.test import TestCase
from django.core.exceptions import ValidationError
from api.models import User, UserProfile
from tournament.models import Tournament, MAX_PARTICIPANTS, DEFAULT_GAME_SETTINGS
from tournament.consumers import TournamentConsumer

# Hint:
# variables that hold database instances wont know about changes
# need to account for that when testing for changes

TEST_TOURNAMENT_NAME='test_tournament'

class TournamentModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        """ sets up a tournament and MAX_PARTCIPANTS no. of test users"""
        cls.users = []
        cls.user_profiles = []
        for index in range(MAX_PARTICIPANTS + 1):
            cls.users.append(User.objects.create_user(
                username=f'testuser{index}', password='1234', email=f'testuser{index}@some_domain.com'))
            cls.user_profiles.append(UserProfile.objects.create(user=cls.users[index]))
        cls.host_profile = cls.user_profiles[0]
        cls.tournament = Tournament.objects.create(name=TEST_TOURNAMENT_NAME, created_by=cls.host_profile)

    def test_tournament_creation(self):
        """ checks for tournament creation and initial participants count """
        self.assertIsNotNone(self.tournament)
        self.assertTrue(Tournament.objects.filter(name=TEST_TOURNAMENT_NAME).exists())
        self.assertEqual(self.tournament.created_by, self.host_profile)
        self.assertEqual(self.tournament.participants.count(), 0)

    def test_tournament_creation_default_values(self):
        """ checks if tournament creation results in correct default values """
        RANDOM_GAME_SETTINGS = {}
        tournament = Tournament.objects.create(name='default', state='playing', game_settings=RANDOM_GAME_SETTINGS)
        self.assertEqual(tournament.get_state(), 'setup')
        self.assertEqual(tournament.get_game_settings(), DEFAULT_GAME_SETTINGS)

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

    def test_tournament_remove_player(self):
        """ checks remove_participant method """
        count_initial = self.tournament.get_participants_count()
        self.tournament.add_participant(self.user_profiles[0])
        self.assertEqual(self.tournament.get_participants_count(), count_initial + 1)
        self.tournament.remove_participant(self.user_profiles[0])
        self.assertEqual(self.tournament.get_participants_count(), count_initial)

    def test_tournament_delete_if_empty(self):
        """ checks delete if empty method """
        self.tournament.delete_if_empty()
        self.assertFalse(Tournament.objects.filter(name=TEST_TOURNAMENT_NAME).exists())

    def test_tournament_advance_state(self):
        """ checks advanving tournament state """
        self.assertEqual(self.tournament.get_state(), 'setup')
        self.tournament.advance_state()
        self.assertEqual(self.tournament.get_state(), 'playing')
        self.tournament.advance_state()
        self.assertEqual(self.tournament.get_state(), 'finished')

    def test_tournament_get_host(self):
        """ checks for correct get_host method """
        # calling it on empty particpants should raise ValidationError
        with self.assertRaises(ValidationError):
            self.tournament.get_host()
        self.tournament.add_participant(self.user_profiles[0])
        self.assertEqual(self.tournament.get_host(), self.tournament.participants.first())

    def test_tournament_set_game_settings(self):
        """ checks set_game_settings method """
        with self.assertRaises(ValidationError):
            self.tournament.set_game_settings(None)
            self.tournament.set_game_settings({})
            self.tournament.set_game_settings({"bullshit-key": 1})
            self.tournament.set_game_settings({"ball_speed": "bullshit_value"})
        NEW_GAME_SETTINGS = {
            "ball_speed": '5',
            "max_score": '4',
            "background_color": '123',
            "border_color": '255',
            "ball_color": '0',
            "advanced_mode": True,
            "power_ups": True
        }
        self.tournament.set_game_settings(NEW_GAME_SETTINGS)
        self.assertEqual(self.tournament.get_game_settings(), NEW_GAME_SETTINGS)

    def test_tournament_user_default_values(self):
        """ checks for default values in a tournament user """
        self.tournament.add_participant(self.user_profiles[0])
        tournament_user = self.tournament.participants.first()
        test_values = {
            "is_ready": False,
            "wins": 0,
            "losses": 0,
            "goals_scored": 0,
            "goals_conceded": 0
        }
        for key, value in test_values.items():
            self.assertEqual(getattr(tournament_user, key), value)

    def test_get_user_by_methods(self):
        """ Checks get_user_by (username or user_profile) method behaviour """
        self.tournament.add_participant(self.user_profiles[0])
        self.tournament.add_participant(self.user_profiles[1])
        tmp = self.tournament.get_participant_by(user_profile=self.user_profiles[1])
        username = self.user_profiles[1].user.username
        tmp_2 = self.tournament.get_participant_by(username=username)
        self.assertEqual(tmp, tmp_2)

    def test_is_host(self):
        """ Checks is_host method behaviour """
        self.tournament.add_participant(self.user_profiles[0])
        self.tournament.add_participant(self.user_profiles[1])
        self.assertTrue(self.tournament.is_host(user_profile=self.user_profiles[0]))
        self.assertTrue(self.tournament.is_host(username=self.user_profiles[0].user.username))
        self.assertFalse(self.tournament.is_host(user_profile=self.user_profiles[1]))
        self.assertFalse(self.tournament.is_host(username=self.user_profiles[1].user.username))

    def test_tournament_user_toggle_ready_state(self):
        """ Checks toggle_ready_state method behaviour """
        self.tournament.add_participant(self.user_profiles[0])
        self.assertFalse(self.tournament.participants.first().is_ready)
        self.tournament.toggle_ready_state_by(self.user_profiles[0])
        self.assertTrue(self.tournament.participants.first().is_ready)

    def test_tournament_are_participants_ready(self):
        """ Checks are_participants_ready method behaviour """
        self.tournament.add_participant(self.user_profiles[0])
        self.assertFalse(self.tournament.are_participants_ready())

        # This test checks the where all particitpants are ready, but MAX_PARTICIPANTS has not been reached
        self.tournament.toggle_ready_state_by(user_profile=self.user_profiles[0])
        self.assertFalse(self.tournament.are_participants_ready())
        self.tournament.toggle_ready_state_by(user_profile=self.user_profiles[0])

        # TODO adjust this test to be scalable depending on MAX_PARTICIPANTS
        self.tournament.add_participant(self.user_profiles[1])
        self.tournament.add_participant(self.user_profiles[2])
        self.tournament.add_participant(self.user_profiles[3])
        self.assertFalse(self.tournament.are_participants_ready())

        self.tournament.toggle_ready_state_by(user_profile=self.user_profiles[0])
        self.tournament.toggle_ready_state_by(user_profile=self.user_profiles[1])
        self.assertFalse(self.tournament.are_participants_ready())

        self.tournament.toggle_ready_state_by(user_profile=self.user_profiles[2])
        self.tournament.toggle_ready_state_by(user_profile=self.user_profiles[3])
        self.assertTrue(self.tournament.are_participants_ready())

    def test_tournament_get_matches_list(self):
        """ Checks create match method """
        self.tournament.add_participant(self.user_profiles[0])
        self.tournament.add_participant(self.user_profiles[1])

        participants = self.tournament.get_participants()

        self.tournament.advance_state()

        self.tournament.create_match(player_home=participants[0], player_away=participants[1])
        print(self.tournament.get_matches_list())

#class TournamentConsumerTest(TestCase):
#
#    @classmethod
#    def setUpTestData(cls):
#        cls.users = []
#        cls.user_profiles = []
#        for index in range(MAX_PARTICIPANTS + 1):
#            cls.users.append(User.objects.create_user(
#                username=f'testuser{index}', password='1234', email=f'testuser{index}@some_domain.com'))
#            cls.user_profiles.append(UserProfile.objects.create(user=cls.users[index]))
#        cls.host_profile = cls.user_profiles[0]
#        cls.tournament = Tournament.objects.create(name=TEST_TOURNAMENT_NAME, created_by=cls.host_profile)
#
#    def test_first(self):
#        self.assertEqual(True, True)
