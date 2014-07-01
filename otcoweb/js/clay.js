
clay ={}; // for storage for clay globals

// Our generic omnipotent Clay creature - everything is a clay creature
// A clay creature can become any other creature in the world
// It can send and receive messages 
// It has internal state dictionary

function ClayCreature(initMessage) {

	//////////////// 1. Properties of the creature  ////////////////

	this.properties = { } ; // A dictionary that holds name/value property pairs
	this.sensors = { }; // Sensors detect messages and send them to the brain
	this.brains = { } ;  // A brain that handles incoming and outgoing messages
	this.actions = { } ;   // A dictionnary to hold our creatures methods
	
	// Some defaults for all creatures
	this.properties.name = "nameless creature";
	this.properties.birthday = new Date();
	this.properties.age = getAge;
	this.properties.code = {};
	this.properties.creator = "nameless creator"; // who made you
	
	// Private instance variables  - shortcuts for use later	
	var properties = this.properties; 
	var actions = this.actions;
	var sensors = this.sensors;
	var my = this.properties;  // e.g. my.name  
	var me = this;

	////////////////   Initialization  ////////////////
	

	// Initialize the creature from data
	this.actions.init = function(data){
		
		if(!data){
			console.log("Initing creature with no data");
			return;
		}

		console.log("Initing creature with data:");

		// Go through each property in the data object and add to the creature
		if(data.properties){
			for ( propertyName in data.properties){
				var propertyVal = data.properties[propertyName];
				console.log( "   " +  propertyName + ":" + propertyVal);					
				
				// There are two types of properties vals and functions
				
				// If the property is a function - call it on the creature
				// This is how we add abilities to creature
				if(typeof(propertyVal) =="boolean") {
					
					// Convert string name to function and call it if it exists 
					//e.g. drawable(me)
					if(window[propertyName]){window[propertyName](me);} 
					else{ console.log("init error trying to call property function: " + propertyName);}

				}else{ // We have normal name value pair property
					properties[propertyName] = propertyVal;
				}
			}
		}

		if(data.brains){
			// go through each brain
			for(var i =0 ; i < data.brains.length ; i++){
				var currBrain = data.brains[i];
				console.log("got a brain:" + currBrain.name);
				me.brains[currBrain.name] = new currBrain( "" , me);

				//Todo: tell all the brains to start
			}

			// for(brain in data.brains){
			// 	console.log("got a brain:" + data[brain]);
			// 	// console.log( "   brain:" + data.brain.name);					
				
			// 	me.brains.brain = data.brains[brain];	
			// }			
		}

		// Go through each method in our and add it to the creature
		if(data.actions){
			for ( method in data.actions){

				var args= "()";
				if(data.actions[method].arguments) args = data.actions[method].arguments;
				var code = data.actions[method].code;
				var methodName = method;

				var funcToAdd;
				var codeString = "var funcToAdd = function " + methodName + args
									+ code

				console.log( "   " + codeString );		

				// Recreate the function from a string 
				eval(codeString);
				
				if(!funcToAdd){
					console.log("error trying to eval function from data");	
					return;
				} 

				actions[methodName] = funcToAdd;
			}
		}

		if(data.sensors){
			console.log("adding sensors");
			for (sense in data.sensors){
				console.log("adding sense of:" + sense);

			}
		}
	}


	// Setup the properties of the creature if we got a message with properties
	if(initMessage) {
		// If we get a message that is an object with an init data
		if (typeof(initMessage) == "object") { 
			this.actions.init(initMessage);
		}
	} 

	////////////////////////////////////////////////////////////////

	////////////////  SENSING   ////////////////

	// help on defining custom events :
	//http://www.kaizou.org/2010/03/generating-custom-javascript-events/
	// http://stackoverflow.com/questions/9671995/javascript-custom-event-listener
	// https://github.com/ariya/phantomjs/issues/11289

	// All creatures have ear's to hear other creatures messesages
	
	this.sensors.ears = function (){		

		var callback = me.actions.receiveMessage;
		// If the creatures ears get a message run the receieved message action
		createNewEvent("message",callback);
		// createNewEvent("message",myEventHandler);
	}

	// This creature has a sense of foo
	this.sensors.foo = function(){

		var evt = document.createEvent("Event");
		evt.initEvent("myEvent",true,true); 

		//register
		document.addEventListener("myEvent",myEventHandler,false);
		document.addEventListener("myEvent",myEventHandler2,false);

		//invoke
		// document.dispatchEvent(evt);

	}

	this.sensors.mouseenter = function(){
		
		// var handlerFn = foo;
		var handlerFn = function(){

			// var elem = drawMessageInput(my.x + my.w + 25,  my.y + my.h/2,me);
			var elem = drawMessageInput(15, my.h+10,me);
			var caret = rect(0, my.h+10,15,15,"transparent");
//js
			// show a caret
			$(caret).text(">")
					.addClass("commandCaret")
					.appendTo(my.body)
					.fadeIn()
					.show();

			my.body.appendChild(elem);
			elem.focus();		
		}	


		$( my.body).mouseenter( handlerFn );
	}()

	this.sensors.mouseleave =function(){
		
	
		var handlerFn = function(){			
			//fade out and command carent
			$(".commandCaret").fadeOut();					
		}	


		$( my.body).mouseleave( handlerFn );
	}()


	function myEventHandler() {
		console.log("i got pinged!");
	}

	function myEventHandler2() {
		console.log("i also got pinged!");
	}

	///

	// Can sense messages from other creature i.e has ears
	this.actions.receiveMessage = function(receivedMessage, fromCreature){

		// console.log("receiving message");
		if(!fromCreature) {
			console.log(my.name + " got anonymous message :" + receivedMessage);
		} else{
			console.log( fromCreature.properties.name + ": \"" + receivedMessage  
			+ "\" ( Message to " + properties.name + " )");
		}
		
		if(!me.brains){
			console.log("Me no have no brains...");
			return;
		}

		// Todo fix up routing of received messages to brains

		// If you receive a message send it to the creature's brain		
		// for PROCESSING

		var foundLanguageBrain;
		var response = "";
		//Look at each brains type and look for language brains
		for(currBrainName in me.brains){
			
			if(me.brains[currBrainName].type =="languageBrain") {
				
				foundLanguageBrain = me.brains[currBrainName];

				// Send all messages to the languageBrains
				response = foundLanguageBrain.receiveMessage(receivedMessage,fromCreature);
		
			}
		}
		
		// To do what to do about speacial brains e.g. blinking ?
		return response;

		// var response = me.brain(receivedMessage, fromCreature, me); //mybrain
		// // Once we get a reponse from our brain send a response message out.
		// if(response && fromCreature) actions.sendMessage( response, fromCreature);
	
	}

	
	//////////////////   ACTIONS  - all creatures have ////////////

	// Can send messages to other object ... has a mouth
	this.actions.sendMessage = function (messageToSend , toTarget){
		
		// console.log("creature with name:" + properties.name 
		// 	+ " sent msg:" + messageToSend
		// 	+ " to creature:" + toTarget.properties.name); 		
		
		// make sure that the target is another creature
		var isValidCreature = toTarget instanceof ClayCreature;

		// if a target is specified send it
		if(toTarget && isValidCreature) {
			toTarget.actions.receiveMessage(messageToSend, me);
		} else {
			console.log( my.name + 
				" tried to send a message to a creature that doesn't exist");
			return toTarget;
		}

	}

	this.actions.wakeUp = function(){

		// when the creature is awake we fire all sensors
		my.loop = setInterval(me.actions.update , 500);	
	}
	
	this.actions.sleep = function(){
		clearInterval(my.loop);	
	}
	

	// All creatures update their state if recieve a message to do so
	this.actions.update = function(){
		
		// console.log("creature : " + my.name + " updating self" );

		// If we have a body
		if(my.body){
			// console.log("updating body");			
			my.x += 10;
			my.y += 10;
		}

		actions.draw();
	}
	this.actions.getAge = function(){return getAge(me);	}

	// All creatures can have new actions added to them
	// this allows us to send string messages to define
	// Code is added as strings (for saving ) as well as dynamically attached
	this.actions.addAction = function(methodName, code, arguments){
		
		console.log("adding method to object with methodname:" + methodName);
		
		// Method format as an object
		//{ "methodname" : {arguments:"none," ,code:"{some code}"} };

		var methodData = {
			"arguments":arguments,
			"code":code
		} ;

		// Add the method to the code object of the creature
		properties.code[methodName] = methodData;		

		//Dynamically attatch the method to the creature

		//Todo
	}


	///////////////////////// Junk area of creature

	actions.helloWorld = function(){
		console.log("hello world!");
	}

	// var foo = function(){console.log("foo")}
	// function foo(){ console.log("foo");}

}

function setupMessageInput(elem,creatureName){
	
	console.log("setting up message input for " + creatureName.properties.name);
	

	elem.onkeydown= function(event){

	    var eventKeyCode = (window.event ? event.keyCode : event.which);
    	var eventChar = String.fromCharCode(event.charCode); 

    	// Once you start typeing clear the text
    	if(elem.innerText==clay.defaultInputString){
    		elem.innerText =" ";
  			$(elem).removeClass("placeholder");
    		elem.focus(); 	
    	}

        if ( eventKeyCode == 13) {  //enter was pressed           
        	var currentText= elem.innerText;
        	console.log("sending message:" + currentText);
  	        event.preventDefault();
    		elem.innerText =" ";

    		var response = creatureName.actions.receiveMessage(currentText);
    		
    		// var x =creatureName.properties.x + 20 + creatureName.properties.w;
    		// var y = creatureName.properties.y - 30;

			var position = $(creatureName.properties.body).position();
			// var right = $(window).width() - position.left - link.width();
			// Where is the absolute top of the creature? plus a little padding
			var bottom = $(window).height() - position.top + 15; 
    		var bottomRelative = creatureName.properties.h + 15;
			var leftRelative = creatureName.properties.w*.75;
    		
    		// Absolute Offsets for speech bubble
    		var x =creatureName.properties.x + creatureName.properties.w*.75;    		
    		var y = creatureName.properties.body.top;
    		
    		//todo if(!response)

    		if(response){
    			// If we dont want to append draw in absolute place:
    			// var responseElem = drawResponseBubble(response,x,bottom,"absolute");
    			response ="<b>"+creatureName.properties.name +"</b>"+": " + response ;

    			// Relative: draw and append a speech bubble relative to creature
    			var responseElem = drawResponseBubble(response,leftRelative,bottomRelative,"absolute");
    			append(responseElem,creatureName.properties.body);

    			// fade out message after a few seconds
    			$(responseElem).fadeIn();
				$(responseElem).delay(3000).fadeOut(1000); // fade out delay
    		}
        }
	}

}

clay.defaultInputString = "type your message";
//js
function drawMessageInput(x,y,creatureName){
	// console.log("drawing message input for " +creatureName.properties.name);

	chatInputId = "chatInput" + creatureName.properties.name;
	var msgDiv = document.getElementById(chatInputId);

	if(!msgDiv){
		msgDiv = document.createElement("div");
		msgDiv.id = chatInputId ;
		// document.body.appendChild(msgDiv);
		msgDiv.classList.add("placeholder");
		$(msgDiv).text(clay.defaultInputString);
	    setupMessageInput(msgDiv,creatureName);	
    }	

	
	// If this first setup put some placeholder text
	// if($(msgDiv).hasClass("placeholder") || $(msgDiv).text().trim()==""){ 
	// 	global = msgDiv;
	// 	console.log("clearing");
	// 	$(msgDiv).text(clay.defaultInputString);
	// 	msgDiv.classList.add("placeholder");
	// }

	msgDiv.setAttribute("contentEditable", true);
	msgDiv.classList.add("chatInput");

	// currentString = msgDiv.innerText.trim();
	currentString = $(msgDiv).text();

    msgDiv.style.position ="absolute";
	msgDiv.style.top = y +"px";
	msgDiv.style.left = x + "px";

	// msgDiv.focus(); 

	return msgDiv;
}

function drawResponseBubble(responseText,x,y,position){
	// console.log("drawing message input");

	var elem = document.getElementById("responseBubble");

	if(!elem){
		elem = document.createElement("div");
		elem.id = "responseBubble";
		document.body.appendChild(elem);
    }	

	elem.classList.add("responseBubble");
	elem.classList.add("bubble");

	elem.innerHTML = responseText;
	
	if(position =="absolute"){
	    elem.style.position ="absolute";
		// elem.style.top = y +"px";
		elem.style.bottom = y +"px"; // using bottom to prevent occlussion below
		elem.style.left = x + "px";
	}
	return elem;
}


//////////////////////////////////////////////////////////////////////////////////////////
// Abilities that we can add to creatures
//////////////////////////////////////////////////////////////////////////////////////////

// Add drawable abilities to a creature
// has a draw function
// has apperance properties
// usage: drawableCreature(creatureObject);
function drawable(inputCreature, inputHTMLBody){

	if(!inputCreature) { console.log("need to input a creature to make drawable"); return 	} 
	console.log("    adding drawing ability to creature");

	var my = inputCreature.properties;
	var body = my.body;
	var me = inputCreature;

	my.body = {}; // add a body
	my.drawable = true;
	
	// default body parameters
	// my.body.x = 200 ; // upper left
	// my.body.y = 200;
	// my.body.w = 200 ;
	// my.body.h = 200 ;
	my.x = 200 ; // upper left
	my.y = 200;
	my.w = 200 ;
	my.h = 200 ;

	var x = my.x ; 
	var y = my.y ;
	var w = my.w ;
	var h = my.h ;

	// The creatures body is an object that can be used to generate an HTML element
	// all creatures have rectangle as a body
	// var testRect = new Rect(x+20,y+20,20,20,"black");
	// my.body = new Rect(x,y,w,h); 
	// my.body = drawRect(my.body , my.name + "Body" + my.birthday); // defaultRect
	
	// The creatures body is an HTML div element - as a bounding box
	my.body = rect( x,y,w,h, "lightBlue");
	my.body.id = my.name + "Body" + my.birthday.getTime();

	//js
	//body is an html string we pass in 
	var testHTML = "<div> what what </div>";

	// If there was an innerHTML string to attach draw it
	if(inputHTMLBody){
		my.body.innerHTML = inputHTMLBody;
	}

	// test drawing eye elements directly
	var leftEye =rect( 20,20, 40, 40, "green");
	leftEye.id = my.name+"leftEye";
	var rightEye =rect( 200-60, 20, 40, 40, "red");
	rightEye.id = my.name+"rightEye";

	// var torso = rect( -20, 200, 200+40, 150, "lightBlue");
	// my.body.appendChild (torso);
	my.body.appendChild (leftEye);
	my.body.appendChild (rightEye);
	
	
	my.body.classList.add('creatureContainer')

	// Drawing action - just draws the current body
	inputCreature.actions.draw = function(){

		// Draw creature's body element
		// watch(my, "x", function(){console.log("wwwww");})

		// Check for updated properties for the creature model

		// make sure a container body is appended i.e. draw
		if(!document.getElementById(my.body.id)){ 
			document.body.appendChild(my.body);
		}	

		setX( my.x, my.body);
		setY( my.y, my.body);
		setW( my.w, my.body);
		setH( my.h, my.body);
		

		// var drawElem = drawRect(my.body , my.name + "Body" + my.birthday); // defaultRect	
	}
}

// Jquery ondrag event
// http://api.jqueryui.com/draggable/#event-drag
function onCreatureDrag( event, ui, draggedCreature){
	
	var newX = ui.position.left;
	var newY = ui.position.top;	
	// console.log(draggedCreature.properties.name + "got dragged to X:" + newX +"Y:" +newY);
	
	var id  = ui.helper.attr("id"); // id of the html element being dragged

	// Make sure we are dragging a creature with a valid name
	if(!contains(id,"Body")) { // Ids are in form creatureName + "Body"
		console.log("On creaturedrag not a valid id in html");
		return;
	}

	var creatureName = id.substr(0, id.length - "body".length); // the original name of creature
	// console.log("name: " + creatureName);
	
	// UPDATE: the body properties of the creature
	// make sure the creature has a body with x and y	
	// if(!draggedCreature.properties.body.x || !draggablegedCreature.properties.body.y ) {
	if(!draggedCreature.properties.x || !draggedCreature.properties.y ) {
		console.log("on drag of creature error trying to update body ");
		return;
	}
	draggedCreature.properties.x = newX;
	draggedCreature.properties.y = newY;
}

function draggable(inputCreature){

	console.log("    adding draggable ability to creature");

	inputCreature.properties.draggable = true; // Set a flag in the creatures body

	var drawElem = inputCreature.properties.body; // get the html element of the body
	

	// Jquery drag callback with our creature passed in
	var dragCallback = function(event,ui,draggedCreature){
		return onCreatureDrag(event,ui,inputCreature);
	};

	// JQUERY call: to make div draggable
	$( drawElem ).draggable(); 

	// Draggable creatures should update thier body's state	 if they move
	$( drawElem).on( "drag",  dragCallback); // register callback for updating position 
			
}

//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

function createCreature(message) {

	// parse the message for initial parameters to send
	if(typeof(message) == "string"){
		// message is of type "name:43 , prop:val etc"
		// process the name val pairs into json and tak on init
		message = {init: convertStringToJSON(message)};
	}

	var newCreature = new ClayCreature(message);

	return newCreature;
}


////////////////// Clay helpers   ///////////////////////

//Takes in a named parameter string and wraps as JSON object
// assumes a shortcut string " name: joel , age : 23 "
function convertStringToJSON(string){
	
	var resultObj = {};

	string = string.trim();
	var pairs = string.split(",");

	for ( var i = 0 ; i < pairs.length ; i++){
		var currPair = pairs[i];
		var currPair = currPair.split(":");
		
		var key = currPair[0].trim();
		var value = currPair[1].trim();
		
		resultObj[key] = value;
	}

	return resultObj;
}

// Junk helpers

var foo = function(){
	console.log("foo function was called !")
	return 42;
}

function blink(){
	console.log("blink!");
}

function blink2(){
	console.log("another blink function!");
}
////////////////////////////////// Javascript helpers ///////////////////////

String.prototype.toCamel = function(){
	//replace all spaces with dashes
	var cleaned = this.trim();
	var addDashes = cleaned.replace(" ","-");
	return jQuery.camelCase(addDashes);	
}

// Extend JS strings so we can do "abc_string".contains("abc")
String.prototype.contains = function(substring){

	return contains(this, substring);  
}

function contains (string, substring){
	// Does the string contain a substring ?

	var result = string.indexOf(substring);
	
	// Not in the the substring
	if (result == -1 ) {		
		return false;
	} 

	// bug if word starts 0 is interpreted as false
	else if (result == 0 ){ 
		return true;
	}

	return result;
}

Array.prototype.contains = function( elementToFind){
	for (var i = this.length - 1; i >= 0; i--) {
	 	if(this[i] == elementToFind) return true;
	 }; 
	 return false;
}

// Remove elements of certain type from array
//http://stackoverflow.com/questions/281264/remove-empty-elements-from-an-array-in-javascript
Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};


// Returns a random number between min and max
function randNum(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min,max){
	return Math.floor(randNum(min,max)) 
}

////////////////////////////////// EVENT HANDLING ////////////////

// For dealing with EVENTS - using DOM event handlers
// E.g. we can do: newEvent = createNewEvent("fooHappened", method(s) to call if "foohappened")
// later we can send the event out to the world: document.dispatchEvent(newEvent)
// We can pass multiple call backs in e.g.: createEvent("foo",blinkFn,blinkFn2)
function createNewEvent(eventName, myEventHanderFn,targetCreature){
	
	var evt = document.createEvent("Event");
	evt.initEvent(eventName,true,true);

	// Go through each argument passed - since we can pass multiple handers
	for (var i = arguments.length - 1; i >= 0; i--) {
		var currentArg = arguments[i];
		// if we find a call back function add
		if(typeof(currentArg) == "function"){
			addListener(eventName,currentArg,targetCreature);
		}
	};
	
	//dispatching of event later
	// document.dispatchEvent(evt); 
	return evt;
}

// Creates an event and makes it happen
function makeEventHappen(eventName,targetCreature){
	var evt = createNewEvent(eventName);
	if(!targetCreature) {document.dispatchEvent(evt); }
	else { targetCreature.dispatchEvent(evt);  }
}

function addListener(eventName,myEventHanderFn, targetCreature){
	if(!targetCreature){
		document.addEventListener(eventName,myEventHanderFn,false);
	}else{
		targetCreature.addEventListener(eventName,myEventHanderFn,false)
	}
}

//////////////////////////////////// Sample Creature Brains

// some simple behaviour
function simpleBrain(receivedMessage, fromCreature,creature){
	
	if(!fromCreature) {
		console.log("need to specify a creature for the brain");
		return;	
	} 
	
	var response = "";
	if(receivedMessage){
		response = "me so stupid";	
	} 

	console.log(creature.properties.name +": "+  response);
}

function ClayBrain(initMessage,inputCreature){

	// Brains are just simple creatures that receive msgs
	// and output messages just like clayCreatures
	
	// this.prototype = new ClayCreature(); // inherit from claycreature	
	this.thoughtId; 			         // a reference number to our thoughts
	this.thinkingRate = 1000;    		 // how often should we think in millis?
	this.properties.type = "clayBrain";
	this.hostCreature = inputCreature;

	var me = this;

	// Every brain has a single thought - a function that can loop forever
	this.thought = function(){ console.log("thinking empty thoughts...");};
	
	this.startThinking = function(newThinkingRate){	
		var oldRate = this.thinkingRate;
		if(newThinkingRate == "faster") newThinkingRate = oldRate/2;
		else if (newThinkingRate == "slower") newThinkingRate= oldRate*2;

		// bug that "this" is not updated to subclass, callback is not overriden.
		// if(newThinkingRate && typeof(newThinkingRate)=="number") this.thinkingRate = newThinkingRate;
		if(newThinkingRate) this.thinkingRate = newThinkingRate;

		// stop/clear any old interval that is currently running
		this.thoughtId  = clearInterval(this.thoughtId); 

		this.thoughtId  = setInterval(this.thought , this.thinkingRate);	

		this.thought();
		console.log("brain waking up ... starting to think with thought id:" + this.thoughtId);
	}

	this.stopThinking = function(){
		this.thoughtId  = clearInterval(this.thoughtId); 
		console.log("going to sleep.... stopping brain thoughts");
	}

	// Brains are connected to their host creature's ears
	// Any messages directed towards creature ears are forwarded to a brain	 
	// By default brains registor for "start" and "stop" messages directed to them


	// Brains respond to messages to wake up (starts thoughs) or sleep (stops thoughts)
	this.receiveMessage = function(inputMsg, inputRate){

		inputMsg = inputMsg.toLowerCase();

		if(inputMsg == "start" || inputMsg == "wakeup") { 
			this.startThinking(inputRate);

		}
		else if(inputMsg == "stop" || inputMsg == "sleep") {
			this.stopThinking();
		}
	}
}
ClayBrain.prototype = new ClayCreature();


// Example of making a blinking brain based on a clay brain
function BlinkingBrain(initMessage,inputCreature){

	// Brain setup
	var my = this;
	this.thinkingRate = 2000; 		// default blink rate in millis
	if(inputCreature) this.hostCreature = inputCreature;

	this.toggle = new Switch(); 	
	if(!this.onColor) this.onColor = "pink";
	if(!this.offColor) this.offColor ="lightblue";

	// Our main brain loop
	this.thought = function(){ 		
		console.log("blinking...");		
		
		// flip our internal switch
		var switchVal = my.toggle.flip(); 

		// If this brain is not in a creature with a body exit
		if(!my.hostCreature || !my.hostCreature.properties.body) return; 
		
		if(switchVal == "on"){
			my.hostCreature.properties.body.style.backgroundColor = my.onColor;
		}
		else{
			my.hostCreature.properties.body.style.backgroundColor = my.offColor;	
		}
		return switchVal;
	}

	this.startBlinking = function(rate){
		my.startThinking(rate);
	}

	this.stopBlinking = function(){
		my.stopThinking();
	}

	// Add an action to the creature - i.e creature can blink
	if(my.hostCreature) { 

		// my.hostCreature.actions.blink = my.thought;
		my.hostCreature.actions.blink = my.startBlinking;
		my.hostCreature.actions.startBlinking = my.startBlinking;
		my.hostCreature.actions.stopBlinking = my.stopBlinking;
	}

}
BlinkingBrain.prototype = new ClayBrain();


function Switch( startValue){
	if(!startValue) this.value = "off";
	else this.value = startValue;

	this.flip = function(){

		if(this.value == "off") {
			 this.value = "on";
		}
		else {
			this.value = "off";
		}
		// console.log("toggleValue:" + this.value);
		return this.value;
	}
}

function getAge(inputCreature){
	var creatureBday = inputCreature.properties.birthday;
	var now = new Date();



	var secondsDiff = (now - creatureBday)/1000;
	var minutesDiff = secondsDiff/60;
	var hoursDiff = minutesDiff/60;
	var daysDiff = hoursDiff/24;

	if(secondsDiff <= 60){ return secondsDiff.toFixed()+ " seconds";}
	else if (minutesDiff <=60){ return minutesDiff.toFixed() + " minutes";}
	else if (hoursDiff <=24){ return hoursDiff.toFixed() + " hours";}
	else return daysDiff.toFixed();

}
// Language brain - interprets all messages coming into creature
function LanguageBrain( inputDictionary, inputCreature ){

	var my =this;
	this.type = "languageBrain";
	this.hostCreature = inputCreature;

	if (inputDictionary) this.messageDict  = inputDictionary;

	// default message dicitonary is used for converting input messages 
	// to responses
	this.messageDict = {
		"hello": "hello back to you",
		"hi": "hey",
		"hey": "hi",
		"how are you": "feeling blue",
		"how are you ?": "feeling binary",
		"why": "who knows",
		"ping": "pong",
		"marco": "polo",
		"here i am": "so glad you are",
		"what time is it ?": Date,
		"what time is it": Date,
		"how old are you": "a few minutes",		
		"test": 42,
		"what is the meaning of life": 42,
		"blinkB": blink
	};

	// add any public creature actions to the messageDict
	// for(action in this.hostCreature.actions){
	// 	console.log("log:" +action);
	// 	this.messageDict[action] = this.hostCreature.actions[action];
	// }	


	this.receiveMessage = function ( rawMessage) {
		

		console.log("languge brain got a message");
		var response = "";
		var responseType = "";
		var properties = this.hostCreature.properties;

		if(typeof(rawMessage)!="string") {
			console.log("error in language brain- message must be string");
			return;
		}

		// MESSAGE CLEANING
		var messageData = cleanMessage(rawMessage);
		var messageString = messageData.cleanedMessage;
		var words = messageData.words;	
		var wordsCasePreserved = messageData.wordsCasePreserved;	
		var camelCased = rawMessage.toCamel();
		// global = messageData;


		// ACTION RESPONSE - CAMEL CASE CONCATINATION
		// If string corresponds to an action the creature has
		var foundAction = isActionNameInWordArray(wordsCasePreserved,this.hostCreature.actions);
		//assume that the arguments are everything after the first word
		var msgArguments = wordsCasePreserved.slice(1, words.length);
		if(this.hostCreature.actions[camelCased]){
			response = this.hostCreature.actions[camelCased]();
			if(!response) response="ok";
			responseType ="direct creature action (camelcase)";		
		}
		// ACTION RESPONSE Direct
		else if(foundAction){
			// console.log("found action:"+foundAction + " f:" +this.hostCreature.actions[foundAction]());
			
			// using apply to send arg array as argument list
			// http://stackoverflow.com/questions/1316371/converting-a-javascript-array-to-a-function-arguments-list
			// this.hostCreature.actions[foundAction](msgArguments);
			// if(msgArguments){
				response = this.hostCreature.actions[foundAction].apply(this || window, msgArguments);
			// }
			// else this.hostCreature.actions[foundAction]();
			if(!response) response="ok";
			responseType ="direct creature action";		
		}

		// Direct RAW RESPONSE ( no cleaning)
		// We check if we have a direct response in our message dictionary
		else if(this.messageDict[rawMessage]){

			var responseVal = this.messageDict[rawMessage];

			if(typeof(responseVal) == "function"){
				response = responseVal();					
			}else{
				response = responseVal;
			}
							
			responseType ="direct raw response";		
			
		}

		// DIRECT RESPONSE
		// First we check if we have a direct response in our message dictionary
		else if(this.messageDict[messageString]){
			var responseVal = this.messageDict[messageString];
			
			if(typeof(responseVal) == "string"){
				response = this.messageDict[messageString];	
			}
			else if(typeof(responseVal) == "function"){
				response = responseVal();					
			}
							
			responseType ="direct response";		
			
		}

		// DIRECT MENTION OF PROPERTY
		else if( isPropertyNameInWordArray(words,properties) ) {

			var propertyMentioned = isPropertyNameInWordArray(words,properties); 
			
			if (typeof(properties[propertyMentioned]) == "function"){
				var functionResult = this.hostCreature.properties[propertyMentioned](this.hostCreature);
				response = "my " + propertyMentioned +" is " + functionResult;			
				responseType="function property"
			}
			else{
				response = "my " + propertyMentioned +" is " + properties[propertyMentioned];	
				responseType="direct mention of property"
			}
			
		}
		
		// // QUESTION
		else if( isQuestion(messageString)){			
			responseType = "question response";

			response = "Me no know";			
		}

		////////////////// END OF MESSAGE INTERPRETATION /////////////

		if(response) console.log( responseType + ":" + response);
		else { console.log("i have no response for that") };

		return response;
	}

	function cleanMessage(rawMessage){
		var cleanedMessage = rawMessage;
		
		// pad punctionation with spaces so the words dont collide
		// some words might be beside a punctuation e.g. "name?"		
		cleanedMessage =cleanedMessage.replace("?"," ? ");
		cleanedMessage =cleanedMessage.replace("."," . ");
		cleanedMessage =cleanedMessage.replace(";"," ; ");
		
		var wordsCasePreserved = cleanedMessage.split(" ").clean("");
		cleanedMessage = cleanedMessage.toLowerCase();
		cleanedMessage = cleanedMessage.trim();

				
		var words = cleanedMessage.split(" "); // by whitespace and mutiple "  "
		words.clean(""); // remove any null strings
		
		// reconstruct message as combination of all words single spaced
		var singleSpaced = "";
		for (var i = 0 ; i < words.length ; i++) {
			singleSpaced += words[i] + " ";
		};

		cleanedMessage = singleSpaced.trim();
		
		var messageData = {
			cleanedMessage: cleanedMessage,
			rawMessage:rawMessage,
			words:words,
			wordsCasePreserved:wordsCasePreserved
		}
		return messageData;
	}

	function isQuestion( sentence ) {
		var questionWords =[ "?","what","where","why","how"];

		for (var i = questionWords.length - 1; i >= 0; i--) {
			currWord = questionWords[i];
			
			if (sentence.contains(currWord) ){
				return currWord;
			}
		};
	}

 	function isPropertyNameInWordArray( words, properties){
		
		// look if the message is contains any mention of my properties
		// "eg. what is your name"
		for( currProperty in properties){
			if (words.contains(currProperty)) {				
				return currProperty;

			}
		}

		return false;
 	}


 	function isActionNameInWordArray( words, actions){
		
		// look if the message is contains any mention of my actions
		for(var i = 0 ; i < words.length ; i++){
			var currWord = "" + words[i];
			// console.log("curr word:" + currWord);

			if( actions[currWord]){
				return currWord;
			}
		}

		return false;
 	}

}  //////////////// END OF LANGAUGE BRAIN /////////////
LanguageBrain.prototype = new ClayBrain();


// Brain with basic responses
// can tell about its properties
// can execute commands
// can respond to various string messages
function venusBrain(receivedMessage, fromCreature , creature){

	if(fromCreature && creature){
		console.log(creature.properties.name + "'s brain got a message"
		+ " from " + fromCreature.properties.name);
	} else{
		console.log(" brain got an message from anonymous");
	}

	var response= "";
	var properties = creature.properties;
	var actions = creature.actions;

	// console.log( fromCreature.properties.name + ": \"" + receivedMessage  
	// 	+ "\" ( Message to " + properties.name + " )");


	
	// // Message is either a string or an object

	// // If the message is a string
	// if(typeof(receivedMessage) == "string"){
	// 	// console.log("got string message");
	// 	// assume that any string message is a command
	// 	receivedMessage = {command:receivedMessage};
	// }
	
	// // If the message is a an object
	// if (typeof(receivedMessage) == "object"){
	// 	// console.log("got object message");

	// 	// If you recieve a message that is a command run the command
	// 	if(receivedMessage.command){
	// 		// this.actions.helloWorld();
	// 		// console.log("got a potential command object message");
	// 		var foundMethod = actions[receivedMessage.command];
			
	// 		// does the creature have a method by the command name?
	// 		if(foundMethod) {
	// 			console.log("calling found a method :" + foundMethod);
	// 			foundMethod();
	// 		}
	// 		//run it
	// 		return; // temp return early
	// 	}
	// }

	// // We calculated valid response send a message back to the object
	// if(response) actions.sendMessage( response, fromCreature);

	
	// If the message is an object

	// If you recieve a message that is a command run the command
	if(typeof(receivedMessage) == "object" && receivedMessage.command){
		// this.actions.helloWorld();
		console.log("got a command");

		///js
		// does the creature have a method by the command name?
		if(actions[receivedMessage.command]) {
			foo();
		}
		//run it
		return; // temp return early
	}

	// Message cleanup if it is a raw string
	if(typeof(receivedMessage)=="string"){
		receivedMessage = receivedMessage.toLowerCase(); // clean up message	
	} 

	// if you get a message that says hello say hello back
	if(receivedMessage == "hello"){ 			
		// actions.sendMessage( "hello back to you", fromCreature);
		response = "hello back to you";
	}

	if(receivedMessage == "here i am"){ response = "so glad you are";}



	// If the message is a question check if inquiring about property
	if( contains(receivedMessage , "?") || contains(receivedMessage , "what") ){
		var foundValid = false;
		// look if the message is contains any mention of my properties
		// "eg. what is your name"
		for( property in properties){
			if (contains(receivedMessage , property)) {
				response = "my " + property +" is " + properties[property];
				foundValid = true;
			}
		}

		if(!foundValid) response = "Me dont know what that is";
	}


	// if(receivedMessage == "what is your name?"){ 			
	// 	response =  "my name is " + properties.name;
	// }

	// if(response) actions.sendMessage( response, fromCreature);
	
	return response;
}


////////////////////////////////////// DRAWING ///////////////////

function setX(x,elem){
    elem.style.left = x  + "px";
}
function setY(y,elem){
    elem.style.top = y  + "px";
}
function setW(w,elem){
    elem.style.width = w  + "px";
}
function setH(h,elem){
    elem.style.height = h  + "px";
}

// rectange function to return a rectangle element HTML (div)
function rect( x,y,w,h, color){
	
    var x = x;
    var y = y;
    var w = w;
    var h = h;
    var color = color;

  	//defaults
    if(x == undefined) x = 0;
    if(y == undefined) y = 0;
    if(w == undefined) w = 100;
    if(h == undefined) h = 100;
    if(color == undefined) color = "lightgrey";	

	rectElem = document.createElement("div");
	// rectElem.id = id;

    rectElem.innerHTML = "";
    rectElem.style.backgroundColor = color;
    rectElem.style.position ="absolute";
    rectElem.style.left = x  + "px";
    rectElem.style.width = w + "px";
    rectElem.style.top = y  + "px";
    rectElem.style.height = h + "px";
    
    //temp
    // rectElem.style.border = "1px solid blue";

    return rectElem;

}

// Make a rectangle object
function Rect( x,y,w,h, color){

    //defaults
    if(x == undefined) x = 100;
    if(y == undefined) y = 100;
    if(w == undefined) w = 100;
    if(h == undefined) h = 100;
    if(color == undefined) color = "lightgrey";	

    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;

}

// Draw a rectangle - or updates a rect if it is passed in
// Creates and appends a new rectangle if needsed
function drawRect(rectObj, id){
	
	var rect  = rectObj;
	
	// If no rectangle object was passed in create a new one
	if(!rectObj){
		rectObj = new Rect();	    
	}

	var x = rectObj.x;
	var y =  rectObj.y;
	var w = rectObj.w;
	var h =  rectObj.h;
	var color = rectObj.color;

	console.log("Drawing rectangle with x y w h color : "  + 
                 x + "," + y + "," + w + "," + h + "," + color);
    

	// If we are just updating a rectange dont create an element
	var rectElem = document.getElementById(id);

	// if no rect element by that id already exists create and append.
	if(!rectElem){ 
		rectElem = document.createElement("div");
		rectElem.id = id;
		document.body.appendChild(rectElem); // bug: document body may not exist
	} 	

    rectElem.innerHTML = "";
    rectElem.style.backgroundColor = color;
    rectElem.style.position ="absolute";
    rectElem.style.left = x  + "px";
    rectElem.style.width = w + "px";
    rectElem.style.top = y  + "px";
    rectElem.style.height = h + "px";

    return rectElem;

}

////////////////////////////////////// FROM WORLD /////////////////////////
////////////////////////////////////////////////////////////////////////////


/////////////// Watching  Variables /////////////////////////////////



//http://techblog.personalcapital.com/2013/02/js-hacks-dead-simple-javascript-variable-change-watchers/

function watch(target, prop, handler) {
    if (target.__lookupGetter__(prop) != null) {
        return true;
    }
    var oldval = target[prop],
        newval = oldval,
        self = this,
        getter = function () {
            return newval;
        },
        setter = function (val) {
            if (Object.prototype.toString.call(val) === '[object Array]') {
                val = _extendArray(val, handler, self);
            }
            oldval = newval;
            newval = val;
            handler.call(target, prop, oldval, val);
        };
    if (delete target[prop]) { // can't watch constants
        if (Object.defineProperty) { // ECMAScript 5
            Object.defineProperty(target, prop, {
                get: getter,
                set: setter,
                enumerable: false,
                configurable: true
            });
        } 
        else if (Object.prototype.__defineGetter__  && Object.prototype.__defineSetter__) { // legacy
            Object.prototype.__defineGetter__.call(target, prop, getter);
            Object.prototype.__defineSetter__.call(target, prop, setter);
        }
    }
    return this;
};

function unwatch(target, prop) {
    var val = target[prop];
    delete target[prop]; // remove accessors
    target[prop] = val;
    return this;
};

// Allows operations performed on an array instance to trigger bindings
function _extendArray(arr, callback, framework) {
    if (arr.__wasExtended === true) return;

    function generateOverloadedFunction(target, methodName, self) {
        return function () {
            var oldValue = Array.prototype.concat.apply(target);
            var newValue = Array.prototype[methodName].apply(target, arguments);
            target.updated(oldValue, motive);
            return newValue;
        };
    }
    arr.updated = function (oldValue, self) {
        callback.call(this, 'items', oldValue, this, motive);
    };
    arr.concat = generateOverloadedFunction(arr, 'concat', motive);
    arr.join = generateOverloadedFunction(arr, 'join', motive);
    arr.pop = generateOverloadedFunction(arr, 'pop', motive);
    arr.push = generateOverloadedFunction(arr, 'push', motive);
    arr.reverse = generateOverloadedFunction(arr, 'reverse', motive);
    arr.shift = generateOverloadedFunction(arr, 'shift', motive);
    arr.slice = generateOverloadedFunction(arr, 'slice', motive);
    arr.sort = generateOverloadedFunction(arr, 'sort', motive);
    arr.splice = generateOverloadedFunction(arr, 'splice', motive);
    arr.unshift = generateOverloadedFunction(arr, 'unshift', motive);
    arr.__wasExtended = true;

    return arr;
}



//usage example
var data = {
     quantity: 0
     , products:  []
}

watcher = function(propertyName, oldValue, newValue){ 
	console.log("watcher - detected a change in the world"); 
	console.log(propertyName + " old:" + oldValue + " new:" + newValue );
};

watch(data, 'quantity', watcher);
watch(data, 'products', watcher);


/////////////// END -  Watching  Variables  ///////////////////////////////////////

///////////////  ///////////////////////////////////////

