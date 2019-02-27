const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcrypt');
const Users = require('./users/users-module.js');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);
const db = require('./database/dbConfig.js');

const server = express();

const sessionConfig = {
  name: 'randosquirrel',
  secret: 'shush shush',
  cookie: {
    maxAge: 1000 * 60 * 60, // in ms = an hour
    secure: false,
  },
  httpOnly: true,
  resave: false,
  saveUninitialized: false,
  store: new KnexSessionStore ({
    knex: db,
    tablename: 'sessions',
    sidfieldname: 'sid',
    createTable: true,
    clearInterval: 1000 * 60 * 60
  }),
};

server.use(helmet());
server.use(express.json());
server.use(cors());
server.use(session(sessionConfig));

// =========== Endpoints ========== \\

server.get('/api', (req, res) => {
    res.send('API running.');
});

server.post('/api/register', (req, res) => {
    let user = req.body;
    // generate hash from user's password
    const hash = bcrypt.hashSync(user.password, 10); 
    // override user.password with hash
    user.password = hash;

    Users.add(user)
    .then(newUser => {
      res.status(201).json(newUser);
    })
    .catch(error => {
        res.status(500).json(error);
    });
});

server.post('/api/login', (req, res) => {
    let {username, password} = req.body;
    Users.findBy({username})
    .first()
    .then(user => {
      req.session.user = user;
      if (user && bcrypt.compareSync(password, user.password)) {
        res.status(200).json({ message: `Welcome ${user.username}! We've got a cookie for you.` });
      } else {
        res.status(401).json({ message: 'You shall NOT pass!' });
      }
    })
    .catch(error => {
        res.status(500).json(error);
    });
});

// Restricted Middleware \\

/*

function restricted(req, res, next) {
    const { username, password } = req.headers;
  
    if (username && password) {
      Users.findBy({ username })
        .first()
        .then(user => {
          if (user && bcrypt.compareSync(password, user.password)) {
            next();
          } else {
            res.status(401).json({ message: 'You shall NOT pass!' });
          }
        })
        .catch(error => {
          res.status(500).json({ message: 'Ran into an unexpected error' });
        });
    } else {
      res.status(400).json({ message: 'No credentials provided' });
    }
}
*/

restricted = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({message: 'Heathen, you shall NOT pass!'})
  }
};

// ==== axios.get(url, { headers: { username, password } }); === \\

server.get('/api/restricted/users', restricted, (req, res) => {
    Users.find()
    .then(users => {res.json(users)})
    .catch(err => res.send(err));
});

/*

server.get('/api/restricted/users', restricted, (req, res) => {
    Users.find()
    .then(users => {res.json(users)})
    .catch(err => res.send(err));
});

*/

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`\n**** Running on port ${port} ****\n`));