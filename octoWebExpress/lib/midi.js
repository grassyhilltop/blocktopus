//node midi library
var midi = require('midi');
var mySocketIO = require('./mySocketIO');

var output = new midi.output();	

var global_input = new midi.input();

exports.setupMidi = function(app) {
	setInterval(function () { checkForMidiDevices(app); }, 1000);
};

exports.out = function(deviceName,msg){
	var portNumber = getPortNumberFromDeviceName(deviceName);
	console.log("sending message out to deviceName: " + deviceName + " portName: " + portNumber);
	
	if (portNumber != null){
		output.openPort(portNumber);
		output.sendMessage([msg[0],msg[1],msg[2]]);
		output.closePort();
	}
}

var checkForMidiDevices = function(app){
	var deviceList = getDeviceList();
	var changed = false;
	
	// DISCONNECTED MODULES
	// Detect on disconnection of a module - by checking that new device list contains all previously connected
	for (var blockID in app.realHwObjects){
		var currDeviceName = app.realHwObjects[blockID].devName;
		// Is the hardware device still present in the midi list ?
		if (deviceList.indexOf(currDeviceName) == -1){ // Returns -1 if A is not in B
			app.removeRealHwBlock(blockID);		
		}
	}
	
	
	// NEW CONNECTED MODULES
		
    for(var i = 0; i < deviceList.length ; i ++ ){
    	var currDeviceName = deviceList[i];
    	var foundBlockId = app.findBlockID(currDeviceName);
    	
    	if (!foundBlockId ) { // if no device yet created
    		console.log("Found new midi device to connect to:" + currDeviceName );
    		var input = new midi.input();
    		
    		if(currDeviceName.substring(0, currDeviceName.length - 2) == "RGB_LED"){
    			var newHwBlock = app.createNewRGBLED(currDeviceName);
    		}
    		else{
    			var newHwBlock =  app.createNewRealHwBlock(currDeviceName);
    		}
    		
    		//if(newHwBlock.deviceDirection == "Input" ){// output
    			//app.Pool.OpenMidiOut(currDeviceName);
    		    	
    		//}
    		 		      		
    		// Always add new devices as possible midi inputs (so any device can receive MIDI messages )
   			//app.Pool.OpenMidiIn(currDeviceName,function(name){return function(t,a){onNewMidiMsg(name,a);};}(deviceList[i]));        							        		
    		input.on('message', function(name){return function(deltaTime, message) {
			  	onNewMidiMsg(app, name , message);
			};}(deviceList[i]));
			
    		input.openPort(i);
    	}
    }
	
};

var onNewMidiMsg = function(app, deviceName, msg){
	// console.log("New midi msg generated by: " + deviceName);
	// When a device generates a message just send it to its self (hardware block)
	console.log("Device Name " + deviceName);
	var blockID = app.findBlockID(deviceName);
	console.log("Block ID: " + blockID);
	var block = app.blockObjects[blockID];
	block.onReceiveMessage(blockID,msg);
}

var getDeviceList = function() {
	var deviceList = [];
	var portCount = global_input.getPortCount();

	for(i=0;i<portCount;i++){
		var portName = global_input.getPortName(i);
		console.log("Port Name: " + portName);
		deviceList.push(global_input.getPortName(i));
	}
	return deviceList;
}

var getPortNumberFromDeviceName = function(portName) {
	var deviceList = getDeviceList();
	
	for (var i = 0; i < deviceList.length; i++){
		if (deviceList[i] == portName){
			return i;
		}
	}
	return null;
}