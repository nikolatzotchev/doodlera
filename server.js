var express = require('express');
var fs		= require('fs');
var path 	= require('path');
var app 	= express();
var pg = require('pg');
var http	= require('http').Server(app);
var io		= require('socket.io')(http);
var port	= process.env.PORT || 3000;
var words	= [];

process.setMaxListeners(0);

app.use("/", express.static(__dirname));

const connectionString = process.env.DATABASE_URL || "postgres://postgres:root@localhost:5432/doodlera";

var time = 60;

fs.readFile('./words.txt', "utf-8", function (err, data) {
  if (err) throw err;
	words = data.split('\n');
});

const client = new pg.Client(connectionString);
client.connect();

const query = client.query(
  'CREATE TABLE IF NOT EXISTS doodlera_schema.doodlera_table (id SERIAL PRIMARY KEY, name VARCHAR(40) not null, points integer DEFAULT 0)');
query.on('end', () => { client.end(); });

setInterval( function() {
	if (playercount != 0) {
				
		if (time == 60)
			currentword = words[Math.floor(Math.random() * 499)];
		
		io.emit('updateTimer', time, currentword);
		
		time = time - 1;
		if (time == 0)
			time = 75;
	}
}, 1000);

var playercount = 0;

io.sockets.on('connection', function(socket){
	
	const results = [];

	var socketid;
	var name;
	var exists = false;
	
	socket.on('chosenname', function(name){
		pg.connect(connectionString, (err, client, done) => {
			// Handle connection errors
			if(err) {
			  done();
			  console.log(err);
			}
			
			const query = client.query('SELECT * FROM doodlera_schema.doodlera_table WHERE name = $1', [name], function(err, result) 
			{
				if (!(typeof result !== 'undefined' && result))
				{
					socketid = result.rows[0].id;
					playercount = playercount + 1;
				}
				else
				{
					client.query('INSERT INTO doodlera_schema.doodlera_table (name) values($1) ON CONFLICT DO NOTHING RETURNING id', [name], function(err, results) {
						if(err) 
						{
							done()
							console.log(err);//handle error
						}
						else 
						{
							socketid = results.rows[0].id;
							playercount = playercount + 1;
						}
					});
				}
			});

			query.once('end', () => {
			  done();
			});
		});
  });
	
	socket.on('chat message', function(name, msg){
		if (msg == "!points")
		{
		pg.connect(connectionString, (err, client, done) => {
			// Handle connection errors
			if(err) {
			  done();
			  console.log(err);
			}
			
			const query = client.query('SELECT * FROM doodlera_schema.doodlera_table WHERE name = $1 LIMIT 1', [name]);
			// Stream results back one row at a time
			query.on('row', (row) => {
				io.emit('chat message',null,'' + name + ' has ' + row.points + ' points.');
			});
			
			// After all data is returned, close connection and return results
			query.once('end', () => {
			  done();
			});
		});
		}
		io.emit('chat message', name, msg);
	});
	
	socket.on('queuedrawing', function(image, name){
		io.emit('queuedrawing', image, name);
	});
	
	socket.on('winner', function(voter,winner){
		pg.connect(connectionString, (err, client, done) => {
		// Handle connection errors
		if(err) {
		  done();
		  console.log(err);
		}
		
		io.emit('chat message', null, '' + voter + " voted for " + winner + "!");
		// SQL Query > Insert Data
		client.query('UPDATE doodlera_schema.doodlera_table SET points = points + 1 WHERE name = $1', [name]);
		
		// After all data is returned, close connection and return results
		query.once('end', () => {
		  done();
		});
		});
	});
	
	socket.on('disconnect', function(){
		pg.connect(connectionString, (err, client, done) => {
			// Handle connection errors
			if(err) {
			  done();
			  console.log(err);
			}

			// SQL Query > Select Data
			const query = client.query('SELECT * FROM doodlera_schema.doodlera_table WHERE id = $1', [socketid]);
			// Stream results back one row at a time
			query.on('row', (row) => {
			  	io.emit('chat message',null,'' + row.name.replace(/`/g , "") + ' disconnected.');
				playercount = playercount - 1;
			});

			// After all data is returned, close connection and return results
			query.once('end', () => {
			  done();
			});
		});
	});
});


http.listen(port, function(){
  console.log('listening on *:' + port);
});
