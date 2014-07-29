window.addEventListener("load",setupMidi);

var app = new App();

function App() {
	var obj = this;
	this.numBlocks = 0;
	this.blockObjects = {};
	this.hwObjects = {};

	// Midi Pool variables
	this.Pool;
	this.ins;
	this.outs;
	this.midiDevicePollTimer;

	this.newBlockID = function () {
		return obj.numBlocks++;
	};
	
	this.addNewBlock = function (block) {
		obj.blockObjects[block.blockID] = block;
	};
	
	this.addNewHwBlock = function (hwBlock) {
		obj.addNewBlock(hwBlock);
		obj.hwObjects[hwBlock.blockID] = hwBlock;
	};
	
	this.removeHwBlock = function (blockID) {
		var blockToRemove = obj.blockObjects[blockID];
		console.log("Removing block id:" + blockID + " for device name:" +blockToRemove.devName);
		
		blockToRemove.deleteView();
		delete obj.blockObjects[blockID];
		delete obj.hwObjects[blockID];
	};

	this.findBlockID = function (devName){
		for (blockID in obj.hwObjects){
			if(obj.hwObjects[blockID].devName == devName){
				return blockID;
			}
		}
	};

	// MIDI FUNCTIONS

	this.setupMidiPool = function (){
		try{
			obj.Pool=new MidiPool;	 
		}
		catch(err){ alert(err);}
	}
};

function getDeviceTypeFromName(deviceName){
	var deviceTypes = {
	"Knob": "Output",
	"Button": "Output",
	"Slider": "Output",
	"Light": "Output",
	"Temp": "Output",
	"Tilt": "Output",
	"LED": "Input",
	"Buzzer": "Input"
	};

	return deviceTypes[deviceName];
}

function BlockObject(viewObj){
	console.log("creating block object");
	var obj = this;
	this.viewObj = viewObj;
	this.inConnections = {};
	this.outConnections = {};
	this.blockID = app.newBlockID();
	this.type = "block";
	this.value = 0;
};
BlockObjectClone = function () {};
BlockObjectClone.prototype = BlockObject.prototype;

BlockObject.prototype.removeOutputConnection = function (outputConnectionObj){
	console.log("removing output connection");
	delete this.outConnections[outputConnectionObj.blockID];
};

BlockObject.prototype.addOutputConnection = function (outputConnectionObj){
	console.log("adding output connection from " + this.blockID + " to " + outputConnectionObj.blockID);
	this.outConnections[outputConnectionObj.blockID] = outputConnectionObj;
};

BlockObject.prototype.removeInputConnection = function (inputConnectionObj){
	console.log("removing input connection");
	delete this.inConnections[inputConnectionObj.blockID];
};

BlockObject.prototype.addInputConnection = function (inputConnectionObj){
	console.log("adding input connection from " + inputConnectionObj.blockID + " to " + this.blockID );
	this.inConnections[inputConnectionObj.blockID] = inputConnectionObj;
};

BlockObject.prototype.sendToAllOutputs = function(msg){
	console.log("sending to all outputs");
	for (targetBlockID in this.outConnections){
		this.sendMsg(targetBlockID, msg);
	}
};

BlockObject.prototype.sendMsg = function(targetBlockID, msg){
	console.log("Sending message to " + targetBlockID + " from " + this.blockID);
	app.blockObjects[targetBlockID].onReceiveMessage(this.blockID, msg);
};

function HwBlock(devName,viewObj){
	
	console.log("Creating new hardware block with name:" + devName);

	var obj = this;
	BlockObject.call(this,viewObj);
	this.type = "hw";						 // object type	 
	this.devName = devName; 	             // Assumes midi device name in format "button-5"
	this.deviceType = devName.split("-")[0]; // Just the type part of the name "button"
	this.deviceIDNum = devName.split("-")[1];// Just the numerical part of the name "5"
	this.data = "0"; 						 // Current state of device
	this.deviceDirection = getDeviceTypeFromName(this.deviceType); // e.g. has Input or Output
	app.addNewHwBlock(this);
	
	// Create a default hardware view
	if(!viewObj){
		
   		var x = 50 + 400* Math.random();
		var y = 100+ 400* Math.random();
		
		var displayVal = obj.data ;
		if(obj.deviceType =="Button" || obj.deviceType =="Buzzer")  displayVal = "OFF";
		else displayVal = "0%";		
		
		obj.viewObj = drawHardwareBlock(obj.blockID, x , y , obj.deviceIDNum , obj.deviceType , displayVal);
	} 

	// Remove hardware view
	this.deleteView =function (){
				
		deleteNode(obj.viewObj); // Clean up jsplumb connectors
		$(obj.viewObj).remove();
	}

	// Called when the block state has changed - update data and view
	this.update = function(fromBlockID,msg){
		// console.log("Updating hardware block:" + obj.devName);

		// Update data - hardware state
		var newVal = msg[2];

		// Update View		
		
		if(msg[0] == 144){ // If the message type is note on/off use string label instead of number
			newVal = 100;
			$("#sensorVal"+obj.deviceIDNum).text("ON");
		}
		else if (msg[0] == 128){
			newVal = 0;
			$("#sensorVal"+obj.deviceIDNum).text("OFF");		
		}

		// control change for pitch wheel
		else if (msg[0] == 227 || msg[0] == 176 ){
			var sensorPercent = Math.floor(100*msg[2]/127);
			newVal = sensorPercent;
			// special case for temperature
			if(obj.devName =="Temp") {
				var temperature = 25 + (sensorPercent%50); 
				$("#sensorVal"+obj.deviceIDNum).text( temperature +"°C");
			}
			else {				
				$("#sensorVal"+obj.deviceIDNum).text( sensorPercent +"%");
			}
		}

		$("#sensorVal"+obj.deviceIDNum).val(newVal);

		obj.data = newVal;
	}

	this.onReceiveMessage = function(fromBlockID,msg){
		console.log("Hardware: " + obj.devName +" blockID:" + obj.blockID + " recevied msg: " + msg +" from id:" + fromBlockID);

		// If we were the hardware the generated the message
		if (obj.blockID == fromBlockID){
			// console.log("Hardware: " + obj.devName + " message to self");
			// process the message if needed here e.g. check valid message cleaning...
		}
		// If the message containes a new value update hardware block
		if( msg) obj.update(fromBlockID,msg);			
		
		if(obj.deviceDirection == "Input"){ // If we have input e.g. buzzer
			midi_out(obj.devName,[msg[0],msg[1],msg[2]]);
		}
		else if (obj.deviceDirection == "Output"){ // Sensor
			obj.sendToAllOutputs(msg);	// Send to any connected output blocks
		}
		else{
			console.log("Error: HwBlock should be an output or input device!");
		}	
	};
	
	this.sendToAllOutputs = function(msg){		
		for (targetBlockID in obj.outConnections){
			obj.sendMsg(targetBlockID, msg);
		}
	};
	
	this.sendMsg = function(targetBlockID, msg){
		console.log( obj.devName + " sending message to block id: " + targetBlockID);
		app.blockObjects[targetBlockID].onReceiveMessage(obj.blockID, msg);
	};
};

HwBlock.prototype = new BlockObjectClone();
HwBlock.prototype.constructor = HwBlock;


HwBlockClone = function () {};
HwBlockClone.prototype = HwBlock.prototype;

function Knob(viewObj, devName){
	var obj = this;
	console.log("creating Knob");
	HwBlock.call(this,viewObj,devName);
	this.deviceDirection = "Output";

};
Knob.prototype = new HwBlockClone();
Knob.prototype.constructor = Knob;

Knob.prototype.onReceiveMessage = function(fromBlockID,msg){
	console.log("Knob on receive message");
	HwBlock.prototype.onReceiveMessage.call(this, fromBlockID, msg);				
};

function Buzzer(viewObj, devName){
	console.log("creating buzzer");
	var obj = this;
	HwBlock.call(this,viewObj,devName);
	this.deviceDirection = "Input";
};

Buzzer.prototype = new HwBlockClone();
Buzzer.prototype.constructor = Buzzer;

Buzzer.prototype.onReceiveMessage = function(fromBlockID,msg){
	console.log("Buzzer on receive message");
	HwBlock.prototype.onReceiveMessage.call(this, fromBlockID, msg);			
};


function CodeBlock(x,y,viewObj){
	var obj = this;
	BlockObject.call(this,viewObj);
	this.type="sw";
	this.data = "0";
	app.addNewBlock(this);

	if(!viewObj){
		this.viewObj = drawCodeBlock(this.blockID,x,y);
	}
	
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
			if (fromObj.type == "hw"){
				var deviceName = fromObj.deviceType.toLowerCase();

				if (currName == deviceName){					
					argElems[i].value = newVal;					
				}	
			} else{
				if (currName == "input"){
					argElems[i].value = newVal;	
				}
			}
			
		};
		
		// Evaluate code block
		var result = evalCodeBlock(obj.blockID);

		// Update output field with evaluated result
		// todo...
		obj.data = result;

		return result;
	}	

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
			if ( currConnectedObj.type == "sw" ){	
				// If connecting from a code block

			} 
			else if (currConnectedObj.type == "hw"){
				// If connecting from hardware
				currArgumentName = currConnectedObj.deviceType.toLowerCase();
			} 	

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

};
CodeBlock.prototype = new BlockObjectClone();
CodeBlock.prototype.constructor = CodeBlock;

// When some object connects to a code block
CodeBlock.prototype.addInputConnection = function (outputConnectionObj){

	BlockObject.prototype.addInputConnection.call(this,outputConnectionObj);

	console.log("Adding input to code block");
	
	this.updateArgumentsView();			
};

// When some object dissconnects from a code block
CodeBlock.prototype.removeInputConnection = function (outputConnectionObj){

	BlockObject.prototype.removeInputConnection.call(this,outputConnectionObj);

	console.log("Removing input from code block");
	
	this.updateArgumentsView();			
};



function setupMidi () {
	console.log("Setting up midi");
	
	/// USING JAZZ PLUGING
	app.setupMidiPool();

	// Poll for new midi devices
	app.midiDevicePollTimer = setInterval( checkForMidiDevices, 1000);

}

// On receive of an midi message from a sensor
function midi_out(name,msg){
	console.log("Sending midi out to device name:" + name + " msg:" + msg);

	// Send the message out to the pool
	app.Pool.MidiOut(name,msg);
}

function play_all(){
	var note=60;
 	for(var i in app.hwObjects){ 		
 		midi_out(app.hwObjects[i].devName,[144,note,0x7f]); 
 		note+=5;
 	}
}

function stop_all(){
	var note=60;
	for(var i in app.hwObjects){ 
		midi_out(app.hwObjects[i].devName,[128,note,0]); 
		note+=5;
	}
}

// Polling for midi devices
function checkForMidiDevices(){
	
	var deviceList = app.Pool.MidiInList();
	
	// For debugging show list of all detected midi devices in div
	var newDeviceListStr = "Connected Devices:";
	$("#deviceListDiv").text(newDeviceListStr);	
	$("#deviceListDiv").append("<br/>");
	for (var i = 0; i < deviceList.length; i++) {
		var currDeviceName = deviceList[i];
		$("#deviceListDiv").append(currDeviceName + "<br/>");	
	};

	// DISCONNECTED MODULES
	// Detect on disconnection of a module - by checking that new device list contains all previously connected
	for (var blockID in app.hwObjects){
		var currDeviceName = app.hwObjects[blockID].devName;
		// Is the hardware device still present in the midi list ?
		if ( $.inArray(currDeviceName, deviceList) == -1){ // Returns -1 if A is not in B
			app.removeHwBlock(blockID);				
		}
	}
	
	// NEW CONNECTED MODULES
		
    for(var i = 0; i < deviceList.length ; i ++ ){
    	var currDeviceName = deviceList[i];
    	var foundBlockId = app.findBlockID(currDeviceName);
    	
    	if ( !foundBlockId ) { // if no device yet created
    		console.log("Found new midi device to connect to:" + currDeviceName );
    		
    		var newHwBlock = new HwBlock(currDeviceName);

    		if( newHwBlock.deviceDirection == "Input" ){// output
    			app.Pool.OpenMidiOut(currDeviceName);
    		}       		      		
    		// Always add new devices as possible midi inputs (so any device can receive MIDI messages )
   			app.Pool.OpenMidiIn(currDeviceName,function(name){return function(t,a){onNewMidiMsg(name,a);};}(deviceList[i]));        							        		
    	}
    }
	
}

// Main MIDI Message callback. Whenever a new midi message comes in
function onNewMidiMsg( deviceName, msg){
	// console.log("New midi msg generated by: " + deviceName);
	
	// When a device generates a message just send it to its self (hardware block)
	var blockID = app.findBlockID(deviceName);
	var block = app.blockObjects[blockID];
	block.onReceiveMessage(blockID,msg);
}

// MIDI pool object that dynamically creates new instances of the plugin for each
// Midi device
function MidiPool(){
 var place;
 var arr=[];
 var inputs={};
 var outputs={};
 if(arguments.length){
  if(arguments[0].isJazz){
   place=arguments[0].parentNode;
   arr[0]={plugin:arguments[0]};
  }
  else{
   try{ // if this is a good location to create plugins
    var tmp=create_plugin(arguments[0]);
    arr[0]={plugin:tmp};
    place=arguments[0];
   }
   catch(err){}
  }
 }
 if(place===undefined){ // otherwise create plugins at where the current script is
  var scripts=document.getElementsByTagName('script');
  place=scripts[scripts.length-1].parentNode;
 }
 if(!arr.length) arr[0]={plugin:create_plugin(place)};

 // Comment out so midi messages pass though even when browswer doesn't have focus
 // if(navigator.appName=='Microsoft Internet Explorer'){ document.onfocusin=onFocusIE; document.onfocusout=onBlurIE;}
 // else{ window.onfocus=connectMidi; window.onblur=disconnectMidi;}

 function create_plugin(where){
  var obj=document.createElement('object');
  obj.classid="CLSID:1ACE1618-1C7D-4561-AEE1-34842AA85E90";
  if(!obj.isJazz) obj.type="audio/x-jazz";
  obj.style.visibility='hidden';
  obj.style.width='0px'; obj.style.height='0px';
  where.appendChild(obj);
  if(obj.isJazz) return obj;
  where.removeChild(obj);
  throw "Cannot create Jazz-Plugin";
 }

 function connectMidi(){
  try{
   for(i=0;i<arr.length;i++){
    if(arr[i].in){
     if(arr[i].func) arr[i].plugin.MidiInOpen(arr[i].in,arr[i].func);
     else arr[i].plugin.MidiInOpen(arr[i].in);
    }
    if(i && arr[i].out) arr[i].plugin.MidiOutOpen(arr[i].out);
   }
  }
  
 	catch(err){
  		// res.innerHTML=res.innerHTML+' ERR: '+err;
 	}
 }

 function disconnectMidi(){
  try{
   for(i=0;i<arr.length;i++){
    if(arr[i].in) arr[i].plugin.MidiInClose();
    if(i && arr[i].out) arr[i].plugin.MidiOutClose(); // don't close the default out
   }
  }
  catch(err){}
 }
 function onFocusIE(){
  active_element=document.activeElement;
  connectMidi();
 }
 var active_element;
 function onBlurIE(){
  if(active_element!=document.activeElement){ active_element=document.activeElement; return;}
  disconnectMidi();
 }

 this.MidiOutList=function(){ return arr[0].plugin.MidiOutList();}
 this.MidiInList=function(){ return arr[0].plugin.MidiInList();}
 this.MidiOut=function(name,msg){ if(outputs[name]) outputs[name].plugin.MidiOutLong(msg);}
 this.ClearMidiIn=function(name){ if(inputs[name]) inputs[name].plugin.ClearMidiIn();}
 this.QueryMidiIn=function(name){ if(inputs[name]) return inputs[name].plugin.QueryMidiIn();}
 
 this.OpenMidiOut=function(name){
  if(outputs[name]) return;
  var i;
  for(i=0;i<arr.length;i++) if(!arr[i].out) break;
  if(i==arr.length){
   arr[i]={plugin:create_plugin(place)};
  }
  arr[i].out=name;
  arr[i].plugin.MidiOutOpen(name);
  outputs[name]=arr[i];
 }

 this.OpenMidiIn=function(name,func){
  if(!inputs[name]){
   var i;
   for(i=0;i<arr.length;i++) if(!arr[i].in) break;
   if(i==arr.length){
    arr[i]={plugin:create_plugin(place)};
   }
   arr[i].in=name;
   inputs[name]=arr[i];
  }
  if(func) inputs[name].plugin.MidiInOpen(name,func); else inputs[name].plugin.MidiInOpen(name);
  inputs[name].func=func;
 }
}

//////////  MIDI Connections - jsplumb callback on change of any connection
function updateConnections (info, shouldRemove){
	console.log("Updating connections");

	// First check if we plugged input a code block
	// Code blocks have divs with ID = clobject-4 etc , hardware div have id:light-1_container
	var sourceElem = $("#"+info.sourceId);
	var targetElem = $("#"+info.targetId);
	var targetInputElem;
	var targetOutputElem;

	var sourceID = info.sourceId.split("-")[1];
	var targetID = info.targetId.split("-")[1];
	var sourceName = app.blockObjects[sourceID].devName; // remove any underscores
	var targetName = app.blockObjects[targetID].devName;
	
	console.log("source name: " + sourceName + " sourceID: " + sourceID);
	console.log("target name: " + targetName + " targetID: " + targetID);
	
	if (shouldRemove){
		app.blockObjects[sourceID].removeOutputConnection(app.blockObjects[targetID]);
		app.blockObjects[targetID].removeInputConnection(app.blockObjects[sourceID]);
	}else{
		app.blockObjects[sourceID].addOutputConnection(app.blockObjects[targetID]);
		app.blockObjects[targetID].addInputConnection(app.blockObjects[sourceID]);
	}		
}


// Code to evaluate text boxes
// assumes that we are passing in the ID of the codebox object 
function evalCodeBlock(codeBlockID){
	
	console.log("Evaling code block");
	
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
}

// Checks if the string is a valid javascript expression 
// i.e. a full statement 
function isValidLine(line){
	if(! line 
		|| line.match("{[^}]*$") // open ended block ( { not closed ) e.g. if () { ...
		|| line.match("^\s*}\s*$") // close bracket hanging out by itself
		// || line.match("^\s*(if|else)") // starts with keyword ( with arbitrary spaces)
	){return false }
	else {
	 return true;
	}
}

// Checks if statement can be returned in an eval
// Assignments , and lines with keywords cannot be returned by javascript syntax
function isValidReturnValue(line){

	if(! line 
		|| line.match("^\s*(if|else|var)") // starts with keyword ( with arbitrary spaces)
		|| line.match("^\s*}\s*$") // close bracket hanging out by itself
		|| line.match("=") // has assignment 
	){return false }
	else {
	 return true;
	}
}

// Is the line an assigment
function isAssignmentLine(line){

	if(! line ) return false;

	// is X = Y , not X == Y
	var foundMatch = line.match(/(\w+)[^=]?=[^=]?(\w+)/);
	
	return 	foundMatch;
}

// Returns a number between 0-100 from a standard midi message
function convertMidiMsgToNumber(msg){
	if(!msg || msg.length !=3) {
		console.log("Error trying to convert invalid midi msg");
		return;
	}

	if (msg[0] == 144 ) return 100; // note on
	if( msg[0] == 128 ) return 0;	// note off
	if (msg[0] == 227) {			// pitch change
		var midiVal = msg[2]; //0-127
		return Math.floor(100*midiVal/127)
	}		
}

// Converts a number from 0-100 into a midi message
function convertPercentToMidiMsg( num ){	
	if (num == 100 ) return [144,60,69]; 			    // note on
	else if( num == 0 ) return [128,60,69];	    // note off
	else return  [227,0,Math.round(127*num/100)];   // continuous pitch change		
}

