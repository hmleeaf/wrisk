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

// Use the session middleware to maintain sessions
const chatSession = session({
  secret: 'game',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { maxAge: 300000 },
});
app.use(chatSession);

// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
  return /^\w+$/.test(text);
}

// Handle the /register endpoint
app.post('/register', (req, res) => {
  // Get the JSON data from the body
  const { username, avatar, name, password } = req.body;

  //
  // D. Reading the users.json file
  //
  const users = JSON.parse(fs.readFileSync('data/users.json'));

  //
  // E. Checking for the user data correctness
  //
  if (username === '') {
    res.json({ status: 'error', error: 'Username cannot be empty.' });
    return;
  }
  if (avatar === '') {
    res.json({ status: 'error', error: 'Avatar cannot be empty.' });
    return;
  }
  if (name === '') {
    res.json({ status: 'error', error: 'Name cannot be empty.' });
    return;
  }
  if (password === '') {
    res.json({ status: 'error', error: 'Password cannot be empty.' });
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
  users[username] = { avatar, name, password: hash };

  //
  // H. Saving the users.json file
  //
  fs.writeFileSync('data/users.json', JSON.stringify(users, null, ' '));

  //
  // I. Sending a success response to the browser
  //
  res.json({ status: 'success' });
});

// Handle the /signin endpoint
app.post('/signin', (req, res) => {
  // Get the JSON data from the body
  const { username, password } = req.body;

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
    res.json({ status: 'error', error: 'Invalid username or password.' });
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
  res.json({ status: 'success', user });
});

// Handle the /validate endpoint
app.get('/validate', (req, res) => {
  //
  // B. Getting req.session.user
  //
  const { user } = req.session;

  //
  // D. Sending a success response with the user account
  //
  if (user) res.json({ status: 'success', user });
  else res.json({ status: 'error', error: 'No sessions exist.' });
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
  res.json({ status: 'success' });
});

// setup Socket.io server
const { createServer } = require('http');
const { Server } = require('socket.io');
const httpServer = createServer(app);
const io = new Server(httpServer);

// initialize empty online users
const onlineUsers = {};

let waitingArea = [];

let rooms = [];

const playerLimit = 2;

const maps = [{
  territories: [
    {
      id: 0,
      neighbours: [1, 6, 13]
    },
    {
      id: 1,
      neighbours: [0, 2]
    },
    {
      id: 2,
      neighbours: [1, 3]
    },
    {
      id: 3,
      neighbours: [2, 4, 5]
    },
    {
      id: 4,
      neighbours: [3, 18]
    },
    {
      id: 5,
      neighbours: [3, 10]
    },
    {
      id: 6,
      neighbours: [0, 8]
    },
    {
      id: 7,
      neighbours: [8, 9]
    },
    {
      id: 8,
      neighbours: [6, 7, 9, 13]
    },
    {
      id: 9,
      neighbours: [7, 8, 10, 13, 15]
    },
    {
      id: 10,
      neighbours: [5, 9, 11]
    },
    {
      id: 11,
      neighbours: [10, 12, 15]
    },
    {
      id: 12,
      neighbours: [11, 17]
    },
    {
      id: 13,
      neighbours: [0, 8, 9, 14]
    },
    {
      id: 14,
      neighbours: [13, 15, 16]
    },
    {
      id: 15,
      neighbours: [9, 11, 14, 16]
    },
    {
      id: 16,
      neighbours: [14, 15, 17, 18]
    },
    {
      id: 17,
      neighbours: [12, 16, 18]
    },
    {
      id: 18,
      neighbours: [4, 16, 17]
    }
  ],
  continents: [
    {
      name: 'asia', territories: [13, 14, 15, 16]
    },
    {
      name: 'australia',
      territories: [17, 18]
    },
    {
      name: 'europe',
      territories: [7, 8, 9]
    },
    {
      name: 'africa',
      territories: [10, 11, 12]
    },
    {
      name: 'north america',
      territories: [0, 1, 2]
    },
    {
      name: 'south america',
      territories: [3, 4, 5]
    }
  ]


}]

const generateRandomRoomCode = () => {
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
  for (let i = 0; i < rooms.length; i++){
    if (rooms[i].roomCode === roomCode){
      return i;
    }
  }
  return roomIndex;
}

const initializeBoard = map => {
  let n = playerLimit;
  let t = Math.floor((map.territories.length * 1.8)/ n );
  const shuffledTerritories = shuffleArray([...map.territories]);
  const userTerritories = Array.from({ length: n }, () => []);

  for (let i = 0; i < shuffledTerritories.length; i++) {
    const userIndex = i % n;
    userTerritories[userIndex].push(shuffledTerritories[i].id);
  }

  const updatedTerritories = map.territories.map(territory => {
    const owner = userTerritories.findIndex(userTerritoryIds =>
        userTerritoryIds.includes(territory.id)
    );
    return { ...territory, owner };
  });

  const territoriesWithTroops = distributeTroops(updatedTerritories, userTerritories, t);

  return { ...map, territories: territoriesWithTroops };
}

function distributeTroops(territories, userTerritories, t) {
  const territoriesWithTroops = territories.map(territory => ({ ...territory, troops: 1 }));

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
    const newObj = { ...obj };
    delete newObj[key];
    return newObj;
  });
}

//test
console.log(initializeBoard(maps[0]))

// use session
io.use((socket, next) => {
  chatSession(socket.request, {}, next);
});

io.on('connection', (socket) => {
  // add user to online
  const user = socket.request.session.user;
  if (user) {
    onlineUsers[user.username] = { avatar: user.avatar, name: user.name };
    io.emit('add user', JSON.stringify(user));
  }

  // delete user on disconnect
  socket.on('disconnect', () => {
    if (user) {
      delete onlineUsers[user.username];
      io.emit('remove user', JSON.stringify(user));
    }
  });

  socket.on('get users', () => {
    socket.emit('users', JSON.stringify(onlineUsers));
  });

  // 1. User send 'join-waiting-area-request' to join the waiting area
  // 2. If the waiting area have sufficient players, it will create a room signal the players that are being added with 'game-start-notification'
  // 3. If the waiting room does not have sufficient players, it will signal the requested socket with join-waiting-area-request'
  socket.on('join-waiting-area-request', () => {
    waitingArea.push({user, socketID: socket.id});
    console.log(`User ${user.name} has joined the waiting room.`)
    if (waitingArea.length >= playerLimit) {
      let players = waitingArea.splice(0, playerLimit).map(player => {return {...player, cards: []}});
      const roomCode = generateRandomRoomCode();
      for (const player of players) {
        io.sockets.sockets.get(player.socketID).join(roomCode);
      }
      rooms.push({
        players,
        roomCode,
        currentPlayerIndex: 0,
        board: initializeBoard(maps[0]),
        state: 'draft'
      })
      const room = rooms[getRoomIndexByRoomCode(roomCode)];
      socket.to(roomCode).emit('game-start-notification', {
        players: removeKeyFromArray(room.players, 'cards'),
        roomCode: room.roomCode,
        currentPlayerIndex: room.currentPlayerIndex,
        board: room.board,
        state: room.state
      })
      console.log(`Room ${room.roomCode} has started a game.`)
    } else {
      socket.emit('join-waiting-area-request', {success: true, message: 'Please wait for other players.'})
    }
  })
});

// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
  console.log('The chat server has started...');
});
