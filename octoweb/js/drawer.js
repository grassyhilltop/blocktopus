// drawer.js
// Functions for drawing to browser window

drawer = {};
drawer.defaultStrokeW = 2;

// USING SVG
//http://blog.blazingcloud.net/2010/09/17/svg-scripting-with-javascript-part-1-simple-circle/
// returns an svg element - that needs to be appended to a div
function circle( radius, color, strokeColor, strokeWidth ){

    if ( ! radius) radius = 60;
    if ( ! color ) color = "grey"; // "#336699";
    if ( ! strokeColor ) strokeColor = "black";
    if ( ! strokeWidth ) strokeWidth = drawer.defaultStrokeW;

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

function drawHardwareBlock(blockId, x,y, sensorid , sensorName, displayName, initialVal){
	
	if(!x) x = 400;
	if(!y) y= 400;
	if(!sensorName) sensorName= "sensor";

    var radius = 100;
	var circleContainer = circle(radius,"transparent");	
	var nodeDiv = createDraggableContainer(x,y,50,50);
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
    if(getDeviceTypeFromName(sensorName)  == "Input"){ // Input
        _addEndpoints( nodeDiv.id, [], ["TopCenter"]);
    }
    // else if(sensorTypes[sensorName]  == 1){ // Output
    else if(getDeviceTypeFromName(sensorName)  == "Output"){ // Output

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
