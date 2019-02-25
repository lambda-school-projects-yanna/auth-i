const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcrypt');
const Users = require('./users/users-module.js');
const db = require('./database/dbConfig.js');

const server = express();
server.use(helmet());
server.use(express.json());
server.use(cors());

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

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`\n**** Running on port ${port} ****\n`));