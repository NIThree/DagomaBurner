"use strict";

var _root = __dirname + "/../";
var ModalManager = require(_root+"manager/modalManager.js");

const {remote} = require('electron');
const {ipcRenderer} = require('electron');
const {Menu, MenuItem} = remote;

var template = [
  {
    label: 'DagomApp',
    submenu: [
      {
        label: 'DagomApp',
        selector: 'orderFrontStandardAboutPanel:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Hide DagomApp',
        accelerator: 'Command+H',
        selector: 'hide:'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        selector: 'hideOtherApplications:'
      },
      {
        label: 'Show All',
        selector: 'unhideAllApplications:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click() { require('electron').remote.app.quit(); }
      },
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'Command+R',
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.reload();
        }
      },
      {
        label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.webContents.toggleDevTools();
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'Command+Z',
        selector: 'undo:'
      },
      {
        label: 'Redo',
        accelerator: 'Shift+Command+Z',
        selector: 'redo:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Cut',
        accelerator: 'Command+X',
        selector: 'cut:'
      },
      {
        label: 'Copy',
        accelerator: 'Command+C',
        selector: 'copy:'
      },
      {
        label: 'Paste',
        accelerator: 'Command+V',
        selector: 'paste:'
      },
      {
        label: 'Select All',
        accelerator: 'Command+A',
        selector: 'selectAll:'
      },
    ]
  },
  {
    label: 'Window',
    submenu: [
      {
        label: 'Minimize',
        accelerator: 'Command+M',
        selector: 'performMiniaturize:'
      },
      {
        label: 'Close',
        accelerator: 'Command+W',
        selector: 'performClose:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Bring All to Front',
        selector: 'arrangeInFront:'
      },
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

( function( $ ) {

  ModalManager.setProgress(0);
  var $updateChoice = $("#updateChoice");
  var $navbar = $("#navbar");

  $updateChoice.hide();
  $navbar.hide();

  ipcRenderer.on("hasUpdate", function(event, message){
    console.log("getHasUpdate");
    hasUpdate();
  });

  hasUpdate();

  //ipcRenderer.send("updateAccept");

  function hasUpdate(){
    console.log("updateChecked", remote.getGlobal('state').updateChecked, "hasUpdate", remote.getGlobal('state').hasUpdate);
    if(remote.getGlobal('state').updateChecked){
      if(remote.getGlobal('state').hasUpdate){
        console.log("has new update");
        ModalManager.hideLoader();
        $updateChoice.show();
        $navbar.show();
      }
    }
  }


  $("#btnUpdate").click(function(){
    ipcRenderer.send("acceptUpdate");
    ModalManager.showLoader("Mise &agrave; jours en cours");
    ModalManager.setProgress(0);
    $updateChoice.hide();
    $navbar.hide();
  })

  $("#btnNext").click(function(){
    ipcRenderer.send("discardUpdate");
  })

  $("#navbar a.close").click(function(){
    ipcRenderer.send("discardUpdate");
  });

  ipcRenderer.send("updateWindowReady");

} )( window.jQuery );
