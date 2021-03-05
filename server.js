const express = require('express');
const socketIO = require('socket.io');

const port = process.env.PORT || 3000;
const index = '/index.html';
const server = express().use((req, res) => {
	res.sendFile(index, { root: __dirname})
}).listen(port, () => console.log('Server started at port 3000'))

const io = socketIO(server);

let users = [];
let timeout = null;
let currentPlayer = null;

io.on('connection', (socket) =>{
	console.log('A new user joined the game');

	socket.on('username', (username) =>{
		console.log(username);
		socket.username = username;

		if(users.length ===0){
			currentPlayer = socket;
			users.push(socket);
			switchPlayer();
		}else{
			users.push(socket);
		}
		
		sendUsers();
	})

	socket.on('disconnect', () =>{
		console.log(`${socket.username} has left the game`)

		users = users.filter((user) =>{
			return user !== socket;
		});
		sendUsers();
		if(users.length === 0){
			timeout = clearTimeout(timeout);
		}
	});

	socket.on('line', (data) =>{
		socket.broadcast.emit('line', data);
	});

});
function sendUsers(){
	io.emit('users', users.map((user) =>{
		return{
			username: user.username,
			active: user === currentPlayer
		}
	}));
}
var words=["salut", "commentva?", 'bienoubien']
function switchPlayer(){
	const indexCurrentPlayer = users.indexOf(currentPlayer);
	currentPlayer = users[(indexCurrentPlayer + 1) % users.length]
	// Apres le dernier joueur on retourne au premier
	sendUsers();
	
	const nextWord = words[Math.floor(Math.random()* words.length)];
	currentPlayer.emit('word', nextWord);
	io.emit('clear')
	timeout = setTimeout(switchPlayer, 15000);

}