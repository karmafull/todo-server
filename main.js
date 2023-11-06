const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');

const jwt = require('jsonwebtoken');
require("dotenv").config();

app.get('/', (req, res) => {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    return res.send(data);
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(token == null) { return res.sendStatus(401); }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if(err) { return res.sendStatus(403); }
        req.user = user;
        next();
    });
}

app.get('/tasks', authenticateToken, (req, res) => {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    const user = data.find(user => user.username === req.user.user.username);
    return res.send(user.tasks);
});

app.get('/tasks/:id', authenticateToken, (req, res) => {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    const user = data.find(user => user.username === req.user.user.username);
    const task = user.tasks.find(task => parseInt(task.id) === parseInt(req.params.id));
    return res.send(task);
});

app.post('/tasks', authenticateToken, (req, res) => {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    const user = data.find(user => user.username === req.user.user.username);
    const task = {
        id: user.tasks.length + 1,
        desc: req.query.desc,
        done: false
    };
    user.tasks.push(task);
    fs.writeFileSync('data.json', JSON.stringify(data, null, 4));
    return res.send(task);
});

app.put('/tasks/:id', authenticateToken, (req, res) => {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    const user = data.find(user => user.username === req.user.user.username);
    const task = user.tasks.find(task => parseInt(task.id) === parseInt(req.params.id));
    task.desc = req.query.desc;
    if(req.query.done) { task.done = req.query.done; }
    fs.writeFileSync('data.json', JSON.stringify(data, null, 4));
    return res.send(task);
});

app.delete('/tasks/:id', authenticateToken, (req, res) => {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    const user = data.find(user => user.username === req.user.user.username);
    const task = user.tasks.find(task => parseInt(task.id) === parseInt(req.params.id));
    const index = user.tasks.indexOf(task);
    user.tasks.splice(index, 1);
    fs.writeFileSync('data.json', JSON.stringify(data, null, 4));
    return res.send(task);
});

app.post('/login', (req, res) => {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

    var details = [
        req.query.username,
        req.query.password
    ]

    const user = data.find(user => user.username === details[0] && user.password === details[1]);

    if(!user) { return res.send('Invalid username or password'); }

    const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET);
    return res.send(accessToken);
});

app.post('/register', (req, res) => {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

    var details = [
        req.query.username,
        req.query.password
    ]

    const user = data.find(user => user.username === details[0]);

    if(user) { return res.send('Username already exists'); }

    const newUser = {
        username: details[0],
        password: details[1],
        tasks: []
    };

    data.push(newUser);
    fs.writeFileSync('data.json', JSON.stringify(data, null, 4));
    return res.send(newUser);
});

app.delete('/users/:username', authenticateToken, (req, res) => {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    const user = data.find(user => user.username === req.params.username);
    if(user.username !== req.user.user.username) { res.send('You can only delete your own account'); return; }
    const index = data.indexOf(user);
    data.splice(index, 1);
    fs.writeFileSync('data.json', JSON.stringify(data, null, 4));
    return res.send(user);
});


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
    }
);
