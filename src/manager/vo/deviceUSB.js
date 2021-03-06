"use strict";

var EventEmitter = require('events').EventEmitter;
var util = require('util');
//var SerialPortLib = require("serial-worker");
var SerialPortLib = require("serialport");
//var SerialPortLibNative = require("serialport");
var SerialPort = SerialPortLib.SerialPort;
var AbstractDeviceClass = require("./abstractDevice.js");

var root = __dirname + "/../";
var data = "";

var DeviceClassUSB = function(portName, uid, manufacturer){
  EventEmitter.call(this);

  this.parent = new AbstractDeviceClass(portName.split("/dev/").join(""), this);
  this.type = "usb";
  this.portName = portName;
  this.baudRate = 250000;
  this.uid = uid;
  this.serial = null;
  this.printerFound = false;

  this.serialDataListener = this.serialPortDataHandler.bind(this);
};

util.inherits(DeviceClassUSB, EventEmitter);

DeviceClassUSB.prototype.templateObject = function (deviceData){
  return this.parent.templateObject(deviceData);
}

DeviceClassUSB.prototype.destroy = function (){
  var that = this;
  that.parent.destroy();
  that.close();
}

DeviceClassUSB.prototype.open = function (){
  var that = this;
  that.ready = false;
  that.printerFound = false;

  that.close();
  that.parent.open();

  that.emit("open", that);

  if(that.serial == null){
    //console.log("openSerial?", that.baudRate);
    that.serial = new SerialPort(that.portName, {
      baudrate: that.baudRate,
      //parser: {type:"readline", value:"\r\n"},
      parser: SerialPortLib.parsers.readline("\n"),
      //parser: SerialPortLib.parsers.byteDelimiter([10, 13]),
      disconnectedCallback : function disconnected(err){
        if(that.isBuilding == false)
          that.delete();
      }
    }, false);
  }

  console.log("Delegating a bit port opening ...");
  setTimeout( that.serial.open.bind( that.serial, function (error){
    that.resetPort();
    that.serialPortOpenHandler(error);
  } ), 800);
  /*
  that.serial.open(function (error){
    that.resetPort();
    that.serialPortOpenHandler(error);
  });
  */
}

DeviceClassUSB.prototype.serialPortOpenHandler = function (error){
  var that = this;

  if ( error && error != "Error: Port is already open"){
    console.error("error", error);
    that.delete();
  }else{
    if(!that.ready){
      that.emit("ready", that);
      console.log("ready");
    }

    that.ready = true;
    that.serial.on('data', that.serialDataListener);
  }
}

DeviceClassUSB.prototype.serialPortDataHandler = function (pData) {
  var that = this;
  var lineData = pData.toString();
  that.lastSerialLine = lineData;
  console.log(lineData);
  /*data += pData;
  while(that.parseData()){
    console.log("coucou");
  };
}

DeviceClassUSB.prototype.parseData = function(){
  var that = this;

  var index = data.indexOf("\r\n");
  if(index == -1)
    return false;
  index += 2;
  var lineData = data.substr(0, index);
  data = data.substr(index);
  */

  if(lineData.charCodeAt(0) == 0)
    lineData = lineData.substr(1);

  if(lineData.charCodeAt(0) == 10)
    lineData = lineData.substr(1);

  if(lineData.charCodeAt(0) == 13)
    lineData = lineData.substr(1);
  /*
  if(lineData.indexOf("start")==0 && that.hasStarted == false)
    that.hasStarted == true;
  */
  //console.log(lineData);
  if(lineData.indexOf("echo:Marlin")==0 && that.printerFound==false){
    console.log("printerFound");
    that.emit("printerFound", that);
    that.printerFound = true;
  }

  if(lineData.indexOf("MINTEMP triggered")>=0 || lineData.indexOf("MAXTEMP triggered")>=0){
    ModalManager.hideLoader();
    ModalManager.alert(I18n.currentLanguage().error_minmaxtemp_title, I18n.currentLanguage().error_minmaxtemp_message);
  }

  //console.log(lineData.charCodeAt(0), lineData.charCodeAt(1));
  /*
  if(lineData[0] == "!" && lineData[1] == "S" && lineData[2] == "k"){
    var uid = ((lineData.charCodeAt(6)<<16)+(lineData.charCodeAt(7)<<8)+lineData.charCodeAt(8));
    that.typeId = (lineData.charCodeAt(3)<<8)+(lineData.charCodeAt(4));
    that.version = lineData.charCodeAt(5);
    console.log("uid:",uid,"typeId:",that.typeId, "version:", that.version);

    var shieldID;
    //console.log(lineData[9], lineData.charCodeAt(10), lineData.charCodeAt(11), lineData.charCodeAt(12), lineData.charCodeAt(13), lineData.charCodeAt(14))
    if((lineData[9]=="H" || lineData[9]=="S") && lineData.charCodeAt(10)==12){
      that.hasShield = true;
      shieldID = (lineData.charCodeAt(11)<<8)+(lineData.charCodeAt(12));
      that.shieldVersion = lineData.charCodeAt(13);
      that.shieldVariant = lineData.charCodeAt(14);
      console.log("Shield ID:",shieldID,"version:",that.shieldVersion, "variant:",that.shieldVariant);
    }

    if(that.uid != uid || that.shieldID != shieldID){
      that.uid = uid;
      that.shieldID = shieldID;
      that.emit("change", that);
    }
  }else{*/
    that.parseSerialData(lineData);
    that.emit("receive", lineData);
  //}

  return lineData != "";
};

DeviceClassUSB.prototype.setBaud = function (baudrate) {
  this.baudRate = baudrate;
  this.close();
  this.open();
};

DeviceClassUSB.prototype.endsWith = function(topic, suffix) {
  return topic.match(suffix+"$") == suffix;
};

DeviceClassUSB.prototype.resetPort = function () {
  var that = this;

  if(that.serial == null)
    return;

  that.serial.set({
    rts: true,
    dtr: true
  }, function(err) {
    setTimeout(function clear() {
      that.serial.set({
        rts: false,
        dtr: false
      }, function(err) {
        //console.log("port "+that.portName+" reset");
      });
    }, 250);
  });
}

DeviceClassUSB.prototype.checkConnected = function () {
  var that = this;

  that.interval = setInterval(
    function(){
      that.serial.write("", function(err, results) {
        if(err){
          console.log("error");
          that.delete();
        }
      });
    }
  , 1000);
}

DeviceClassUSB.prototype.parseSerialData = function(data){
  var that = this;

  var res;
  var re = new RegExp('(\\d*);(\\d*);(\\d*);(\\d*);(\\d*);(.*)','g');
  while( res = re.exec(data)){
    //0;0;3;0;14;
    if(+res[1] == 0 && +res[2] == 0 && +res[3] == 3 && +res[4] == 0 && +res[5] == 14)
    {
      that.type = "Arduino";
      that.isNRFGateway = true;
      that.name = "NRFGateway";
      that.emit("change", that);
    }
  }
}

DeviceClassUSB.prototype.send = function (data){
  if(this.serial != null){
    this.emit("write", data);
    this.serial.write(data);//+"\r\n");
    console.log("write", data);
  }
}

DeviceClassUSB.prototype.delete = function(){
  var that = this;
  that.parent.delete();
}

DeviceClassUSB.prototype.close = function(force){
  var that = this;

  that.printerFound = false;

  //that.ready = false;
  that.parent.close();


  if(that.serial != null){
    clearInterval(that.interval);
    if(that.serialDataListener)
      that.serial.removeListener('data', that.serialDataListener);

    try{
      console.log( "Serial hardware closing ...");
      //that.serial.disconnected();
      that.serial.close( function(e) {
        console.log( "Serial hardware closed" , e);
      });
    }catch(e){
      console.log( "Serial hardware closing error", e);
    }
    that.serial = null;
  }
}

DeviceClassUSB.prototype.pause = function(){
  var that = this;
  that.parent.pause();
  that.close(true);
}

DeviceClassUSB.prototype.resume = function(){
  var that = this;
  that.parent.resume();

  if(that.serial != null)
  {
    that.open();
  }
}

module.exports = DeviceClassUSB;
