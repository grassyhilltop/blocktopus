// drawer.js
// Functions for drawing to browser window

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
		value = (value/100).toString();
		console.log("new value :" +value);
		ledDiv.style.opacity = value;
	};
};

function hardwareBlockAddMotion(block){
	var elemDiv = document.createElement("DIV");
	$(elemDiv).addClass("sensorLED");
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
	append(nodeDiv);

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

	return nodeDiv;
}

//Example
// a = drawFlowNode(400,400,6,"knob");
//b = drawFlowNode(400,400,7,"light");
