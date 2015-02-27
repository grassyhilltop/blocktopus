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

exports.sendOutputValToClient = function(blockID,val,fromBlockID,msg){
	io.emit('codeBlockVal', {'blockID':blockID,'val': val,'fromBlockID':fromBlockID,'msg':[msg[0],msg[1],msg[2]]});
};

exports.sendCodeBlockErrorToClient = function(blockID,error){
	io.emit('codeBlockErr', {'blockID':blockID,'error': error});
};

