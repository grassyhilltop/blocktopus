var io = null;

exports.setup = function(passedIO){
	io = passedIO;
	io.on('connection', function(socket){
    	socket.emit('message', {'message': 'hello world'});
	});
};

exports.sendMidiToClient = function(blockID,msg){
	io.emit('midiMsg', {'msg': msg,'blockID':blockID});
};

exports.sendBlockListToClient = function(blockList) {
	io.emit('blockList', {'blockList':blockList});
};

exports.sendOutputValToClient = function(blockID,val){
	io.emit('codeBlockVal', {'blockID':blockID,'val': val});
};
