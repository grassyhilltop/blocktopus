//the midi wrapper that we wrote on top of the node library
var myMidi = require('./midi');
var mySocketIO = require('./mySocketIO');

var app = new App();

deviceTypes = {
	"Knob": {"direction":"Output"},
	"Button": {"direction":"Output"},
	"Slider": {"direction":"Output"},
 	"Light": {"direction":"Input"},
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
	
	/* To interface with the rest of the app */
	this.createNewRealHwBlock = function (currDeviceName) {
		return new RealHwBlock(currDeviceName);
	};
	
	this.createNewRGBLED = function (currDeviceName) {
		return new RGB_LED(currDeviceName);
	};
	
	this.createNewEmuHwBlock = function(emuHwType){
		return new EmuHwBlock(emuHwType);
	};
	
	this.createNewCodeBlock = function(x,y){
		return new CodeBlock(x,y);
	};
	
	/* To interface with the rest of the app */

	this.newBlockID = function () {
		return obj.numBlocks++;
	};
	
	this.getDeviceTypeFromName = function (deviceName){
		if(deviceName in deviceTypes){
			return deviceTypes[deviceName]["direction"];
		}
		else{
		 return  null;
		 }
	}
	
	this.addNewBlock = function (block) {
		obj.blockObjects[block.blockID] = block;
		// Update display names e.g. block1
		var blockList = this.getBlockListForClient();
		mySocketIO.sendBlockListToClient(blockList);
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
		blockToRemove.Remove();

		var deviceType = blockToRemove.type;
		if (blockToRemove.type == "hw") deviceType = blockToRemove.deviceType;

		var currBlockTypeCount = obj.blockTypeCounts[deviceType];				
		obj.blockTypeCounts[deviceType] = currBlockTypeCount - 1;

		delete obj.blockObjects[blockID];
		
		var blockList = this.getBlockListForClient();
		mySocketIO.sendBlockListToClient(blockList);
	};

	this.addNewRealHwBlock = function (hwBlock) {
		console.log("adding new Hw Block!");
		obj.addNewBlock(hwBlock);
		obj.realHwObjects[hwBlock.blockID] = hwBlock;
		//this.menu.addToHwList(hwBlock.blockID);
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
	
	this.addNewSwBlock = function (swBlock) {
		obj.addNewBlock(swBlock);
		//this.menu.addToEmuHwList(hwBlock.blockID);
	};
	
	this.removeEmuHwBlock = function (blockID) {
		//this.menu.removeFromEmuHwList(blockID);
		obj.removeBlock(blockID);
	};
	
	this.removeSwBlock = function (blockID) {
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
	
	this.getBlockListForClient = function() {
		var blockList = {};

		for(var block in obj.blockObjects){
			//Emulated HW blocks and Real HW blocks
			//console.log("adding block to list: " + block);
			if(obj.blockObjects[block].type == "hw"){
				blockList[block] = 
					{"type": "hw",
					"devName":obj.blockObjects[block].devName,
					"devIDNum":obj.blockObjects[block].deviceIDNum}
			}else if(obj.blockObjects[block].type == "sw"){
				blockList[block] = 
					{"type": "sw",
					"x":obj.blockObjects[block].initX,
					 "y":obj.blockObjects[block].initY}
			}
		}
		return blockList;
	};

	// MIDI FUNCTIONS
	console.log("Setting up Midi Data");
	myMidi.setupMidi(this);
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

BlockObject.prototype.Remove = function(){
	console.log("deleting all connections");	
	
	for(block in this.outConnections){
		this.outConnections[block].removeInputConnection(this.blockID);
	};
	
	for(block in this.inConnections){
		this.inConnections[block].removeOutputConnection(this.blockID);
	};
		
	/*
		g1 = this;
		// Clean up jsplumb connectors
		// Remove the actual node
		$(this.viewObj).remove();
		jsPlumb.detachAllConnections(this.viewObj.id);
		jsPlumb.removeAllEndpoints(this.viewObj.id); 
	*/
}

BlockObject.prototype.removeOutputConnection = function (blockID){
	// console.log("removing output connection");
	delete this.outConnections[blockID];
};

BlockObject.prototype.addOutputConnection = function (outputConnectionObj){
	 console.log("adding output connection from " + this.blockID + " to " + outputConnectionObj.blockID);
	this.outConnections[outputConnectionObj.blockID] = outputConnectionObj;
};

BlockObject.prototype.removeInputConnection = function (blockID){
	// console.log("removing input connection");
	delete this.inConnections[blockID];
};

BlockObject.prototype.addInputConnection = function (inputConnectionObj){
	 console.log("adding input connection from " + inputConnectionObj.blockID + " to " + this.blockID );
	this.inConnections[inputConnectionObj.blockID] = inputConnectionObj;
};

BlockObject.prototype.sendToAllOutputs = function(msg){
	// console.log("sending to all outputs");
	for (targetBlockID in this.outConnections){
		this.sendMsg(targetBlockID, msg);
	}
	
	//Test
	//this.sendMsg(2,msg);
};

BlockObject.prototype.onReceiveMessage = function(blockID, msg) {
	//Should be done by objects further down the inheritance chain
}

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
		myMidi.out(this.devName,[msg[0],msg[1],msg[2]]);
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
	mySocketIO.sendMidiToClient(this.blockID, msg);
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
	
	//var devType = this.deviceType;
	//var controlID = deviceTypes[devType]["addControlElem"](this);
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
	
			myMidi.out(obj.devName,[msg[0],0,this.r]);
 			myMidi.out(obj.devName,[msg[0],1,this.g]);
 			myMidi.out(obj.devName,[msg[0],2,this.b]);
	};
};


function CodeBlock(x,y){
	var obj = this;
	this.initX = x;
	this.initY = y;
	BlockObject.call(this,undefined);
	this.type="sw";
	this.data = "0";
	this.displayName = "input";      
// 	this.sandbox   = new JSandbox();
	this.result = 0;

	app.addNewSwBlock(this);

	//if(!viewObjInput){
		// var freeCellELem = drawCodeBlock(this.blockID,x,y);
		// parent element has unique container id .e.g. block-3 		
		//this.viewObj = freeCellELem.parentElement;  
	//}
	
/*
	
	// Update software block from an incoming midi message , evaling code
	this.update = function(fromBlockID,msg){
		
		if(!msg){
			console.log("Error in software block update... no message");
			return;
		}
		var fromObj = app.blockObjects[fromBlockID];
		var newVal = convertMidiMsgToNumber(msg);
		var codeBoxElem = $("#block-"+obj.blockID);
		
		// Update the view -----
	
		// Update input field data and view			
		// codeBoxElem.find(".codeArgInput").val(newVal); 

		// Update the existing code argument div that matches the name of the hardware
		var argElems = codeBoxElem.find(".codeArgInput");
		var argNames = codeBoxElem.find(".codeArgName");
		
		for (var i = 0; i < argNames.length; i++) {
			var currName = argNames[i].innerHTML;
			
			// Using display name to find a match
			var displayName = fromObj.displayName;
			if (fromObj.type == "hw") displayName = displayName.toLowerCase();
			
			if (currName == displayName ){
				argElems[i].value = newVal;	
			} 

			// if (fromObj.type == "hw"){
			// 	var deviceName = fromObj.deviceType.toLowerCase();

			// 	if (currName == deviceName){					
			// 		argElems[i].value = newVal;					
			// 	}	
			// } else{
			// 	if (currName == "input"){
			// 		argElems[i].value = newVal;	
			// 	}
			// }
			
		};
		
		// Evaluate code block
		var codeBlockJqueryObj = $("#block-"+obj.blockID);
		// var sourceName = app.blockObjects[fromBlockID].devName;
		// var result = evalCodeBlock(codeBlockJqueryObj,fromBlockID);
		var result = this.evalCodeBlock();
		// var result = this.evalCodeBlockFromSandBox();
		
		// Update output field with evaluated result
		// todo...
		obj.data = result;

		return result;
	};
	
	this.evalCodeBlockFromSandBox = function () {
		
		var codeBlockID = this.blockID;
	
		var codeBlockObj = app.blockObjects[codeBlockID];
		var clobjectDiv = $("#block-"+codeBlockID); // jquery view object
	
		var elem = clobjectDiv.find(".freeCell");
		var inputValue = elem.find(".codeArgInput").val();
		var outputValueElem = clobjectDiv.find(".returnValInput");
		
		var str = elem.html();
		var divs = elem.find('div');
		var code = "";
		divs.each(function() {
			if ($(this).hasClass("codeArgLine")){
				var argElem = $(this).find(".codeArgInput");
				var argName = $(this).find(".codeArgName");
				code = code + argName.text() + " = " + argElem.val() + " ; ";
			}else{
				code = code + " " + $(this).text() + " ";
			}
		});
		console.log("code "+code);
		this.sandbox.eval(code, function (returnVal) {
			console.log("ret " + returnVal);
			obj.result = returnVal;
		});
		
		console.log("evaled code box with results:" +this.result);

		// todo place this in code box update
		if(outputValueElem) {
			outputValueElem.val(this.result);	
		}

		return this.result;
	};
	
	this.evalCodeBlock = function(){
		console.log("Evaling code block");
		var codeBlockID = this.blockID;
	
		var codeBlockObj = app.blockObjects[codeBlockID];
		var clobjectDiv = $("#block-"+codeBlockID); // jquery view object
	
		var elem = clobjectDiv.find(".freeCell");
		var inputValue = elem.find(".codeArgInput").val();
		var outputValueElem = clobjectDiv.find(".returnValInput");
		
		// Insert new lines around div tags so we can spilt into a line array
		var str = elem.html().replace(/(<\/div>)|(<div>)|<div[^>]*>|(<br>)/g,"\n"); 
	
		str = unescapeHTML(str); // remove any unescaped chars e.g. & " ' < >
		var lines = str.trim().split("\n"); // split string into array of lines

		//remove empty lines
		var trimmedlines = [];
		for (var i = 0; i < lines.length; i++) {
			if ( lines[i].trim() !="" && lines[i] !="<br>" ) trimmedlines.push(lines[i]);
		};
		lines = trimmedlines;

		// Add a line for each input argument
		var argElems = clobjectDiv.find(".codeArgInput");
		var argNames = clobjectDiv.find(".codeArgName");
	
		for (var i = 0; i < argNames.length; i++) {
			var currName = argNames[i].innerHTML;
			var currVal = argElems[i].value;	

			lines[i] = "var " + currName + " = " + currVal; // first line is an input variable	
			
		};
	
		// If there is no code to eval  just pass through the first input value	
		var numInConnections = Object.keys(codeBlockObj.inConnections).length
		// if(lines.length == 1){		
		if(lines.length == numInConnections){		
			outputValueElem.val(inputValue);
			return inputValue;
		}
		
		////////////////////////////////////
		/// CODE GENERATION (line by line)
		////////////////////////////////////
		var lastAssignment;
		var lastLine;
		var codeStr= "function(){";
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			if(!line) continue; // skip blank lines		
		
			console.log("currline is:" +line);
		
			// Check if current line is an assigment and store variable name for later
			var lineAssignmnetMatch =  isAssignmentLine(line);
			if(lineAssignmnetMatch) lastAssignment = lineAssignmnetMatch[1];

			lastLine = line;
			if(isValidLine(line)) line +=";" ; // add semicolon to each line

			codeStr += line;
		};
	
		// Add a return value line , with defaults:
		// 1. Return last line if it is a valid expression
		// 2. else return last variable assignment in code
		if (lastLine) {
			if(!isValidReturnValue(lastLine)){
				lastLine = lastAssignment;
			}
			codeStr += "return (" + lastLine + ")";
		}

		g1 = lastAssignment;

		codeStr +="}";
		console.log("eval code str:"+codeStr);		

		var result = tryEval(codeStr)();
		console.log("evaled code box with results:" +result);

		// todo place this in code box update
		if(outputValueElem) {
			outputValueElem.val(result);	
		}

		return result;
	};

	this.onReceiveMessage = function(fromBlockID,msg){
		console.log("Software block with blockID:" + obj.blockID + " recevied msg: " + msg +" from id:" + fromBlockID);

		if(!msg){
			console.log("Error: tried to send a message to block with empty message");
			return;
		} 

		// If the message containes a new value update block
		var result = obj.update(fromBlockID,msg);			

		// Send a new msg to any connected outputs
		if(result !=undefined ){
			var newMsg = convertPercentToMidiMsg(result);
			obj.sendToAllOutputs(newMsg);
		}
		
	};

	// ================================================
	// CODE BLOCK - VIEW FUNCTIONS
	// ================================================
	
	this.updateArgumentsView = function(){

		// Update the code block views argument lines and output field
		// according the what parents are connected		

		// Setup view variables
		var targetElem = $("#block-"+this.blockID);	  // Jquery obj of the code block view
		var elem = targetElem.find(".freeCell");      // Editable div inside object
		targetInputElems = elem.find(".codeArgInput");// Any existing argument divs
		var numInConnections = Object.keys(this.inConnections).length; // Number of connected parents,  
		
		var linesToAdd = "";

		// First clean up div - Delete all of the preexisintg argument lines
		var argmentLines = $(this.viewObj).find(".codeArgLine");		
		for (var i = 0; i < argmentLines.length; i++) {
			var currTargetInputElem = argmentLines[i];
			currTargetInputElem.remove();
		}
		
		var existingDivider = $(this.viewObj).find(".dividerline");
		if (existingDivider.length > 0 ) existingDivider[0].remove();

		// Add a div for each input connection we have currently
		for ( connectedObjID in this.inConnections ){
			var currConnectedObj = app.blockObjects[connectedObjID];
			
			var currArgumentName ="input";                    // default name of the argument
			var currConnectedObjVal = currConnectedObj.data;  // value of the argument x = 0
			if (currConnectedObjVal ==undefined) currConnectedObjVal = "0";
			
			// Set custom argument name depending on if hardware or software
			// if ( currConnectedObj.type == "sw" ){	
			// 	// If connecting from a code block

			// } 
			// else if (currConnectedObj.type == "hw"){
			// 	// If connecting from hardware
			// 	currArgumentName = currConnectedObj.deviceType.toLowerCase();
			// } 	

			currArgumentName = currConnectedObj.displayName.toLowerCase();

         	// Append a new variable name for each input
			linesToAdd += "<div contenteditable ='false' class='codeArgLine'>" + "<span class='codeArgName'>"+ currArgumentName + 
			"</span> = <input class='codeArgInput' value='" + currConnectedObjVal + "'></input> </div> ";		
		}

		// Append the lines to the elem
		var originalHTML = elem.html();
		var blankLine = "<div><br></div>";
		var dividerline = "<div class='dividerline' contenteditable='false'></div>";
		elem.html(linesToAdd + dividerline + originalHTML + blankLine);

		// Update the output field
		// js todo

		var returnValElem = targetElem.find(".returnValInput");
		var returnVal = "0"; // default return val 
		if( returnValElem.length == 0 ){ // no output div element yet		
			var lastLine = "<div class='returnValDiv' contenteditable='false'><input class='returnValInput' value='" + returnVal + "' readonly></input> </div> ";		
			// elem.append(lastLine);	
			targetElem.append(lastLine);	
			// Set our new data		
			this.data = returnVal;
		}

		jsPlumb.repaint(elem.parent());	// repaint anchors in case shifted	
	}	
*/
};


CodeBlock.prototype = new BlockObjectClone();
CodeBlock.prototype.constructor = CodeBlock;

// When some object connects to a code block
CodeBlock.prototype.addInputConnection = function (outputConnectionObj){

	BlockObject.prototype.addInputConnection.call(this,outputConnectionObj);

	// console.log("Adding input to code block");
	
	this.updateArgumentsView();			
};

// When some object dissconnects from a code block
CodeBlock.prototype.removeInputConnection = function (outputConnectionObj){

	BlockObject.prototype.removeInputConnection.call(this,outputConnectionObj);

	// console.log("Removing input from code block");
	
	this.updateArgumentsView();			
};

module.exports = app;
