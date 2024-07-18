import { checkAccessToken } from "../profile/profile.js";

function reset() {
    document.getElementById("myForm").style.display = "flex";
    document.getElementById("board").style.display = "none";
    document.getElementById("resetGameButton").style.display = "none";
    document.getElementById("left_player").innerText = "Player1";
    document.getElementById("left_player").style.display = "none";
    document.getElementById("right_player").style.display = "none";
  }


export function startGameButton() {
    const gameButton = document.getElementById("startGameButton");
    if (gameButton) {
        gameButton.onclick = () => {
            document.getElementById('myForm').style.display = 'none';

            document.getElementById('gameContainer').style.display = 'block';

            document.getElementById('resetGameButton').style.display = 'none';

            start_game();
        };
    }
}

export function resetGameButton() {
    const resetButton = document.getElementById("resetGameButton");
    if (resetButton) {
        resetButton.onclick = () => reset();
    }
}

let board_id = 0;
let intervalID = 0;

export function close_solo_on_change(){
  if (board_id != 0)
    cancelAnimationFrame(board_id);
  if (intervalID != 0)
    clearInterval(intervalID);
}

export function start_game() {
     //board vars
	checkAccessToken();
    let board;
    let context;
    let boardWidth = 900;
    let boardHeight = 500;

    // player vars
    let playerWidth = 10;
    let playerHeight = 100;
    let playerSpeedY = 0;
    let prevX = 0;
    let prevY = 0;

    //ball vars
    let ballWidth = 10;
    let ballHeight = 10;
    let ballSpeed = document.getElementById("ballSpeed").value;
    let init_ballSpeed = ballSpeed;
    let random = Math.random() > 0.5 ? 1 : -1;
    let ballAngle = random * Math.PI / 4;
    random = Math.random() > 0.5 ? 1 : -1;

    //score vars
    let score1 = 0;
    let score2 = 0;
    let maxScore = document.getElementById("maxScore").value;

    //extra vars
    // let soundVictory = new Audio('victory.wav');
    // soundVictory.loop = false;
    // soundVictory.volume = 0.3;

    // let soundGoal = new Audio('goal.wav');
    // soundGoal.loop = false;
    // soundGoal.volume = 0.3;

    let advanced_mode = document.getElementById("advancedMode").checked;
    let power_up_mode = document.getElementById("powerUps").checked;
    let ai_enabled = document.getElementById("AI").checked;
    let size_power_up_used = false;
    let speed_power_up_used = false;

    //coordinates of the power Ups
    let size_x = boardWidth/2;
    let size_y = boardHeight/4;

    let speed_x = boardWidth/2;
    let speed_y = boardHeight/4 * 3;

    let countdown = 6;

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
    if (ai_enabled == true)
      document.getElementById("left_player").innerText = "AI";
    document.getElementById("left_player").style.display = "block";
    document.getElementById("right_player").style.display = "block";
    board.style.backgroundColor = document.getElementById("background").value;
    board.style.borderTop = "5px solid " + document.getElementById("borders").value;
    board.style.borderBottom = "5px solid " + document.getElementById("borders").value;
    board.style.borderLeft = "5px solid " + document.getElementById("borders").value;
    board.style.borderRight = "5px solid " + document.getElementById("borders").value;


    //fill the board with our classes
	const ballColor = document.getElementById("ballColor");
	if(ballColor)
    	context.fillStyle = document.getElementById("ballColor").value;
    context.fillRect(player1.x, player1.y, player1.width, player1.height);
    context.fillRect(player2.x, player2.y, player2.width, player2.height);

    //key listener if key is pressed
    window.addEventListener('keydown', (event) => {
        if (event.code == 'KeyW' && !ai_enabled) {
          if (player1.y > 0)
            player1.movespeed = -(player1.curr_speedY);
          else{
            player1.movespeed = 0;
            player1.y = 0;
          }
        }
        else if (event.code == 'KeyS' && !ai_enabled) {
          if (player1.y + player1.height < boardHeight)
            player1.movespeed = player1.curr_speedY;
          else{
            player1.movespeed = 0;
            player1.y = boardHeight - player1.height;
          }
       }

        if (event.code == 'ArrowUp') {
          if (player2.y > 0)
            player2.movespeed = -(player2.curr_speedY);
          else{
            player2.movespeed = 0;
            player2.y = 0;
          }
        }
        else if (event.code == 'ArrowDown') {
          if (player2.y + player2.height < boardHeight)
            player2.movespeed = player2.curr_speedY;
          else{
            player2.movespeed = 0;
            player2.y = boardHeight - player2.height;
          }
        }
    })
    //event listener for key gets released
    window.addEventListener('keyup', (e) => {
      if (e.code == 'KeyW') {
        player1.movespeed = 0;
      }
      else if (e.code == 'KeyS') {
        player1.movespeed = 0;
      }

      if (e.code == 'ArrowUp') {
        player2.movespeed = 0;
      }
      else if (e.code == 'ArrowDown') {
        player2.movespeed = 0;
      }
    });
     // Start the game loop and end if game is won
    intervalID = setInterval(count_down, 1000);

    function count_down() {
    countdown--;
    context.clearRect(0, 0, board.width, board.height);
    context.font = "45px Verdana";
    const ballColor = document.getElementById("ballColor");
    if (ballColor)
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
    let id = requestAnimationFrame(update);
    board_id = id;
    context.clearRect(0, 0, board.width, board.height); // Clear the canvas
	const borders = document.getElementById("borders");
	if (borders)
    	context.fillStyle = document.getElementById("borders").value;

	const ballColor = document.getElementById("ballColor");
	if (ballColor)
    	context.fillStyle = document.getElementById("ballColor").value;
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
      const resetGameButton = document.getElementById("resetGameButton");
      if (resetGameButton)
          document.getElementById("resetGameButton").style.display = "block";
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
      if (ball.speedX > 0)
        player1.height *= 2;
      else
        player2.height *= 2;
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
      if (ball.speedX > 0)
        player1.curr_speedY *= 2.5;
      else
        player2.curr_speedY *= 2.5;
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
            ball.y = ball.height/2 + 1;
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
        }
      }
  }

  function check_and_change_dir_player() {
    if (player1.y + player1.height/2 > ball.y && ball.speedX < 0 && ai_enabled)
      player1.y -= player1.curr_speedY;
    else if (player1.y + player1.height/2 < ball.y && ball.speedX < 0 && ai_enabled)
      player1.y += player1.curr_speedY;
    else if (!ai_enabled)
      player1.y += player1.movespeed;

    if (player1.y < 0)
      player1.y = 0
    else if (player1.y > boardHeight - player1.height)
      player1.y = boardHeight - player1.height;
    context.fillRect(player1.x, player1.y, player1.width, player1.height);

    player2.y += player2.movespeed;
    if (player2.y < 0)
      player2.y = 0
    else if (player2.y > boardHeight - player2.height)
      player2.y = boardHeight - player2.height;
    context.fillRect(player2.x, player2.y, player2.width, player2.height);
  }

  function reset_game() {
    ballSpeed = init_ballSpeed;
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


    let random = Math.random() * 2 - 1;
    let angle = random * Math.PI / 4;
    ball.speedX = ballSpeed * Math.cos(angle);
    ball.speedY = ballSpeed * Math.sin(angle);
    context.fillRect(player1.x, player1.y, player1.width, player1.height);
    context.fillRect(player2.x, player2.y, player2.width, player2.height);
    drawCircle(context, ball.x, ball.y, ball.width/2);
  }

  function check_and_change_score() {
    if (ball.x < 0){
      // if (score2 <= maxScore - 1)
      //   soundGoal.play();
      score2++;
      reset_game();
      ball.speedX *= -1;
    }
    else if (ball.x > boardWidth){
      // if (score1 <= maxScore - 1)
      //   soundGoal.play();
      score1++;
      reset_game();
    }
    if (score1 >= maxScore) {
      // soundVictory.play();
      context.clearRect(0, 0, board.width, board.height);
      context.font = "90px sans-serif";
      if (ai_enabled){
        context.fillText("Winner: AI", boardWidth/2, 160);
      }
      else {
        context.fillText("Winner: Player 1", boardWidth/2, 160);
      }
      return 1;
    }
    else if (score2 >= maxScore) {
      // soundVictory.play();
      context.clearRect(0, 0, board.width, board.height);
      context.font = "90px sans-serif";
      context.fillText("Winner: Player 2", boardWidth/2, 160);
      return 1;
    }
    return 0;
  }
    function check_input_froms() {
      if (maxScore === "" || ballSpeed === "")
        return -1;
      else{
        maxScore = parseInt(maxScore);
        if (maxScore > 12 || maxScore <= 3)
          return -1;
        ballSpeed = parseInt(ballSpeed);
        if (ballSpeed > 20 || ballSpeed <= 3)
          return -1;
        playerSpeedY = Math.floor(ballSpeed/2);
      }
      return 0;
    }
}
