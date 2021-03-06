"use strict";

var _root = __dirname + "/../../../";

var ViewLoader = require(_root+"controllers/utils/ViewLoader.js");
var NavManager = require(_root+"manager/NavManager.js");
var I18n = require(_root+"i18n/i18n.js");

var PrinterConnectionClass = function PrinterConnectionClass(){
  this.content = null;

  this.deviceManagerAddListener = this.deviceManagerAddHandler.bind(this);
  this.deviceManagerOpenListener = this.deviceManagerOpenHandler.bind(this);
  this.deviceManagerRemoveListener = this.deviceManagerRemoveHandler.bind(this);
  this.keyDownListener = this.keydownHandler.bind(this);

}

PrinterConnectionClass.prototype.load = function (callback) {
  var that = this;
  if(that.content)
    return callback();

  ViewLoader("selectPrinter/3_printerConnection", function(content){
    that.content = $(content);
    that.initView();
    if(callback){
      callback();
    }
  });


};

PrinterConnectionClass.prototype.initView = function () {
  var that = this;
  that.content.find("#next").on("click", function(){
    that.selectedDevice.validate = true;
    console.log("window.pageAfterDeviceSelection", window.pageAfterDeviceSelection);
    NavManager.setPage(window.pageAfterDeviceSelection);
  });

  that.content.find('select#com').hide();

  that.content.find("select#com").on("change", function(event){
    if(that.selectedDevice != null){
      that.selectedDevice.close();
    }
    that.selectedDevice = DeviceManager.devices[that.content.find('select#com').val()];
    DeviceManager.setSelectedDevice(that.selectedDevice);

    //$(".tabsContent").removeClass("disabled");
    that.selectedDevice.open();
  });

  DeviceManager.on("add", that.deviceManagerAddListener);
  DeviceManager.on("remove", that.deviceManagerRemoveListener);
  DeviceManager.on("open", that.deviceManagerOpenListener);

  $("#navBack").show();
};

PrinterConnectionClass.prototype.deviceManagerRemoveHandler = function(device){
  this.removeDeviceList(device);
  //this.textBox.hide();
  this.content.find("#next").hide();
}

PrinterConnectionClass.prototype.deviceManagerOpenHandler = function(device){
  // Wait a bit before opening the device
  setTimeout( this.openDevice.bind(this), 500 );
  //this.openDevice();
}


PrinterConnectionClass.prototype.deviceManagerAddHandler = function(device){
  var that = this;
  that.updateDeviceList(device);
  that.content.find('select#com').val(device.portName);

  if(that.selectedDevice != null){
    that.selectedDevice.close();
  }
  that.selectedDevice = DeviceManager.devices[that.content.find('select#com').val()];
  DeviceManager.setSelectedDevice(that.selectedDevice);

  //$(".tabsContent").removeClass("disabled");
  that.selectedDevice.open();
}

PrinterConnectionClass.prototype.show = function () {
  var that = this;
  that.selectedDevice = null;
  that.textBox = that.content.find("#comSelector p");
  //that.textBox.hide();

  for (var device in DeviceManager.devices) {
    that.updateDeviceList(DeviceManager.devices[device]);
  }

  that.content.find("#next").hide();

  that.keys = [];
  $(document).on("keydown", this.keyDownListener);
};

PrinterConnectionClass.prototype.openDevice = function () {
  var that = this;
  var timeOut3DPrinterSearch;
  that.content.find("#next").hide();

  that.textBox.show();
  if(that.selectedDevice)
    that.textBox.text(I18n.currentLanguage().printer_connexion_opening+" "+that.selectedDevice.name+"...");

  function no3DPrinterFound(){
    clearTimeout(timeOut3DPrinterSearch);
    that.textBox.text(I18n.currentLanguage().printer_connexion_no_printer);
    that.selectedDevice.removeListener("ready", deviceReady);
    that.selectedDevice.removeListener("printerFound", printerFound);
    that.content.find("#next").hide();
  }

  function printerFound(){
    no3DPrinterFound();
    that.textBox.text(I18n.currentLanguage().printer_connexion_detected);
    that.selectedDevice.removeListener("printerFound", printerFound);
    that.content.find("#next").show();
    //$('select#type').val("melzi");
    that.found3DPrinter = true;
  }

  function deviceReady(){
    that.textBox.text(I18n.currentLanguage().printer_connexion_searching);

    that.selectedDevice.removeListener("ready", deviceReady);
    timeOut3DPrinterSearch = setTimeout(function(){
      //TODO: treat when no printer is discovered
      //no3DPrinterFound();
      printerFound();
    }, 5000);
    that.selectedDevice.on("printerFound", printerFound);
  }

  if(that.selectedDevice){
    if(that.selectedDevice.ready)
      deviceReady();
    else
      that.selectedDevice.on("ready", deviceReady);
  }
};

PrinterConnectionClass.prototype.updateDeviceList = function(device){
  var that = this;
  device.$select = $('<option val="'+device.portName+'">'+device.portName+'</option>');
  that.content.find('select#com').append(device.$select);
  that.content.find('select').material_select();
}

PrinterConnectionClass.prototype.removeDeviceList = function(device){
  device.$select.remove();
}


PrinterConnectionClass.prototype.keydownHandler = function (e) {
  var that = this;
  that.keys.push( e.which );
  that.keys = that.keys.slice( -10 );
  if (that.keys.join('') == '38384040373937396665') {
    that.content.find('select#com').show();
  }
}

PrinterConnectionClass.prototype.dispose = function () {
  DeviceManager.removeListener("add", this.deviceManagerAddListener);
  DeviceManager.removeListener("open", this.deviceManagerOpenListener);
  DeviceManager.removeListener("remove", this.deviceManagerRemoveListener);
  $(document).off("keydown", this.keyDownListener);
};

module.exports = PrinterConnectionClass;
