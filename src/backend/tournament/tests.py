from django.test import TestCase
from django.core.exceptions import ValidationError
from api.models import User, UserProfile
from game.models import GameResult
from tournament.models import Tournament, MAX_PARTICIPANTS, DEFAULT_GAME_SETTINGS
from tournament.consumers import TournamentConsumer
import random

TEST_TOURNAMENT_NAME='test_tournament'

# Hint:
# variables that hold database instances wont know about changes
# need to account for that when testing for changes


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
        cls.valid_game_result = GameResult.objects.create(
                user_profile = cls.user_profiles[0],
                opponent_profile = cls.user_profiles[-2],
                user_score = 8,
                opponent_score = 5,
                is_win = True,
                )

    def test_TournamentModel_creation(self):
        """ checks for tournament creation and initial participants count """
        self.assertIsNotNone(self.tournament)
        self.assertTrue(Tournament.objects.filter(name=TEST_TOURNAMENT_NAME).exists())
        self.assertEqual(self.tournament.created_by, self.host_profile)
        self.assertEqual(self.tournament.participants.count(), 0)

    def test_TournamentModel_creation_default_values(self):
        """ checks if tournament creation results in correct default values """
        RANDOM_GAME_SETTINGS = {}
        tournament = Tournament.objects.create(name='default', state='playing', game_settings=RANDOM_GAME_SETTINGS)
        self.assertEqual(tournament.get_state(), 'setup')
        self.assertEqual(tournament.get_game_settings(), DEFAULT_GAME_SETTINGS)

    def test_TournamentModel_add_participant_limit(self):
        """ checks add_participant method and max_player_limit """
        for index in range(MAX_PARTICIPANTS):
            self.tournament.add_participant(self.user_profiles[index])
        with self.assertRaises(ValidationError):
            self.tournament.add_participant(self.user_profiles[MAX_PARTICIPANTS])
        self.assertEqual(self.tournament.participants.count(), MAX_PARTICIPANTS)

    def test_TournamentModel_add_same_user(self):
        """ checks adding the same user twice to a tournament """
        self.tournament.add_participant(self.user_profiles[0])
        with self.assertRaises(ValidationError):
            self.tournament.add_participant(self.user_profiles[0])

    def test_TournamentModel_remove_player(self):
        """ checks remove_participant method """
        count_initial = self.tournament.get_participants_count()
        self.tournament.add_participant(self.user_profiles[0])
        self.assertEqual(self.tournament.get_participants_count(), count_initial + 1)
        self.tournament.remove_participant(self.user_profiles[0])
        self.assertEqual(self.tournament.get_participants_count(), count_initial)

    def test_TournamentModel_delete_if_empty(self):
        """ checks delete if empty method """
        self.tournament.delete_if_empty()
        self.assertFalse(Tournament.objects.filter(name=TEST_TOURNAMENT_NAME).exists())

    def test_TournamentModel_advance_state(self):
        """ checks advanving tournament state """
        self.assertEqual(self.tournament.get_state(), 'setup')
        self.tournament.advance_state()
        self.assertEqual(self.tournament.get_state(), 'playing')
        self.tournament.advance_state()
        self.assertEqual(self.tournament.get_state(), 'finished')

    def test_TournamentModel_get_host(self):
        """ checks for correct get_host method """
        # calling it on empty particpants should raise ValidationError
        with self.assertRaises(ValidationError):
            self.tournament.get_host()
        self.tournament.add_participant(self.user_profiles[0])
        self.assertEqual(self.tournament.get_host(), self.tournament.participants.first())

    def test_TournamentModel_set_game_settings(self):
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

    def test_TournamentModel_user_default_values(self):
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

    def test_TournamentModel_get_user_by_methods(self):
        """ Checks get_user_by (username or user_profile) method behaviour """
        self.tournament.add_participant(self.user_profiles[0])
        self.tournament.add_participant(self.user_profiles[1])
        tmp = self.tournament.get_participant_by(user_profile=self.user_profiles[1])
        username = self.user_profiles[1].user.username
        tmp_2 = self.tournament.get_participant_by(username=username)
        self.assertEqual(tmp, tmp_2)

    def test_TournamentModel_is_host(self):
        """ Checks is_host method behaviour """
        self.tournament.add_participant(self.user_profiles[0])
        self.tournament.add_participant(self.user_profiles[1])
        self.assertTrue(self.tournament.is_host(user_profile=self.user_profiles[0]))
        self.assertTrue(self.tournament.is_host(username=self.user_profiles[0].user.username))
        self.assertFalse(self.tournament.is_host(user_profile=self.user_profiles[1]))
        self.assertFalse(self.tournament.is_host(username=self.user_profiles[1].user.username))

    def test_TournamentModel_user_toggle_ready_state(self):
        """ Checks toggle_ready_state method behaviour """
        self.tournament.add_participant(self.user_profiles[0])
        self.assertFalse(self.tournament.participants.first().is_ready)
        self.tournament.toggle_ready_state_by(self.user_profiles[0])
        self.assertTrue(self.tournament.participants.first().is_ready)

    def test_TournamentModel_are_participants_ready(self):
        """ Checks are_participants_ready method behaviour """
        self.tournament.add_participant(self.user_profiles[0])
        self.assertFalse(self.tournament.are_participants_ready())

        # This test checks the where all participants are ready,
        # but MAX_PARTICIPANTS has not been reached
        self.tournament.toggle_ready_state_by(user_profile=self.user_profiles[0])
        self.assertFalse(self.tournament.are_participants_ready())
        self.tournament.toggle_ready_state_by(user_profile=self.user_profiles[0])
        self.tournament.remove_participant(self.user_profiles[0])

        for participant in self.user_profiles[:-1]:
            self.tournament.add_participant(participant)
            self.tournament.toggle_ready_state_by(user_profile=participant)
        self.assertTrue(self.tournament.are_participants_ready())

    def test_TournamentModel_create_matches_list(self):
        """ Checks create match method """
        # This test checks creating matches_list with too few participants
        self.tournament.add_participant(self.user_profiles[0])
        with self.assertRaises(ValidationError):
            self.tournament.create_matches_list()
        self.tournament.remove_participant(self.user_profiles[0])

        # This test checks creating matches when not all participants are ready
        for participant in self.user_profiles[:-1]:
            self.tournament.add_participant(participant)
        with self.assertRaises(ValidationError):
            self.tournament.create_matches_list()
        
        # This test checks creating a tournament when all conditions are met
        for participant in self.tournament.get_participants():
            self.tournament.toggle_ready_state_by(user_profile=participant.user_profile)
        self.tournament.advance_state()
        self.tournament.create_matches_list()

    def test_TournamentModel_has_participant(self):
        """ Checks tournament has_participant method """
        self.assertFalse(self.tournament.has_participant(user_profile=self.user_profiles[0]))
        self.assertFalse(self.tournament.has_participant(user_profile=self.user_profiles[1]))

        self.tournament.add_participant(self.user_profiles[0])
        self.tournament.add_participant(self.user_profiles[1])
        self.assertTrue(self.tournament.has_participant(user_profile=self.user_profiles[0]))
        self.assertTrue(self.tournament.has_participant(user_profile=self.user_profiles[1]))

        self.tournament.remove_participant(self.user_profiles[0])
        self.assertFalse(self.tournament.has_participant(user_profile=self.user_profiles[0]))
        self.assertTrue(self.tournament.has_participant(user_profile=self.user_profiles[1]))

        self.tournament.remove_participant(self.user_profiles[1])
        self.assertFalse(self.tournament.has_participant(user_profile=self.user_profiles[0]))
        self.assertFalse(self.tournament.has_participant(user_profile=self.user_profiles[1]))

    def test_TournamentModel_has_matches_list(self):
        """ Checks has matches list method """
        self.assertFalse(self.tournament.has_matches_list())
        self.create_playing_phase_lobby()
        self.assertTrue(self.tournament.has_matches_list())
    
    def test_TournamentMatchModel_is_match_participant(self):
        """ Checks TournamentMatch is match participant method """
        self.create_playing_phase_lobby()
        first_participant = self.tournament.get_participants().first()
        matches = self.tournament.get_matches_list()
        counter = 0
        for match in matches:
            if match.is_match_participant(participant=first_participant):
                counter += 1
        # Each participant should have MAX_PARTICIPANTS - 1 amount of games
        self.assertEqual(counter, MAX_PARTICIPANTS - 1)

    def test_TournamentMatchModel_set_finished(self):
        """ Checks TournamentMatch set finished method """
        self.create_playing_phase_lobby()
        match = self.tournament.get_matches_list().first()
        self.assertEqual(match.is_finished, False)
        match.set_finished()
        self.assertEqual(match.is_finished, True)

    def test_TournamentMatchModel_set_results_and_finished(self):
        """ Checks TournamentMatch set results method """
        non_tournament_user_game_result = GameResult.objects.create(
                        user_profile = self.user_profiles[0],
                        opponent_profile = self.user_profiles[-1],
                        user_score = 8,
                        opponent_score = 5,
                        is_win = True,
                    )
        if MAX_PARTICIPANTS > 2:
            wrong_user_game_result = GameResult.objects.create(
                        user_profile = self.user_profiles[0],
                        opponent_profile = self.user_profiles[2],
                        user_score = 8,
                        opponent_score = 5,
                        is_win = True,
                    )
        another_game_result = GameResult.objects.create(
                    user_profile = self.user_profiles[0],
                    opponent_profile = self.user_profiles[1],
                    user_score = 8,
                    opponent_score = 5,
                    is_win = True,
                )
        self.create_playing_phase_lobby()
        first_participant = self.tournament.get_participants().first()
        match = self.tournament.get_next_match(participant=first_participant)

        # Test with non Tournament user
        with self.assertRaises(ValidationError):
            match.set_results_and_finished(non_tournament_user_game_result)

        # Test with wrong users
        if MAX_PARTICIPANTS > 2:
            with self.assertRaises(ValidationError):
                match.set_results_and_finished(wrong_user_game_result)

        # Test correct behaviour
        match.set_results_and_finished(self.valid_game_result)
        self.assertEqual(match.goals_home,8)
        self.assertEqual(match.goals_away,5)

        # Test if already finished
        with self.assertRaises(ValidationError):
            match.set_results_and_finished(another_game_result)

    def test_TournamentModel_get_next_match(self):
        """ Checks Tournament get next match method """
        # checks case where there are no matches created
        self.tournament.add_participant(self.user_profiles[0])
        with self.assertRaises(ValidationError):
            self.tournament.get_next_match(participant=self.tournament.get_participants().first())
        self.tournament.remove_participant(self.user_profiles[0])

        # this test checks if a None is returned if all matches are finished
        self.create_playing_phase_lobby()
        first_participant = self.tournament.get_participants().first()

        # this test checks the main logic of how to use get_next_match
        # match should be set to finished, and there should be a total of
        # participants.count() - 1 matches
        # the last get_next_match should return None, because no more games
        # should be played
        participants = list(self.tournament.participants.all())
        for index, participant in enumerate(participants[:-1]):
            next_match = self.tournament.get_next_match(participant=first_participant)
            self.assertIsNotNone(next_match)
            next_match.set_finished()
        next_match = self.tournament.get_next_match(participant=first_participant)
        self.assertIsNone(next_match)

    def test_TournamentModel_get_last_match(self):
        """ Checks Tournament get last match method """
        # checks case where there are no matches created
        self.tournament.add_participant(self.user_profiles[0])
        with self.assertRaises(ValidationError):
            self.tournament.get_last_match(participant=self.tournament.get_participants().first())
        self.tournament.remove_participant(self.user_profiles[0])

        # this test checks if a None is returned if no matches are finished
        self.create_playing_phase_lobby()
        first_participant = self.tournament.get_participants().first()
        self.assertIsNone(self.tournament.get_last_match(participant=first_participant))

        # Checks wether the get_last_match correclty gets the last played match
        match = self.tournament.get_next_match(participant=first_participant)
        match.set_finished()
        next_match = self.tournament.get_next_match(participant=first_participant)
        if next_match:
            next_match.set_finished()
            self.assertEqual(next_match, self.tournament.get_last_match(participant=first_participant))
        else:
            self.assertEqual(match, self.tournament.get_last_match(participant=first_participant))

    def test_TournamentModel_are_matches_finished(self):
        """ Checks Tournament are matches finished method """
        with self.assertRaises(ValidationError):
            self.tournament.are_matches_finished()
        self.create_playing_phase_lobby()
        self.assertFalse(self.tournament.are_matches_finished())
        for match in self.tournament.get_matches_list():
            match.set_finished()
        self.assertTrue(self.tournament.are_matches_finished())

    def test_TournamentMatchModel_update_stats(self):
        """ Checks TournamentMatch update stats method """
        self.create_playing_phase_lobby()
        matches = self.tournament.get_matches_list()
        first_participant = self.tournament.get_participants().first()
        next_match = self.tournament.get_next_match(participant=first_participant)
        next_match.set_results_and_finished(self.valid_game_result)

        self.assertEqual(first_participant.wins, 0)
        self.assertEqual(first_participant.losses, 0)
        self.assertEqual(first_participant.goals_scored, 0)
        self.assertEqual(first_participant.goals_conceded, 0)

        first_participant.update_stats(match=next_match)

        self.assertEqual(first_participant.wins, 1)
        self.assertEqual(first_participant.losses, 0)
        self.assertEqual(first_participant.goals_scored, self.valid_game_result.user_score)
        self.assertEqual(first_participant.goals_conceded, self.valid_game_result.opponent_score)

    def test_TournamentMatchModel_get_winner(self):
        self.create_playing_phase_lobby()
        matches = self.tournament.get_matches_list()
        first_participant = self.tournament.get_participants().first()
        next_match = self.tournament.get_next_match(participant=first_participant)
        next_match.set_results_and_finished(self.valid_game_result)
        self.assertEqual(first_participant, next_match.get_winner())

    def test_TournamentModel_get_winners(self):
        self.create_playing_phase_lobby()
        with self.assertRaises(ValidationError):
            self.tournament.get_winners()

        self.tournament.advance_state()

        MAX_MATCHES = MAX_PARTICIPANTS - 1
        wins_range = (0, MAX_MATCHES)
        goals_scored_range = (0, int(DEFAULT_GAME_SETTINGS['max_score']))

        for participant in self.tournament.participants.all():

            participant.wins = random.randint(*wins_range)
            losses_range = (0, MAX_MATCHES - participant.wins)
            participant.losses = random.randint(*losses_range)

            participant.goals_scored = random.randint(*goals_scored_range)

            goals_conceded_range = (0, participant.goals_scored)
            participant.goals_conceded = random.randint(*goals_conceded_range)
            participant.save()

        winners = self.tournament.get_winners()
        self.assertGreater(len(winners), 0)
        self.assertIsNotNone(winners)

#   ==========================     UTIL FUNCTIONS

    def create_playing_phase_lobby(self):
        """ helper to automate proceding to the playing phase """
        for participant in self.user_profiles[:-1]:
            self.tournament.add_participant(participant)
        for participant in self.tournament.get_participants():
            self.tournament.toggle_ready_state_by(user_profile=participant.user_profile)
        self.tournament.advance_state()
        self.tournament.create_matches_list()

