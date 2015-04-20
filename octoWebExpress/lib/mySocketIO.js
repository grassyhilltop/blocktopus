var io = null;

exports.setup = function(passedIO){
	io = passedIO;
	io.on('connection', function(socket){
    	socket.emit('message', {'message': 'hello world'});
	});
};

exports.sendMidiToClient = function(blockID,msgDict){
	io.emit('midiMsg', {'msgDict':msgDict,'msg': msgDict['msg'],'blockID':blockID});
};

exports.sendBlockListToClient = function(blockList) {
	io.emit('blockList', {'blockList':blockList});
};

exports.sendOutputValToClient = function(blockID,val,fromBlockID,msgDict){
	var msg = msgDict['msg'];
	
	io.emit('codeBlockVal', {'blockID':blockID,'val': val,'fromBlockID':fromBlockID,'msg':[msg[0],msg[1],msg[2]],'msgDict':msgDict});
};

exports.sendCodeBlockErrorToClient = function(blockID,error){
	io.emit('codeBlockErr', {'blockID':blockID,'error': error});
};

