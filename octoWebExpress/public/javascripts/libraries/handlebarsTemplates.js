// script elements that correspond to Handlebars templates
var codeBtnTemplate = document.getElementById('code-button-template');
var emuHwBtnTemplate = document.getElementById('emulated-hardware-button-template');
var emuHwCreatedTemplate = document.getElementById('emulated-hardware-created-template');
var outputDisplayWindowTemplate = document.getElementById('outputDisplayWindow');

// compiled Handlebars templates
var templates = {
	renderCodeBtn: Handlebars.compile(codeBtnTemplate.innerHTML),
	renderEmuHwBtn: Handlebars.compile(emuHwBtnTemplate.innerHTML),
	renderEmuHwCreated: Handlebars.compile(emuHwCreatedTemplate.innerHTML),
	renderOutputDisplayWindow: Handlebars.compile(outputDisplayWindowTemplate.innerHTML)
};