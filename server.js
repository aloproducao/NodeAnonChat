var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var queue = [];
var pairs = [];

app.get('*', function(req, res){

	res.sendFile(__dirname + '/web/' + req.url);
})

io.on('connection', function(client){

	client.on('pair', function(message){

		if(!isClientInQueue(client.id) && !getClientPair(client.id)){

			queue.push(client.id);
		}

		findPair();
	});

	client.on('message', function(message){
		
		sendToPair(client.id, 'message', message);
	});

	client.on('unpair', function(message){

		unpairClient(client.id);
	});

	client.on('disconnect', function(){

		unpairClient(client.id);
	});
});

http.listen(9000, function(){

	console.log('Http server started');
});

function findPair(){

	if(queue.length > 1){

		pairClients(queue[0], queue[1]);
	}
}

function pairClients(client, client2){

	pairs.push([client, client2]);
	queue.splice(0, 2);

	sendToPair(client, 'clear');
	sendToPair(client, 'paired');
}

function unpairClient(client){

	var pair = getClientPair(client);

	if(!pair){

		return;
	}

	if(pair[0] == client){

		io.to(pair[1]).emit('unpaired');
	}
	else{

		io.to(pair[0]).emit('unpaired');
	}

	removePair(pair);
}

function sendToPair(client, type, message){

	var pair = getClientPair(client);

	if(!pair){

		return;
	}

	if(type != 'message'){

		io.to(pair[0]).emit(type, message);
		io.to(pair[1]).emit(type, message);
		return;
	}

	if(pair[0] == client){

		io.to(pair[0]).emit(type, 'You: ' + message);
		io.to(pair[1]).emit(type, 'Stranger: ' + message);
	}
	else{

		io.to(pair[0]).emit(type, 'Stranger: ' + message);
		io.to(pair[1]).emit(type, 'You: ' + message);
	}		
}

function getClientPair(client){

	for(var i = 0; i < pairs.length; i++){

		if(pairs[i].indexOf(client) > -1){

			return pairs[i];
		}
	}

	return false;
}

function isClientInQueue(client){

	if(queue.indexOf(client) > -1){

		return true;
	}

	return false;
}

function removePair(pair){

	var pairIndex = pairs.indexOf(pair);
	pairs.splice(pairIndex, 1);
}