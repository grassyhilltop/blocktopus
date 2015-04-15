//on the client

window.addEventListener("load",function () {
	app = new ClientApp();
});


//TODO: want to keep this only on the server and get it on request
deviceTypes = {
	"Knob": {"direction":"Output", "addControlElem": emuKnobAddControlElem},
	"Angle": {"direction":"Output", "addControlElem": emuKnobAddControlElem},
	"Timer": {"direction":"Output", "addControlElem": emuTimerAddControlElem},
	"Button": {"direction":"Output", "addControlElem": emuButtonAddControlElem},
	"Slider": {"direction":"Output","addControlElem": emuSliderAddControlElem},
	"Light_Sensor": {"direction":"Output", "addControlElem": emuKnobAddControlElem},
	"Temperature": {"direction":"Output", "addControlElem": emuKnobAddControlElem},
	"Heater": {"direction":"Input", "addControlElem": emuHeaterAddControlElem},
 	"Fan": {"direction":"Input","addControlElem": emuFanAddControlElem},
	"Light": {"direction":"Input","addControlElem": emuLEDAddControlElem},
	"Motion_Sensor": {"direction":"Output", "addControlElem": emuMotionAddControlElem},
	"Motor": {"direction":"Input", "addControlElem": emuMotorAddControlElem},
// "RGB_LED": {"direction":"Input"},
	"Buzzer": {"direction":"Input"}
};

function ClientApp() {
	var obj = this;
	this.numBlocks = 0;
	this.blockObjects = {};
	this.blockTypeCounts = {};
	this.realHwObjects = {};
	this.socket; 
	
	this.newBlockID = function () {
		return obj.numBlocks++;
	};
	
	this.getDeviceTypeFromName = function (deviceName){
		if(deviceName in deviceTypes){
		return deviceTypes[deviceName]["direction"];
		}else{
			return null;
		}
	}
	
	this.addNewBlock = function (block) {
		obj.blockObjects[block.blockID] = block;
		// Update display names e.g. block1
		//obj.updateDisplayName(block.blockID);
	};
	
	this.updateDisplayName = function (blockObject){
		var currBlock = blockObject;
		
		var typeName ="";
		if (currBlock.type == "hw")	typeName =  currBlock.deviceType;	
		else typeName = "input"; 	
		
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
	};

	this.addNewRealHwBlock = function (hwBlock) {
		console.log("adding new Hw Block!");
		obj.addNewBlock(hwBlock);
		obj.realHwObjects[hwBlock.blockID] = hwBlock;
		this.menu.addToHwList(hwBlock.blockID);
	};
	
	this.removeRealHwBlock = function (blockID) {
		this.menu.removeFromHwList(blockID);
		obj.removeBlock(blockID);
		delete obj.realHwObjects[blockID];
	};
	
	this.addNewEmuHwBlock = function (hwBlock) {
		obj.addNewBlock(hwBlock);
		this.menu.addToEmuHwList(hwBlock.blockID);
	};
	
	this.removeEmuHwBlock = function (blockID) {
		this.menu.removeFromEmuHwList(blockID);
		obj.removeBlock(blockID);
	};

	this.findBlockID = function (devName){
		for (blockID in obj.realHwObjects){
			if(obj.realHwObjects[blockID].devName == devName){
				return blockID;
			}
		}
	};
	
	this.hasBlock = function (queryID){
		if(queryID in obj.blockObjects){
			return true;
		}else{
			return false;
		}
	};
	
	this.getBlockObjects = function () {
		return this.blockObjects;
	};
	
	// Polling for midi devices
	// TODO: cleanup update
	//this.pollServerForMidiDevices = function () {
		this.updateBlockList = function(blockList) {
			if(blockList){
			
				// DISCONNECTED MODULES
				// Detect on disconnection of a module - by checking that new device list contains all previously connected
				for (var blockID in obj.blockObjects){
				//	var currDeviceName = app.blockObjects[blockID].devName;
					// Is the hardware device still present in the midi list ?
					if (!(blockID in blockList)){ // Returns -1 if A is not in B
						if(obj.blockObjects[blockID].type == "sw"){
								app.removeBlock(blockID);		
						}else{
							if(obj.blockObjects[blockID].devIDNum =="E"){
								app.removeEmuHwBlock(blockID);	
							}else{
								app.removeRealHwBlock(blockID);	
							}
						}
					}
				}
	
				// NEW CONNECTED MODULES
				for(var block in blockList){
					var foundBlockId = obj.hasBlock(block);
					if (!foundBlockId) { // if no device yet created
						//Software blocks
						if(blockList[block]["type"] == "sw"){
							var newSwBlock = new CodeBlock(block,blockList[block]["x"],blockList[block]["y"],blockList[block]["text"]);
						//Hardware Blocks
						}else{
							console.log("Found new block:" + blockList[block]["devName"]);
							//emulated Hw Devices
							// js: why is there speacial case code for this?
							if(blockList[block]["devIDNum"]=="E"){
								if(blockList[block]["devName"] == "Timer-E"){
									var newEmuTimerBlock = new EmuTimerBlock(blockList[block]["devName"],block);
								}else if((blockList[block]["devName"] == "Fan-E")){
									var newobj = new EmuFanBlock(blockList[block]["devName"],block);
								}else if((blockList[block]["devName"] == "Motor-E")){
									var newEmuMotorBlock = new EmuMotorBlock(blockList[block]["devName"],block);
								}
								else{
									var newHwBlock = new EmuHwBlock(blockList[block]["devName"],block);
								}
							//Real Hw Devices
							}else{
								//check for weird midi device from edison
								var deviceName = blockList[block]["devName"].split("-")[0];
								if(obj.getDeviceTypeFromName(deviceName)){
									if(blockList[block]["devName"].substring(0, blockList[block]["devName"].length - 2) == "RGB_LED"){
										var newHwBlock = new RGB_LED(blockList[block]["devName"],block);
									}
									else{
										var newHwBlock = new RealHwBlock(blockList[block]["devName"],block);
									}
								}
							}
						}
					}
				}
				//Once all blocks are redrawn, then add connections
				//TODO: have this work be done only on refresh
				for(var block in blockList){
					//console.log(blockList[block]["outConnections"]);
					if(blockList[block]["outConnections"]){
						for (var i = 0; i < blockList[block]["outConnections"].length; i++){
							var outC = blockList[block]["outConnections"][i];
							//console.log("FROM: " + "block-"+block + "TO: " + "block-"+outC);
							var sourceUUID = "block-"+block+"BottomCenter";
							var targetUUID = "block-"+outC+"TopCenter";
							console.log("Attempting to reconnected uuids: " + sourceUUID + " " + targetUUID);
							jsPlumb.connect({uuids:[sourceUUID, targetUUID]});
						}
				 	}
				}
			}else{
				console.log("block list is null!");
			}
		}
		//getDeviceListFromServer(callback);
	//}
	
	// MIDI FUNCTIONS
	this.setupMidi = function () {
		console.log("Setting up midi");
		// Poll for new midi devices
		
		getDeviceListFromServer(this.updateBlockList);
	};
	
	this.setupSocketIO = function ()  {
		console.log("Setting up socket IO");
		this.socket = io.connect();
		
		this.socket.on('message',function(data) {
		   console.log(data.message);
		});
		
		this.socket.on('midiMsg',function(data) {
			console.log("data.blockID: " + data.blockID);
			obj.blockObjects[data.blockID].onReceiveMessage(data.blockID,data.msg);
		});
		
		this.socket.on('midiMsg',function(data) {
			console.log("data.blockID: " + data.blockID);
			obj.blockObjects[data.blockID].onReceiveMessage(data.blockID,data.msg);
		});
		
		this.socket.on('codeBlockVal',function(data) {
			var blockID = data.blockID;
			var val = data.val;
			var fromBlockID = data.fromBlockID;
			var msg = data.msg;
			obj.blockObjects[data.blockID].update(fromBlockID, msg, val);
		});
		
		this.socket.on('codeBlockErr',function(data){
			var blockID = data.blockID;
			var error = data.error;
			console.log("ERROR: in executing code in block : " + error);
			obj.blockObjects[blockID].displayError(error);
		});
		
		this.socket.on('blockList',function(data) {
			var blockList = data.blockList;
			obj.updateBlockList(blockList);
		});
	};
	
	this.sendNewCodeBlockToServer = function (x,y) {
		var NEW_CODE_BLOCK_URL = "/newCodeBlock";
		var postArgs = JSON.stringify({x: x, y: y});
		request = new XMLHttpRequest();
		console.log("Post args: " + postArgs);
	
		request.open('POST', NEW_CODE_BLOCK_URL);
		request.setRequestHeader('Content-type', "application/json;charset=UTF-8");
		request.send(postArgs);
	};
	
	this.removeCodeBlockFromServer = function (blockID){
		var REMOVE_CODE_BLOCK_URL = "/removeCodeBlock";
		var postArgs = JSON.stringify({blockID: blockID});
		var obj = this;
		request = new XMLHttpRequest();
		console.log("Post args: " + postArgs);
	
		request.addEventListener('load',function () {
			if(request.status == 200){
				//var results = JSON.parse(request.responseText);
			}else{
				console.log("error trying to remove emu hw block!");
			}
		});

		request.open('POST', REMOVE_CODE_BLOCK_URL);
		request.setRequestHeader('Content-type', "application/json;charset=UTF-8");
		request.send(postArgs);
	};
	
	this.masterClickHandler = function () {
		var x = event.pageX;
		var y = event.pageY;

		// What did we click on ? 
		var elem = event.target;
	
		var id = elem.id;                    
		var elemType = elem.tagName.toLowerCase();
		var elemParent =  elem.parentNode;
		if(elemParent) var elemParentType = elemParent.tagName;
		//console.log( "You Clicked a " + elemType + " with id: " + elem.id + " parent :" + elemParentType);

		// Depending on what we clicked launch some other click handlers

		// Click in empty workspace
		if ($("#"+elem.id).hasClass("section")){
			//Tell the server to create a code block
			// This moved to double click handler
			// obj.sendNewCodeBlockToServer(x,y);
		}

		// if you clicked on an object set the selected property
		else {
			// If the type of object is inside freeHTMLContainer select its container
			var freeContainer = $(elem).closest('.freeHTMLContainer');
			$(freeContainer).toggleClass("selected");
		}
	};

	this.masterDoubleClickHandler = function () {

		var x = event.pageX;
		var y = event.pageY;

		// What did we click on ? 
		var elem = event.target;
	
		var id = elem.id;                    
		var elemType = elem.tagName.toLowerCase();
		var elemParent =  elem.parentNode;
		if(elemParent) var elemParentType = elemParent.tagName;
		//console.log( "You Clicked a " + elemType + " with id: " + elem.id + " parent :" + elemParentType);
		// console.log("DOUBLE CLICK");
		
		// Depending on what we clicked launch some other click handlers
		
		// Click on DOUBLE CLICK in empty workspace
		if ($("#"+elem.id).hasClass("section")){
			//Tell the server to create a code block
			obj.sendNewCodeBlockToServer(x,y);
		}
	}
	
	this.setupCodeBlocks = function () {
		window.addEventListener("click", this.masterClickHandler); 
		window.addEventListener("dblclick", this.masterDoubleClickHandler); 
	};
	
	// Functions to call when the app is first opened
	this.menu = new Menu();
	this.menu.addEmuHwBtns(deviceTypes);
	this.menu.addCodeBtn();
	this.setupMidi();
	this.setupSocketIO();
	this.setupCodeBlocks();
};

getDeviceListFromServer = function(callback) {
	var DEVICES_URL = '/devices';
	request = new XMLHttpRequest();
	
	request.addEventListener('load',function () {
		if(request.status == 200){
			var results = JSON.parse(request.responseText);
			callback(results);
		}else{
			callback(null);
		}
	});

	request.open('GET', DEVICES_URL, true);
	request.send();    
};

function Menu() {
	var obj = this;
	var $menuDiv = $("#menu");
	var $hwList = $("#hardwareList");
	 
 	this.addToHwList = function (blockID) {
 		$hwList = $("#hardwareList");
		var $newHwEntry = $("<li></li>");
		//$newHwEntry.text(app.blockObjects[blockID].displayName);
		$newHwEntry.append("<i class='fa fa-square fa-lg white shadow'></i>");
		$newHwEntry.attr("id", "hw_entry"+blockID);
		$newHwEntry.append(" "+ app.blockObjects[blockID].displayName);
		$newHwEntry.attr("class", "hw_sidebar_entry");
		$hwList.append($newHwEntry);
 	};
 	
  	this.removeFromHwList = function (blockID) {
 		$hwEntry = $("#hw_entry"+blockID);
		$hwEntry.remove();
 	};
 	
  	this.addToEmuHwList = function (blockID) {
 		$emuHwList = $("#emulatedList");
 		var hwEmuCreated = app.blockObjects[blockID].displayName;
 		var block = app.blockObjects[blockID];
 		var id = blockID;
		var newEmuHwEntry = templates.renderEmuHwCreated({id:id,name:hwEmuCreated});
		$emuHwList.append(newEmuHwEntry);
		
		//add event handler for click on button
		var $newEmuHwEntry = $("#"+"hwEmuCreated"+blockID);
		$newEmuHwEntry.bind("click", function(event) {
			$newEmuHwEntry.parent().remove();
			block.RemoveOnServer();
		});
 	};
 	
   	this.removeFromEmuHwList = function (blockID) {
 		$emuHwEntry = $("#emu_entry"+blockID);
		$emuHwEntry.remove();
 	};
 	
 	this.sendNewEmuHwToServer = function (emuHwType) {
 		var NEW_EMU_HW_URL = "/newEmuHw";
		var postArgs = JSON.stringify({emuHwType: emuHwType});
		request = new XMLHttpRequest();
		console.log("Post args: " + postArgs);
	
		request.open('POST', NEW_EMU_HW_URL);
		request.setRequestHeader('Content-type', "application/json;charset=UTF-8");
		request.send(postArgs);
		console.log("sent update to new emu hw");
 	};
 	
 	this.addEmuHwBtns = function(devices){
 		console.log("adding emulated hardware buttons");
 		$emuHwOptList = $("#emulationOptionsList");
 		
 		for (var key in devices){
 			//add html for button
 			var newEmuHwBtnHTML = templates.renderEmuHwBtn({name:key});
 			$emuHwOptList.append(newEmuHwBtnHTML);
 			
 			//add event handler for click on button
 			//js
 			var newEmuHwBtnElem = $("#"+"hwEmuBtn"+key);
 			newEmuHwBtnElem.bind("click", function(event) {
 				// var target = event.target; //js: there is a bug here if clicking on icon, grabs icon and not parent <li>
 				var target = $(this);  // Use the jquery selector to avoid ambiguity. This is <li> 				
 				var emuHwType = $(target).attr("id").substr(8) + "-E"; // ?? js: why substr the name?
 				console.log("new emulated hw :" + emuHwType + " clicked");
 				//var newEmuHw = new EmuHwBlock(emuHwType);
 				// check that the hardware is valid before sending to server
 				obj.sendNewEmuHwToServer(emuHwType);
 			});
		};
		
 	};

 	this.addCodeBtn = function(){
		key = "Code";

		//add html for button
		var newEmuHwBtnHTML = templates.renderEmuHwBtn({name:key});
		$emuHwOptList.append(newEmuHwBtnHTML);
		
		//add event handler for click on button
		var newEmuHwBtnElem = $("#"+"hwEmuBtn"+key);
		newEmuHwBtnElem.bind("click", function(event) {
			var target = $(this);;
			var emuHwType = $(target).attr("id").substr(8) + "-E";
			console.log("new emulated codebox :" + emuHwType + " clicked");

			// Add a little randomness to where the box is drawn to avoid two boxes exactly overlapping
			app.sendNewCodeBlockToServer(500+100*Math.random(),300+100*Math.random());
		});
 	};
 	
};

function BlockObject(viewObj,blockID){
	console.log("creating block object");
	var obj = this;
	this.viewObj = viewObj;
	this.inConnections = {};
	this.outConnections = {};
	this.blockID = blockID;
	this.type = typeof this.type !== 'undefined' ? this.type : "block";
	this.displayName = typeof this.displayName !== 'undefined' ? this.displayName : "block";
	
	this.data = typeof this.data !== 'undefined' ? this.data : 0;
	app.updateDisplayName(this);
};

BlockObjectClone = function () {};
BlockObjectClone.prototype = BlockObject.prototype;

BlockObject.prototype.Remove = function(){
	console.log("deleting view!");	
	// Clean up jsplumb connectors
	jsPlumb.detachAllConnections(this.viewObj.id);
	jsPlumb.removeAllEndpoints(this.viewObj.id);

	// Remove the actual node
	$(this.viewObj).remove();
};

BlockObject.prototype.updateConnectionsOnServer = function(connectFrom, connectTo){
	var CONNECTIONS_URL = "/connections";
	var postArgs = JSON.stringify({connectFrom: connectFrom, connectTo: connectTo});
    //var postArgs = JSON.stringify({number:1});
    request = new XMLHttpRequest();
    console.log("Post args: " + postArgs);
	
	request.open('POST', CONNECTIONS_URL);
	request.setRequestHeader('Content-type', "application/json;charset=UTF-8");
	request.send(postArgs);
	console.log("sent update to connections");
};

BlockObject.prototype.removeConnectionsOnServer = function(connectFrom, connectTo){
	var CONNECTIONS_URL = "/delConnection";
	var postArgs = JSON.stringify({connectFrom: connectFrom, connectTo: connectTo});
    //var postArgs = JSON.stringify({number:1});
    request = new XMLHttpRequest();
    console.log("Post args: " + postArgs);
	
	request.open('POST', CONNECTIONS_URL);
	request.setRequestHeader('Content-type', "application/json;charset=UTF-8");
	request.send(postArgs);
	console.log("sent remove to connections");
};

BlockObject.prototype.removeOutputConnection = function (outputConnectionObj){
	// console.log("removing output connection");
	delete this.outConnections[outputConnectionObj.blockID];
	this.removeConnectionsOnServer(this.blockID,outputConnectionObj.blockID);
};

BlockObject.prototype.addOutputConnection = function (outputConnectionObj){
	// console.log("adding output connection from " + this.blockID + " to " + outputConnectionObj.blockID);
	this.outConnections[outputConnectionObj.blockID] = outputConnectionObj;
	this.updateConnectionsOnServer(this.blockID,outputConnectionObj.blockID);
};

BlockObject.prototype.removeInputConnection = function (inputConnectionObj){
	// console.log("removing input connection");
	delete this.inConnections[inputConnectionObj.blockID];
	this.removeConnectionsOnServer(inputConnectionObj.blockID,this.blockID);
};

BlockObject.prototype.addInputConnection = function (inputConnectionObj){
	// console.log("adding input connection from " + inputConnectionObj.blockID + " to " + this.blockID );
	this.inConnections[inputConnectionObj.blockID] = inputConnectionObj;
	this.updateConnectionsOnServer(inputConnectionObj.blockID,this.blockID);
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

function HwBlock(devName,blockID){
	console.log("Creating new hardware block with name:" + devName);
	var obj = this;
	this.type = "hw";						 // object type
	this.devName = devName; 	             // Assumes midi device name in format "button-5"
	this.deviceType = devName.split("-")[0]; // Just the type part of the name "button"
	this.deviceIDNum = devName.split("-")[1];// Just the numerical part of the name "5"
	this.data = 0; 						 // Current state of device
	this.deviceDirection = app.getDeviceTypeFromName(this.deviceType); // e.g. has Input or Output
	this.displayName = typeof this.displayName !== 'undefined' ? this.displayName : this.deviceType;
	BlockObject.call(this,undefined,blockID);

	console.log("block ID:" + this.blockID);
	console.log("displayName: " + obj.displayName);
	
	// Create a default hardware view
	if((undefined === this.viewObj)){
		var displayVal = obj.data ;
		if(obj.deviceType =="Button" || obj.deviceType =="Buzzer")  displayVal = "OFF";
		else if(obj.deviceType =="Timer") displayVal = "OFF";
		else displayVal = "0%";		
		
		this.viewObj = drawHardwareBlock(this, this.blockID, obj.deviceIDNum , obj.deviceType, obj.displayName , displayVal);
	}
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
	//	midi_out(this.devName,[msg[0],msg[1],msg[2]]);
	}
	else if (this.deviceDirection == "Output"){ // Sensor
	//	this.sendToAllOutputs(msg);	// Send to any connected output blocks
	}
	else{
	//	console.log("Error: HwBlock should be an output or input device!");
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
		$("#sensorVal"+obj.blockID).text("ON");
	}
	else if (msg[0] == 128){
		newVal = 0;
		$("#sensorVal"+obj.blockID).text("OFF");		
	}

	// control change for pitch wheel
	else if (msg[0] == 227 || msg[0] == 176 ){
		var sensorPercent = Math.round(100*msg[2]/127);		
		newVal = sensorPercent;
		// special case for temperature
		if(obj.deviceType =="Temperature") {
		
			// var temperature = 25 + (sensorPercent%50); 
			$("#sensorVal"+obj.blockID).text( sensorPercent +"°F");
		} else if (obj.deviceType =="Angle") {
			$("#sensorVal"+obj.blockID).text( sensorPercent +"°");
		}
		else {				
			$("#sensorVal"+obj.blockID).text( sensorPercent +"%");
		}
	}
	$("#sensorVal"+obj.blockID).val(newVal);

	obj.data = newVal;
	
	return newVal;
};

HwBlockClone = function () {};
HwBlockClone.prototype = HwBlock.prototype;

function RealHwBlock(devName,blockID){
	console.log("creating Knob");
	HwBlock.call(this,devName,blockID);
	app.addNewRealHwBlock(this);
};

RealHwBlock.prototype = new HwBlockClone();
RealHwBlock.prototype.constructor = RealHwBlock;

RealHwBlockClone = function () {};
RealHwBlockClone.prototype = RealHwBlock.prototype;

function EmuHwBlock(devName,blockID){
	console.log("creating Emulated Hardware");
	HwBlock.call(this,devName,blockID);
	app.addNewEmuHwBlock(this);
	
	var devType = this.deviceType;
	// Null check then grab any custom control elements
	if(deviceTypes[devType] && deviceTypes[devType]["addControlElem"]){ 
		var controlID = deviceTypes[devType]["addControlElem"](this);
	}
	
};

EmuHwBlock.prototype = new HwBlockClone();
EmuHwBlock.prototype.constructor = EmuHwBlock;

EmuHwBlock.prototype.updateValueOnServer = function(msg){
	var UPDATE_HW_VAL_URL = "/updateEmuHwVal";
	var postArgs = JSON.stringify({blockID: this.blockID, msg:[msg[0],msg[1],msg[2]]});
	request = new XMLHttpRequest();
	console.log("Post args: " + postArgs);

	request.open('POST', UPDATE_HW_VAL_URL);
	request.setRequestHeader('Content-type', "application/json;charset=UTF-8");
	request.send(postArgs);
	console.log("sent update to emu hw val");
};

EmuHwBlock.prototype.RemoveOnServer = function(){
	var REMOVE_EMU_HW_URL = "/removeEmuHwBlock";
	var postArgs = JSON.stringify({blockID: this.blockID});
	var obj = this;
	request = new XMLHttpRequest();
	
	request.addEventListener('load',function () {
		if(request.status == 200){
			//var results = JSON.parse(request.responseText);
			
			//Call the parent function to remove view, etc.
			//BlockObject.prototype.Remove.call(obj);
		}else{
			console.log("error trying to remove emu hw block!");
		}
	});

	request.open('POST', REMOVE_EMU_HW_URL);
	request.setRequestHeader('Content-type', "application/json;charset=UTF-8");
	request.send(postArgs);
};


EmuHwBlockClone = function () {};
EmuHwBlockClone.prototype = EmuHwBlock.prototype;

function EmuTimerBlock(devName,blockID){
	EmuHwBlock.call(this,devName,blockID);
};

EmuTimerBlock.prototype = new EmuHwBlockClone();
EmuTimerBlock.prototype.constructor = EmuTimerBlock;

// Called when the block state has changed - update data and view
EmuTimerBlock.prototype.update = function(fromBlockID,msg){
	obj = this;
	// console.log("Updating hardware block:" + obj.devName);

	// Update data - hardware state
	var newVal = msg[2];
	// Update View		
	
	if(msg[0] == 144){ // If the message type is note on/off use string label instead of number
		newVal = 100;
		$("#sensorVal"+obj.blockID).text("ON");
	}
	else if (msg[0] == 128){
		newVal = 0;
		$("#sensorVal"+obj.blockID).text("OFF");		
	}
	// control change for pitch wheel
	else if (msg[0] == 227 || msg[0] == 176 ){
		var sensorPercent = Math.round((100*(msg[2]/127)))/10;
		newVal = sensorPercent;
		if(sensorPercent == 0){
			$("#sensorVal"+obj.blockID).text("OFF");
		}else{
			$("#sensorVal"+obj.blockID).text( sensorPercent +" sec");
		}
	}
	$("#sensorVal"+obj.blockID).val(newVal);

	obj.data = newVal;
};

EmuTimerBlockClone = function () {};
EmuTimerBlockClone.prototype = EmuHwBlock.prototype;

function EmuFanBlock(devName,blockID){
	//super constructer call
	var obj = this;
	this.rotationRate = 0;
	this.degrees = 0;
	EmuHwBlock.call(this,devName,blockID);
	
	setInterval(function(){ 
		// console.log("obj.degrees: " + obj.degrees);
		obj.degrees = obj.degrees + obj.rotationRate*.4; 
		$("#fanIcon-"+obj.blockID).css({'-webkit-transform' : 'rotate('+ obj.degrees +'deg)',
					 '-moz-transform' : 'rotate('+ obj.degrees +'deg)',
					 '-ms-transform' : 'rotate('+ obj.degrees +'deg)',
					 'transform' : 'rotate('+ obj.degrees +'deg)'});
	},100);
	
};

EmuFanBlock.prototype = new EmuHwBlockClone();
EmuFanBlock.prototype.constructor = EmuFanBlock;

// Called when the block state has changed - update data and view
EmuFanBlock.prototype.update = function(fromBlockID,msg){
	//call parent function to get the new value and then use that for the rotation rate
	this.rotationRate = EmuHwBlock.prototype.update.call(this, fromBlockID, msg);
};

EmuFanBlockClone = function () {};
EmuFanBlockClone.prototype = EmuHwBlock.prototype;

// ---- Motor

function EmuMotorBlock(devName,blockID){
	//super constructer call
	var obj = this;
	this.rotationRate = 0;
	this.degrees = 0;
	EmuHwBlock.call(this,devName,blockID);
	
	setInterval(function(){ 
		// console.log(" motor obj.degrees: " + obj.degrees);
		obj.degrees = obj.degrees + obj.rotationRate*.15; 
		$("#motorIcon-"+obj.blockID).css({'-webkit-transform' : 'rotate('+ obj.degrees +'deg)',
					 '-moz-transform' : 'rotate('+ obj.degrees +'deg)',
					 '-ms-transform' : 'rotate('+ obj.degrees +'deg)',
					 'transform' : 'rotate('+ obj.degrees +'deg)'});
	},100);
	
};

EmuMotorBlock.prototype = new EmuHwBlockClone();
EmuMotorBlock.prototype.constructor = EmuMotorBlock;

EmuMotorBlock.prototype.update = function(fromBlockID,msg){
	//call parent function to get the new value and then use that for the rotation rate
	this.rotationRate = EmuHwBlock.prototype.update.call(this, fromBlockID, msg);
};

// ---- Motor end

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
	};
};

// From here URL :http://stackoverflow.com/questions/16601934/js-jquery-contenteditable-insert-text-and-move-cursor-to-end
function insertTabAtCursor(text) { 
    var sel, range, html; 
    sel = window.getSelection();
    range = sel.getRangeAt(0); 
    range.deleteContents(); 
    var textNode = document.createTextNode(text);
	var tabnode = $("<pre class='Preform'>&#009</pre>")[0];

    range.insertNode(textNode);
    range.insertNode(tabnode);
    range.setStartAfter(textNode);
    sel.removeAllRanges();
    sel.addRange(range);        
}

function insertTextAtCursor(text) { 
    var sel, range, html; 
    sel = window.getSelection();
    range = sel.getRangeAt(0); 
    range.deleteContents(); 
    var textNode = document.createTextNode(text);
    
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    sel.removeAllRanges();
    sel.addRange(range);        
}

function CodeBlock(blockID,x,y,text){
	var obj = this;
	viewObjInput = undefined;
	this.displayName = "CodeBlock"; 
	this.type="sw";
	BlockObject.call(this,viewObjInput,blockID);
	this.data = "0";
// 	this.sandbox   = new JSandbox();
	this.result = 0;

	app.addNewBlock(this);

	var freeCellELem = drawCodeBlock(this.blockID,x,y);	
	// parent element has unique container id .e.g. block-3 		
	this.viewObj = freeCellELem.parentElement;
	var codeWindow = $("#codeWindow-"+this.blockID);
	
	if(text !== undefined){
		codeWindow.append( "<div>"+text+"</div>" );
		codeWindow.append( "<div>"+"&nbsp;"+"</div>" );
	}else{
		codeWindow.append( "<div>"+"&nbsp;"+"</div>" );
	}
	
	//Always set the focus to new created codebox
  	codeWindow.focus();
	
  	// Setup a blur handler on loss of focus
  	// DELETE Empty text boxes that lose focus 
  	codeWindow.blur( function() {
  		var innerText = $(this).text().trim();
		console.log("Lost focus on code block , with inner text:" + innerText);

		if (innerText ==""){
			console.log("Removing Empty code block");
			app.removeCodeBlockFromServer(blockID);
		}
  	});
    
	this.sendCodeToServer = function(text){
		var NEW_CODE_BLOCK_TEXT_URL = "/newCodeBlockText";
		var postArgs = JSON.stringify({blockID: obj.blockID, text: text});
		request = new XMLHttpRequest();
		console.log("Post args: " + postArgs);
	
		request.open('POST', NEW_CODE_BLOCK_TEXT_URL);
		request.setRequestHeader('Content-type', "application/json;charset=UTF-8");
		request.send(postArgs);
	};
	
	this.executeCodeOnServer = function() {
		var EXEC_CODE_BLOCK_URL = "/execCodeBlock";
		var postArgs = JSON.stringify({blockID: obj.blockID});
		request = new XMLHttpRequest();
		console.log("Post args: " + postArgs);
	
		request.open('POST', EXEC_CODE_BLOCK_URL);
		request.setRequestHeader('Content-type', "application/json;charset=UTF-8");
		request.send(postArgs);
	};
	
	//add event handler for click on button
	var $codeWindow = $("#"+"codeWindow-"+blockID);
	$codeWindow.bind("keydown", function(event) {
		console.log("down:" +event.which);
		
		// For the tab key disable switching focus ... i.e. insert a tab
		if(event.which === 9) { // tab was pressed
			// $(this).append("&nbsp;&nbsp;what");
		   	// $(this).append("<pre class='Preform'>&#009</pre>what");
            // document.execCommand ( 'indent', true, null )
            insertTabAtCursor(" ");
		   	event.preventDefault();
	    } else if(event.keyCode === 8) { // backspace was pressed		
            // document.execCommand ( 'outdent', true, null )
		   	// event.preventDefault();
	    } 

			
	});
	$codeWindow.bind("keyup", function(event) {
		//var htmlString = $codeWindow.text();
		
		var codeBlockID = obj.blockID;
		var codeBlockObj = app.blockObjects[codeBlockID];
		var clobjectDiv = $("#block-"+codeBlockID);
		
		//var elem = clobjectDiv.find(".freeCell");
		var elem = clobjectDiv.find("#codeWindow-"+obj.blockID);
		var divs = elem.children('div');
		var code = "";
		
		divs.each(function() {
			if ($(this).hasClass("codeArgLine")){
				//Do nothing. This is now done on the server
			}else{
				code = code + " " + $(this).text() + ' \n';
			}
		});
		
        //we want to make sure the window resizes correctly
        jsPlumb.repaint($codeWindow.parent());
		obj.sendCodeToServer(code);
		//Special Key to Execute Code on Server?
		if (event.keyCode == 13) {
        	//obj.executeCodeOnServer();
    	}
	});

	this.update = function(fromBlockID, msg, outputValue) {
		var obj = this;
		var codeBlockID = obj.blockID;
		var clobjectDiv = $("#block-"+codeBlockID); // jquery view object
		var outputValueElem = clobjectDiv.find(".returnValInput");
		
		var newVal = convertMidiMsgToNumber(msg);
		var inputVarTag = "#inputArg"+this.blockID+fromBlockID;
		var inputVarElem = clobjectDiv.find(inputVarTag).find(".codeArgInput");
		
		var stateVarTag = "#inputArg"+this.blockID+"STATE";
		var stateVarElem = clobjectDiv.find(stateVarTag).find(".codeArgInput");
		
		if(outputValueElem) {
			outputValueElem.val(outputValue);	
		}
		if(inputVarElem) {
			inputVarElem.val(newVal);	
		}
		if(stateVarElem){
			stateVarElem.val(outputValue);
		}
		$("#block-"+this.blockID).finish();
		$("#block-"+this.blockID).animate({backgroundColor: 'green',opacity: 0.5}, 400,function(){
			$("#block-"+obj.blockID).animate({backgroundColor: 'transparent',opacity: 1}, 400);
		});
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


			//currArgumentName = currConnectedObj.displayName.toLowerCase();
			currArgumentName = currConnectedObj.displayName;

         	// Append a new variable name for each input
         	if(currConnectedObj.deviceType != "Timer"){
				linesToAdd += "<div contenteditable ='false' class='codeArgLine' id='inputArg"+this.blockID+connectedObjID+"'>" + "<span class='codeArgName'>"+ currArgumentName + 
				"</span> = <input class='codeArgInput' value='" + currConnectedObjVal + "'></input> </div> ";
			}	
		}
		if(Object.keys(this.outConnections).length == 1){
			// Append a new variable name for single connected output
			linesToAdd += "<div contenteditable ='false' class='codeArgLine' id='inputArg"+this.blockID+"STATE'>" + 
			"<span class='codeArgName'>"+ 
			 app.blockObjects[Object.keys(this.outConnections)[0]].displayName + 
			"</span> = <input class='codeArgInput' value='" + "0" + "'></input> </div> ";
		}else{
			// Append a new variable name for state
			linesToAdd += "<div contenteditable ='false' class='codeArgLine' id='inputArg"+this.blockID+"STATE'>" + 
			"<span class='codeArgName'>"+ "Output" + 
			"</span> = <input class='codeArgInput' value='" + "0" + "'></input> </div> ";	
		}
		// Append the lines to the elem
		var originalHTML = elem.html();
		var blankLine = "<div><br></div>";
		var dividerline = "<div class='dividerline' contenteditable='false'></div>";
		elem.html(linesToAdd + dividerline + originalHTML + blankLine);

		// Make the codeArgInput not editable
		$(".codeArgInput").prop('disabled', true);

		// Update the output field
		// js todo

		var returnValElem = targetElem.find(".returnValInput");
		var returnVal = "0"; // default return val 
		if( returnValElem.length == 0 ){ // no output div element yet		
			//var lastLine = "<div class='returnValDiv' contenteditable='false'><input class='returnValInput' value='" + returnVal + "' readonly></input> </div> ";		
			var lastLine = templates.renderOutputDisplayWindow({returnVal:returnVal,blockID:obj.blockID});
			// elem.append(lastLine);	
			targetElem.append(lastLine);	
			// Set our new data		
			this.data = returnVal;
		}

		jsPlumb.repaint(elem.parent());	// repaint anchors in case shifted	
	}	
	
	this.updateArgumentsView();
};

CodeBlock.prototype = new BlockObjectClone();
CodeBlock.prototype.constructor = CodeBlock;

// When some object connects to a code block
CodeBlock.prototype.displayError = function (error){
	var obj = this;
	//$("#block-"+this.blockID).css("background-color","red");
		$("#block-"+this.blockID).finish();
		$("#block-"+this.blockID).animate({backgroundColor: 'red',opacity: 0.5}, 400,function(){
			$("#block-"+obj.blockID).animate({backgroundColor: 'white',opacity: 1}, 400);
		});
};

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

// When some object connects to a code block
CodeBlock.prototype.addOutputConnection = function (inputConnectionObj){
	BlockObject.prototype.addOutputConnection.call(this,inputConnectionObj);
	// console.log("Adding output to code block");
	this.updateArgumentsView();			
};

// When some object dissconnects from a code block
CodeBlock.prototype.removeOutputConnection = function (inputConnectionObj){
	BlockObject.prototype.removeOutputConnection.call(this,inputConnectionObj);
	// console.log("Removing output from code block");
	this.updateArgumentsView();			
};

//////////  MIDI Connections - jsplumb callback on change of any connection
function updateConnections (sourceID, targetID, shouldRemove){
	console.log("Updating connections");
	
	//var sourceName = app.blockObjects[sourceID].devName;
	//var targetName = app.blockObjects[targetID].devName;
	//console.log("source name: " + sourceName + " sourceID: " + sourceID);
	//console.log("target name: " + targetName + " targetID: " + targetID);
	
	//removing a connetion
	if(shouldRemove){
		app.blockObjects[sourceID].removeOutputConnection(app.blockObjects[targetID]);
		app.blockObjects[targetID].removeInputConnection(app.blockObjects[sourceID]);
	}
	//otherwise we assume that we are making a connection
	else{
		app.blockObjects[sourceID].addOutputConnection(app.blockObjects[targetID]);
		app.blockObjects[targetID].addInputConnection(app.blockObjects[sourceID]);
	}		
}
