////////////////////////////////////////////////////////////////////////
//
// For Creating in a page via free flow text 
// Can create standard Html Elements and execute loaded clay code
//
////////////////////////////////////////////////////////////////////////

var Creator = {}; // global specific to creator 
var World = {} ;   // var World = {} ;

World.printKeyboard = false;;
World.printMouseMove = false;
World.printMouseClick = false;
World.keyPressed = false;
World.numObjects = 0;

//////////////////////////////////////////////////////////////////////////
// World Setup
////////////////////////////////////////////////////////////////////////

window.addEventListener("load",setupWorld);

function setupWorld(){

    console.log("Setting up creator");
    Creator.objects = [];
    Creator.numObjects = 0; 

    // createCommandInput(); // Initally show a command input

    // If we click on the canvas create a textField
    window.addEventListener("click", masterClayClickHander) ;    
    window.addEventListener("keydown", masterClayKeyDownHander) ;    
}

function masterClayKeyDownHander(event){

    var eventKeyCode = event.keyCode;
    var eventChar = String.fromCharCode(eventKeyCode).toLowerCase(); 

    if(World.printKeyboard){
        // console.log( "Char Code :" + eventChar + " was pressed ");
        console.log("" + eventChar
                      + " was pressed (Key Code) : " + eventKeyCode ) ;
    }

    if(eventKeyCode == stringToKeyCode("escape")){
        if(World.printKeyboard) console.log("escape pressed");

        deselectAllObjects();
    }
}

function deselectAllObjects(){ $(".selected").removeClass("selected");}

function masterClayClickHander(event){


    var x = event.pageX;
    var y = event.pageY;
    if(World.printMouseClick) console.log("Got click at ( " + x + " , " + y + " )") ;

    // What did we click on ? 
    var elem = event.target;
    
    var id = elem.id;                    
    var elemType = elem.tagName.toLowerCase();
    var elemParent =  elem.parentNode;
    if(elemParent) var elemParentType = elemParent.tagName;
    if(World.printMouseClick) console.log( "You Clicked a " + elemType + " with id: " + elem.id + " parent :" + elemParentType);

    // Depending on what we clicked launch some other click handlers

    // Click on empty space is a click on the body of main html document
    if (elemType == "html" || elemType == "body"){
        gotClickInEmptySpace(event);        
    }

    // if you clicked on an object set the selected property
    else {
        // If the type of object is inside freeHTMLContainer select its container
        var freeContainer = $(elem).closest('.freeHTMLContainer');
        $(freeContainer).toggleClass("selected");
    }
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
    var container = createDraggableContainer(id,x,y);
    var divElem = createDiv(0,0,w,h,true,"relative");// Creating a contentEditable div
    append(divElem,container);
    append(container);    
    container.classList.add("freeCellContainer");

    divElem.classList.add("freeCell");
    divElem.focus();  
    divElem.addEventListener("blur",lostCellFocus);

    _addEndpoints( container.id, ["BottomCenter"], ["TopCenter"]);

    //jsPlumb.draggable($(".draggable") );
    jsPlumb.draggable($(".draggable") ,  { cancel: ".editable" } );


    return divElem;
}

function createDraggableContainer(id,x,y){

    divElem = document.createElement("div");


    divElem.style.position ="absolute";
    divElem.style.top = y +"px";
    divElem.style.left = x + "px";

    // Add unique id to each canvas cell
    
    // var idString = "" + getUniqueId();
    var idString = "block-" + id;
    divElem.id = idString;

    divElem.classList.add("draggable");
    // $( divElem ).draggable({ cancel: ".editable" });
    
    return divElem;

}

function getUniqueId(){
    World.numObjects += 1;
    return "clobject-" + World.numObjects;
}

function lostCellFocus(event){
    
    var parentnode = this.parentNode;
    // console.log("lost focus and text is:"+$(this).text()+" with parent:" +parentnode);
    
    // If we lose focus on a cell that is emtpy just delete it from the DOM
    if( $(this).text() =="" && document.hasFocus()){
        // console.log("Removeing : this is: " + this + " and parentNode:" + parentnode);
        
        // parentnode.removeChild(this); // remove just the child

        deleteNode(parentnode.id);
        // assumes that this is just a div wrapped in a draggable container
        $(parentnode).remove();  // remove the parent and child  
    }
    
}

// Clean up all the node elements
function deleteNode(id){
    
    // Remove jsplub anchors    
    //http://stackoverflow.com/questions/15147291/jsplumb-delete-a-draggable-element
    jsPlumb.detachAllConnections(id);
    jsPlumb.removeAllEndpoints(id);
}
function gotClickInEmptySpace( event){

    var x = event.pageX;
    var y = event.pageY;
    // var freeCellElem = drawCodeBlock(x,y);
    var newCodeBlock = new CodeBlock(x,y);
    var codeBlockView = newCodeBlock.viewObj;
    
    codeBlockView.onkeyup = function(event){
        
        // jsPlumb.repaintEverything();// Key up resizes container so need to repaint
        jsPlumb.repaint(codeBlockView.parentElement);
    }

    codeBlockView.onkeydown = function(event){

        // repaint jsplumb so anchors move with resize , force redraw of jsplumb
        //http://jsplumbtoolkit.com/doc/utilities.html
        jsPlumb.repaint(codeBlockView.parentElement);
        // jsPlumb.repaint(el, [ui])
        // jsPlumb.repaintEverything();

        // onkeypress works with char codes e.g. event.charCode
        // onkeydown works reliably with keyCodes e.g. event.keyCode
        
        var eventKeyCode = event.keyCode;
        var eventChar = String.fromCharCode(eventKeyCode).toLowerCase(); 

        if(World.printKeyboard){
            console.log("" + eventChar + " was pressed (Key Code) : " + eventKeyCode ) ;
        }

        var resultText= "";
  
        // if you start holding command
        if( eventKeyCode == stringToKeyCode("command")){
            if(World.printKeyboard) console.log("holding command");
        }

        // If we press command and enter evaluate
        if( eventKeyCode == stringToKeyCode("enter") && event.metaKey){
            if(World.printKeyboard) console.log("enter plus + command pressed!!");
            
             var result =""

            var textString = $(codeBlockView).text(); // cross platform get text
            console.log("text to parse:" +textString);

            // if the contents have html get them (Jquery escapes the found html)
            // So we have to unescape it to have a pure HTML string again
            // Todo: unescape HTML less hacky.(it won't unescape everything)
            var htmlString = unescapeHTML($(codeBlockView).html()); 
            console.log("html to parse:" +htmlString);
            
            // Just always parse the raw string
            result = parseCommandInput(textString);

            // // Alternative: If the html string looks like valid html e.g. with <tags> send that over
            // if(htmlString.containsHTML()) {
            //     result = parseCommandInput(htmlString);
            //     // result = parseCommandInput(textString); // bug here to remove escaping
            // }
            // else{
            //     result = parseCommandInput(textString);  
            // } 


            if(result){
                
                // if it a function run it
                if (typeof(result) == "function"){
                    var functionResult = result();
                    
                    // Got some HTML back - just draw it
                    if(isHTMLElement(functionResult)){

                        functionResult.style.position ="relative";
                        $(codeBlockView).parent().removeClass("freeCellContainer");
                        $(codeBlockView).parent().addClass("freeHTMLContainer");

                        //js

                        $(codeBlockView).replaceWith( functionResult);
                        // append(functionResult,codeBlockView);
                    }
                } 
                else if( typeof(result) == "object"){
                    console.log("found object result");

                    // result string is html
                    if(result.type =="html"){
                        console.log("replacing with html");
                        $(codeBlockView).html(result);  
                    }
                    // Got some HTML back - just draw it
                    if(isHTMLElement(result)){

                        result.style.position ="relative";
                        $(codeBlockView).parent().removeClass("freeCellContainer");
                        $(codeBlockView).parent().addClass("freeHTMLContainer");

                        //js

                        $(codeBlockView).replaceWith( result);
                        // append(functionResult,codeBlockView);
                    }
                }
                else{ // got a result string - add it to the div
                    // $(codeBlockView).append(result).show(); // append below
                    $(codeBlockView).text(result); // replaces the div with the result
                }
                
                
            }
        }

    } 

}
// http://shebang.brandonmintern.com/foolproof-html-escaping-in-javascript/
function unescapeHTML(inputString){

    return inputString
      .replace(/&amp;/g ,"&" )
      .replace(/&lt;/g  , "<")
      .replace(/&gt;/g  , ">")
      .replace(/&quot;/ , '"')
      .replace(/&#39;/g , "'"); 

    // var escapeMap = { 
    //     '&amp;' :  '&',
    //     '&lt;'  : '<',
    //     '&gt;'  : '>',
    //     '&quot;': '"',
    //     '&#39;' : "'",
    // }

    // return inputString.replace( /[&amp]/g , function(c) {
    //     return escapeMap[c];
    // });
}
 


function addRow(tableElem){

    var rowCount = tableElem.rows.length;
    console.log("row count" + rowCount);

    var row = tableElem.insertRow(rowCount);
    var cellCount = tableElem.rows[0].cells.length;            
    console.log("cell count:" + cellCount);

    for (var i = 0; i < cellCount; i++) {

        var innerDiv = document.createElement("div");
        var cell = row.insertCell(i);        
        cell.appendChild(innerDiv);            
        if(i ==0){
            innerDiv.contentEditable = true;
            innerDiv.setAttribute("class","editable");
            innerDiv.focus();           
        }
        
    }
}

function tryEval( code){
    try {
        console.log("trying to eval: " + String(code));
        // adding parens allows string to be treated as expression
        // e.g. just " { } " will get interpreted as an object
        var result =  eval("("+  String(code)  +")"); 

        // Wrapping in an anon function allows full code to be executed
        // For example for loops will work
        // var result =  eval("( function(){ return ("+  String(code)  +")}() )"); 
        
        console.log("TryEval result:" + result);
        
        return result;
    } 
    catch (e) {
        if (e instanceof SyntaxError) {
            console.log(e.message);
        }
        return false;
    }

    console.log(" Eval success on input: !" + code);
}

//convert the string to an html object
function stringToHTML(inputString){
    var resultElem = $.parseHTML( inputString )
    return resultElem;
}

function parseCommandInput( inputText){

    console.log("parsing input: " + inputText); 
    var result ="";

    // Check if the string is HTML. If so just return an html elem
    if(inputText.containsHTML()){
        console.log("detected some <HTML></HTML>");
        result = stringToHTML(inputText);
        result.type = "html";
        return result;
    }    
    // Try to eval the expression directly
    var result  = tryEval(inputText);
    if (result) { // bug result could be the number 0
        console.log(" Got valid eval result while parsing !");
        console.log("Result is: " + result);
        
        return result;
    } 

    // // Tokenize the input separated by spaces
    // stringArray = inputText.split( /\W+/ ); // one or more spaces
    
    // // Case : of imperative command - starts with a VERB
    // funcName = stringArray[0]; // Eg draw
    // args = stringArray.splice(1); // a circle
    
    // // Check if there is a built in function by that name  
    // try {
    //     if(funcName){
    //         var result = window[funcName](args);
    //         return;
    //     }
    // }
    // catch(e){ 
    //     console.log("Parsing error: " + e);
    // }
 
    // return false;
}

///// JUNK 

function fooCreator(arg1) {
        alert("called foo with args :" + arg1);
}
function ab(){
    alert( "test alert" );
}

function add(arg1) {
        alert(" Added :" + arg1 + " = " + eval(arg1.join('+')) );
}


/////////////////////////////////////////////////////////////////////////
///////     CREATING ELEMETNTS
/////////////////////////////////////////////////////////////////////////

function createNewObjectID(){
    return Creator.numObjects += 1 ;        
}

// Create an element of a given type
function createElement(elemType , id){
    
    // See if an element already exists with that id
    var elem = document.getElementById(id);    
    if(elem) {
        console.log("Tried to create an id that already exists");
        return;
    }
    
    // If no id provided set one
    if(!id){
        id = createNewObjectID();
    }
    
    elemType = String(elemType);

    elem = document.createElement(elemType);
    elem.id = id;

    document.body.appendChild(elem);

    // Set some default properties of an element
    // Absolute position
    // elem.style.position = "Absolute";
    // elem.contentEditable = true;
    elem.innerHTML = "new " +  elemType + id;

    console.log("created new element of type: " + elemType +" id: " + id);
    
    return elem;
}

// Create a table
function createTable(numRows, numCols, hasHeader){
    var numRowsDefault = 2;
    var numColsDefault = 2;
    var widthDefault = 10; //80
    var heightDefault = 10;//20
    var hasHeaderDefault = false;

    if(!numRows) numRows= numRowsDefault;
    if(!numCols) numCols = numColsDefault;
    if(!hasHeader) hasHeader =hasHeaderDefault;

    var table = document.createElement("table");
    var tbody = document.createElement("tbody");
    table.appendChild(tbody); 

    // Create the header row 
    if(hasHeader){
        var thead =table.createTHead(); 
        table.appendChild(thead); 
    
        var headerRow = document.createElement("tr");
        thead.appendChild(headerRow);

        for (var i = 0; i < numRows; i++) {
            var th = document.createElement("th");
            headerRow.appendChild(th);

            // Default display properties
            // th.innerHTML = "header" ;
            // th.style.border="1px solid #cecece"; // debug
            th.style.width= widthDefault +"px";
            th.style.height= heightDefault + "px";

        }
    } 
    
    // Draw the table body
    for (var i = 0; i < numRows; i++) {

        var tr = document.createElement("tr");
        tbody.appendChild(tr);
                
        for (var j = 0; j < numCols; j++) {
            var cell = tr.insertCell(j);
            cell.innerHTML = ""; 
            
            // Default cell style
            cell.style.border="1px solid #cecece";
            cell.style.width= widthDefault +"px";
            cell.style.height= heightDefault + "px";
            
            // Add an editable div inside each cell
            var div = document.createElement("div");
            div.contentEditable = true;
            div.setAttribute("class","editable");
            cell.appendChild(div);

        }
    }

    // Some default display properties of the table
    // (User will control view in CSS - but this sets some barebones properties) 
    table.cellSpacing = "0"; 
    table.style.borderCollapse = "collapse";
    table.style.margin = "5px";
    
    document.body.appendChild(table); 

    return table;

}

function createTextInput( id){
    elem = createElement("input" , id);
    elem.type = "text";   
    return elem;
}

function createButton( label , id , actionFn){
    if(!label) label = "button";

    elem = createElement("input", id);
    elem.type = "button";   
    elem.value = label;  
    if(actionFn) elem.onclick = actionFn;  
    return elem;
}

function createTextArea(rows, cols, name){
    if(!rows) rows = 5;
    if(!cols) cols = 40;


    elem = createElement("textArea");
    elem.rows = rows;
    elem.cols = cols;
    if(name) elem.name = name;
    
    return elem;
}

// Creating a content editable div
function createDiv(x,y,w,h,editable, position){

    divElem = document.createElement("div");

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


///////////////////////////////////////////////////////////
// Creator helpers 
///////////////////////////////////////////////////////////


function getParentByTagName(obj, tag) {
    var obj_parent = obj.parentNode;
    if (!obj_parent) return false;
    if (obj_parent.tagName.toLowerCase() == tag) return obj_parent;
    else return getParentByTagName(obj_parent, tag);
}

function gelem(id){
    var elem = document.getElementById(id);
    if (!elem) console.log("couldn't find element with that id");

    return elem;
}

function append(elem, toParent){ // shortcut for appending to the body of the HTML
    if(toParent){
        return toParent.appendChild(elem);    
    }
    else{
        return document.body.appendChild(elem);
    }
}

function showElem(boxid){
  document.getElementById(boxid).style.visibility="visible";
}

function hideElem(boxid){
  document.getElementById(boxid).style.visibility="hidden";
}

function toggleShow(boxid){
  var el = document.getElementById(boxid);
  el.style.visibility = (el.style.visibility !='visible'?'visible':'hidden' );
}

function isSVG(elem){
    return elem instanceof SVGElement;
}

//Returns true if an object is and HTML element or SVG
// http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
function isHTMLElement(elem){
    if( typeof(elem) == "object" &&
        (elem instanceof HTMLElement) || (elem instanceof SVGElement)        
       )
    {
        return true;
    }
    
        return false;
  // return (
  //   typeof HTMLElement === "object" ? elem instanceof HTMLElement : //DOM2
  //   elem && typeof elem === "object" 
  //   && elem !== null && elem.nodeType === 1 
  //   && typeof elem.nodeName==="string"
  //   );
}

// http://stackoverflow.com/questions/499126/jquery-set-cursor-position-in-text-area
function setSelectionRange(input, selectionStart, selectionEnd) {
  if (input.setSelectionRange) {
    input.focus();
    input.setSelectionRange(selectionStart, selectionEnd);
  }
  else if (input.createTextRange) {
    var range = input.createTextRange();
    range.collapse(true);
    range.moveEnd('character', selectionEnd);
    range.moveStart('character', selectionStart);
    range.select();
  }
}

function setCaretToPos (input, pos) {
  setSelectionRange(input, pos, pos);
}

// http://stackoverflow.com/questions/3052052/how-to-find-if-string-contains-html-data
String.prototype.containsHTML = function(){
  return result = this.match(".*\\<[^>]+>.*");  
} 


///////////////////////////////////////
// Keyboard events 
///////////////////////////////////////

// function pressed(e) {
//     // Has the enter key been pressed?
//     if ( (window.event ? event.keyCode : e.which) == 13) { 
//         // If it has been so, manually submit the <form>
//         foo();
//     }
// }

//http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes

// For special keys

function stringToKeyCode( keyname){
specialKeys = { 
    backspace: 8 ,
    command: 91 ,
    tab:       9,
    enter:      13,
    shift:      16,
    ctrl:      17,
    alt :       18 ,    
    capslock:  20,
    escape:     27,
    pageup:    33,
    pagedown:  34,
    end:        35,
    home:      36,
    left:   37,
    up:     38,
    right:  39,
    down :   40,
    insert:   45,
    delete:   46,
    period:   190
    };

    return specialKeys[keyname];
}

/////////////////////////// USER INPUT  /////////////////////////


// Debuging show mouse coordinates
window.onmousemove = function (event){
    // v = document.getElementById("xy");
    // if(!v) v = createElement("div","xy");
    if(World.printMouseMove)
    console.log( "Mousemove X:" + event.pageX + " Y:" + event.pageY ) ;
}

window.onmousedown = function (event){
    if(World.printMouseClick)
    console.log("mouse click at X:" + event.pageX + " Y:" + event.pageY);
}

// keyboard

window.onkeydown = function(event){
    var eventKeyCode = event.keyCode;
    var eventChar = String.fromCharCode(eventKeyCode).toLowerCase(); 

    if(World.printKeyboard){
        // console.log( "Char Code :" + eventChar + " was pressed ");
        console.log("" + eventChar
                      + " was pressed (Key Code) : " + eventKeyCode ) ;
    }

    World.keyPressed = true;

    // Keyboard mappings

    if(eventChar=="n"){
        // var newCreature = new ClayCreature( duppy );
        // newCreature.actions.draw();
    }
}


document.onkeyup = function (e) {
    World.keyPressed = false;
};



//////////////////////////////////////////////////////////

