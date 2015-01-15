var express = require('express');
var router = express.Router();

var midiData = require('../lib/midiData');
var myMidi = require('../lib/midi');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/devices', function (req, res) {
	console.log("got request for hw devices");
	
	var deviceList = midiData.getDeviceListForClient();
	res.json(deviceList);
});

router.post('/connections', function(req, res){
	console.log("CONNECTIONS UPDATE: " + req.body["connectFrom"]);
	var fromBlock = midiData.blockObjects[req.body["connectFrom"]];
	var toBlock = midiData.blockObjects[req.body["connectTo"]];
	
	fromBlock.addOutputConnection(toBlock);
	toBlock.addInputConnection(fromBlock);
	res.json(1);
});

router.delete('/connections', function(req, res){
	console.log("CONNECTIONS UPDATE: " + req.body["connectFrom"]);
	var fromBlock = midiData.blockObjects[req.body["connectFrom"]];
	var toBlock = midiData.blockObjects[req.body["connectTo"]];
	
	fromBlock.removeOutputConnection(toBlock);
	toBlock.removeInputConnection(fromBlock);
	res.json(1);
});

router.post('/value', function(req, res){
	console.log("REQUEST FOR VALUE: " + req.body["blockID"]);
	var block = midiData.blockObjects[req.body["blockID"]];
	var msg = block.msg;
	//res.json(msg);
	res.json(1);
});


module.exports = router;
