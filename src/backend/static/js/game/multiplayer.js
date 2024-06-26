export function createGameButton() {
    const createMultiplayer = document.getElementById("createMultiplayer");
    if (createMultiplayer) {
        createMultiplayer.onclick = () => create_join_game();
    }
}

export function startRemoteGame() {
    const startRemoteGame = document.getElementById("startRemoteGame");
    if (startRemoteGame) {
        startRemoteGame.onclick = () => remote_start();
    }
}

export function resetRemoteGameButton() {
    const resetRemoteGameButton = document.getElementById("resetRemoteGameButton");
    if (resetRemoteGameButton) {
        resetRemoteGameButton.onclick = () => reset();
    }
}

  let chatSocket;
  let context;
      //board vars
  let board;
  let boardWidth = 900;
  let boardHeight = 500;

  // player vars
  let playerWidth = 10;
  let playerHeight = 100;
  let playerHeight_power = playerHeight * 1.5;
  let playerSpeedY = 0;
  let playerSpeed_power;
  let prevX = 0;
  let prevY = 0;

  //ball vars
  let ballWidth = 10;
  let ballHeight = 10;
  let ballSpeed = 0;
  let init_ballSpeed = 0;
  let random = Math.random() > 0.5 ? 1 : -1;
  let ballAngle = random * Math.PI / 4;
  random = Math.random() > 0.5 ? 1 : -1;

  //score vars
  let score1 = 0;
  let score2 = 0;
  let maxScore;
  let rally = 0;
  let rallies = [];

  // extra vars
  // let soundVictory = new Audio('victory.wav');
  // soundVictory.loop = false;
  // soundVictory.volume = 0.3;

  // let soundGoal = new Audio('goal.wav');
  // soundGoal.loop = false;
  // soundGoal.volume = 0.3;

  let advanced_mode;
  let power_up_mode;
  let size_power_up_used = false;
  let speed_power_up_used = false;

  //coordinates of the power Ups
  let size_x = boardWidth/2;
  let size_y = boardHeight/4;

  let speed_x = boardWidth/2;
  let speed_y = boardHeight/4 * 3;

  //game classes
  let player1 = {
    x: 10,
    y: boardHeight / 2 - playerHeight/2,
    width: playerWidth,
    height: playerHeight,
    curr_speedY: 0,
    movespeed: 0
  }

  let player2 = {
    x: boardWidth - playerWidth - 10,
    y: boardHeight / 2 - playerHeight/2,
    width: playerWidth,
    height: playerHeight,
    curr_speedY: 0,
    movespeed: 0
  }

  let ball = {
    x: boardWidth/2,
    y: boardHeight/2,
    width: ballWidth,
    height: ballHeight,
    speedX: random * ballSpeed * Math.cos(ballAngle),
    speedY: ballSpeed * Math.sin(ballAngle)
  }

  //vars from the html form
  let border_color;
  let ball_color;
  let background_color;

  //the id of the animatioframe in this case board
  let id = 0;
  let countdown = 6;
  let intervalID = 0;
  let items_pushed = 0;
  let username;
  let connected_users;

  export function create_join_game(){
    ballSpeed = document.getElementById("ballSpeed").value;
    ball.speedX = random * ballSpeed * Math.cos(ballAngle);
    ball.speedY = ballSpeed * Math.sin(ballAngle);
    border_color = document.getElementById("borders").value;
    ball_color = document.getElementById("ballColor").value;
    background_color = document.getElementById("background").value;
    maxScore = document.getElementById("maxScore").value;
    advanced_mode = document.getElementById("advancedMode").checked;
    power_up_mode = document.getElementById("powerUps").checked;
    let room_name = document.getElementById("room_name").value;
    if (/[^a-zA-Z0-9]/.test(room_name)){
      alert('Please enter only alphabetical characters !');
      return;
    }
	if (room_name.length < 4 || room_name.trim() === "") {
        alert("Please enter a Room Name with values atleast 4 characters!");
        return;
    }
    fetch("/username/")
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
      username = data.username;
      chatSocket = new WebSocket(`ws://${window.location.host}/ws/game/${room_name}/${username}/`);
      chatSocket.onopen = function(e) {
      console.log("Websocket connection opened!");
    }
    chatSocket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        if (data.type === 'connected_users') {
            connected_users = JSON.parse(data.connected_users)[room_name];
			const roomInfo =  document.getElementById('roomInfo');
			if (roomInfo){
				document.getElementById('roomInfo').textContent = `Welcome to Room ${data.room_name}!`;
			}
              if (connected_users.length == 2){
                let html_tag = document.getElementById("player1");
                html_tag.textContent = connected_users[0];
                let html_tag_2 = document.getElementById("player2");
                html_tag_2.textContent = connected_users[1];
              }
              else if (connected_users.length == 1){
                let html_tag = document.getElementById("player1");
                html_tag.textContent = connected_users[0];
                let html_tag_2 = document.getElementById("player2");
                html_tag_2.textContent = "waiting...";
            }
            if (connected_users[0] == username)
              document.getElementById("startRemoteGame").style.display = "block";
        }
        else if (data.type === 'connect_error'){
            alert("Room is full!");
            chatSocket.close();
            return;
        }
        else if (data.type === 'start_game'){
          speed_power_up_used = false;
          size_power_up_used = false;
          player1.curr_speedY = playerSpeedY;
          player2.curr_speedY = playerSpeedY;
          player1.height = playerHeight;
          player2.height = playerHeight;
          player1.y = boardHeight / 2 - playerHeight/2;
          player2.y = boardHeight / 2 - playerHeight/2;
          ball.x = boardWidth/2;
          ball.y = boardHeight/2;
          size_x = boardWidth/2;
          size_y = boardHeight/4;
          speed_x = boardWidth/2;
          speed_y = boardHeight/4 * 3;
          ball.speedX = data.ball_speed_x;
          ball.speedY = data.ball_speed_y;
          background_color = data.backgroundColor;
          border_color = data.borderColor;
          ball_color = data.ballColor;
          maxScore = data.maxScore;
          ballSpeed = data.ballSpeed;
          init_ballSpeed = data.ballSpeed;
          advanced_mode = data.advancedMode;
          power_up_mode = data.powerUps;
          countdown = 6;
          score1 = 0;
          score2 = 0;
          start_game();
          return;
        }
        else if (data.type === 'game_action'){
          if (data.action == 'move_up'){
            if (data.player == '1')
              player1.movespeed = -(player1.curr_speedY);
            else if (data.player == '2')
              player2.movespeed = -(player2.curr_speedY);
          }
          else if (data.action == 'move_down'){
            if (data.player == '1')
              player1.movespeed = player1.curr_speedY;
            else if (data.player == '2')
              player2.movespeed = player2.curr_speedY;
          }
          else if (data.action == 'stop'){
            if (data.player == '1')
              player1.movespeed = 0;
            else if (data.player == '2')
              player2.movespeed = 0;
          }
          else if (data.action == 'power_up_used_speed'){
            if (data.player == '1')
              player1.curr_speedY = playerSpeed_power;
            else if (data.player == '2')
              player2.curr_speedY = playerSpeed_power;
            speed_power_up_used = true;
          }
          else if (data.action == 'power_up_used_size'){
            if (data.player == '1')
              player1.height = playerHeight_power;
            else if (data.player == '2')
              player2.height = playerHeight_power;
            size_power_up_used = true;
          }
          return;
        }
        else if (data.type == 'ball_move'){
            ball.speedX = data.ball_speed_x;
            ball.speedY = data.ball_speed_y;
            rally++;
            return;
        }
        else if (data.type == 'reset_game'){
          if (items_pushed % 2 == 0){
            rallies.push(rally/2);
            items_pushed++;
          }
          else
            items_pushed++;
          reset_game(data);
          rally = 0;
          return;
        }
        else if (data.type == 'disconnected'){
			const startRemoteGame = document.getElementById("startRemoteGame");
			if(startRemoteGame){
				document.getElementById("startRemoteGame").style.display = "none";
			}	
          if (id !== 0){ 
            if (username == connected_users[0])
              alert(`${connected_users[1]} left the game!`);
            else
              alert(`${connected_users[0]} left the game!`);
            reset();
          }
          else{
            if (username == connected_users[0])
              alert(`${connected_users[1]} left the lobby!`);
            else
              alert(`${connected_users[0]} left the lobby!`);
          }
          if (id != 0){
            cancelAnimationFrame(id);
            id = 0;
          }
          if (intervalID != 0){
            clearInterval(intervalID);
            intervalID = 0;
          }
          return;
        }
        document.getElementById("roomInfo").style.display = "block";
        document.getElementById("versusScreen").style.display = "block";
        document.getElementById("myForm").style.display = "none";
        document.getElementById("board").style.display = "none";
        document.getElementById("left_player").style.display = "none";
        document.getElementById("right_player").style.display = "none";
        document.getElementById("resetRemoteGameButton").style.display = "none";
    };
    })
    .catch(error => {
        console.error('Error fetching username:', error);
    });
  }

export function close_multi_on_change(){
  if (id != 0){
    cancelAnimationFrame(id);
    id = 0;
  }
  if (intervalID != 0){
    clearInterval(intervalID);
    intervalID = 0;
  }
  if (chatSocket)
    chatSocket.close();
}

function remote_start() {
    if (document.getElementById("player2").textContent == "waiting...") {
        alert("Wait for another player to join!");
        return;
    }
    chatSocket.send(
        JSON.stringify({
            type: "start_game",
            ball_speed_x: ball.speedX,
            ball_speed_y: ball.speedY,
            backgroundColor: background_color,
            borderColor: border_color,
            ballColor: ball_color,
            ballSpeed: ballSpeed,
            maxScore: maxScore,
            advancedMode: advanced_mode,
            powerUps: power_up_mode,
        })
    );
}

function reset() {
	const roomInfo = document.getElementById("roomInfo");
	if (roomInfo){
		document.getElementById("roomInfo").style.display = "none";
		document.getElementById("versusScreen").style.display = "none";
		document.getElementById("myForm").style.visibility = "block";
		document.getElementById("myForm").style.display = "block";
		document.getElementById("board").style.display = "none";
		document.getElementById("resetRemoteGameButton").style.display = "none";
		document.getElementById("left_player").style.display = "none";
		document.getElementById("right_player").style.display = "none";
		chatSocket.close();
	}
}



function start_game() {
  document.getElementById("myForm").style.display = "none";
    document.getElementById("roomInfo").style.display = "none";
    document.getElementById("versusScreen").style.display = "none";
    document.getElementById("board").style.display = "block";
    if (username == connected_users[0]){
      document.getElementById("left_player").innerText = username;
      document.getElementById("right_player").innerText = connected_users[1];
    }
    else{
      document.getElementById("left_player").innerText = connected_users[0];
      document.getElementById("right_player").innerText = username;
    }
    document.getElementById("left_player").style.display = "block";
    document.getElementById("right_player").style.display = "block";
    document.getElementById("resetRemoteGameButton").style.display = "none";
    //board vars
    if (check_input_froms() == -1){
      alert("The host entered wrong settings for the game!");
      reset();
      return ;
    }
    player1.curr_speedY = playerSpeedY;
    player2.curr_speedY = playerSpeedY;
    document.getElementById("myForm").style.display = "none";
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    //color customization
    board.style.display = "block";
    board.style.backgroundColor = background_color;
    board.style.borderTop = "5px solid " + border_color;
    board.style.borderBottom = "5px solid " + border_color;
    board.style.borderLeft = "5px solid " + border_color;
    board.style.borderRight = "5px solid " + border_color;

    //fill the board with our classes
    context.fillStyle = ball_color;
    context.fillRect(player1.x, player1.y, player1.width, player1.height);
    context.fillRect(player2.x, player2.y, player2.width, player2.height);

    //key listener if key is pressed
    window.addEventListener('keydown', (event) => {
      if (username == connected_users[0]){
        if (event.code == 'ArrowUp') {
          if (player1.y > 0){
            chatSocket.send(JSON.stringify({'type': 'game_action', 'action': 'move_up', 'player': '1'}));
          }
          else{
            player1.movespeed = 0;
            player1.y = 0;
          }
        }
        if (event.code == 'ArrowDown') {
          if (player1.y + player1.height < boardHeight){
            chatSocket.send(JSON.stringify({'type': 'game_action', 'action': 'move_down', 'player': '1'}));
          }
          else{
            player1.movespeed = 0;
            player1.y = boardHeight - player1.height;
          }
        }
      }
      else{
        if (event.code == 'ArrowUp') {
          if (player2.y > 0){
            chatSocket.send(JSON.stringify({'type': 'game_action', 'action': 'move_up', 'player': '2'}));
          }
          else{
            player2.movespeed = 0;
            player2.y = 0;
          }
        }
        if (event.code == 'ArrowDown') {
          if (player2.y + player2.height < boardHeight){
            chatSocket.send(JSON.stringify({'type': 'game_action', 'action': 'move_down', 'player': '2'}));
          }
          else{
            player2.movespeed = 0;
            player2.y = boardHeight - player2.height;
          }
        }
      }
    })
    //event listener for key gets released
    window.addEventListener('keyup', (e) => {
    if (username == connected_users[0]){
      if (e.code == 'ArrowUp' || e.code == 'ArrowDown') {
        chatSocket.send(JSON.stringify({'type': 'game_action', 'action': 'stop', 'player': '1'}));
      }
    }
    else{
      if (e.code == 'ArrowUp' || e.code == 'ArrowDown') {
        chatSocket.send(JSON.stringify({'type': 'game_action', 'action': 'stop', 'player': '2'}));
      }
    }
    });
     // Start the game loop and end if game is won
    intervalID = setInterval(count_down, 1000);
  }

  function count_down() {
    countdown--;
    context.clearRect(0, 0, board.width, board.height);
    context.font = "45px Verdana";
    context.fillStyle = document.getElementById("ballColor").value;
    context.textAlign = "center";
    context.fillText(`Game starts in ${countdown}`, board.width / 2, board.height / 2);
    if (countdown <= 0){
      clearInterval(intervalID);
      intervalID = 0;
      update();
      return;
    }
  }

  function update() {
    id = requestAnimationFrame(update);
    context.clearRect(0, 0, board.width, board.height); // Clear the canvas

    context.fillStyle = border_color;

    context.fillStyle = ball_color;
    check_and_change_dir_ball();

    prevX = ball.x;
    prevY = ball.y;

    ball.x += ball.speedX;
    ball.y += ball.speedY;
    drawCircle(context, ball.x, ball.y, ball.width/2);

    if (power_up_mode == true){
      //check if the size power up is collected and change accordingly
      check_size_power_up();

      //check if the speed power up is collected and change accordingly
      check_speed_power_up();
    }

    // check if player paddle is out of the frame otherwise change player paddle x and y
    check_and_change_dir_player();

    if (check_and_change_score() == 1){
      cancelAnimationFrame(id);
	  const resetRemoteGameButton = document.getElementById("resetRemoteGameButton")
	  if(resetRemoteGameButton){
		  document.getElementById("resetRemoteGameButton").style.display = "block";
	  }
    }
    context.font = "45px Verdana";
    context.fillText(score1, boardWidth/5, 45);
    context.fillText(score2, boardWidth/5 * 4, 45);
  }

  function check_size_power_up(){
    if (size_power_up_used == false){
      if (size_y < 0)
        size_y = boardHeight;
      else
        size_y -= 3;
      drawArrow(context, size_x, size_y, 40);
    }
    if (size_power_up_used == false && areBallsTouching(ball.x, ball.y, ball.width/2, size_x, size_y, 20)){
      var player;
      if (ball.speedX > 0)
        player = '1';
      else
        player = '2';
      chatSocket.send(JSON.stringify({'type': 'game_action', 'action': 'power_up_used_size', 'player': player}));
      size_power_up_used = true;
    }
  }

  function check_speed_power_up(){
    if (speed_power_up_used == false){
      if (speed_y + 20 > boardHeight)
        speed_y = 0;
      else
        speed_y += 3;
      drawStar(context, speed_x, speed_y, 20, 20);
    }
    if (speed_power_up_used == false && areBallsTouching(ball.x, ball.y, ball.width/2, speed_x, speed_y, 20)){
      var player;
      if (ball.speedX > 0)
        player = '1';
      else
        player = '2';
      chatSocket.send(JSON.stringify({'type': 'game_action', 'action': 'power_up_used_speed', 'player': player}));
      speed_power_up_used = true;
    }
  }

  function drawCircle(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  function drawArrow(ctx, x, y, size) {
    var halfSize = size / 2;
    var tipY = y - size;
    var topX = x;
    var topY = y - halfSize;
    var bottomLeftX = x - halfSize;
    var bottomLeftY = y;
    var bottomRightX = x + halfSize;
    var bottomRightY = y;
    var bodyHeight = size / 4; // Height of the arrow's body

    ctx.fillRect(x - size / 6, y, size / 3, bodyHeight * 1.5);

    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(bottomLeftX, bottomLeftY);
    ctx.lineTo(bottomRightX, bottomRightY);
    ctx.lineTo(topX, topY);
    ctx.lineTo(x, tipY);
    ctx.closePath();

    ctx.fill();
  }

  function drawStar(ctx, x, y, size) {
    ctx.beginPath();
    for (var i = 0; i < 5; i++) {
        ctx.lineTo(x + size * Math.cos((18 + i * 72) / 180 * Math.PI),
                   y - size * Math.sin((18 + i * 72) / 180 * Math.PI));
        ctx.lineTo(x + size / 2 * Math.cos((54 + i * 72) / 180 * Math.PI),
                   y - size / 2 * Math.sin((54 + i * 72) / 180 * Math.PI));
    }
    ctx.closePath();
    ctx.lineWidth = 3;
    ctx.fill();
  }

  function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  function mapValue(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
  }

  function areBallsTouching(ball1_x, ball1_y, ball1_radius, ball2_x, ball2_y, ball2_radius) {
    var distanceBetweenCenters = Math.sqrt(Math.pow(ball1_x - ball2_x, 2) + Math.pow(ball1_y - ball2_y, 2));
    var sumOfRadii = ball1_radius + ball2_radius;
    return distanceBetweenCenters <= sumOfRadii;
  }

  function checkPaddleCollision(prevX, currentX, paddleX, paddleWidth) {
    if (prevX < paddleX && currentX >= paddleX) return true;
    if (prevX > paddleX + paddleWidth && currentX <= paddleX + paddleWidth) return true;
    return false;
}

  function check_and_change_dir_ball() {
    if (ball.y > boardHeight - ball.height/2){
      if (advanced_mode == true)
            ball.y = ball.height / 2;
      else{
          ball.y = boardHeight - ball.height / 2;
          ball.speedY *= -1;
      }
    }
    if (ball.y < ball.height/2){
        if (advanced_mode == true)
            ball.y = boardHeight - ballHeight/2;
        else{
            ball.y = ball.height / 2;
            ball.speedY *= -1;
        }
    }
    if (ball.x <= player1.x + player1.width && ball.x + ball.width >= player1.x
      && ball.y + ball.height >= player1.y && ball.y <= player1.y + player1.height){
      if (checkPaddleCollision(prevX, ball.x, player1.x, player1.width) && ball.x < player1.x + player1.width){
        ballSpeed *= 1.01;
        let diff = ball.y - (player1.y + player1.height/2);
        let rad = degreesToRadians(45);
        let angle = mapValue(diff, -player1.height/2, player1.height/2, -rad, rad);
        ball.speedX = ballSpeed * Math.cos(angle);
        ball.speedY = ballSpeed * Math.sin(angle);
        chatSocket.send(JSON.stringify({'type': 'ball_move', 'ball_speed_x': ball.speedX, 'ball_speed_y': ball.speedY, 'player': '1'}));
      }
    }
    else if (checkPaddleCollision(prevX, ball.x, player2.x, player2.width) && ball.x + ball.width >= player2.x && ball.x <= player2.x + player2.width
        && ball.y <= player2.y + player2.height && ball.y + ball.height >= player2.y){
        if (ball.x > player2.x){
          ballSpeed *= 1.01;
          let diff = ball.y - (player2.y + player2.height/2);
          let angle = mapValue(diff, -player2.height/2, player2.height/2, degreesToRadians(225), degreesToRadians(135));
          ball.speedX = ballSpeed * Math.cos(angle);
          ball.speedY = ballSpeed * Math.sin(angle);
          chatSocket.send(JSON.stringify({'type': 'ball_move', 'ball_speed_x': ball.speedX, 'ball_speed_y': ball.speedY, 'player': '2'}));
        }
      }
  }

  function check_and_change_dir_player() {
    player1.y += player1.movespeed;
    if (player1.y < 0)
      player1.y = 1
    else if (player1.y > boardHeight - player1.height)
      player1.y = boardHeight - player1.height;

    context.fillRect(player1.x, player1.y, player1.width, player1.height);

    player2.y += player2.movespeed;
    if (player2.y < 0)
      player2.y = 1
    else if (player2.y > boardHeight - player2.height)
      player2.y = boardHeight - player2.height;
    context.fillRect(player2.x, player2.y, player2.width, player2.height);
  }

  function reset_game(data) {
    speed_power_up_used = false;
    size_power_up_used = false;
    player1.curr_speedY = playerSpeedY;
    player2.curr_speedY = playerSpeedY;
    player1.height = playerHeight;
    player2.height = playerHeight;
    if (ball.speedX > 0)
      ball.x = 20;
    else
      ball.x = board.width - player1.width - 20;
    ball.y = boardHeight/2;
    size_x = boardWidth/2;
    size_y = boardHeight/4;
    speed_x = boardWidth/2;
    speed_y = boardHeight/4 * 3;

    //reset the game with the data from the channels
    ball.speedX = data.ball_speed_x;
    ball.speedY = data.ball_speed_y;
    score1 = data.score1;
    score2 = data.score2;

    context.fillRect(player1.x, player1.y, player1.width, player1.height);
    context.fillRect(player2.x, player2.y, player2.width, player2.height);
    drawCircle(context, ball.x, ball.y, ball.width/2);
  }

  function check_and_change_score() {
    if (ball.x < 0){
      // if (score2 <= maxScore - 1)
      //   soundGoal.play();
      score2++;
      ballSpeed = init_ballSpeed;
      let random = Math.random() * 2 - 1;
      let ballAngle = random * Math.PI / 4;
      ball.speedX = ballSpeed * Math.cos(ballAngle);
      ball.speedY = ballSpeed * Math.sin(ballAngle);
      ball.speedX *= -1;
      chatSocket.send(JSON.stringify({'type': 'reset_game', 'ball_speed_x': ball.speedX, 'ball_speed_y': ball.speedY, 'score1': score1, 'score2': score2}));
    }
    else if (ball.x > boardWidth){
      // if (score1 <= maxScore - 1)
      //   soundGoal.play();
      score1++;
      ballSpeed = init_ballSpeed;
      let random = Math.random() * 2 - 1;
      let ballAngle = random * Math.PI / 4;
      ball.speedX = ballSpeed * Math.cos(ballAngle);
      ball.speedY = ballSpeed * Math.sin(ballAngle);
      chatSocket.send(JSON.stringify({'type': 'reset_game', 'ball_speed_x': ball.speedX, 'ball_speed_y': ball.speedY, 'score1': score1, 'score2': score2}));
    }
    if (score1 >= maxScore) {
      // soundVictory.play();
      context.clearRect(0, 0, board.width, board.height);
      context.font = "90px sans-serif";
      context.fillText("Winner: " + connected_users[0], boardWidth/2, 160);
      setTimeout(() => {
      let maxRally = Math.max(...rallies);
      let minRally = Math.min(...rallies);
      let average = 0;
      for (let i = 0; i < rallies.length; i++){
        average += rallies[i];
      }
      average = (average / rallies.length).toFixed(2);
      if (username == connected_users[0])
        chatSocket.send(JSON.stringify({
        'type': 'end_score',
        'user_score': score1,
        'opponent_score': score2,
        'is_win': true,
        'opponent': connected_users[1],
        'max_rally': maxRally,
        'min_rally': minRally,
        'average_rally': average}));
      else
        chatSocket.send(JSON.stringify({
        'type': 'end_score',
        'user_score': score2,
        'opponent_score': score1,
        'is_win': false,
        'opponent': connected_users[0],
        'max_rally': maxRally,
        'min_rally': minRally,
        'average_rally': average}));
      return 1;
      }, 500);
      return 1;
    }
    else if (score2 >= maxScore) {
      // soundVictory.play();
      context.clearRect(0, 0, board.width, board.height);
      context.font = "90px sans-serif";
      context.fillText("Winner: " + connected_users[1], boardWidth/2, 160);
      setTimeout(() => {
      let maxRally = Math.max(...rallies);
      let minRally = Math.min(...rallies);
      let average = 0;
      for (let i = 0; i < rallies.length; i++){
        console.log(i);
        average += rallies[i];
      }
      average = (average / rallies.length).toFixed(2);
      if (username == connected_users[1]){
        chatSocket.send(JSON.stringify({
        'type': 'end_score',
        'user_score': score2,
        'opponent_score': score1,
        'is_win': true,
        'opponent': connected_users[0],
        'max_rally': maxRally,
        'min_rally': minRally,
        'average_rally': average}));
      }
      else{
        chatSocket.send(JSON.stringify({
        'type': 'end_score',
        'user_score': score1,
        'opponent_score': score2,
        'is_win': false,
        'opponent': connected_users[1],
        'max_rally': maxRally,
        'min_rally': minRally,
        'average_rally': average}));
        }
        return 1;
      }, 500);
      return 1;
    }
    return 0;
  }

  function check_input_froms() {
      if (maxScore === "" || ballSpeed === ""){
        console.log("empty value");
        return -1;
      }
      else{
        maxScore = parseInt(maxScore);
        if (maxScore > 12 || maxScore <= 3){
          console.log("maxscore: ", maxScore);
          return -1;
        }
        ballSpeed = parseInt(ballSpeed);
        if (ballSpeed > 20 || ballSpeed <= 3){
          console.log("ballSpeed: ", ballSpeed);
          return -1;
        }
        playerSpeedY = Math.floor(ballSpeed/1.5);
        playerSpeed_power = playerSpeedY * 1.5;
      }
      return 0;
  }
