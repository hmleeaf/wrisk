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

  socket.on('get messages', () => {
    const chatroom = JSON.parse(fs.readFileSync('data/chatroom.json'));
    socket.emit('messages', JSON.stringify(chatroom));
  });

  socket.on('post message', (content) => {
    const message = { user, datetime: new Date(), content };
    const chatroom = JSON.parse(fs.readFileSync('data/chatroom.json'));
    chatroom.push(message);
    fs.writeFileSync('data/chatroom.json', JSON.stringify(chatroom, null, ' '));

    io.emit('add message', JSON.stringify(message));
  });

  socket.on('start typing', () => {
    io.emit('user typing', JSON.stringify(user));
  });
});

// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
  console.log('The chat server has started...');
});
