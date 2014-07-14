


window.addEventListener("load",setupMidi);


var connectedMidiDevices = {};
var deviceDrawnNodeIds = {};
var midiDevicePollTimer;

// 1 = input
// 2 = output
// 3 = both
var sensorTypes = {
"Knob": 1,
"Button": 1,
"Slider": 1,
"Light": 1,
"Temp": 1,
"Tilt": 1,
"LED": 2,
"Buzzer": 2
};

// MIDI to MIDI Connections
// Input (Sensor) ---> Output (e.g. Buzzer)
var deviceToDeviceConnections ={}

// From midi pool

var Pool;
var ins;
var outs;

var hist=[];
var in_hist=0;

function setupMidi () {
	console.log("Setting up midi");
	
	/// USING JAZZ PLUGING
	setupMidiPool();

	// Poll for new midi devices
	midiDevicePollTimer = setInterval( checkForMidiDevices, 1000);

}

function setupMidiPool(){
	try{
	 Pool=new MidiPool;
	 ins=Pool.MidiInList();
	 outs=Pool.MidiOutList();
	 
	 for(var i in outs) Pool.OpenMidiOut(outs[i]);
	 for(var i in ins) Pool.OpenMidiIn(ins[i],function(name){return function(t,a){print_msg(name,a);};}(ins[i]));
	}
	catch(err){ alert(err);}

	// Flash all the outputs
	// play_all();
	// stop_all();
}

// On receive of an midi message from a sensor
function midi_out(name,msg){
	console.log("sending midi out");

	// // Send the message out to the pool
	Pool.MidiOut(name,msg);
	print_msg(name,msg,true);	

	// This NEVER SEEMS TO GET CALLED ??
}

function play_all(){
	var note=60;
 	for(var i in outs){
 		// Dont play the apple synth
 		if (outs[i] == "Apple DLS Synth") {
 			continue;
 		}
 		midi_out(outs[i],[144,note,0x7f]); 
 		note+=5;
 	}
}

function stop_all(){
	var note=60;
	for(var i in outs){ 
		midi_out(outs[i],[128,note,0]); 
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

function send_msg(){
	var msg=[];
	var a=fix_input(inp.value).split(" ");
	for(var i in a){ 
		var x=parseInt(a[i],16); 
		if(!isNaN(x)) msg.push(x);
	}
	if(msg.length){
		if(sel.selectedIndex) {
			midi_out(outs[sel.selectedIndex-1],msg);
		}
		else{ 
			for(var i in outs){ 
				midi_out(outs[i],msg);
			}
		}
		var str=format(msg);

		for(var i=0;i<hist.length;i++){
			if(hist[i]==str){
				hist.splice(i,1);
				i--;
			}
		}
		hist.push(str);
		in_hist=hist.length;
	}
	inp.value="";
	setTimeout(function(){inp.focus();},0);
}

/////////////////////////////

// Polling for midi devices
function checkForMidiDevices(){
	
	// console.log("looking for midi devices");
	
	ins = Pool.MidiInList();
	outs = Pool.MidiOutList();

	var deviceList = ins;

	var newDeviceListStr = "Connected Devices:";
	$("#deviceListDiv").text(newDeviceListStr);	
	$("#deviceListDiv").append("<br/>");
	for (var i = 0; i < deviceList.length; i++) {
		var currDeviceName = deviceList[i];
		$("#deviceListDiv").append(currDeviceName + "<br/>");	
	};

	// DISCONNECTED MODULES
	// On disconn
	// Check that the new list contains all of the previously connected
	for (var key in connectedMidiDevices){
		// console.log("key:" + key);
		if ( $.inArray(key, deviceList) == -1){
			console.log("Can't find:" +key + " in device list anymore");
			
			delete connectedMidiDevices[key];
			var lostNode = deviceDrawnNodeIds[key];			
			// $(lostNode).hide();
			$(lostNode).remove();

			// Clean up jsplumb
			deleteNode(lostNode);

			// remove from device to device list
			delete deviceToDeviceConnections[lostNode];
		}
	}
	

	if ( deviceList.length  > 0 ){
		// console.log("Found midi devices:" + deviceList);

		
        for(var i = 0; i < deviceList.length ; i ++ ){
        	var currDeviceName = deviceList[i];

        	if (connectedMidiDevices[deviceList[i]] ) {
        		// console.log("device in connected deviceList already:" + currDeviceName );

        	} 
        	////// First time seeing a device - make a connection and draw a node for them
        	else{
        		console.log("new device to connect:" + currDeviceName );
        		connectedMidiDevices[currDeviceName] = "connected";

        		var splitName = currDeviceName.split("-");
        		var nameShort = splitName[0];
        		var deviceUDID  = splitName[1];
        		var startValue = "";

        		// MAKE A NEW CONNECTION

        		// If it is an output
        		if( sensorTypes[nameShort] == 2 ){// output

        			Pool.OpenMidiOut(currDeviceName);
        		}         		
        		// always add to inputs
       			Pool.OpenMidiIn(currDeviceName,function(name){return function(t,a){print_msg(name,a);};}(ins[i]));        			

        		// draw a node
        		var x = 50 + 400* Math.random();
        		var y = 100+ 400* Math.random();
        		
        		if(nameShort =="Button" || nameShort =="Buzzer")  startValue = "OFF";
        		else startValue = "0%";

        		var elem = drawFlowNode(x,y,deviceUDID,nameShort,startValue);

        		deviceDrawnNodeIds[currDeviceName] = elem;
        	}
        }


		return deviceList[0];
	}
}

function midiString(a,b,c){
	 var cmd=Math.floor(a/16);
	 var note=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'][b%12]+Math.floor(b/12);
	 a=a.toString(16);
	 b=(b<16?'0':'')+b.toString(16);
	 c=(c<16?'0':'')+c.toString(16);
	 var str=a+" "+b+" "+c+"    ";
	 if(cmd==8){
	  str+="Note Off   "+note;
	 }
	 else if(cmd==9){
	  str+="Note On    "+note;
	 }
	 else if(cmd==10){
	  str+="Aftertouch "+note;
	 }
	 else if(cmd==11){
	  str+="Control    "+b;
	 }
	 else if(cmd==12){
	  str+="Program    "+b;
	 }
	 else if(cmd==13){
	  str+="Aftertouch";
	 }
	 else if(cmd==14){
	  str+="Pitch Wheel";
	 }
	 return str;
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

 if(navigator.appName=='Microsoft Internet Explorer'){ document.onfocusin=onFocusIE; document.onfocusout=onBlurIE;}
 else{ window.onfocus=connectMidi; window.onblur=disconnectMidi;}

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
function updateConnections ( info, shouldRemove){
	console.log("Updating connections");


	// js
	// First check if we plugged input a code block
	// Code blocks have divs with ID = clobject-4 etc , hardware div have id:light-1_container
	var sourceName = info.sourceId.split("_")[0]; // remove any underscores
	var targetName = info.targetId.split("_")[0];
	var sourceElem = $("#"+info.sourceId);
	var targetElem = $("#"+info.targetId);
	var targetInputElem;
	var targetOutputElem;
	
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
		g1 = targetOutputElem;
		if(targetOutputElem.length != 0){

		} else{
			var returnVal = firstVarValue;
			var lastLine = "<div>out = <input class='returnValInput' value='" + returnVal + "'></input> </div> ";		
			g2 = lastLine;
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
		lines[0] = "var "+ firstVarName+ " =" + inputValue; // first line is an input variable	
		lines[lines.length-1] = ""; // blank out last line (will be evaled)
	} 


	if(lines.length < 2){ 
		console.log("error while evaling code box.. not enough lines");
	} else if (lines.length == 2){
		// just pass the value through
		outputValueElem.val(inputValue)

		// If we are CONNECTED TO HARDWARE send message onwards
		if (connectedOutput) sendMsgToHardware(connectedOutput,inputValue);
		
		// TODO if we are connected to another code box... eval it 

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
		
	var result = tryEval(codeStr)();
	
	if(outputValueElem ) {
		console.log("evaled code box with results:" +result);
		outputValueElem.val(result);	
		if (connectedOutput) sendMsgToHardware(connectedOutput,result);	
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