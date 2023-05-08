const express = require('express');

const bcrypt = require('bcrypt');
const fs = require('fs');
const session = require('express-session');

// Create the Express app
const app = express();

// Use the 'public' folder to serve static files
app.use(express.static('public'));

// Use the json middleware to parse JSON data
app.use(express.json());
const cors = require('cors');
app.use(cors());

// Use the session middleware to maintain sessions
const chatSession = session({
  secret: 'game',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {maxAge: 300000},
});
app.use(chatSession);

// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
  return /^\w+$/.test(text);
}

// Handle the /register endpoint
app.post('/register', (req, res) => {
  // Get the JSON data from the body
  const {username, avatar, name, password} = req.body;

  //
  // D. Reading the users.json file
  //
  const users = JSON.parse(fs.readFileSync('data/users.json'));

  //
  // E. Checking for the user data correctness
  //
  if (username === '') {
    res.json({status: 'error', error: 'Username cannot be empty.'});
    return;
  }
  if (avatar === '') {
    res.json({status: 'error', error: 'Avatar cannot be empty.'});
    return;
  }
  if (name === '') {
    res.json({status: 'error', error: 'Name cannot be empty.'});
    return;
  }
  if (password === '') {
    res.json({status: 'error', error: 'Password cannot be empty.'});
    return;
  }
  if (!containWordCharsOnly(username)) {
    res.json({
      status: 'error',
      error: 'Username contains invalid characters.',
    });
    return;
  }
  if (username in users) {
    res.json({
      status: 'error',
      error: 'An account with this username already exists.',
    });
    return;
  }

  //
  // G. Adding the new user account
  //
  const hash = bcrypt.hashSync(password, 10);
  users[username] = {avatar, name, password: hash};

  //
  // H. Saving the users.json file
  //
  fs.writeFileSync('data/users.json', JSON.stringify(users, null, ' '));

  //
  // I. Sending a success response to the browser
  //
  res.json({status: 'success'});
});

// Handle the /signin endpoint
app.post('/signin', (req, res) => {
  // Get the JSON data from the body
  const {username, password} = req.body;

  //
  // D. Reading the users.json file
  //
  const users = JSON.parse(fs.readFileSync('data/users.json'));

  //
  // E. Checking for username/password
  //
  if (
      !(username in users) ||
      !bcrypt.compareSync(password, users[username].password)
  ) {
    res.json({status: 'error', error: 'Invalid username or password.'});
    return;
  }

  //
  // G. Sending a success response with the user account
  //
  const user = {
    username,
    avatar: users[username].avatar,
    name: users[username].name,
  };

  // store session
  req.session.user = user;

  // response success
  res.json({status: 'success', user});
});

// Handle the /validate endpoint
app.get('/validate', (req, res) => {
  //
  // B. Getting req.session.user
  //
  const {user} = req.session;

  //
  // D. Sending a success response with the user account
  //
  if (user) res.json({status: 'success', user});
  else res.json({status: 'error', error: 'No sessions exist.'});
});

// Handle the /signout endpoint
app.get('/signout', (req, res) => {
  //
  // Deleting req.session.user
  //
  delete req.session.user;

  //
  // Sending a success response
  //
  res.json({status: 'success'});
});

// setup Socket.io server
const {createServer} = require('http');
const {Server} = require('socket.io');
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// initialize empty online users
const onlineUsers = {};

let waitingArea = [];

let rooms = [];

const playerLimit = 2;

const maps = [{
  territories: [
    {id: 0, neighbours: [1, 6, 13]},
    {id: 1, neighbours: [0, 2]},
    {id: 2, neighbours: [1, 3]},
    {id: 3, neighbours: [2, 4, 5]},
    {id: 4, neighbours: [3, 5, 18]},
    {id: 5, neighbours: [3, 4, 10]},
    {id: 6, neighbours: [0, 8]},
    {id: 7, neighbours: [8, 9]},
    {id: 8, neighbours: [6, 7, 9, 13]},
    {id: 9, neighbours: [7, 8, 10, 13, 14, 15]},
    {id: 10, neighbours: [5, 9, 11, 15]},
    {id: 11, neighbours: [10, 12, 15]},
    {id: 12, neighbours: [11, 17]},
    {id: 13, neighbours: [0, 8, 9, 14]},
    {id: 14, neighbours: [9, 13, 15, 16]},
    {id: 15, neighbours: [9, 10, 11, 14, 16]},
    {id: 16, neighbours: [14, 15, 17, 18]},
    {id: 17, neighbours: [12, 16, 18]},
    {id: 18, neighbours: [4, 16, 17]},
  ],
  continents: [
    {name: 'asia', territories: [13, 14, 15, 16], bonus: 4},
    {name: 'australia', territories: [17, 18], bonus: 2},
    {name: 'europe', territories: [6, 7, 8, 9], bonus: 3},
    {name: 'africa', territories: [10, 11, 12], bonus: 3},
    {name: 'north america', territories: [0, 1, 2], bonus: 3},
    {name: 'south america', territories: [3, 4, 5], bonus: 2}
  ]
}];

const cardTypes = ['Infantry', 'Cavalry', 'Artillery'];

const cardSets = {
  Infantry: {cards: ['Infantry', 'Infantry', 'Infantry'], bonus: 1},
  Cavalry: {cards: ['Cavalry', 'Cavalry', 'Cavalry'], bonus: 2},
  Artillery: {cards: ['Artillery', 'Artillery', 'Artillery'], bonus: 3},
  All: {cards: ['Infantry', 'Cavalry', 'Artillery'], bonus: 4},
};


const generateRandomRoomCode = () => {
  // Debug purpose
  // return 'testingRoomCode';
  let roomCode = '';
  const codeLength = 10;
  let uniqueCheck = false;

  let duplicateFound;
  while (!uniqueCheck) {
    for (let i = 0; i < codeLength; i++) {
      const randomAscii = Math.floor(Math.random() * 26) + 65;
      roomCode += String.fromCharCode(randomAscii);
    }
    duplicateFound = false;
    for (let i = 0; i < rooms.length; i++) {
      if (rooms[i].roomCode === roomCode) {
        duplicateFound = true;
        break;
      }
    }
    if (!duplicateFound)
      uniqueCheck = true;
  }
  return roomCode;
}

const getRoomIndexByRoomCode = roomCode => {
  let roomIndex = -1;
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].roomCode === roomCode) {
      return i;
    }
  }
  return roomIndex;
}

const initializeBoard = map => {
  // Debug purpose
  // return {
  //   "territories": [
  //     { "id": 0, "neighbours": [1, 6, 13], "owner": 1, "troops": 3 },
  //     { "id": 1, "neighbours": [0, 2], "owner": 1, "troops": 1 },
  //     { "id": 2, "neighbours": [1, 3], "owner": 0, "troops": 2 },
  //     { "id": 3, "neighbours": [2, 4, 5], "owner": 1, "troops": 1 },
  //     { "id": 4, "neighbours": [3, 18], "owner": 1, "troops": 2 },
  //     { "id": 5, "neighbours": [3, 10], "owner": 1, "troops": 2 },
  //     { "id": 6, "neighbours": [0, 8], "owner": 1, "troops": 2 },
  //     { "id": 7, "neighbours": [8, 9], "owner": 0, "troops": 1 },
  //     { "id": 8, "neighbours": [6, 7, 9, 13], "owner": 1, "troops": 4 },
  //     { "id": 9, "neighbours": [7, 8, 10, 13, 15], "owner": 0, "troops": 1 },
  //     { "id": 10, "neighbours": [5, 9, 11], "owner": 0, "troops": 1 },
  //     { "id": 11, "neighbours": [10, 12, 15], "owner": 1, "troops": 1 },
  //     { "id": 12, "neighbours": [11, 17], "owner": 0, "troops": 2 },
  //     { "id": 13, "neighbours": [0, 8, 9, 14], "owner": 0, "troops": 1 },
  //     { "id": 14, "neighbours": [13, 15, 16], "owner": 0, "troops": 3 },
  //     { "id": 15, "neighbours": [9, 11, 14, 16], "owner": 0, "troops": 2 },
  //     { "id": 16, "neighbours": [14, 15, 17, 18], "owner": 1, "troops": 1 },
  //     { "id": 17, "neighbours": [12, 16, 18], "owner": 0, "troops": 2 },
  //     { "id": 18, "neighbours": [4, 16, 17], "owner": 0, "troops": 2 }
  //   ],continents: [
  //     {name: 'asia', territories: [13, 14, 15, 16], bonus: 4},
  //     {name: 'australia', territories: [17, 18], bonus: 2},
  //     {name: 'europe', territories: [7, 8, 9], bonus: 3},
  //     {name: 'africa', territories: [10, 11, 12], bonus: 3},
  //     {name: 'north america', territories: [0, 1, 2], bonus: 3},
  //     {name: 'south america', territories: [3, 4, 5], bonus: 2}
  //   ]}

  let n = playerLimit;
  let t = Math.floor((map.territories.length * 1.8) / n);
  const shuffledTerritories = shuffleArray([...map.territories]);
  const userTerritories = Array.from({length: n}, () => []);

  for (let i = 0; i < shuffledTerritories.length; i++) {
    const userIndex = i % n;
    userTerritories[userIndex].push(shuffledTerritories[i].id);
  }

  const updatedTerritories = map.territories.map(territory => {
    const owner = userTerritories.findIndex(userTerritoryIds =>
        userTerritoryIds.includes(territory.id)
    );
    return {...territory, owner};
  });

  const territoriesWithTroops = distributeTroops(updatedTerritories, userTerritories, t);

  return {...map, territories: territoriesWithTroops};
}

function distributeTroops(territories, userTerritories, t) {
  const territoriesWithTroops = territories.map(territory => ({...territory, troops: 1}));

  for (let i = 0; i < userTerritories.length; i++) {
    let remainingTroops = t - userTerritories[i].length;

    while (remainingTroops > 0) {
      const randomTerritoryIndex = Math.floor(Math.random() * userTerritories[i].length);
      const territoryId = userTerritories[i][randomTerritoryIndex];
      const territoryIndex = territoriesWithTroops.findIndex(territory => territory.id === territoryId);
      territoriesWithTroops[territoryIndex].troops += 1;
      remainingTroops -= 1;
    }
  }
  return territoriesWithTroops;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function removeKeyFromArray(arr, key) {
  return arr.map(obj => {
    const newObj = {...obj};
    delete newObj[key];
    return newObj;
  });
}

function calculateDraftTroops(board, playerId) {
  const {territories, continents} = board;

  // Calculate territories bonus
  const playerTerritories = territories.filter(t => t.owner === playerId);
  const territoriesBonus = playerTerritories.length >= 9
      ? Math.floor(playerTerritories.length / 3)
      : 3;

  // Calculate continents bonus
  let continentsBonus = 0;
  continents.forEach(continent => {
    const playerOwnsContinent = continent.territories.every(tId => {
      const territory = territories.find(t => t.id === tId);
      return territory.owner === playerId;
    });

    if (playerOwnsContinent) {
      continentsBonus += continent.bonus;
    }
  });

  return territoriesBonus + continentsBonus;
}

function riskAttack(attackerTroops, defenderTroops) {
  function rollDice(numDice) {
    const rolls = [];
    for (let i = 0; i < numDice; i++) {
      rolls.push(Math.floor(Math.random() * 6) + 1);
    }
    return rolls.sort((a, b) => b - a);
  }


  const attackerDice = rollDice(Math.min(attackerTroops - 1, 3));
  const defenderDice = rollDice(Math.min(defenderTroops, 2));

  let attackerTroopsLost = 0;
  let defenderTroopLost = 0;

  for (let i = 0; i < Math.min(attackerDice.length, defenderDice.length); i++) {
    if (attackerDice[i] > defenderDice[i]) {
      defenderTroops--;
      defenderTroopLost++;
    } else {
      attackerTroops--;
      attackerTroopsLost++
    }
  }


  return {
    attackerTroops,
    defenderTroops,
    attackerDice,
    defenderDice,
    attackerTroopsLost,
    defenderTroopLost
  };
}

function isConnected(board, territoryId1, territoryId2, playerId) {
  const visited = new Set();

  function dfs(territoryId) {
    if (territoryId === territoryId2) return true;
    if (visited.has(territoryId)) return false;

    visited.add(territoryId);
    const territory = board.territories.find(t => t.id === territoryId);

    if (territory.owner !== playerId) return false;

    for (const neighbourId of territory.neighbours) {
      if (dfs(neighbourId)) return true;
    }

    return false;
  }

  return dfs(territoryId1);
}

function drawRandomCard(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

function removeSubarray(a, b) {
  const bCopy = [...b]; // Create a copy of array b to not modify the original
  let isSubarray = true;

  a.forEach((element) => {
    const index = bCopy.indexOf(element);

    if (index !== -1) {
      bCopy.splice(index, 1);
    } else {
      isSubarray = false;
    }
  });

  if (isSubarray) {
    return bCopy;
  } else {
    return null;
  }
}

function areAllLandsOwnedByOnePlayer(board) {

  const territories = board.territories;
  if (territories.length === 0) {
    return false;
  }

  const firstOwner = territories[0].owner;

  for (let i = 1; i < territories.length; i++) {
    if (territories[i].owner !== firstOwner) {
      return false;
    }
  }

  return true;
}


// use session
io.use((socket, next) => {
  chatSession(socket.request, {}, next);
});

io.on('connection', (socket) => {
  // add user to online
  const user = socket.request.session.user;
  if (user) {
    onlineUsers[user.username] = {avatar: user.avatar, name: user.name};
    io.emit('add user', JSON.stringify(user));
  }

  // const user = 'test user'
  console.log(socket.id, 'has connectd.')

  // delete user on disconnect
  socket.on('disconnect', () => {
    if (user) {
      delete onlineUsers[user.username];
      io.emit('remove user', JSON.stringify(user));
    }
    let waitingAreaIndex = waitingArea.findIndex(user => user.socketID === socket.id);
    if (waitingAreaIndex !== -1) {
      waitingArea.splice(waitingAreaIndex, 1);
    }

    let roomsIndex = rooms.findIndex(room => {
      room.players.map(player => player.socketID).includes(socket.id);
    })
    if (roomsIndex !== -1) {
      socket.to(rooms[roomsIndex].roomCode).emit('quit-game-notification', {})
      console.log(`Room ${rooms[roomsIndex].roomCode} is removed.`)
      rooms.splice(roomsIndex, 1);
    }
  });

  socket.on('get users', () => {
    socket.emit('users', JSON.stringify(onlineUsers));
  });

  // 1. User send 'join-waiting-area-request' to join the waiting area
  // 2. If the waiting area have sufficient players, it will create a room signal the players that are being added with 'game-start-notification'
  // 3. If the waiting room does not have sufficient players, it will signal the requested socket with join-waiting-area-request'
  socket.on('join-waiting-area-request', () => {
    if (waitingArea.map(user => user.socketID).includes(socket.id)) {
      socket.emit('join-waiting-area-response', {
        success: false,
        reason: 'You are already in waiting area.'
      })
      return;
    }
    waitingArea.push({user, socketID: socket.id});
    console.log(`User ${socket.id} has joined the waiting area.`)
    if (waitingArea.length >= playerLimit) {
      let board = initializeBoard(maps[0]);
      let players = waitingArea.splice(0, playerLimit).map((player, idx) => {
        return {
          ...player,
          cards: [],
          troopsLost: 0,
          troopsKill: 0,
          replayRequest: false,
          troopsReceived: board.territories.filter(territory => territory.owner === idx)
              .map(territory => territory.troops)
              .reduce((accumulator, currentValue) => accumulator + currentValue, 0)
        }
      });
      console.log(JSON.stringify(players));
      const roomCode = generateRandomRoomCode();
      for (const player of players) {
        io.sockets.sockets.get(player.socketID).join(roomCode);
      }

      const roomClients = io.sockets.adapter.rooms.get(roomCode);
      console.log(JSON.stringify(roomClients))
      rooms.push({
        players,
        roomCode,
        board,
        currentPlayerIndex: 0,
        state: 'draft',
        attackRecorded: false,
        beginTime: new Date(),
        round: 1,
      })
      const room = rooms[getRoomIndexByRoomCode(roomCode)];
      room.draftTroops = calculateDraftTroops(room.board, room.currentPlayerIndex)
      room.players[room.currentPlayerIndex].troopsReceived += room.draftTroops;

      io.to(roomCode).emit('game-start-notification', {
        players: removeKeyFromArray(room.players, 'cards'),
        roomCode: room.roomCode,
        currentPlayerIndex: room.currentPlayerIndex,
        board: room.board,
        state: room.state,
      })

      io.to(room.players[room.currentPlayerIndex].socketID).emit('draft-notification', {
        players: removeKeyFromArray(room.players, 'cards'),
        roomCode: room.roomCode,
        currentPlayerIndex: room.currentPlayerIndex,
        board: room.board,
        state: room.state,
        draftTroops: room.draftTroops
      })
      console.log(`Room ${room.roomCode}: Phase ${room.state} Player ${room.currentPlayerIndex}.`)
    } else {
      socket.emit('join-waiting-area-response', {success: true, message: 'Please wait for other players.'})
    }
  })


  // Format of req JSON:
  // {
  //   roomCode: string,
  //   draftRequests: {id: int, troops: int}[]
  // }
  socket.on('draft-request', req => {
    let roomIndex = getRoomIndexByRoomCode(req.roomCode);
    if (roomIndex === -1) {
      socket.emit('draft-response', {
        success: false,
        reason: 'RoomCode not found.'
      })
      return;
    }
    const room = rooms[roomIndex];
    if (room.players[room.currentPlayerIndex].socketID !== socket.id || room.state !== 'draft') {
      socket.emit('draft-response', {
        success: false,
        reason: 'You have no permission to draft troops.'
      })
      return;
    }
    // Validate Draft
    let requestingDraftTroops = 0;
    let draftRequest = req.draftRequest;

    let territory = room.board.territories.find(territory => territory.id == draftRequest.id);
    if (territory) {
      if (territory.owner !== room.currentPlayerIndex) {
        socket.emit('draft-response', {
          success: false,
          reason: `You cannot draft troops on ${draftRequest.id}.`
        });
        return;
      }
    } else {
      socket.emit('draft-response', {
        success: false,
        reason: `Territory not found.`
      });
      return;
    }
    requestingDraftTroops += draftRequest.troops;

    if (requestingDraftTroops > room.draftTroops) {
      socket.emit('draft-response', {
        success: false,
        reason: `The number of troops is invalid.`
      });
      return;
    }

    // Troops deployed

    let territoryIndex = room.board.territories.findIndex(territory => territory.id === draftRequest.id);
    rooms[roomIndex].board.territories[territoryIndex].troops += draftRequest.troops;


    room.draftTroops -= requestingDraftTroops;

    socket.emit('draft-response', {
      success: true,
    });

    io.to(room.players[room.currentPlayerIndex].socketID).emit('draft-notification', {
      players: removeKeyFromArray(room.players, 'cards'),
      roomCode: room.roomCode,
      currentPlayerIndex: room.currentPlayerIndex,
      board: room.board,
      state: room.state,
      draftTroops: room.draftTroops
    })
  })

  // Format of req JSON:
  // {
  //   roomCode: string,
  //   cardSetType: string('Infantry', 'Cavalry', 'Artillery', 'All')
  // }
  socket.on('card-redeem-request', req => {
    let roomIndex = getRoomIndexByRoomCode(req.roomCode);
    if (roomIndex === -1) {
      socket.emit('card-redeem-response', {
        success: false,
        reason: 'RoomCode not found.'
      })
      return;
    }
    const room = rooms[roomIndex];
    if (room.players[room.currentPlayerIndex].socketID !== socket.id || room.state !== 'draft') {
      socket.emit('card-redeem-response', {
        success: false,
        reason: 'You have no permission to redeem card.'
      })
      return;
    }
    const redeemResult = removeSubarray(cardSets[req.cardSetType].cards, room.players[room.currentPlayerIndex].cards);
    if (redeemResult === null) {
      socket.emit('card-redeem-response', {
        success: false,
        reason: 'The card redeem is invalid.'
      })
      return;
    }
    room.players[room.currentPlayerIndex].cards = redeemResult;
    room.draftTroops += cardSets[req.cardSetType].bonus;
    room.players[room.currentPlayerIndex].troopsReceived += cardSets[req.cardSetType].bonus;
    socket.emit('card-redeem-response', {
      success: true
    })
    socket.emit('update-cards-notification', {
      cards: room.players[room.currentPlayerIndex].cards
    })
    io.to(room.players[room.currentPlayerIndex].socketID).emit('draft-notification', {
      players: removeKeyFromArray(room.players, 'cards'),
      roomCode: room.roomCode,
      currentPlayerIndex: room.currentPlayerIndex,
      board: room.board,
      state: room.state,
      draftTroops: room.draftTroops
    })

  })

  socket.on('finish-draft-request', req => {
    let roomIndex = getRoomIndexByRoomCode(req.roomCode);
    if (roomIndex === -1) {
      socket.emit('finish-draft-response', {
        success: false,
        reason: 'RoomCode not found.'
      })
      return;
    }
    const room = rooms[roomIndex];
    if (room.players[room.currentPlayerIndex].socketID !== socket.id || room.state !== 'draft') {
      socket.emit('finish-draft-response', {
        success: false,
        reason: 'You have no permission to finish the draft phase.'
      })
      return;
    }
    if (room.draftTroops > 0) {
      socket.emit('finish-draft-response', {
        success: false,
        reason: 'You have not draft all the troops.'
      })
      return;
    }
    rooms[roomIndex].state = 'attack';
    socket.emit('finish-draft-response', {
      success: true,
    })
    io.to(room.roomCode).emit('map-update-notification', {
      players: removeKeyFromArray(room.players, 'cards'),
      roomCode: room.roomCode,
      currentPlayerIndex: room.currentPlayerIndex,
      board: room.board,
      state: room.state,
    })
  })


  //Format of req JSON
  // {
  //   roomCode: string,
  //   attackerID: int,
  //   defenderID: int,
  // }
  socket.on('attack-request', req => {
    let roomIndex = getRoomIndexByRoomCode(req.roomCode);
    if (roomIndex === -1) {
      socket.emit('attack-response', {
        success: false,
        reason: 'RoomCode not found.'
      })
      return;
    }
    const room = rooms[roomIndex];
    if (room.players[room.currentPlayerIndex].socketID !== socket.id || room.state !== 'attack') {
      socket.emit('attack-response', {
        success: false,
        reason: 'You have no permission to attack.'
      })
      return;
    }

    const attackerTerritoryIndex = room.board.territories.findIndex(territory => territory.id == req.attackerID);
    const defenderTerritoryIndex = room.board.territories.findIndex(territory => territory.id == req.defenderID);
    const attackerTerritory = room.board.territories.find(territory => territory.id == req.attackerID);
    const defenderTerritory = room.board.territories.find(territory => territory.id == req.defenderID);
    if (!attackerTerritory || !defenderTerritory) {
      socket.emit('attack-response', {
        success: false,
        reason: 'Invalid attacking or defending territory.'
      })
      return;
    }
    if (attackerTerritory.owner !== room.currentPlayerIndex || defenderTerritory === room.currentPlayerIndex || attackerTerritory.troops <= 1) {
      socket.emit('attack-response', {
        success: false,
        reason: 'Invalid attacking or defending territory.'
      })
      return;
    }
    const result = riskAttack(attackerTerritory.troops, defenderTerritory.troops)
    rooms[roomIndex].players[attackerTerritory.owner].troopsLost += result.attackerTroopsLost;
    rooms[roomIndex].players[attackerTerritory.owner].troopsKill += result.defenderTroopLost;

    rooms[roomIndex].players[defenderTerritory.owner].troopsLost += result.defenderTroopLost;
    rooms[roomIndex].players[defenderTerritory.owner].troopsKill += result.attackerTroopsLost;

    rooms[roomIndex].board.territories[attackerTerritoryIndex].troops = result.attackerTroops;
    rooms[roomIndex].board.territories[defenderTerritoryIndex].troops = result.defenderTroops;

    if (result.defenderTroops > 0) {
      //The defender survives
      socket.emit('attack-response', {
        success: true,
        defeat: false,
        attackerID: req.attackerID,
        defenderID: req.defenderID,
        attackerTroops: result.attackerTroops,
        defenderTroops: result.defenderTroops,
        attackerDice: result.attackerDice,
        defenderDice: result.defenderDice
      })

      io.to(room.roomCode).emit('map-update-notification', {
        players: removeKeyFromArray(room.players, 'cards'),
        roomCode: room.roomCode,
        currentPlayerIndex: room.currentPlayerIndex,
        board: room.board,
        state: room.state,
      })
    } else {
      //The attacker wins
      rooms[roomIndex].state = 'post-attack-fortify';
      rooms[roomIndex].postAttackPair = {attackerID: req.attackerID, defenderID: req.defenderID}
      rooms[roomIndex].attackRecorded = true;
      socket.emit('attack-response', {
        success: true,
        defeat: true,
        attackerID: req.attackerID,
        defenderID: req.defenderID,
        attackerTroops: result.attackerTroops,
        defenderTroops: result.defenderTroops,
        attackerDice: result.attackerDice,
        defenderDice: result.defenderDice
      })
    }
  })

  //Format of req JSON
  // {
  //   roomCode: string,
  //   attackerID: int,
  //   defenderID: int,
  //   attackerTroops: int,
  //   defenderTroops: int,
  // }
  socket.on('post-attack-fortify-request', req => {
    let roomIndex = getRoomIndexByRoomCode(req.roomCode);
    if (roomIndex === -1) {
      socket.emit('post-attack-fortify-response', {
        success: false,
        reason: 'RoomCode not found.'
      })
      return;
    }
    const room = rooms[roomIndex];
    if (room.players[room.currentPlayerIndex].socketID !== socket.id || room.state !== 'post-attack-fortify') {
      socket.emit('post-attack-fortify-response', {
        success: false,
        reason: 'You have no permission to perform post attack fortify.'
      })
      return;
    }
    if (req.attackerID !== room.postAttackPair.attackerID || req.defenderID !== room.postAttackPair.defenderID) {
      socket.emit('post-attack-fortify-response', {
        success: false,
        reason: 'You have no permission to perform post attack fortify.'
      })
      return;
    }
    const attackerTerritoryIndex = room.board.territories.findIndex(territory => territory.id == req.attackerID);
    const defenderTerritoryIndex = room.board.territories.findIndex(territory => territory.id == req.defenderID);
    const attackerTerritory = room.board.territories.find(territory => territory.id == req.attackerID);
    const defenderTerritory = room.board.territories.find(territory => territory.id == req.defenderID);

    if ((attackerTerritory.troops + defenderTerritory.troops) !== (req.attackerTroops + req.defenderTroops) || req.attackerTroops <= 0 || req.defenderTroops <= 0) {
      console.log(attackerTerritory.troops, defenderTerritory.troops, req.attackerTroops, req.defenderTroops)
      socket.emit('post-attack-fortify-response', {
        success: false,
        reason: 'Invalid troops distribution.'
      })
      return;
    }

    socket.emit('post-attack-fortify-response', {
      success: true,
    })

    rooms[roomIndex].board.territories[attackerTerritoryIndex].troops = req.attackerTroops;
    rooms[roomIndex].board.territories[defenderTerritoryIndex].troops = req.defenderTroops;
    rooms[roomIndex].board.territories[attackerTerritoryIndex].owner = room.currentPlayerIndex;
    rooms[roomIndex].board.territories[defenderTerritoryIndex].owner = room.currentPlayerIndex;

    if (areAllLandsOwnedByOnePlayer(room.board)) {
      rooms[roomIndex].state = 'end';
      io.to(room.roomCode).emit('end-game-notification', {
        players: removeKeyFromArray(room.players, 'cards'),
        roomCode: room.roomCode,
        winner: room.currentPlayerIndex,
        board: room.board,
        state: room.state,
        round: room.round,
        duration: new Date() - room.beginTime,
      })
      // rooms.splice(roomIndex, 1);
      return;
    }

    rooms[roomIndex].state = 'attack';

    io.to(room.roomCode).emit('map-update-notification', {
      players: removeKeyFromArray(room.players, 'cards'),
      roomCode: room.roomCode,
      currentPlayerIndex: room.currentPlayerIndex,
      board: room.board,
      state: room.state,
    })


  })

  socket.on('replay-request', req => {
    let roomIndex = getRoomIndexByRoomCode(req.roomCode);
    if (roomIndex === -1) {
      socket.emit('replay-response', {
        success: false,
        reason: 'RoomCode not found.'
      })
      return;
    }
    const room = rooms[roomIndex];
    if (room.state !== 'end') {
      socket.emit('replay-response', {
        success: false,
      })
      return;
    }
    let player = room.players.find(player => player.socketID === socket.id);
    player.replayRequest = true;
    let restart = true;
    for (const player of room.players) {
      if (!player.replayRequest)
        restart = false;
    }

    if (restart) {
      socket.emit('replay-response', {
        success: true,
        waiting: true,
      })

      let board = initializeBoard(maps[0]);
      for (let i = 0; i < room.players.length; i++) {
        let player = room.players[i];
        player.cards = [];
        player.troopsLost = 0;
        player.troopsKill = 0;
        player.replayRequest = false;
        player.troopsReceived = board.territories.filter(territory => territory.owner === i)
            .map(territory => territory.troops)
            .reduce((accumulator, currentValue) => accumulator + currentValue, 0)
      }

      room.board = board;
      room.currentPlayerIndex = 0;
      room.state = 'draft';
      room.attackRecorded = false;
      room.beginTime = new Date();
      room.round = 1;
      room.draftTroops = calculateDraftTroops(room.board, room.currentPlayerIndex)

      room.players[room.currentPlayerIndex].troopsReceived += room.draftTroops;

      io.to(room.roomCode).emit('game-start-notification', {
        players: removeKeyFromArray(room.players, 'cards'),
        roomCode: room.roomCode,
        currentPlayerIndex: room.currentPlayerIndex,
        board: room.board,
        state: room.state,
      })

      io.to(room.players[room.currentPlayerIndex].socketID).emit('draft-notification', {
        players: removeKeyFromArray(room.players, 'cards'),
        roomCode: room.roomCode,
        currentPlayerIndex: room.currentPlayerIndex,
        board: room.board,
        state: room.state,
        draftTroops: room.draftTroops
      })
    } else {
      socket.emit('replay-response', {
        success: true,
        waiting: true,
      })
    }
  })

  socket.on('finish-attack-request', req => {
    let roomIndex = getRoomIndexByRoomCode(req.roomCode);
    if (roomIndex === -1) {
      socket.emit('post-attack-fortify-response', {
        success: false,
        reason: 'RoomCode not found.'
      })
      return;
    }
    const room = rooms[roomIndex];
    if (room.players[room.currentPlayerIndex].socketID !== socket.id || room.state !== 'attack') {
      socket.emit('finish-attack-response', {
        success: false,
        reason: 'You have no permission to finish the attack phase.'
      })
      return;
    }
    rooms[roomIndex].state = 'fortify';
    socket.emit('finish-attack-response', {
      success: true,
    })
    io.to(room.roomCode).emit('map-update-notification', {
      players: removeKeyFromArray(room.players, 'cards'),
      roomCode: room.roomCode,
      currentPlayerIndex: room.currentPlayerIndex,
      board: room.board,
      state: room.state,
    })
  })
  //Format of req JSON
  // {
  //   roomCode: string,
  //   fromID: int,
  //   toID: int,
  //   fortifyTroops: int,
  // }
  socket.on('fortify-request', req => {
    let roomIndex = getRoomIndexByRoomCode(req.roomCode);
    if (roomIndex === -1) {
      socket.emit('fortify-response', {
        success: false,
        reason: 'RoomCode not found.'
      })
      return;
    }
    const room = rooms[roomIndex];
    if (room.players[room.currentPlayerIndex].socketID !== socket.id || room.state !== 'fortify') {
      socket.emit('fortify-response', {
        success: false,
        reason: 'You have no permission to perform fortify.'
      })
      return;
    }
    if (!(req.fromID == -1 && req.toID == -1)) {
      const fromTerritoryIndex = room.board.territories.findIndex(territory => territory.id == req.fromID);
      const toTerritoryIndex = room.board.territories.findIndex(territory => territory.id == req.toID);
      const fromTerritory = room.board.territories.find(territory => territory.id == req.fromID);
      const toTerritory = room.board.territories.find(territory => territory.id == req.toID);
      if (fromTerritory.owner !== room.currentPlayerIndex || toTerritory.owner !== room.currentPlayerIndex) {
        socket.emit('fortify-response', {
          success: false,
          reason: 'You do not own the requested territory.'
        })
        return;
      }
      if (fromTerritory.troops - req.fortifyTroops < 1) {
        socket.emit('fortify-response', {
          success: false,
          reason: 'You do not have enough troops to fortify.'
        })
        return;
      }

      if (!isConnected(room.board, req.fromID, req.toID, room.currentPlayerIndex)) {
        socket.emit('fortify-response', {
          success: false,
          reason: 'The two lands are not connected.'
        })
        return;
      }

      rooms[roomIndex].board.territories[fromTerritoryIndex].troops -= req.fortifyTroops;
      rooms[roomIndex].board.territories[toTerritoryIndex].troops += req.fortifyTroops;
    }

    if (rooms[roomIndex].attackRecorded) {
      const card = drawRandomCard(cardTypes);
      rooms[roomIndex].players[rooms[roomIndex].currentPlayerIndex].cards.push(card);
      socket.emit('update-cards-notification', {
        cards: room.players[room.currentPlayerIndex].cards
      })
    }

    rooms[roomIndex].state = 'draft';
    rooms[roomIndex].attackRecorded = false;
    rooms[roomIndex].currentPlayerIndex = (rooms[roomIndex].currentPlayerIndex + 1) % playerLimit;
    if (rooms[roomIndex].currentPlayerIndex === 0) {
      rooms[roomIndex].round += 1;
    }
    rooms[roomIndex].draftTroops = calculateDraftTroops(room.board, room.currentPlayerIndex);
    rooms[roomIndex].players[room.currentPlayerIndex].troopsReceived += room.draftTroops;
    socket.emit('fortify-response', {
      success: true,
    })
    io.to(room.roomCode).emit('map-update-notification', {
      players: removeKeyFromArray(room.players, 'cards'),
      roomCode: room.roomCode,
      currentPlayerIndex: room.currentPlayerIndex,
      board: room.board,
      state: room.state,
    })
    io.to(room.players[room.currentPlayerIndex].socketID).emit('draft-notification', {
      players: removeKeyFromArray(room.players, 'cards'),
      roomCode: room.roomCode,
      currentPlayerIndex: room.currentPlayerIndex,
      board: room.board,
      state: room.state,
      draftTroops: room.draftTroops
    })
  })
});

// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
  console.log('The chat server has started...');
});
