function soloGame(){
  const soloGameButton = document.getElementById("game");
  if (soloGameButton) {
    soloGameButton.addEventListener("click", function(event) {
      event.preventDefault();
      handleRoute(event, "/game/");
    });
  }
}

function multiplayerGame(){
  const multiplayerGame = document.getElementById("multiplayerGame");
  if (multiplayerGame) {
    multiplayerGame.addEventListener("click", function(event) {
      event.preventDefault();
      handleRoute(event, "/multiplayer/");
    });
  }
}

function loginButton(){
  const loginButton = document.getElementById("login");
  if(loginButton){
    loginButton.addEventListener("click", function(event) {
      event.preventDefault();
      handleRoute(event, "/login/");
  });
}
}

function defaultButton(){
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

function homeButton(){
  const homeButton = document.getElementById("homeButton");
  if(homeButton){
    homeButton.addEventListener("click", function(event) {
      event.preventDefault();
      window.history.pushState({ path: '/home/' }, '', '/home/');
      updateContent("/home/");
  });
}
}
