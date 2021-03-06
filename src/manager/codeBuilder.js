"use strict";

var root = __dirname + "/../";
var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Avrgirl = require('avrgirl-arduino'),
    boards = require('avrgirl-arduino/boards'),
    lodash = require('lodash');

module.exports = function(device, file, type, callback){
  if(device == null)
    return callback(false);

  console.log("burn to ", device);

  var timeOut3DPrinterSearch;
  var success = true;
  var board = "mega";
  device.isBuilding = true;
  device.pause();


  boards.byName.melzi = {
    baud: 57600,
    signature: new Buffer([0x1e, 0x97, 0x05]), // ATmega2560
    //0x1e9705
    pageSize: 256,
    delay1: 10,
    delay2: 1,
    timeout: 0x320,//0xc8, // Up to 800ms
    stabDelay:0x64,
    cmdexeDelay:0x19,
    synchLoops:0x20,
    byteDelay:0x00,
    pollValue:0x53,
    pollIndex:0x03,
    productId: ['0x0403', '0x6001'],
    protocol: 'stk500v1'
  };

  // Add timeout to mks too. In case of
  boards.byName.mega.timeout = 0x320;
  console.log("ready to flash");
  setTimeout(function(){
    console.log("flash");
    var avrgirl = new Avrgirl({
      board: type, //"melzi",//"mega",
      port: device.portName,
      debug: true
    });


    function printerFound(){
      clearTimeout(timeOut3DPrinterSearch);
      device.removeListener("printerFound", printerFound);
      callback(success);
    }

    function resetAndWaitPort(success){
      device.isBuilding = false;
      setTimeout(function(){device.open()}, 1000);

      timeOut3DPrinterSearch = setTimeout(function(){
        //TODO: treat when no printer is discovered
        //no3DPrinterFound();
        printerFound();
      }, 30000);
      device.on("printerFound", printerFound);
    }

    avrgirl.flash(file, function (error) {
      if (error) {
        console.log("retrying after error", error);
        //callback(false);

        //device.resetPort();
        // Retry immediatly
        setTimeout( function() {
          avrgirl.flash(file, function (error) {

            if (error) {
              console.log("ok, giving up with error", error);
              success = false;
            } else {
              console.log('done.');
              success = true;
            }

            resetAndWaitPort(true/*, result.message*/);
          });
        }, 5000);

      } else {
        console.log('done.');
        success = true;
        resetAndWaitPort(true/*, result.message*/);
      }
    });

  },
  5000);
};
