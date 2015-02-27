var emuKnobAddControlElem = function (block) {
	hardwareBlockAddSlider(block);
}; 
var emuSliderAddControlElem = function (block) {
	hardwareBlockAddSlider(block);
}; 

var emuTimerAddControlElem = function (block) {
	hardwareBlockAddSlider(block);
	//Don't want and extra box
	//hardwareBlockAddOutputWindow(block);
}; 

var emuButtonAddControlElem = function (block) {
	hardwareBlockAddButton(block);
};
var emuLEDAddControlElem = function (block) {
	hardwareBlockAddLED(block);
};
