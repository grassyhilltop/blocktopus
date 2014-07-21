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

BlockObject.prototype.removeConnection = function (outputConnectionObj){
	console.log("removing connection");
	delete this.outConnections[outputConnectionObj.blockID];
};

BlockObject.prototype.addConnection = function (outputConnectionObj){
	console.log("adding connection from " + this.blockID + " to " + outputConnectionObj.blockID);
	this.outConnections[outputConnectionObj.blockID] = outputConnectionObj;
};

function HwBlock(devName,viewObj){
	
	console.log("Creating new hardware block with name:" + devName);

	var obj = this;
	BlockObject.call(this,viewObj);
	this.type = "hw";						 // object type	
	this.devName = devName; 	             // Assumes midi device name in format "button-5"
	this.deviceType = devName.split("-")[0]; // Just the type part of the name "button"
	this.deviceIDNum = devName.split("-")[1];// Just the numerical part of the name "5"
	this.data = ""; 						 // Current state of device
	this.deviceDirection = getDeviceTypeFromName(this.deviceType); // e.g. has Input or Output
	app.addNewHwBlock(this);
	
	// Create a default hardware view
	if(!viewObj){
		
   		var x = 50 + 400* Math.random();
		var y = 100+ 400* Math.random();
		
		if(obj.deviceType =="Button" || obj.deviceType =="Buzzer")  obj.data = "OFF";
		else obj.data = "0%";		
		
		obj.viewObj = drawFlowNode(x , y , obj.deviceIDNum , obj.deviceType , obj.data);
	} 

	// Remove hardware view
	this.deleteView =function (){
				
		deleteNode(obj.viewObj); // Clean up jsplumb connectors
		$(obj.viewObj).remove();
	}

	// Called when the block state has changed - update data and view
	this.update = function(fromBlockID,msg){
		console.log("Updating hardware block:" + obj.devName);

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
	}

	this.onReceiveMessage = function(fromBlockID,msg){
		console.log("Hardware: " + obj.devName +" blockID:" + obj.blockID + " recevied msg: " + msg +" from id:" + fromBlockID);

		// If we were the hardware the generated the message
		if (obj.blockID == fromBlockID){console.log("Hardware: " + obj.devName + " message to self");
			// Todo process the message if needed here e.g. check valid message cleaning...
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

HwBlock.prototype.sendToAllOutputs = function(msg){
	console.log("sending to all outputs");
	for (targetBlockID in this.outConnections){
		this.sendMsg(targetBlockID, msg);
	}
};

HwBlock.prototype.sendMsg = function(targetBlockID, msg){
	console.log("Sending message to " + targetBlockID + " from " + this.blockID);
	app.blockObjects[targetBlockID].onReceiveMessage(this.blockID, msg);
};


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

function CodeBlock(viewObj){
	var obj = this;
	this.base = BlockObject;
	this.base(viewObj);
	this.type="sw";
	//this.evalBlock = function
};
CodeBlock.prototype = new BlockObject;



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

	// // Send the message out to the pool
	app.Pool.MidiOut(name,msg);
	// print_msg(name,msg,true);	

	// This NEVER SEEMS TO GET CALLED ??
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

function format(msg){
	var tmp=[];
 	for(var i in msg) {
 		tmp[i]=(msg[i]<16?"0":"")+msg[i].toString(16);
 	}
 	return tmp.join(" ");
}

// When we actually receive a message
function print_msg(name,msg,out){
	
	console.log("name:" + name + " msg:" + msg  +" out:"+out);

	// Update the sensor value for the flow node 
	// js
	
	var splitName = name.split("-");
	var nameShort = splitName[0];
	var deviceUDID  = splitName[1];
	var newVal = "";
	//todo set hidden return value in nodes

	// On off type message
	if(msg[0] == 144){
		newVal = 100;
		$("#sensorVal"+deviceUDID).text("ON");
	}
	else if (msg[0] == 128){
		newVal = 0;
		$("#sensorVal"+deviceUDID).text("OFF");		
	}

	// control change for pitch wheel
	else if (msg[0] == 227 || msg[0] == 176 ){
		var sensorPercent = Math.floor(100*msg[2]/127);
		newVal = sensorPercent;
		// special case for temperature
		if(nameShort =="Temp") {
			var temperature = 25 + (sensorPercent%50); 
			$("#sensorVal"+deviceUDID).text( temperature +"°C");
		}
		else $("#sensorVal"+deviceUDID).text( sensorPercent +"%");
	}

	$("#sensorVal"+deviceUDID).val(newVal);

	//Routing midi messages between devices -----
	//  If we have a connection from this device to another output
	var connectedOutput = deviceToDeviceConnections[name];
	if( connectedOutput ){

		// If we are connected to a CODE BOX
		if (connectedOutput.split("-")[0]=="clobject"){
			var codeBoxElem = $("#"+connectedOutput);
			
			// Update the code box
			codeBoxElem.find(".codeArgInput").val(newVal);
			var result = evalCodeBox(codeBoxElem,name);
			// codeBoxElem.find(".returnValInput").val(result);						
			// $("#"+connectedOutput).find(".codeArgVal").text("foo");			
		}
		else {
			// Connected directly to hardware
			console.log("ROUTING from " + name + " to:" + connectedOutput);
			midi_out(connectedOutput,[msg[0],msg[1],msg[2]]); 			
		}
	}	
}	

/////////////////////////////

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
	console.log("New midi msg generated by: " + deviceName);
	
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

////////// Joel MIDI Connections - jsplumb callback on change of any connection
function updateConnections (info, shouldRemove){
	console.log("Updating connections");

	// First check if we plugged input a code block
	// Code blocks have divs with ID = clobject-4 etc , hardware div have id:light-1_container
	var sourceName = info.sourceId.split("_")[0]; // remove any underscores
	var targetName = info.targetId.split("_")[0];
	var sourceElem = $("#"+info.sourceId);
	var targetElem = $("#"+info.targetId);
	var targetInputElem;
	var targetOutputElem;

	var sourceID = app.findBlockID(sourceName);
	var targetID = app.findBlockID(targetName);	
	console.log("source name: " + sourceName + " sourceID: " + sourceID);
	console.log("target name: " + targetName + " targetID: " + targetID);
		if (shouldRemove){
		app.blockObjects[sourceID].removeConnection(app.blockObjects[targetID]);
	}else{
		app.blockObjects[sourceID].addConnection(app.blockObjects[targetID]);
	}
	
	
	if(shouldRemove){
		// Find the sensor and remove it from the connection list
		if(deviceToDeviceConnections[sourceName]){
			delete deviceToDeviceConnections[sourceName];			
		}
		return;
	}
	
	// Connecting TO CODE BLOCK
	if( targetName.split("-")[0] == "clobject" ) {
		console.log("made connection to code block");
		// Fill in the first line of the code with the output
		var elem = targetElem.find(".freeCell");
		var elemHTML = elem.html();

		var firstVarName = "input";
		var firstVarValue = 0;

		
		// Two cases: either the source is a text block or hardware
		// CONNECTING FROM CODE 
		if ( sourceName.split("-")[0] == "clobject" ){
						
			// Get the return value of the source code box if one is defined there
			var returnVal = sourceElem.find(".returnValInput").val();
			if (returnVal) firstVarValue = returnVal;
		}  
		else{ // CONNECTING FROM HARDWARE 

			firstVarName = sourceName.split("-")[0].toLowerCase(); // just the name of the sensor	
			var deviceUDID = sourceName.split("-")[1];
			
			firstVarValue =	$("#sensorVal"+deviceUDID).val();
		
		}

		targetInputElem = elem.find(".codeArgInput");
		var foundExistingArgName = elem.find(".codeArgName");
		
		// Update the first line of the block or append a new line
		if (targetInputElem.length != 0) {
			// If there is already an input value field just update it
			foundExistingArgName.text(firstVarName);
			targetInputElem.val(firstVarValue);
			
		} else{ // append a new name
			var firstLine = "<div>" + "<span class='codeArgName'>"+ firstVarName + 
			"</span> = <input class='codeArgInput' value='" + firstVarValue + "'></input> </div> ";		
			elem.html(firstLine + elemHTML);
			targetInputElem = elem.find(".codeArgInput");			
		}
		
		// Attach a return val input box
		targetOutputElem = elem.find(".returnValInput");
		if(targetOutputElem.length != 0){

		} else{
			var returnVal = firstVarValue;
			var blankLine = "<div>  </div>";
			var lastLine = "<div>out = <input class='returnValInput' value='" + returnVal + "'></input> </div> ";		
			elem.append(blankLine);			
			elem.append(lastLine);			

		}

		jsPlumb.repaint(elem.parent())				
	}

	// -------------------------------------
	// MAP CONNECTIONS 
	// -------------------------------------
	
	// Bind a change event with the input
	// targetInputElem.change(onInputChange); // only works for keyinput, lost focus

	deviceToDeviceConnections[sourceName] = targetName;
}

function onInputChange(value){
	console.log("Input changed to new value:" + value );
}

// Code to evaluate text boxes
// assumes that we are passing in the container element (clay object clobject)
// sourceName is the parent connecting node
function evalCodeBox(clobjectDiv,sourceName){
	
	console.log("evaling code box");

	var elem = clobjectDiv.find(".freeCell");
	var inputValue = elem.find(".codeArgInput").val();
	var outputValueElem = elem.find(".returnValInput");
	var connectedOutput = deviceToDeviceConnections[clobjectDiv[0].id];
	var connectedOutputElem = $("#"+connectedOutput);
	
	var str = elem.html().replace(/(<\/div>)|(<div>)/g,"\n"); // split into new lines	
	var lines = str.trim().split("\n");
		
	//remove empty lines
	var trimmedlines = [];
	for (var i = 0; i < lines.length; i++) {
		if ( lines[i].trim() !="" && lines[i] !="<br>" ) trimmedlines.push(lines[i]);
	};
	lines = trimmedlines;
	
	if(inputValue) {
		var firstVarName = sourceName.split("-")[0].toLowerCase();
		if( firstVarName =="clobject") firstVarName = "input";
		lines[0] = "var "+ firstVarName+ " =" + inputValue; // first line is an input variable	
		lines[lines.length-1] = ""; // blank out last line (will be evaled)
	} 


	if(lines.length < 2){ 
		console.log("error while evaling code box.. not enough lines");
	} else if (lines.length == 2){
		// just pass the value through
		outputValueElem.val(inputValue)
		
		if (connectedOutput) {
			// TODO if we are connected to another code box... eval it 
			if(connectedOutput.split("-")[0] == "clobject"){
				var nextInput = connectedOutputElem.find(".codeArgInput");
				nextInput.val(outputValueElem.val());
				
				evalCodeBox($("#"+connectedOutput) ,clobjectDiv[0].id); 
			} else{
				// If we are CONNECTED TO HARDWARE send message onwards
				sendMsgToHardware(connectedOutput,inputValue);
			}
		}
		return inputValue; 
	}

	var codeStr= "function(){";
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];
		// always put a return statement on the last line
		if (i == lines.length-2 ) line = "return (" + line + ")";
		
		if(!line) continue; // skip blank lines

		console.log("currline is:" +line);
		
		line +=";" ; // add semicolon to each line

		codeStr += line;
	};
	
	codeStr +="}";
	console.log("eval code str:"+codeStr);		

	var result = tryEval(codeStr)();
	console.log("evaled code box with results:" +result);

	if(outputValueElem) {
		outputValueElem.val(result);	
// 		if (connectedOutput) sendMsgToHardware(connectedOutput,result);	
		// Todo factor out
		if (connectedOutput) {
			// TODO if we are connected to another code box... eval it 
			if(connectedOutput.split("-")[0] == "clobject"){
				var nextInput = connectedOutputElem.find(".codeArgInput");
				nextInput.val(outputValueElem.val());
				
				evalCodeBox($("#"+connectedOutput) ,clobjectDiv[0].id); 
			} else{
				// If we are CONNECTED TO HARDWARE send message onwards
				sendMsgToHardware(connectedOutput,result);
			}
		}
	}

	return result;
}


function sendMsgToHardware( name , value){
	console.log("sending msg to hardware:" +name + " val:" + value);
	if (value == 0)	{		
		midi_out(name,[128,60,value]);
	} else if (value == 100){
		midi_out(name,[144,60,value]);
	} else{
		midi_out(name,[227,0,Math.floor(127*value/100)]);
	}

} 
