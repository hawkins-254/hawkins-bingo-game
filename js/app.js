// Common variables
const MIN_PLAYERS = 5;
let sessionPlayers = JSON.parse(localStorage.getItem("bingoPlayers")) || [];

// Determine which page is loaded
const path = window.location.pathname;

// -------- Registration Page --------
if(path.includes("index.html")){
  const form = document.getElementById("registrationForm");
  const statusDiv = document.getElementById("status");

  function generateUniqueID(){
    return 'ID' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();

    if(!name || !email) return;

    const id = generateUniqueID();
    sessionPlayers.push({id,name,email});
    localStorage.setItem("bingoPlayers",JSON.stringify(sessionPlayers));

    form.style.display = "none";
    const remaining = MIN_PLAYERS - sessionPlayers.length;
    if(remaining > 0){
      statusDiv.innerHTML = `<p>Thank you ${name}! Your Player ID: <strong>${id}</strong></p>
                             <p>Waiting for ${remaining} more player(s) to start the game...</p>`;
      setTimeout(()=>{ window.location.href="waiting.html"; },2000);
    } else {
      statusDiv.innerHTML = `<p>Thank you ${name}! Your Player ID: <strong>${id}</strong></p>
                             <p>Game ready to start! <a href="game.html">Click here</a></p>`;
    }
  });
}

// -------- Waiting Room Page --------
if(path.includes("waiting.html")){
  const playerStatus = document.getElementById("playerStatus");
  const checkPlayers = setInterval(()=>{
    sessionPlayers = JSON.parse(localStorage.getItem("bingoPlayers")) || [];
    const remaining = MIN_PLAYERS - sessionPlayers.length;
    if(remaining > 0){
      playerStatus.textContent = `Current players: ${sessionPlayers.length}. Waiting for ${remaining} more...`;
    } else {
      clearInterval(checkPlayers);
      window.location.href = "game.html";
    }
  },1000);
}

// -------- Game Page --------
if(path.includes("game.html")){
  const playersContainer = document.getElementById("players-container");
  const calledText = document.getElementById("called");
  const winnerText = document.getElementById("winner");
  const startBtn = document.getElementById("startGame");
  const resetBtn = document.getElementById("reset");

  let numbers = Array.from({length:25},(_,i)=>i+1);
  let picked = [];
  let interval;
  let gameOver=false;

  function shuffle(arr){ // Fisher-Yates
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]] = [arr[j],arr[i]];
    }
    return arr;
  }

  function createBoards(){
    playersContainer.innerHTML="";
    sessionPlayers.forEach(player=>{
      player.board = [];
      const boardDiv = document.createElement("div");
      boardDiv.classList.add("player-board");
      boardDiv.innerHTML=`<h2>${player.name}</h2>`;
      const grid = document.createElement("div");
      grid.classList.add("grid");
      const nums = shuffle([...numbers]);
      nums.forEach(num=>{
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.textContent=num;
        grid.appendChild(cell);
        player.board.push(cell);
      });
      boardDiv.appendChild(grid);
      playersContainer.appendChild(boardDiv);
    });
  }

  function pickNumber(){
    if(gameOver) return;
    const available = numbers.filter(n=>!picked.includes(n));
    if(available.length===0) return;
    const randomNum = available[Math.floor(Math.random()*available.length)];
    picked.push(randomNum);
    calledText.textContent = `📢 Number: ${randomNum}`;
    const msg = new SpeechSynthesisUtterance(`Number ${randomNum}`);
    window.speechSynthesis.speak(msg);

    sessionPlayers.forEach(player=>{
      player.board.forEach(cell=>{
        if(parseInt(cell.textContent)===randomNum){
          cell.style.background="#4caf50";
          cell.style.color="#fff";
          cell.classList.add("marked");
        }
      });
    });
    checkBingo();
  }

  function checkBingo(){
    if(gameOver) return;
    for(let player of sessionPlayers){
      const gridArr = [];
      for(let i=0;i<25;i+=5) gridArr.push(player.board.slice(i,i+5));

      let bingo=false;
      if(gridArr.some(r=>r.every(c=>c.classList.contains("marked")))) bingo=true;
      for(let c=0;c<5;c++){
        if(gridArr.every(r=>r[c].classList.contains("marked"))) bingo=true;
      }
      if(gridArr.every((r,i)=>r[i].classList.contains("marked"))||
         gridArr.every((r,i)=>r[4-i].classList.contains("marked"))) bingo=true;

      if(bingo){
        gameOver=true;
        winnerText.textContent=`🎉 ${player.name} wins!`;
        winnerText.style.animation="flash 1s infinite";
        clearInterval(interval);
        setTimeout(()=>{ localStorage.setItem("winner",player.name); window.location.href="result.html"; },5000);
      }
    }
  }
    startBtn.addEventListener("click",()=>{
    if(interval) return;
    createBoards();
    interval = setInterval(pickNumber,3000);
    startBtn.disabled=true;
  });

  resetBtn.addEventListener("click",()=>{
    localStorage.removeItem("bingoPlayers");
    localStorage.removeItem("winner");
    window.location.href="index.html";
  });
}

// -------- Result Page --------