var getBlockObjectDiv = function (target) {
	while (target && (target.id.search("block") === -1)){
  		target = target.parentNode;
  	}
  	if(!target){
  		return undefined;
  	}
  	return target;
};

var emuKnobClickHandler = function (event) {
	console.log("knob clicked");
	var target = getBlockObjectDiv(event.target);
	var blockID = target.id.split("-")[1];// Just the numerical part of the name "5"
	var msg = midiPitchMsg(50);
  	
  	app.blockObjects[blockID].onReceiveMessage(blockID, msg);
}; 

//Send Midi Message to Button to tell it that it is on or off
var emuButtonClickHandler = function (event) {
	console.log("button clicked");
	var target = getBlockObjectDiv(event.target);
	var blockID = target.id.split("-")[1];// Just the numerical part of the name "5"
	var block = app.blockObjects[blockID]
	var msg;
	
	if(block.data === 100){
		msg = midiOffMsg();
	}else{
		msg = midiOnMsg();
	}
  	
  	block.onReceiveMessage(blockID, msg);
}; 