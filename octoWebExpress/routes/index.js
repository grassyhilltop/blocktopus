var express = require('express');
var router = express.Router();

var serverApp = require('../lib/serverApp');
var myMidi = require('../lib/midi');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/devices', function (req, res) {
	console.log("got request for hw devices");
	var blockList = serverApp.getBlockListForClient(true);
	res.json(blockList);
});

router.post('/connections', function(req, res){
	console.log("ADD connect from: " + req.body["connectFrom"]);
	console.log("ADD connect to: " + req.body["connectTo"]);
	
	var fromNumber = Number(req.body["connectFrom"]);
	var toNumber = Number(req.body["connectTo"]);
	
	var fromBlock = serverApp.blockObjects[fromNumber];
	var toBlock = serverApp.blockObjects[toNumber];
	
	fromBlock.addOutputConnection(toBlock);
	toBlock.addInputConnection(fromBlock);
	
	res.json(1);
});

router.post('/newCodeBlock', function(req, res){
	console.log("NEW CODE BLOCK!");
	var x = Number(req.body["x"]);
	var y = Number(req.body["y"]);
	
	serverApp.createNewCodeBlock(x,y);
	
	res.json(1);
});

router.post('/newCodeBlockText', function(req, res){
	console.log("NEW CODE BLOCK TEXT!");
	var text = req.body["text"];
	var blockID = Number(req.body["blockID"]);
	var block = serverApp.blockObjects[blockID];
	
	block.updateCodeText(text);
	
	res.json(1);
});

router.post('/execCodeBlock', function(req, res){
	console.log("EXEC CODE BLOCK");
	var blockID = Number(req.body["blockID"]);
	var block = serverApp.blockObjects[blockID];
	
	var results = block.execCodeBlock();
	
	res.json(1);
});

router.post('/removeCodeBlock', function(req, res){
	console.log("REMOVE CODE BLOCK: " + req.body["blockID"]);
	var blockID = Number(req.body["blockID"]);
	
	if(blockID in serverApp.blockObjects)
		serverApp.removeSwBlock(blockID);
		
	res.json(1);
});


router.post('/newEmuHw', function(req, res){
	console.log("NEW EMU HW UPDATE: " + req.body["emuHwType"]);
	var emuHwType = req.body["emuHwType"];
	serverApp.createNewEmuHwBlock(emuHwType);
	res.json(1);
});

router.post('/updateEmuHwVal', function(req, res){
	console.log("EMU HW VALUE UPDATE: " + req.body["blockID"]);
	var blockID = Number(req.body["blockID"]);
	var msg = req.body["msg"];
	
	serverApp.blockObjects[blockID].onReceiveMessage(blockID,msg);
	res.json(1);
});

router.post('/removeEmuHwBlock', function(req, res){
	console.log("REMOVE EMU HW: " + req.body["blockID"]);
	var blockID = Number(req.body["blockID"]);
	
	if(blockID in serverApp.blockObjects)
		serverApp.removeEmuHwBlock(blockID);
		
	res.json(1);
});

router.post('/delConnection', function(req, res){
	console.log("DELETE connect from: " + req.body["connectFrom"]);
	console.log("DELETE UPDATE connect to: " + req.body["connectTo"]);
	
	var fromNumber = Number(req.body["connectFrom"]);
	var toNumber = Number(req.body["connectTo"]);
	console.log(typeof toNumber);
	
	//We need to do these checks because when a hardware block is removed
	//it automatically removes all of its connections
	if(fromNumber in serverApp.blockObjects){
		var fromBlock = serverApp.blockObjects[fromNumber];
		//The block may have been removed and that is why the connection is being deleted
		if(toNumber in fromBlock.outConnections){
			fromBlock.removeOutputConnection(toNumber);
		}
	}
	
	if(toNumber in serverApp.blockObjects){
		var toBlock = serverApp.blockObjects[toNumber];
		if(fromNumber in toBlock.inConnections){
			toBlock.removeInputConnection(fromNumber);
		}
	}
	res.json(1);
});

router.post('/value', function(req, res){
	console.log("REQUEST FOR VALUE: " + req.body["blockID"]);
	var block = serverApp.blockObjects[req.body["blockID"]];
	var msg = block.msg;
	//res.json(msg);
	res.json(1);
});


module.exports = router;
