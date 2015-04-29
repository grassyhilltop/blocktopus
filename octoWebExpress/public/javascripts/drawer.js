// drawer.js on the client
// Functions for drawing to browser window

function addDeleteButton(divID, callback){
	var blockID;
    if (divID) blockID = divID.split("-")[1]; // get id of parent container
    var html = "<div class='deleteButton'></div>";
    $("#"+divID).append(html);
    $("#"+divID+">div.deleteButton").click( callback);
}


function drawCodeBlock(id, x , y ,w ,h){

    var yOff = 30; // Offset from cursor - so we dont occlude with mouse
    var xOff = 10;
    if(!w)  w = 100;
    if(!h) h = 20;

    // Just use a pain div ( not wrapped in a draggable Container)
    // var x = x + 0;  //offsets for div
    // var y = y - 20; //offsets for div        
    // var divElem = createDiv(x,y,w,h,true);// Creating a contentEditable div
    // append(divElem);

    var x = x - 10;  //offsets for draggablediv
    var y = y - 30; //offsets for draggablediv

    // Wrapp div in draggable div
    var container = createDraggableContainer(x,y,id);
    var divElem = createCodeWindow(id,0,0,w,h,true,"relative");// Creating a contentEditable div

    container.appendChild(divElem)
    document.body.appendChild(container);    

    container.classList.add("freeCellContainer");

    divElem.classList.add("freeCell");
    // divElem.focus();  
    //divElem.addEventListener("blur",lostCellFocus);

    // jsplumb add anchors for wire connections
    _addEndpoints( container.id, ["BottomCenter"], ["TopCenter"]); 
    
    //jsPlumb.draggable($(".draggable") );
    jsPlumb.draggable($(".draggable") ,  { cancel: ".editable" } );

	
    // add a delete button
    var blockID;
    blockID = container.id.split("-")[1];
    addDeleteButton(container.id,function(){ 
    	app.removeCodeBlockFromServer(blockID); 
    });

    return divElem;
}


// Creating a content editable div for the text area within codeboxes
function createCodeWindow(id,x,y,w,h,editable, position){

    divElem = document.createElement("div");
    
     var idString = "codeWindow-" + id;
     divElem.id = idString;

    if(editable == true){
       divElem.setAttribute("contentEditable", true); 
       divElem.setAttribute("spellcheck", false); 
       divElem.classList.add("editable");
    }  

    if(position =="absolute"){
        divElem.style.position ="absolute";
        divElem.style.top = y +"px";
        divElem.style.left = x + "px";    
    }
    
    return divElem;
}

function createDraggableContainer(x,y,id,color){

    divElem = document.createElement("div");
    
    divElem.style.position ="absolute";
    divElem.style.top = y +"px";
    divElem.style.left = x + "px";
    divElem.style.backgroundColor = color;

    // Add unique id to each canvas cell
    
    // var idString = "" + getUniqueId();
     var idString = "block-" + id;
     divElem.id = idString;

    divElem.classList.add("draggable");
    // $( divElem ).draggable({ cancel: ".editable" });
    
    return divElem;

}



drawer = {};
drawer.defaultStrokeW = 2;

// USING SVG
//http://blog.blazingcloud.net/2010/09/17/svg-scripting-with-javascript-part-1-simple-circle/
// returns an svg element - that needs to be appended to a div
function circle( radius, color, strokeColor, strokeWidth, opacity ){

    if ( ! radius) radius = 60;
    if ( ! color ) color = "grey"; // "#336699";
    if ( ! strokeColor ) strokeColor = "black";
    if ( ! strokeWidth ) strokeWidth = drawer.defaultStrokeW;
    if ( ! opacity ) opacity = 1 ;

    // Create the container for the SVG
    var container = document.getElementById("svgContainer");
    var mySvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    mySvg.setAttribute("version", "1.2");
    mySvg.setAttribute("baseProfile", "tiny");
    document.body.appendChild(mySvg); // Just append to the body
    // container.appendChild(mySvg);

    // Draw the circle
    var c1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c1.setAttribute("cx", radius + strokeWidth);
    c1.setAttribute("cy", radius + strokeWidth);
    c1.setAttribute("r", radius);
    c1.setAttribute("fill", color);
    c1.setAttribute("stroke", strokeColor);
    c1.setAttribute("stroke-width", drawer.defaultStrokeW);
    mySvg.appendChild(c1);

    // Set the width of the svg to fit around the circle
    mySvg.setAttribute("width", radius*2 + strokeWidth*2);
    mySvg.setAttribute("height", radius*2 + strokeWidth*2);
    mySvg.setAttribute("opacity", opacity);
    // mySvg.setAttribute("top", "500");
    // mySvg.setAttribute("left", "500");

    // $(mySvg).addClass("shapeContainer"); // bug jquery can't work on SVG
    
    return mySvg;

}

//USING CANVAS
function circle2(){
    //alert(" drawing circle");

    var canvas = document.getElementById("myCanvas");
    var context = canvas.getContext("2d");
    // var centerX = canvas.width / 2;
    // var centerY = canvas.height / 2;
    var centerX = Math.random()*(canvas.width);
    var centerY = Math.random()*(canvas.height);
    var radius = 10;
    //alert(centerX + " " + centerY);

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.fillStyle = "black";
    context.fill();
    context.lineWidth = 1;
    context.strokeStyle = "black";
    context.stroke();
}

function hardwareBlockAddSlider(block){
	var sliderDiv = document.createElement("div");
	$(sliderDiv).addClass("sensorSlider");
	
	$("#block-"+block.blockID).append(sliderDiv);

	$(sliderDiv).slider({
		slide: function( event, ui ) {
			var msg = midiPitchMsg(ui.value);
        	
        	block.updateValueOnServer(msg);
        }
	});
};

function hardwareBlockAddFanIcon(block){
	var img = $('<img id="fanIcon-'+block.blockID+'">');
	img.attr('src', '/images/fanIcon.png');
	img.addClass("fanIcon");
	
	$("#block-"+block.blockID).append(img);
};

function hardwareBlockAddSoundWaves(block){
	var soundWavesDiv = $('<div class="preloader_1"><span></span><span></span><span></span><span></span><span></span></div>');
	var id = "soundWaves-"+block.blockID;
	$(soundWavesDiv).attr('id', id);
	block.emuHardwareResponse = function(msg) {
		var value = convertMidiMsgToNumber(msg);
		$('#'+id).css('height', (value)*.75+'px');
		$('#'+id).css('top', (140-(value)*.75)+'px');
	};
	
	$("#block-"+block.blockID).append(soundWavesDiv);
	$(soundWavesDiv).addClass("preloader_1");
};

function hardwareBlockAddMotorIcon(block){
	var img = $('<img id="motorIcon-'+block.blockID+'">');
	img.attr('src', '/images/motorIcon.png');
	img.addClass("motorIcon");
	
	$("#block-"+block.blockID).append(img);
};

function hardwareBlockAddOutputWindow(block){
	var outputWindow = templates.renderOutputDisplayWindow({returnVal:0,blockID:block.blockID,ofClass:"outputWindow"});
	outputWindow.id = "outputWindow-"+block.blockID;
	
	$("#block-"+block.blockID).append(outputWindow);
};

function hardwareBlockAddButton(block){
	var button = document.createElement("BUTTON");

	$(button).addClass("sensorButton");
	$("#block-"+block.blockID).append(button);

	$(button).bind("mousedown", function(event) {
		var msg;
			msg = midiOnMsg(100); 
		//block.onReceiveMessage(block.blockID, msg);
		block.updateValueOnServer(msg);
	});
	$(button).bind("mouseup", function(event) {
		var msg;
		msg = midiOffMsg(0); 
		//block.onReceiveMessage(block.blockID, msg);
		block.updateValueOnServer(msg);
	});
};

function hardwareBlockAddSwitch(block){
	var button = document.createElement("BUTTON");

	$(button).addClass("sensorButton");
	$("#block-"+block.blockID).append(button);

	$(button).bind("click", function(event) {
		var msg;
		if(block.data === 100){
			msg = midiOffMsg();
		}else{
			msg = midiOnMsg();
		}
		//block.onReceiveMessage(block.blockID, msg);
		block.updateValueOnServer(msg);
	});
};

function hardwareBlockAddLED(block){
	var ledDiv = document.createElement("DIV");
	$(ledDiv).addClass("sensorLED");
	$("#block-"+block.blockID).append(ledDiv);
	
	block.emuHardwareResponse = function(msg) {
		var value = convertMidiMsgToNumber(msg);
		value = (value/100 + .2);
		if(value > 1.0)
			value = 1.0;
		value = value.toString();
		console.log("new value :" +value);
		ledDiv.style.opacity = value;
	};
};

function hardwareBlockAddMotion(block){
	var elemDiv = document.createElement("DIV");
	$(elemDiv).addClass("sensorLED");
	$(elemDiv).addClass("motion");
	$("#block-"+block.blockID).append(elemDiv);
	
	$(elemDiv).hover(
			function( event, ui ) {
				var msg = midiPitchMsg(100);        	
        		block.updateValueOnServer(msg);
    		},
    		function( event, ui ) {
				var msg = midiPitchMsg(0);        	
        		block.updateValueOnServer(msg);
    		} 
	);

};


function hardwareBlockAddHeater(block){
	var ledDiv = document.createElement("DIV");
	$(ledDiv).addClass("heater");
	$("#block-"+block.blockID).append(ledDiv);
	
	block.emuHardwareResponse = function(msg) {
		var value = convertMidiMsgToNumber(msg);
		value = (value/100).toString();
		console.log("new value :" +value);
		ledDiv.style.opacity = value;
	};
};

function drawHardwareBlock(block, blockId, sensorid , sensorName, displayName, initialVal){
	var section;
	var menu = document.getElementById("menu");
	var color = block.deviceIDNum === "E" ? "#FDC68A" : "#7BCDC8";
	var opacity = .25;
	
	if(!sensorName) sensorName= "sensor";
	
	if(app.getDeviceTypeFromName(sensorName)  == "Output"){ // Input
		section = document.getElementById("section1");
	}
	else{
		section = document.getElementById("section3");
	}
	var boundingBoxSection = section.getBoundingClientRect();
	var boundingBoxMenu = section.getBoundingClientRect();

	
	// Placement of hardware block on screen
	y = boundingBoxSection.top + Math.random()*10;
	var menuWidth = 200;
	x = menuWidth + (205 * blockId) % (boundingBoxSection.width - menuWidth - 200);

    var radius = 100;
	var circleContainer = circle(radius,color, undefined, undefined, opacity);	
	var nodeDiv = createDraggableContainer(x,y,1);
	var textDiv = document.createElement("div");
	var labelDiv = document.createElement("div");
	

    // override th enode div ID to be sensor container
    // nodeDiv.id = sensorName+"-"+sensorid + "_container";
    nodeDiv.id = "block-"+ blockId;

	$(textDiv).addClass("sensorValue")
			  .attr("id","sensorVal" + blockId)
			  .text(initialVal);

	$(labelDiv).addClass("sensorLabel")
			  .attr("id","sensorLabel" + blockId)
			  .text(displayName);


	$(nodeDiv).addClass("sensorNodeContainer")
			  .append(circleContainer)
		  	  .append(textDiv)
		  	  .append(labelDiv);

	//append to body
	document.body.appendChild(nodeDiv)

    //JSplumb add connectors
    // If is input just add one connector on top
    // if(sensorTypes[sensorName]  == 2){ // Input
    if(app.getDeviceTypeFromName(sensorName)  == "Input"){ // Input
        _addEndpoints( nodeDiv.id, [], ["TopCenter"]);
    }
    // else if(sensorTypes[sensorName]  == 1){ // Output
    else if(app.getDeviceTypeFromName(sensorName)  == "Output"){ // Output

        _addEndpoints( nodeDiv.id, ["BottomCenter"], []);
    }
    else{
        console.log("Found sensor: " + sensorName  +  " ,not in list. Just adding both. NEED UPDATE !!!");
        _addEndpoints( nodeDiv.id, ["BottomCenter"], ["TopCenter"]);
    }

    // $( nodeDiv ).draggable({ cancel: ".editable" });
    jsPlumb.draggable($(".draggable") , { cancel: ".editable" } );
    
    //add delete button
    addDeleteButton("block-"+ blockId,function(){ 
    	block.RemoveOnServer(); 
    });

	return nodeDiv;
}

//Example
// a = drawFlowNode(400,400,6,"knob");
//b = drawFlowNode(400,400,7,"light");
