// script elements that correspond to Handlebars templates
var emuHwBtnTemplate = document.getElementById('emulated-hardware-button-template');
var emuHwCreatedTemplate = document.getElementById('emulated-hardware-created-template');

// compiled Handlebars templates
var templates = {
	renderEmuHwBtn: Handlebars.compile(emuHwBtnTemplate.innerHTML),
	renderEmuHwCreated: Handlebars.compile(emuHwCreatedTemplate.innerHTML),
};