import { checkAccessToken } from "../profile/profile.js";
import { reattachEventListeners } from "../basics.js";
import { getCookie } from "../security/csrft.js";


export const showLoggedInState = (username) => {
  navButtons.innerHTML = `
<li class="nav-item">
  <button class="nav-button" id="game" >Solo Game</button>
</li>

<li class="nav-item">
  <button class="nav-button" id="multiplayerGame">Play Multiplayer</button>
</li>

<li class="nav-item">
  <button class="nav-button" id="tournamentButton">Tournament</button>
</li>

<li class="nav-item dropdown">
  <button class="nav-button dropdown-toggle" id="friendsDropdown" data-bs-toggle="dropdown" aria-expanded="false">
  Friends
  </button>
  <ul class="dropdown-menu" aria-labelledby="friendsDropdown">
    <li>
    <input type="text" id="search-friends" class="form-control" placeholder="Search user...">
    </li>
    <li id="search-results"></li>
    <div id="friend-requests"></div>
    <div class="dropdown-divider"></div>
    <h5 class="dropdown-header">Friends</h5>
    <div id="friends-list"></div>
  </ul>
</li>

<li class="nav-item dropdown">
  <button class="nav-button dropdown-toggle" id="navbarDropdownMenuLink" data-bs-toggle="dropdown" aria-expanded="false">
  ${username}
  </button>
  <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdownMenuLink">
    <li><button class="dropdown-item" id="profile">View Profile</button></li>
    <li><hr class="dropdown-divider"></li>
    <li><button class="dropdown-item" id="matchHistory">Match History</button></li>
    <li><hr class="dropdown-divider"></li>
    <li><button class="dropdown-item" id="logout">Logout</button></li>
  </ul>
</li>
      `;
  reattachEventListeners();
};

export const showLoggedOutState = () => {
  navButtons.innerHTML = `
<li class="nav-item">
</li>
<li class="nav-item">
  <button class="nav-button login-button" id="login">Login</button>
</li>
<li class="nav-item">
  <button class="nav-button" id="registerButton">Authenticate with 42</button>
</li>
      `;
  reattachEventListeners();
};
