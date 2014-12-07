var midi = require('./midi');

var app = new App();

deviceTypes = {
	"Knob": {"direction":"Output"},
	"Button": {"direction":"Output"},
	"Slider": {"direction":"Output"},
 	"Light": {"direction":"Input",},
// 	"Temp": {"direction":"Output"},
// 	"Tilt": {"direction":"Output"},
	"LED": {"direction":"Input"},
	"RGB_LED": {"direction":"Input"},
	"Buzzer": {"direction":"Input"}
};

function App() {
	var obj = this;
	this.numBlocks = 0;
	this.blockObjects = {};
	this.blockTypeCounts = {};
	this.realHwObjects = {};

	// Midi Pool variables
	this.Pool;
	this.ins;
	this.outs;
	this.midiDevicePollTimer;

	this.newBlockID = function () {
		return obj.numBlocks++;
	};
	
	this.getDeviceTypeFromName = function (deviceName){
		return deviceTypes[deviceName]["direction"];
	}
	
	this.addNewBlock = function (block) {
		obj.blockObjects[block.blockID] = block;
		// Update display names e.g. block1
		//obj.updateDisplayName(block.blockID);
	};
	
	this.updateDisplayName = function (blockID){
		var currBlock = obj.blockObjects[blockID];
		
		var typeName ="";
		if (currBlock.type == "hw")	typeName =  currBlock.deviceType;	
		else typeName = currBlock.type; 	
		
		// increment the type count
		var currBlockTypeCount = obj.blockTypeCounts[typeName];
		if ( currBlockTypeCount ) currBlockTypeCount += 1;
		else currBlockTypeCount = 1;
		obj.blockTypeCounts[typeName] = currBlockTypeCount;

		// only show number if more than one type
		if (currBlockTypeCount != 1) currBlock.displayName += currBlockTypeCount;  
	}

	this.removeBlock = function (blockID) {
		console.log("removing block with id: " + blockID );
		
		var blockToRemove = obj.blockObjects[blockID];
		blockToRemove.deleteView();

		var deviceType = blockToRemove.type;
		if (blockToRemove.type == "hw") deviceType = blockToRemove.deviceType;

		var currBlockTypeCount = obj.blockTypeCounts[deviceType];				
		obj.blockTypeCounts[deviceType] = currBlockTypeCount - 1;

		delete obj.blockObjects[blockID];
	};

	this.addNewRealHwBlock = function (hwBlock) {
		console.log("adding new Hw Block!");
		obj.addNewBlock(hwBlock);
		obj.realHwObjects[hwBlock.blockID] = hwBlock;
		//this.menu.addToHwList(hwBlock.blockID);
	};

	this.createNewRealHwBlock = function (currDeviceName) {
		return new RealHwBlock(currDeviceName);
	};
	
	this.createNewRGBLED = function (currDeviceName) {
		return new RGB_LED(currDeviceName);
	};
	
	this.removeRealHwBlock = function (blockID) {
		//this.menu.removeFromHwList(blockID);
		obj.removeBlock(blockID);
		delete obj.realHwObjects[blockID];
	};
	
	this.addNewEmuHwBlock = function (hwBlock) {
		obj.addNewBlock(hwBlock);
		//this.menu.addToEmuHwList(hwBlock.blockID);
	};
	
	this.removeEmuHwBlock = function (blockID) {
		//this.menu.removeFromEmuHwList(blockID);
		obj.removeBlock(blockID);
	};

	this.findBlockID = function (devName){
		console.log("Finding block id by device name");
		for (blockID in obj.realHwObjects){
			if(obj.realHwObjects[blockID].devName == devName){
				return blockID;
			}
		}
	};

	// MIDI FUNCTIONS
	
	// Functions to call when the app is first opened\
		console.log("Setting up Midi Data");
		midi.setupMidi(this);
		//this.menu = new Menu();
		//this.menu.addEmuHwBtns(deviceTypes);
	//
};


function BlockObject(viewObj){
	console.log("creating block object");
	var obj = this;
	this.viewObj = viewObj;
	this.inConnections = {};
	this.outConnections = {};
	this.blockID = app.newBlockID();
	this.type = typeof this.type !== 'undefined' ? this.type : "block";
	this.displayName = typeof this.displayName !== 'undefined' ? this.displayName : "block";
	this.data = typeof this.data !== 'undefined' ? this.data : 0;
};

BlockObjectClone = function () {};
BlockObjectClone.prototype = BlockObject.prototype;

BlockObject.prototype.deleteView = function(){
	console.log("deleting view!");	
	/*
		g1 = this;

		// Clean up jsplumb connectors
		jsPlumb.detachAllConnections(this.viewObj.id);
		jsPlumb.removeAllEndpoints(this.viewObj.id); 

		// Remove the actual node
		$(this.viewObj).remove();
	*/
}

BlockObject.prototype.removeOutputConnection = function (outputConnectionObj){
	// console.log("removing output connection");
	delete this.outConnections[outputConnectionObj.blockID];
};

BlockObject.prototype.addOutputConnection = function (outputConnectionObj){
	// console.log("adding output connection from " + this.blockID + " to " + outputConnectionObj.blockID);
	this.outConnections[outputConnectionObj.blockID] = outputConnectionObj;
};

BlockObject.prototype.removeInputConnection = function (inputConnectionObj){
	// console.log("removing input connection");
	delete this.inConnections[inputConnectionObj.blockID];
};

BlockObject.prototype.addInputConnection = function (inputConnectionObj){
	// console.log("adding input connection from " + inputConnectionObj.blockID + " to " + this.blockID );
	this.inConnections[inputConnectionObj.blockID] = inputConnectionObj;
};

BlockObject.prototype.sendToAllOutputs = function(msg){
	// console.log("sending to all outputs");
	for (targetBlockID in this.outConnections){
		this.sendMsg(targetBlockID, msg);
	}
};

BlockObject.prototype.sendMsg = function(targetBlockID, msg){
	console.log("Sending message to " + targetBlockID + " from " + this.blockID);
	app.blockObjects[targetBlockID].onReceiveMessage(this.blockID, msg);
};

function HwBlock(devName){
	console.log("Creating new hardware block with name:" + devName);
	var obj = this;
	this.type = "hw";						 // object type
	this.devName = devName; 	             // Assumes midi device name in format "button-5"
	this.deviceType = devName.split("-")[0]; // Just the type part of the name "button"
	this.deviceIDNum = devName.split("-")[1];// Just the numerical part of the name "5"
	this.data = 0; 						 // Current state of device
	this.deviceDirection = app.getDeviceTypeFromName(this.deviceType); // e.g. has Input or Output
	this.displayName = typeof this.displayName !== 'undefined' ? this.displayName : this.deviceType;
	BlockObject.call(this,undefined);

	console.log("block ID:" + this.blockID);
	console.log("displayName: " + obj.displayName);
	
	// Create a default hardware view
	/*
	if((undefined === this.viewObj)){
		var displayVal = obj.data ;
		if(obj.deviceType =="Button" || obj.deviceType =="Buzzer")  displayVal = "OFF";
		else displayVal = "0%";		
		
		this.viewObj = drawHardwareBlock(this, this.blockID, obj.deviceIDNum , obj.deviceType, obj.displayName , displayVal);
	}
	*/
};

HwBlock.prototype = new BlockObjectClone();
HwBlock.prototype.constructor = HwBlock;

HwBlock.prototype.onReceiveMessage = function(fromBlockID,msg){
	console.log("Hardware: " + this.devName +" blockID:" + this.blockID + " recevied msg: " + msg +" from id:" + fromBlockID);

	// If we were the hardware the generated the message
	if (this.blockID == fromBlockID){
		// console.log("Hardware: " + obj.devName + " message to self");
		// process the message if needed here e.g. check valid message cleaning...
	}
	
	// If the message containes a new value update hardware block
	if (msg) this.update(fromBlockID,msg);
	
	if(this.emuHardwareResponse) this.emuHardwareResponse(msg);
	
	if(this.deviceDirection == "Input"){ // If we have input e.g. buzzer
		midi_out(this.devName,[msg[0],msg[1],msg[2]]);
	}
	else if (this.deviceDirection == "Output"){ // Sensor
		this.sendToAllOutputs(msg);	// Send to any connected output blocks
	}
	else{
		console.log("Error: HwBlock should be an output or input device!");
	}	
};

// Called when the block state has changed - update data and view
HwBlock.prototype.update = function(fromBlockID,msg){
	obj = this;
	// console.log("Updating hardware block:" + obj.devName);

	// Update data - hardware state
	var newVal = msg[2];
	// Update View		
	
	if(msg[0] == 144){ // If the message type is note on/off use string label instead of number
		newVal = 100;
		//$("#sensorVal"+obj.blockID).text("ON");
	}
	else if (msg[0] == 128){
		newVal = 0;
		//$("#sensorVal"+obj.blockID).text("OFF");		
	}

	// control change for pitch wheel
	else if (msg[0] == 227 || msg[0] == 176 ){
		var sensorPercent = Math.floor(100*msg[2]/127);
		newVal = sensorPercent;
		// special case for temperature
		if(obj.devName =="Temp") {
			var temperature = 25 + (sensorPercent%50); 
			//$("#sensorVal"+obj.blockID).text( temperature +"°C");
		}
		else {				
			//$("#sensorVal"+obj.blockID).text( sensorPercent +"%");
		}
	}
	//$("#sensorVal"+obj.blockID).val(newVal);


	obj.data = newVal;
};

HwBlockClone = function () {};
HwBlockClone.prototype = HwBlock.prototype;

function RealHwBlock(devName){
	console.log("creating Knob");
	HwBlock.call(this,devName);
	app.addNewRealHwBlock(this);
};

RealHwBlock.prototype = new HwBlockClone();
RealHwBlock.prototype.constructor = RealHwBlock;

RealHwBlockClone = function () {};
RealHwBlockClone.prototype = RealHwBlock.prototype;

function EmuHwBlock(devName){
	console.log("creating Emulated Hardware");
	HwBlock.call(this,devName);
	app.addNewEmuHwBlock(this);
	
	var devType = this.deviceType;
	var controlID = deviceTypes[devType]["addControlElem"](this);
	
};

EmuHwBlock.prototype = new HwBlockClone();
EmuHwBlock.prototype.constructor = EmuHwBlock;

EmuHwBlockClone = function () {};
EmuHwBlockClone.prototype = EmuHwBlock.prototype;

function RGB_LED_R(devName, RGB_LED){
	console.log("creating RGB_LED_R");
	var obj = this;
	this.displayName = "RGB_LED-Red";
	RealHwBlock.call(this,devName);
	this.RGB_LED = RGB_LED;
};

RGB_LED_R.prototype = new RealHwBlockClone();
RGB_LED_R.prototype.constructor = RGB_LED_R;

RGB_LED_R.prototype.setColor = function(colorByte){
		console.log("RGB_R set color " + colorByte);
		this.RGB_LED.r = colorByte;
};

RGB_LED_R.prototype.onReceiveMessage = function(fromBlockID,msg){
	console.log("RGB_LED_R on receive message");
	this.setColor(msg[2]);
	HwBlock.prototype.update.call(this, fromBlockID, msg);
	this.RGB_LED.sendOutColors(msg);
};

function RGB_LED_G(devName, RGB_LED){
	console.log("creating RGB_LED_R");
	var obj = this;
	this.displayName = "RGB_LED-Green";
	RealHwBlock.call(this,devName);
	this.RGB_LED = RGB_LED;
};

RGB_LED_G.prototype = new RealHwBlockClone();
RGB_LED_G.prototype.constructor = RGB_LED_G;

RGB_LED_G.prototype.setColor = function(colorByte){
		console.log("RGB_R set color " + colorByte);
		this.RGB_LED.g = colorByte;
};

RGB_LED_G.prototype.onReceiveMessage = function(fromBlockID,msg){
	console.log("RGB_LED_R on receive message");
	this.setColor(msg[2]);
	HwBlock.prototype.update.call(this, fromBlockID, msg);
	this.RGB_LED.sendOutColors(msg);
};

function RGB_LED_B(devName, RGB_LED){
	console.log("creating RGB_LED_R");
	var obj = this;
	this.displayName = "RGB_LED-Blue";
	RealHwBlock.call(this,devName);
	this.RGB_LED = RGB_LED;
};

RGB_LED_B.prototype = new RealHwBlockClone();
RGB_LED_B.prototype.constructor = RGB_LED_B;

RGB_LED_B.prototype.setColor = function(colorByte){
		console.log("RGB_R set color " + colorByte);
		this.RGB_LED.b = colorByte;
};

RGB_LED_B.prototype.onReceiveMessage = function(fromBlockID,msg){
	console.log("RGB_LED_R on receive message");
	this.setColor(msg[2]);
	HwBlock.prototype.update.call(this, fromBlockID, msg);
	this.RGB_LED.sendOutColors(msg);
};

function RGB_LED(devName){
	console.log("creating RGB_LED");
	var obj = this;
	this.devName = devName;
	this.deviceDirection = "Input";
	
	this.r = 0;
	this.g = 0;
	this.b = 0;
	
	this.rgb_led_r = new RGB_LED_R(devName, obj);
	this.rgb_led_g = new RGB_LED_G(devName, obj);
	this.rgb_led_b = new RGB_LED_B(devName, obj);
	
	this.sendOutColors = function(msg){
			var r = obj.r;
			var g = obj.g;
			var b = obj.b;
			
			console.log("RGB_LED Sending Out Colors: " + r +" " + g +" "+ b);
			
			var r_msg = [0,0,0];
			var g_msg = [0,0,0];
			var b_msg = [0,0,0];
	
			r_msg[0] = msg[0];
			r_msg[1] = msg[1];
			//r_msg[2] = this.r;
			r_msg[1] = r;
	
			g_msg[0] = msg[0];
			g_msg[1] = msg[1];
			g_msg[2] = g;
	
			b_msg[0] = msg[0];
			b_msg[1] = msg[1];
			b_msg[2] = b;
	
			midi_out(obj.devName,[msg[0],0,this.r]);
 			midi_out(obj.devName,[msg[0],1,this.g]);
 			midi_out(obj.devName,[msg[0],2,this.b]);

	};
};

module.exports = app;
