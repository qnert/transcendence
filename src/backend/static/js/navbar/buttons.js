import { handleRoute } from "../basics.js";
import { updateContent } from "../basics.js";

export function soloGame(){
  const soloGameButton = document.getElementById("game");
  if (soloGameButton) {
    soloGameButton.addEventListener("click", function(event) {
      event.preventDefault();
      handleRoute(event, "/game/");
    });
  }
}

export function multiplayerGame(){
  const multiplayerGame = document.getElementById("multiplayerGame");
  if (multiplayerGame) {
    multiplayerGame.addEventListener("click", function(event) {
      event.preventDefault();
      handleRoute(event, "/multiplayer/");
    });
  }
}

export function loginButton(){
  const loginButton = document.getElementById("login");
  if(loginButton){
    loginButton.addEventListener("click", function(event) {
      event.preventDefault();
      handleRoute(event, "/login/");
  });
}
}

export function defaultButton(){
  const defaultButton = document.getElementById("defaultButton");
  if(defaultButton){
    defaultButton.addEventListener("click", function(event) {
      event.preventDefault();
      window.history.pushState({ path: '/' }, '', '/');
      const oldContent = document.getElementById("oldContent");
      if(oldContent){
        oldContent.innerHTML = "";
      }
  });
}
}

export function homeButton(){
  const homeButton = document.getElementById("homeButton");
  if(homeButton){
	const newHomeButton = homeButton.cloneNode(true);
    homeButton.parentNode.replaceChild(newHomeButton, homeButton);
    newHomeButton.addEventListener("click", function(event) {
      event.preventDefault();
      window.history.pushState({ path: '/home/' }, '', '/home/');
      updateContent("/home/");
  });
	}
}
