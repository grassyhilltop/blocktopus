// script elements that correspond to Handlebars templates
var emuHwBtnTemplate = document.getElementById('emulated-hardware-button-template');

// compiled Handlebars templates
var templates = {
	renderEmuHwBtn: Handlebars.compile(emuHwBtnTemplate.innerHTML),
};