const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const app = express();
const httpserver = http.createServer(app);

app.use(cors());

const io = new Server(httpserver, {
    cors: {
        origin: "http://localhost:5000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const words = [
    "ant", "ball", "coin", "duck", "echo", "fish", "game", "hat",
    "isle", "jazz", "kite", "leaf", "moon", "nose", "open", "pear",
    "quiz", "rose", "star", "time", "user", "vase", "wind", "yoga",
    "zest", "arch", "blow", "clap", "drum", "edge", "frog", "glow",
    "horn", "idea", "joke", "knob", "loop", "mood", "nail", "olive",
    "palm", "quest", "rest", "sail", "teal", "unit", "vibe", "wave",
    "xray", "yarn", "zone", "aqua", "bark", "code", "dove", "eagle",
    "fire", "giraffe", "hope", "iron", "jade", "leaf", "mint", "note",
    "orange", "path", "quiz", "rose", "snow", "tree", "under", "view",
    "yoga", "zoo", "apple", "brisk", "climb", "dance", "event", "flock", "glide", "heart",
    "input", "jolly", "knack", "lunar", "magic", "night", "ocean", "pride",
    "quilt", "relay", "shine", "trail", "ultra", "vivid", "whale", "yield",
    "zebra", "angel", "bloom", "creek", "dwarf", "flame", "globe", "honey",
    "index", "jewel", "latch", "mirth", "noble", "orbit", "phase", "quest",
    "ridge", "sheep", "track", "utter", "valve", "wrist", "youth", "zesty",
    "amber", "blend", "crisp", "dodge", "feast", "grape", "hatch", "ivory",
    "joker", "lemon", "mango", "nerve", "oasis", "petal", "quick", "raven",
    "spear", "thorn", "urban", "vista", "wafer", "xenon", "yearn", "zonal", "ability", "balloon", "capture", "decline", "economy", "faculty",
    "gallery", "harmony", "imagine", "journey", "kitchen", "library",
    "meeting", "network", "outline", "payment", "quality", "respect",
    "session", "trainer", "utility", "victory", "welcome", "yellow",
    "zealous", "afflict", "balance", "capital", "default", "example",
    "freight", "glacier", "holiday", "insight", "justice", "kidneys",
    "luggage", "mission", "natural", "options", "pattern", "quarter",
    "resolve", "society", "therapy", "uncover", "veteran", "western",
    "zealots"
];

let usercount = 0;
let roomno = 1;
let full = 0;
let users = {};
let scorechart = {};
let prevWord = "";
let actualWord;
//generating random words
function randomNum() {
    const randomInd = Math.floor(Math.random() * words.length);
    if (words[randomInd] === prevWord) randomNum();//make sure words never repeat
    let word = words[randomInd];
    actualWord = word;
    function jumbleWord(word) {
        let arr = word.split('');
        for (let i = arr.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]]
        }
        let jword = arr.join('');
        if (jword === word) jumbleWord(word);
        return jword;
    }
    return jumbleWord(word);
}

let newWord = randomNum();
prevWord = newWord;
//timer

let timer;
let isTimer = false;
function gameTimer() {
    let time = 60;
    clearInterval(timer);
    timer = setInterval(() => {
        if (time === 0) {
            time = 60;
            io.emit('timer', time);
            newWord = randomNum();
            io.emit('newword', newWord);
        }
        time = time - 1;
        io.emit('timer', time);
        return (() => clearInterval(timer));
    }, 1000)
}
//socket connection
io.on('connection', socket => {
    let score = 0;
    console.log("Userjoined");
    socket.on('setuser', (data) => {//getting user name
        users[socket.id] = data;
        scorechart[users[socket.id]] = 0;
        usercount++;
        io.emit('usercount', usercount);
        io.emit('newword', newWord);
        io.emit('list', users);
        io.emit('newscore', scorechart);
        socket.broadcast.emit('newplayer', data);
        console.log(scorechart);
        if (!isTimer && usercount > 1) {

            gameTimer();
            isTimer = true;
        }
    });

    socket.emit('newusercount', socket.id + 'has joined');
    //message
    socket.on('newmsg', text => {
        io.emit('newmsg', { msg: text, name: users[socket.id] });
        if (text === actualWord) {
            io.emit('correct', { name: users[socket.id], status: true });
            score++;
            scorechart[users[socket.id]] = score;
            io.emit('newscore', scorechart);
            if (score === 10) {
                io.emit('winner', { name: users[socket.id], status: true });
            }
            newWord = randomNum();
            io.emit('newword', newWord);
            gameTimer();
        }
    });
    socket.on('disconnect', () => {
        console.log("user left");
        if (users[socket.id] !== undefined)
            io.emit('userleft', `L${users[socket.id]} left the game`);
        if (usercount > 0) usercount--;
        if (usercount < 1) {
            clearInterval(timer);
            isTimer = false;
        }
        if (users[socket.id]) {
            delete scorechart[users[socket.id]];
            delete users[socket.id];
        }
        io.emit('usercount', usercount);

    })
})
httpserver.listen(3000, () => {
    console.log("SERVER CONNECTED on port 3000!");
});
