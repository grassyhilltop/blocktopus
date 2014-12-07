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

// Converts a number from 0-100 into a midi message
function midiPitchMsg( num ){	
	 return  [227,0,Math.round(127*num/100)];   // continuous pitch change		
}

// Converts a number from 0-100 into a midi message
function midiOnMsg(){	
	  return [144,60,69]; 			    // note on	
}

// Converts a number from 0-100 into a midi message
function midiOffMsg(){	
	  return [128,60,69];	    // note off	
}
