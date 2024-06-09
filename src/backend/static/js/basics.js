import { searchFriends } from './friends/action_friends.js';
import { generateQRCode, validateOTP, handleCheckbox, checkBox} from './profile/2FA.js';
import { bindProfileButton, bindSaveChangesButton,saveChanges } from './profile/buttons.js';
import { setNewPasswd } from './profile/profile.js';
import { loginButton, homeButton, soloGame, multiplayerGame, defaultButton } from './navbar/buttons.js';
import { login, logout, oauth, set_passwd } from './navbar/logging.js';
import { checkLoginStatus } from './login_check.js';


    window.addEventListener('popstate', function(event) {
			if (event.state && event.state.path) {
				updateContent(event.state.path);
			}
		});

    document.addEventListener("DOMContentLoaded", function() {
      reattachEventListeners();
    });

	export function updateContent(path) {
		//check if path is default path because of navigation in Browser. If default then oldContent is empty!
		fetch(path)
		.then(response => {
			if (!response.ok) {
			  if (response.status === 401) {
				updateContent("/login/");
			  } else if (response.status === 403) {
				updateContent("/login/");
			  } else {
				throw new Error("Unexpected Error");
			  }
			}
			return response.text();
		})
		.then(html => {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");
		const newContent = doc.querySelector("#newContent");
		const oldContent = document.getElementById("oldContent");
		oldContent.innerHTML = "";
		oldContent.appendChild(newContent);
		reattachEventListeners();
		 })
		 .catch(error => console.error('Error fetching content:', error));
	};

	export function handleRoute(event, path) {
		event.preventDefault();
		if (window.location.pathname !== path) {
			window.history.pushState({path: path}, '', path);
			updateContent(path);
		}
	}

	export function reattachEventListeners(){
		loginButton()
		login()
		logout()
		generateQRCode()
		validateOTP()
		oauth()
		homeButton()
		defaultButton()
		bindProfileButton()
		soloGame()
		multiplayerGame()
		handleCheckbox()
		checkBox()
		setNewPasswd()
    	searchFriends()
		checkLoginStatus()
		searchFriends()
	}



	window.onload = function(){
		loadFriends();
	}

	export let chatSocket;
	export let selectedFriendId  = null;