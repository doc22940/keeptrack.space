/* /////////////////////////////////////////////////////////////////////////////

(c) 2016-2017, Theodore Kruczek
main.js is the primary javascript file for keeptrack.space. It manages all user
interaction with the application.
http://keeptrack.space

Unless otherwise noted, all of the code contained within is Copyright © 2016-2017
by Theodore Kruczek. All rights reserved. No part of this web site may be reproduced,
published, distributed, displayed, performed, copied or stored for public or private
use in any information retrieval system, or transmitted in any form by any mechanical,
photographic or electronic process, including electronically or digitally on the
Internet or World Wide Web, or over any network, or local area network, without
written permission of the author.

No part of this code may be modified or changed or exploited in any way used
for derivative works, or offered for sale, or used to construct any kind of database
or mirrored at any other location without the express written permission of the author.

Thank you for respecting the intellectual property rights protected by the copyright
laws of the United States and International Copyright Treaty.

///////////////////////////////////////////////////////////////////////////// */

/* /////////////////////////////////////////////////////////////////////////////

                                INDEX OF CODE
1 - main
2 - shader-loader
3 - color-scheme
4 - groups
5 - search-box
6 - orbit-display
7 - line
8 - earth
9 - sun
10 - sat

///////////////////////////////////////////////////////////////////////////// */

/* global

    satSet
    searchBox
    shaderData
    $
    satellite
    Image
    ColorScheme
    orbitDisplay
    shaderLoader
    sun
    SunCalc
    earth
    groups
    mat3
    mat4
    vec3
    vec4
    Worker
    requestAnimationFrame
    ga
    braun
    sensorManager
    tleManager
    MassRaidPre
    saveAs
    Blob
    FileReader
    UsaICBM
    RussianICBM
    NorthKoreanBM
    ChinaICBM
    Missile
    missilesInUse
    lastMissileError
*/

// **** 1 - main ***

//  Version Control
var VERSION_NUMBER = 'v0.23.10';
var VERSION_DATE = 'October 06, 2017';

// Constants
var ZOOM_EXP = 3;
var DIST_MIN = 6800;
var DIST_MAX = 200000;
var TAU = 2 * Math.PI;
var DEG2RAD = TAU / 360;
var RAD2DEG = 360 / TAU;
var RADIUS_OF_EARTH = 6371.0;
var MINUTES_PER_DAY = 1440;
var MILLISECONDS_PER_DAY = 1.15741e-8;
// var maxOrbitsDisplayed = 100; // Used in sat.js and orbit-display.js TODO: issues:23 Add settings option to change maxOrbitsDisplayed

var satCruncher;
var gl;
var shadersReady = false;
var cruncherReady = false;

// Time Variables
var propRealTime = Date.now(); // actual time we're running it
var propOffset = 0.0; // offset we're propagating to, msec
var propRate = 1.0; // time rate multiplier for propagation
var propFrozen = Date.now(); // for when propRate 0
var time; // Only used in drawLoop function
var now;
var drawNow;
var dt;

// drawLoop Variables
var xDif;
var yDif;
var yawTarget;
var pitchTarget;
var dragPointR;
var dragTargetR;
var dragPointLon;
var dragTargetLon;
var dragPointLat;
var dragTargetLat;
var pitchDif;
var yawDif;

// DOM Variables
var curObjsHTML;
var curObjsHTMLText = '';

var uFOVi;  // Update FOV function iteration i variable
var uFOVs;  // Update FOV function iteration S variable

// Camera Variables
var camYaw = 0;
var camPitch = 0.5;
var camYawTarget = 0;
var camPitchTarget = 0;
var camSnapMode = false;
var camZoomSnappedOnSat = false;
var camAngleSnappedOnSat = false;
var zoomLevel = 0.5;
var zoomTarget = 0.5;
var camPitchSpeed = 0;
var camYawSpeed = 0;
// var isZoomChanging = false;
var dragTarget;

var earthJ;
var earthNow;
var earthEra;
var timeTextStr;
var tDS; // time Date String
var mvMatrix;
var nMatrix;
var lightDirection;

var lookangles = window.lookangles;

var FPSPitch = 0;
var FPSPitchRate = 0;
var FPSYaw = 0;
var FPSYawRate = 0;
var FPSxPos = 0;
var FPSyPos = 25000;
var FPSzPos = 0;
var FPSForwardSpeed = 0;
var FPSSideSpeed = 0;
var FPSRun = 1;
var FPSLastTime = 1;

// Map Variables
var mapWidth = 800;
var mapHeight = 600;

// SOCRATES Variables
var socratesObjOne = []; // Array for tr containing CATNR1
var socratesObjTwo = []; // Array for tr containing CATNR2
var socratesOnSatCruncher;

var isBottomIconsEnabled = false;
var isLookanglesMenuOpen = false;
var isLookanglesMultiSiteMenuOpen = false;
var isTwitterMenuOpen = false;
var isWeatherMenuOpen = false;
var isMapMenuOpen = false;
// var isSpaceWeatherMenuOpen = false;
var isFindByLooksMenuOpen = false;
var isSensorInfoMenuOpen = false;
var isLaunchMenuOpen = false;
var isBottomMenuOpen = false;
var isAboutSelected = false;
var isMilSatSelected = false;
var isSocratesMenuOpen = false;
var isSettingsMenuOpen = false;
var isEditSatMenuOpen = false;
var isNewLaunchMenuOpen = false;
var isMissileMenuOpen = false;
var isCustomSensorMenuOpen = false;
var isEditTime = false;
var isShowNextPass = false;
var isShowDistance = false;
var isOnlyFOVChecked = false;
var isRiseSetLookangles = false;

var isPropRateVisible = false;
var isPropRateChange = false;
var isHoverBoxVisible = false;

var limitSats;
var isSharperShaders = false;

var otherSatelliteTransparency = 0.1;

// getEarthScreenPointvar rayOrigin;
var rayOrigin;
var ptThru;
var rayDir;
var toCenterVec;
var dParallel;
var longDir;
var dPerp;
var dSubSurf;
var dSurf;
var ptSurf;

var lastBoxUpdateTime = 0;
var lastMapUpdateTime = 0;
var mapUpdateOverride = false;
var lookanglesInterval = 5;
var lookanglesLength = 2;

var pickFb, pickTex;
var pickColorBuf;

var pMatrix = mat4.create();
var camMatrix = mat4.create();

var selectedSat = -1;
var lastSelectedSat = -1;

var mouseX = 0;
var mouseY = 0;
var mouseTimeout = null;
var mouseSat = -1;
var isMouseMoving = false;

// var curRadarTrackNum = 0;
// var lastRadarTrackTime = 0;

var dragPoint = [0, 0, 0];
var screenDragPoint = [0, 0];
var dragStartPitch = 0;
var dragStartYaw = 0;
var isDragging = false;
var dragHasMoved = false;

var rotateTheEarth = true; // Set to False to disable initial rotation
var rotateTheEarthSpeed = 0.000075; // Adjust to change camera speed when rotating around earth

var CAMERA_TYPE = 0;

// var debugLine;

$(document).ready(function () { // Code Once index.htm is loaded
  // Load the Stylesheets
  $('head').append('<link rel="stylesheet" type="text/css" href="css/style.css">');

  // Load ALl The Images Now
  $('img').each(function () {
    $(this).attr('src', $(this).attr('delayedsrc'));
  });

  // Initialize Navigation Menu
  $('.dropdown-button').dropdown();
  $('.tooltipped').tooltip({delay: 50});

  // Initialize Materialize Select Menus
  $('select').material_select();

  $('#search-results').perfectScrollbar();

  var resizing = false;

  $(window).resize(function () {
    if (!resizing) {
      window.setTimeout(function () {
        resizing = false;
        webGlInit();
      }, 500);
    }
    resizing = true;
  });

  webGlInit();
  earth.init();
  ColorScheme.init();
  satSet.init(function (satData) {
    orbitDisplay.init();
    groups.init();
    searchBox.init(satData);

    // debugLine = new Line();
    // debugLine2 = new Line();
    // debugLine3 = new Line();
  });

  $('#datetime-input-tb').datetimepicker({
    dateFormat: 'yy-mm-dd',
    timeFormat: 'HH:mm:ss',
    timezone: '+0000',
    addSliderAccess: true,
    sliderAccessArgs: { touchonly: false },
    minDate: -14, // No more than 7 days in the past
    maxDate: 14 }).on('change.dp', function (e) { // or 7 days in the future to make sure ELSETs are valid
      $('#datetime-input').fadeOut();
      $('#datetime-text').fadeIn();
      isEditTime = false;
    });

  satSet.onCruncherReady(function (satData) {
    // do querystring stuff

    var queryStr = window.location.search.substring(1);
    var params = queryStr.split('&');
    for (var i = 0; i < params.length; i++) {
      var key = params[i].split('=')[0];
      var val = params[i].split('=')[1];
      switch (key) {
        case 'intldes':
          var urlSatId = satSet.getIdFromIntlDes(val.toUpperCase());
          if (urlSatId !== null) {
            selectSat(urlSatId);
          }
          break;
        case 'search':
          // console.log('preloading search to ' + val);
          searchBox.doSearch(val);
          $('#search').val(val);
          break;
        case 'rate':
          val = Math.min(val, 1000);
          // could run time backwards, but let's not!
          val = Math.max(val, 0.0);
          // console.log('propagating at rate ' + val + ' x real time ');
          propRate = Number(val);
          satCruncher.postMessage({
            typ: 'offset',
            dat: (propOffset).toString() + ' ' + (propRate).toString()
          });
          break;
        case 'hrs':
          // console.log('propagating at offset ' + val + ' hrs');
          // offset is in msec
          propOffset = Number(val) * 3600 * 1000;
          satCruncher.postMessage({
            typ: 'offset',
            dat: (propOffset).toString() + ' ' + (propRate).toString()
          });
          break;
      }
    }

    searchBox.init(satData);
    satSet.satDataString = null; // Clears stringified json file and clears 7MB of memory.
  });

  // Resize Window Detection
  $(window).resize(function () {
    if ($(window).width() > $(window).height()) {
      mapWidth = $(window).width(); // Subtract 12 px for the scroll
      $('#map-image').width(mapWidth);
      mapHeight = mapWidth * 3 / 4;
      $('#map-image').height(mapHeight);
      $('#map-menu').width($(window).width());
    } else {
      mapHeight = $(window).height() - 100; // Subtract 12 px for the scroll
      $('#map-image').height(mapHeight);
      mapWidth = mapHeight * 4 / 3;
      $('#map-image').width(mapWidth);
      $('#map-menu').width($(window).width());
    }
  });

  $('#canvas').on('touchmove', function (evt) {
    evt.preventDefault();
    if (isDragging && screenDragPoint[0] !== evt.originalEvent.touches[0].clientX && screenDragPoint[1] !== evt.originalEvent.touches[0].clientY) {
      dragHasMoved = true;
      camAngleSnappedOnSat = false;
      camZoomSnappedOnSat = false;
    }
    mouseX = evt.originalEvent.touches[0].clientX;
    mouseY = evt.originalEvent.touches[0].clientY;
    isMouseMoving = true;
    clearTimeout(mouseTimeout);
    mouseTimeout = setTimeout(function () {
      isMouseMoving = false;
    }, 250);
  });

  $('#canvas').mousemove(function (evt) {
    if (isDragging && screenDragPoint[0] !== evt.clientX && screenDragPoint[1] !== evt.clientY) {
      dragHasMoved = true;
      camAngleSnappedOnSat = false;
      camZoomSnappedOnSat = false;
    }
    mouseX = evt.clientX;
    mouseY = evt.clientY;
    isMouseMoving = true;
    clearTimeout(mouseTimeout);
    mouseTimeout = setTimeout(function () {
      isMouseMoving = false;
    }, 250);
  });

  $('#canvas').on('wheel', function (evt) {
    // if (isZoomChanging) return;
    // isZoomChanging = true;
    var delta = evt.originalEvent.deltaY;
    if (evt.originalEvent.deltaMode === 1) {
      delta *= 33.3333333;
    }
    zoomTarget += delta * 0.0002;
    if (zoomTarget > 1) zoomTarget = 1;
    if (zoomTarget < 0) zoomTarget = 0;
    rotateTheEarth = false;
    camZoomSnappedOnSat = false;
  });

  $('#canvas').click(function (evt) {
    $.colorbox.close();
  });

  $(document).bind('cbox_closed', function () {
    if (isLaunchMenuOpen) {
      isLaunchMenuOpen = false;
      $('#menu-launches img').removeClass('bmenu-item-selected');
    }
  });

  $('#canvas').contextmenu(function () {
    return false; // stop right-click menu
  });

  $('#canvas').mousedown(function (evt) {
    // if(evt.which === 3) {//RMB
    // CAMERA_OVERIDE_ENABLED = false;
    dragPoint = getEarthScreenPoint(evt.clientX, evt.clientY);
    screenDragPoint = [evt.clientX, evt.clientY];
    dragStartPitch = camPitch;
    dragStartYaw = camYaw;
    // debugLine.set(dragPoint, getCamPos());
    isDragging = true;
    if ($(document).width() <= 1000) {
      isDragging = false;
    }
    camSnapMode = false;
    rotateTheEarth = false;
    // }
  });

  $('#canvas').on('touchstart', function (evt) {
    var x = evt.originalEvent.touches[0].clientX;
    var y = evt.originalEvent.touches[0].clientY;
    dragPoint = getEarthScreenPoint(x, y);
    screenDragPoint = [x, y];
    dragStartPitch = camPitch;
    dragStartYaw = camYaw;
    // debugLine.set(dragPoint, getCamPos());
    isDragging = true;
    if ($(document).width() <= 1000) {
      isDragging = false;
    }
    camSnapMode = false;
    rotateTheEarth = false;
  });

  $('#canvas').mouseup(function (evt) {
    // if(evt.which === 3) {//RMB
    if (!dragHasMoved) {
      var clickedSat = getSatIdFromCoord(evt.clientX, evt.clientY);
      if (clickedSat === -1 && evt.button === 2) { // Right Mouse Buttom Click
        // clearMenuCountries();
        $('#search').val('');
        searchBox.hideResults();
        isMilSatSelected = false;
        $('#menu-space-stations img').removeClass('bmenu-item-selected');
        if ($(document).width() <= 1000) {
          $('#search-results').attr('style', 'height:110px;margin-bottom:-50px;width:100%;bottom:auto;margin-top:50px;');
          $('#controls-up-wrapper').css('top', '80px');
        } else {
          $('#search-results').attr('style', 'max-height:100%;margin-bottom:-50px;');
          $('#legend-hover-menu').hide();
        }

        // Hide All legends
        $('#legend-list-default').hide();
        $('#legend-list-default-sensor').hide();
        $('#legend-list-rcs').hide();
        $('#legend-list-small').hide();
        $('#legend-list-near').hide();
        $('#legend-list-deep').hide();
        $('#legend-list-velocity').hide();

        if (lookangles.sensorSelected()) {
          $('#menu-in-coverage img').removeClass('bmenu-item-disabled');
          $('#legend-list-default-sensor').show();
        } else {
          $('#legend-list-default').show();
        }

        satSet.setColorScheme(ColorScheme.default);
      }
      selectSat(clickedSat);
    }
    dragHasMoved = false;
    isDragging = false;
    rotateTheEarth = false;
    // }
  });

  $('#canvas').on('touchend', function (evt) {
    dragHasMoved = false;
    isDragging = false;
    rotateTheEarth = false;
  });

  $('.menu-item').mouseover(function (evt) {
    $(this).children('.submenu').css({
      display: 'block'
    });
  });

  $('.menu-item').mouseout(function (evt) {
    $(this).children('.submenu').css({
      display: 'none'
    });
  });

  $('#search-close').click(function () {
    $('#search').val('');
    searchBox.hideResults();
    isMilSatSelected = false;
    $('#menu-space-stations img').removeClass('bmenu-item-selected');
    $('#controls-up-wrapper').css('top', '80px');
  });

  $('#controls-zoom-in').click(function () {
    zoomTarget -= 0.04;
    if (zoomTarget < 0) zoomTarget = 0;
    rotateTheEarth = false;
    camZoomSnappedOnSat = false;
  });

  $('#controls-zoom-out').click(function () {
    zoomTarget += 0.04;
    if (zoomTarget > 1) zoomTarget = 1;
    rotateTheEarth = false;
    camZoomSnappedOnSat = false;
  });
  $('#controls-up').click(function () {
    camPitchSpeed += 0.001 * zoomLevel;
    if (camPitch > Math.PI / 2) camPitchSpeed = 0;
    rotateTheEarth = false;
    camZoomSnappedOnSat = false;
  });

  $('#controls-down').click(function () {
    camPitchSpeed -= 0.001 * zoomLevel;
    if (camPitch < -Math.PI / 2) camPitchSpeed = 0;
    rotateTheEarth = false;
    camZoomSnappedOnSat = false;
  });

  $('#controls-left').click(function () {
    camYawSpeed -= 0.001 * zoomLevel;
    // if (camYaw < -1) camYaw = -1;
    rotateTheEarth = false;
    camZoomSnappedOnSat = false;
  });

  $('#controls-right').click(function () {
    camYawSpeed += 0.001 * zoomLevel;
    // if (camYaw > 1) camYaw = 1;
    rotateTheEarth = false;
    camZoomSnappedOnSat = false;
  });

  $('#bottom-menu').on('click', '.FOV-object', function (evt) {
    var objNum = $(this)['context']['textContent']; // TODO: Find correct code for this.
    objNum = objNum.slice(-5);
    var satId = satSet.getIdFromObjNum(objNum);
    if (satId !== null) {
      selectSat(satId);
    }
  });

  $('#facebook-share').click(function () {
    ga('send', 'social', 'Facebook', 'share', 'http://keeptrack.com');
  });

  $('#twitter-share').click(function () {
    ga('send', 'social', 'Twitter', 'share', 'http://keeptrack.com');
  });

  $('#reddit-share').click(function () {
    ga('send', 'social', 'Reddit', 'share', 'http://keeptrack.com');
  });

  $('#us-radar-menu').click(function () {
    if ($('#legend-list-default').css('display') === 'block') {
      $('#legend-list-default').hide();
      $('#legend-list-default-sensor').show();
    }
    updateMap();
  });

  $('#russian-menu').click(function () {
    if ($('#legend-list-default').css('display') === 'block') {
      $('#legend-list-default').hide();
      $('#legend-list-default-sensor').show();
    }
    updateMap();
  });

  $('#legend-menu').click(function () {
    if ($('#legend-hover-menu').css('display') === 'block') {
      $('#legend-hover-menu').hide();
    } else {
      $('#legend-hover-menu').show();
      $('#search').val('');
      searchBox.hideResults();
      $('#search-results').hide();
      $('#legend-hover-menu').css({
        height: 'inherit'
      });
    }
  });

  // USAF Radars
  $('#radar-beale').click(function () { // Select Beale's Radar Coverage
    sensorManager.setSensor(sensorManager.sensorList.BLE);
  });
  $('#radar-capecod').click(function () { // Select Cape Cod's Radar Coverage
    sensorManager.setSensor(sensorManager.sensorList.COD);
  });
  $('#radar-clear').click(function () { // Select Clear's Radar Coverage
    sensorManager.setSensor(sensorManager.sensorList.CLR);
  });
  $('#radar-eglin').click(function () { // Select Clear's Radar Coverage
    sensorManager.setSensor(sensorManager.sensorList.EGL);
  });
  $('#radar-fylingdales').click(function () { // Select Fylingdales's Radar Coverage
    sensorManager.setSensor(sensorManager.sensorList.FYL);
  });
  $('#radar-parcs').click(function () { // Select PARCS' Radar Coverage
    sensorManager.setSensor(sensorManager.sensorList.CAV);
  });
  $('#radar-thule').click(function () { // Select Thule's Radar Coverage
    sensorManager.setSensor(sensorManager.sensorList.THL);
  });
  $('#radar-cobradane').click(function () { // Select Cobra Dane's Radar Coverage
    sensorManager.setSensor(sensorManager.sensorList.CDN);
  });

  // US Contributing Radars
  $('#radar-altair').click(function () { // Select Altair's Radar Coverage
    sensorManager.setSensor(sensorManager.sensorList.ALT);
  });
  $('#radar-millstone').click(function () { // Select Millstone's Radar Coverage
    sensorManager.setSensor(sensorManager.sensorList.MIL);
  });
  $('#radar-ascension').click(function () { // Select Ascension's Radar Coverage
    sensorManager.setSensor(sensorManager.sensorList.ASC);
  });
  $('#radar-globus').click(function () { // Select Globus II's Radar Coverage
    sensorManager.setSensor(sensorManager.sensorList.GLB);
  });

  // Optical
  $('#optical-diego-garcia').click(function () { // Select Diego Garcia's Optical Coverage
    sensorManager.setSensor(sensorManager.sensorList.DGC);
  });
  $('#optical-maui').click(function () { // Select Maui's Optical Coverage
    sensorManager.setSensor(sensorManager.sensorList.MAU);
  });
  $('#optical-socorro').click(function () { // Select Socorro's Optical Coverage
    sensorManager.setSensor(sensorManager.sensorList.SOC);
  });

  // Russian Radars
  $('#russian-armavir').click(function () {
    sensorManager.setSensor(sensorManager.sensorList.ARM);
  });
  $('#russian-balkhash').click(function () {
    sensorManager.setSensor(sensorManager.sensorList.BAL);
  });
  $('#russian-gantsevichi').click(function () {
    sensorManager.setSensor(sensorManager.sensorList.GAN);
  });
  $('#russian-lekhtusi').click(function () {
    sensorManager.setSensor(sensorManager.sensorList.LEK);
  });
  $('#russian-mishelevka-d').click(function () {
    sensorManager.setSensor(sensorManager.sensorList.MIS);
  });
  $('#russian-olenegorsk').click(function () {
    sensorManager.setSensor(sensorManager.sensorList.OLE);
  });
  $('#russian-pechora').click(function () {
    sensorManager.setSensor(sensorManager.sensorList.PEC);
  });
  $('#russian-pionersky').click(function () {
    sensorManager.setSensor(sensorManager.sensorList.PIO);
  });

  // Chinese Radars
  $('#chinese-xuanhua').click(function () {
    sensorManager.setSensor(sensorManager.sensorList.XUA);
  });

  $('.sensor-selected').click(function () {
    $('#menu-sensor-info img').removeClass('bmenu-item-disabled');
    if (selectedSat !== -1) {
      $('#menu-lookangles img').removeClass('bmenu-item-disabled');
    }
    $('#menu-in-coverage img').removeClass('bmenu-item-disabled');
  });

  $('#datetime-input-form').change(function (e) {
    var selectedDate = $('#datetime-input-tb').datepicker('getDate');
    var today = new Date();
    propOffset = selectedDate - today;
    satCruncher.postMessage({
      typ: 'offset',
      dat: (propOffset).toString() + ' ' + (1.0).toString()
    });
    propRealTime = Date.now();
    e.preventDefault();
  });
  $('#findByLooks').submit(function (e) {
    var fblAzimuth = $('#fbl-azimuth').val();
    var fblElevation = $('#fbl-elevation').val();
    var fblRange = $('#fbl-range').val();
    var fblInc = $('#fbl-inc').val();
    var fblPeriod = $('#fbl-period').val();
    var fblAzimuthM = $('#fbl-azimuth-margin').val();
    var fblElevationM = $('#fbl-elevation-margin').val();
    var fblRangeM = $('#fbl-range-margin').val();
    var fblIncM = $('#fbl-inc-margin').val();
    var fblPeriodM = $('#fbl-period-margin').val();
    satSet.searchAzElRange(fblAzimuth, fblElevation, fblRange, fblInc, fblAzimuthM, fblElevationM, fblRangeM, fblIncM, fblPeriod, fblPeriodM);
    e.preventDefault();
  });
  $('#settings-form').submit(function (e) {
    var isResetSensorChecked = document.getElementById('settings-resetSensor').checked;
    var isHOSChecked = document.getElementById('settings-hos').checked;
    isOnlyFOVChecked = document.getElementById('settings-onlyfov').checked;
    var isLimitSats = document.getElementById('settings-limitSats-enabled').checked;
    var isChangeSharperShaders = document.getElementById('settings-shaders').checked;
    var isSNPChecked = document.getElementById('settings-snp').checked;
    var isSDChecked = document.getElementById('settings-sd').checked;
    var isRiseSetChecked = document.getElementById('settings-riseset').checked;

    /** Filter On and Shaders On */
    if (!isSharperShaders && isChangeSharperShaders && isLimitSats) {
      shadersOnFilterOn();
    } else if (isLimitSats && limitSats !== $('#limitSats').val() && !isChangeSharperShaders) {
      shadersOffFilterOn();
    } else if (!isSharperShaders && isChangeSharperShaders && !isLimitSats) {
      shadersOnFilterOff();
    } else if (!isLimitSats && limitSats !== '') {
    /** Filter turned off was previously on */
      if (isChangeSharperShaders === false) {
        shadersOffFilterOff();
      } else {
        shadersOnFilterOff();
      }
    } else if (isSharperShaders !== isChangeSharperShaders) {
    /** If shaders change */
      if (!isLimitSats || limitSats === '') {
        if (isChangeSharperShaders) { shadersOnFilterOff(); }
        if (!isChangeSharperShaders) { shadersOffFilterOff(); }
      } else {
        if (isChangeSharperShaders) { shadersOnFilterOn(); }
        if (!isChangeSharperShaders) { shadersOffFilterOn(); }
      }
    }

    function shadersOnFilterOn () {
      limitSats = $('#limitSats').val();
      window.location = '/index.htm?sharperShaders=true&limitSats=' + limitSats;
    }
    function shadersOnFilterOff () { window.location = '/index.htm?sharperShaders=true'; }
    function shadersOffFilterOn () {
      limitSats = $('#limitSats').val();
      window.location = '/index.htm?limitSats=' + limitSats;
    }
    function shadersOffFilterOff () { window.location = '/index.htm'; }

    if (isResetSensorChecked) {
      // Return to default settings with nothing 'inview'
      satCruncher.postMessage({
        typ: 'offset',
        dat: (propOffset).toString() + ' ' + (propRate).toString(),
        sensor: lookangles.defaultSensor
      });
      lookangles.setobs(null, true);
      sensorManager.whichRadar = ''; // Disable Weather
      $('#menu-sensor-info img').addClass('bmenu-item-disabled');
      $('#menu-in-coverage img').addClass('bmenu-item-disabled');
      $('#menu-lookangles img').addClass('bmenu-item-disabled');
      $('#menu-weather img').addClass('bmenu-item-disabled');
    }
    if (isHOSChecked) {
      otherSatelliteTransparency = 0;
      ga('send', 'event', 'Settings Menu', 'Hide Other Satellites', 'Option Selected');
    } else {
      otherSatelliteTransparency = 0.1;
    }
    if (isOnlyFOVChecked) {
      satSet.setColorScheme(ColorScheme.onlyFOV);
      ga('send', 'event', 'Settings Menu', 'Show Only FOV', 'Option Selected');
      ga('send', 'event', 'ColorScheme Menu', 'Only FOV', 'Selected');
    }
    if (isSNPChecked) {
      isShowNextPass = true;
      ga('send', 'event', 'Settings Menu', 'Show Next Pass on Hover', 'Option Selected');
    } else {
      isShowNextPass = false;
    }

    if (isSDChecked) {
      isShowDistance = true;
      ga('send', 'event', 'Settings Menu', 'Show Distance on Hover', 'Option Selected');
    } else {
      isShowDistance = false;
    }

    if (isRiseSetChecked) {
      isRiseSetLookangles = true;
      ga('send', 'event', 'Settings Menu', 'Show Only Rise/Set Times', 'Option Selected');
    } else {
      isRiseSetLookangles = false;
    }

    lookanglesLength = $('#lookanglesLength').val() * 1;
    lookanglesInterval = $('#lookanglesInterval').val() * 1;

    document.getElementById('settings-resetSensor').checked = false;
    e.preventDefault();
  });

  $('#editSat').submit(function (e) {
    $('#es-error').hide();
    var scc = $('#es-scc').val();
    var satId = satSet.getIdFromObjNum(scc);
    if (satId === null) {
      console.log('Not a Real Satellite');
      e.preventDefault();
      return;
    }
    var sat = satSet.getSat(satId);

    var intl = sat.TLE1.substr(9, 8);

    // TODO: Calculate current J-Day to change Epoch Date

    function pad (str, max) {
      return str.length < max ? pad(' ' + str, max) : str;
    }

    var inc = $('#es-inc').val();

    inc = parseFloat(inc).toPrecision(7);
    inc = inc.split('.');
    inc[0] = inc[0].substr(-3, 3);
    if (inc[1]) {
      inc[1] = inc[1].substr(0, 4);
    } else {
      inc[1] = '0000';
    }
    inc = (inc[0] + '.' + inc[1]).toString();
    inc = pad(inc, 8);

    var meanmo = $('#es-meanmo').val();

    meanmo = parseFloat(meanmo).toPrecision(10);
    meanmo = meanmo.split('.');
    meanmo[0] = meanmo[0].substr(-2, 2);
    if (meanmo[1]) {
      meanmo[1] = meanmo[1].substr(0, 8);
    } else {
      meanmo[1] = '00000000';
    }
    meanmo = (meanmo[0] + '.' + meanmo[1]).toString();
    meanmo = pad(meanmo, 8);

    var rasc = $('#es-rasc').val();

    rasc = parseFloat(rasc).toPrecision(7);
    rasc = rasc.split('.');
    rasc[0] = rasc[0].substr(-3, 3);
    if (rasc[1]) {
      rasc[1] = rasc[1].substr(0, 4);
    } else {
      rasc[1] = '0000';
    }
    rasc = (rasc[0] + '.' + rasc[1]).toString();
    rasc = pad(rasc, 8);

    var ecen = $('#es-ecen').val();
    var argPe = $('#es-argPe').val();

    argPe = parseFloat(argPe).toPrecision(7);
    argPe = argPe.split('.');
    argPe[0] = argPe[0].substr(-3, 3);
    if (argPe[1]) {
      argPe[1] = argPe[1].substr(0, 4);
    } else {
      argPe[1] = '0000';
    }
    argPe = (argPe[0] + '.' + argPe[1]).toString();
    argPe = pad(argPe, 8);

    var meana = $('#es-meana').val();

    meana = parseFloat(meana).toPrecision(7);
    meana = meana.split('.');
    meana[0] = meana[0].substr(-3, 3);
    if (meana[1]) {
      meana[1] = meana[1].substr(0, 4);
    } else {
      meana[1] = '0000';
    }
    meana = (meana[0] + '.' + meana[1]).toString();
    meana = pad(meana, 8);

    var epochyr = $('#es-year').val();
    var epochday = $('#es-day').val();

    var TLE1Ending = sat.TLE1.substr(32, 39);

    var TLE1 = '1 ' + scc + 'U ' + intl + ' ' + epochyr + epochday + TLE1Ending; // M' and M'' are both set to 0 to put the object in a perfect stable orbit
    var TLE2 = '2 ' + scc + ' ' + inc + ' ' + rasc + ' ' + ecen + ' ' + argPe + ' ' + meana + ' ' + meanmo + '    10';

    if (lookangles.altitudeCheck(TLE1, TLE2, propOffset) > 1) {
      satCruncher.postMessage({
        typ: 'satEdit',
        id: satId,
        active: true,
        TLE1: TLE1,
        TLE2: TLE2
      });
      orbitDisplay.updateOrbitBuffer(satId, true, TLE1, TLE2);
      sat.active = true;

      sat = satSet.getSat(satId);
    } else {
      $('#es-error').html('Failed Altitude Check</br>Try Different Parameters');
      $('#es-error').show();
    }
    e.preventDefault();
  });

  $('#editSat-save').click(function (e) {
    var scc = $('#es-scc').val();
    var satId = satSet.getIdFromObjNum(scc);
    var sat = satSet.getSat(satId);
    var sat2 = {
      TLE1: sat.TLE1,
      TLE2: sat.TLE2
    };
    var variable = JSON.stringify(sat2);
    var blob = new Blob([variable], {type: 'text/plain;charset=utf-8'});
    saveAs(blob, scc + '.tle');
    e.preventDefault();
  });

  $('#editSat-open').click(function (e) {
    $('#editSat-file').trigger('click');
  });

  $('#editSat-file').change(function (evt) {
    if (!window.FileReader) return; // Browser is not compatible

    var reader = new FileReader();

    reader.onload = function (evt) {
      if (evt.target.readyState !== 2) return;
      if (evt.target.error) {
        console.log('error');
        return;
      }

      var object = JSON.parse(evt.target.result);
      var scc = parseInt(pad(object.TLE1.substr(2, 5).trim(), 5));
      var satId = satSet.getIdFromObjNum(scc);
      var sat = satSet.getSat(satId);
      if (lookangles.altitudeCheck(object.TLE1, object.TLE2, propOffset) > 1) {
        satCruncher.postMessage({
          typ: 'satEdit',
          id: sat.id,
          active: true,
          TLE1: object.TLE1,
          TLE2: object.TLE2
        });
        orbitDisplay.updateOrbitBuffer(sat.id, true, object.TLE1, object.TLE2);
        sat.active = true;
      } else {
        $('#es-error').html('Failed Altitude Check</br>Try Different Parameters');
        $('#es-error').show();
      }
    };
    reader.readAsText(evt.target.files[0]);
    evt.preventDefault();
  });

  $('#es-error').click(function () {
    $('#es-error').hide();
  });

  $('#newLaunch').submit(function (e) {
    $('#loading-screen').fadeIn('slow', function () {
      $('#nl-error').hide();
      var scc = $('#nl-scc').val();
      var satId = satSet.getIdFromObjNum(scc);
      var sat = satSet.getSat(satId);
      // var intl = sat.INTLDES.trim();

      var upOrDown = $('#nl-updown').val();

      // TODO: Calculate current J-Day to change Epoch Date

      var launchFac = $('#nl-facility').val();
      ga('send', 'event', 'New Launch', launchFac, 'Launch Site');

      var launchLat, launchLon;

      for (var launchSite in window.launchSiteManager.launchSiteList) {
        if (window.launchSiteManager.launchSiteList[launchSite].name === launchFac) {
          launchLat = window.launchSiteManager.launchSiteList[launchSite].lat;
          launchLon = window.launchSiteManager.launchSiteList[launchSite].lon;
        }
      }
      if (launchLon > 180) { // if West not East
        launchLon -= 360; // Convert from 0-360 to -180-180
      }

      // Set time to 0000z for relative time.

      var today = new Date(); // Need to know today for offset calculation
      var quadZTime = new Date(today.getFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0); // New Date object of the future collision
      // Date object defaults to local time.
      quadZTime.setUTCHours(0); // Move to UTC Hour

      propOffset = quadZTime - today; // Find the offset from today
      camSnapMode = false;
      satCruncher.postMessage({ // Tell satCruncher we have changed times for orbit calculations
        typ: 'offset',
        dat: (propOffset).toString() + ' ' + (1.0).toString()
      });

      var TLEs = lookangles.getOrbitByLatLon(sat, launchLat, launchLon, upOrDown, propOffset);

      var TLE1 = TLEs[0];
      var TLE2 = TLEs[1];

      if (lookangles.altitudeCheck(TLE1, TLE2, propOffset) > 1) {
        satCruncher.postMessage({
          typ: 'satEdit',
          id: satId,
          active: true,
          TLE1: TLE1,
          TLE2: TLE2
        });
        orbitDisplay.updateOrbitBuffer(satId, true, TLE1, TLE2);

        sat = satSet.getSat(satId);
      } else {
        $('#nl-error').html('Failed Altitude Check</br>Try Editing Manually');
        $('#nl-error').show();
      }
      $('#loading-screen').fadeOut();
    });
    e.preventDefault();
  });

  $('#nl-error').click(function () {
    $('#nl-error').hide();
  });

  $('#breakup').submit(function (e) {
    $('#loading-screen').fadeIn('slow', function () {
      var scc = $('#hc-scc').val();
      var satId = satSet.getIdFromObjNum(scc);
      var mainsat = satSet.getSat(satId);
      var currentEpoch = lookangles.currentEpoch(time);
      mainsat['TLE1'] = mainsat.TLE1.substr(0, 18) + currentEpoch[0] + currentEpoch[1] + mainsat.TLE1.substr(32);

      // TODO: Calculate current J-Day to change Epoch Date

      var launchFac = $('#nl-facility').val();
      ga('send', 'event', 'New Launch', launchFac, 'Launch Site');

      var launchLat, launchLon;
      launchLon = satellite.degrees_long(lookangles.lon);
      launchLat = satellite.degrees_lat(lookangles.lat);

      camSnapMode = false;

      var upOrDown = 'S';

      var TLEs = lookangles.getOrbitByLatLon(mainsat, launchLat, launchLon, upOrDown, propOffset);
      var TLE1 = TLEs[0];
      var TLE2 = TLEs[1];

      for (var i = 0; i < 30; i++) {
        satId = satSet.getIdFromObjNum(80000 + i);
        var sat = satSet.getSat(satId);
        var iTLE1 = '1 ' + (80000 + i) + TLE1.substr(7);

        var inc = TLE2.substr(8, 8);
        inc = parseFloat(inc - 0.3 + (0.6 / (15 / (i + 1)))).toPrecision(7);
        inc = inc.split('.');
        inc[0] = inc[0].substr(-3, 3);
        if (inc[1]) {
          inc[1] = inc[1].substr(0, 4);
        } else {
          inc[1] = '0000';
        }
        inc = (inc[0] + '.' + inc[1]).toString();
        inc = pad(inc, 8);
        console.log(inc);

        var meanmo = TLE2.substr(52, 10);
        meanmo = parseFloat(meanmo - (0.03 / 15) + (0.06 * ((i + 1) / 15))).toPrecision(10);
        console.log(meanmo);
        meanmo = meanmo.split('.');
        console.log(meanmo);
        meanmo[0] = meanmo[0].substr(-2, 2);
        console.log(meanmo[0]);
        if (meanmo[1]) {
          meanmo[1] = meanmo[1].substr(0, 8);
        } else {
          meanmo[1] = '00000000';
        }
        meanmo = (meanmo[0] + '.' + meanmo[1]).toString();
        console.log(meanmo);

        var iTLE2 = '2 ' + (80000 + i) + ' ' + inc + ' ' + TLE2.substr(17, 35) + meanmo + TLE2.substr(63);
        console.log(iTLE2);
        sat['TLE1'] = iTLE1;
        sat['TLE2'] = iTLE2;
        console.log(sat);
        var iTLEs = lookangles.getOrbitByLatLon(sat, launchLat, launchLon, upOrDown, propOffset);
        iTLE1 = iTLEs[0];
        iTLE2 = iTLEs[1];
        console.log(sat);
        if (lookangles.altitudeCheck(iTLE1, iTLE2, propOffset) > 1) {
          satCruncher.postMessage({
            typ: 'satEdit',
            id: satId,
            TLE1: iTLE1,
            TLE2: iTLE2
          });
          orbitDisplay.updateOrbitBuffer(satId, true, iTLE1, iTLE2);

          sat = satSet.getSat(satId);
        } else {
          console.error('Breakup Generator Failed');
        }
      }
      $('#loading-screen').fadeOut();
    });
    e.preventDefault();
  });

  $('#missile').submit(function (e) {
    $('#ms-error').hide();
    var type = $('#ms-type').val() * 1;
    var attacker = $('#ms-attacker').val() * 1;
    var tgtLat = $('#ms-lat').val() * 1;
    var tgtLon = $('#ms-lon').val() * 1;
    // var result = false;

    var launchTime = $('#datetime-text').text().substr(0, 19);
    launchTime = launchTime.split(' ');
    launchTime = new Date(launchTime[0] + 'T' + launchTime[1] + 'Z').getTime();

    if (type > 0) {
      if (type === 1) MassRaidPre(launchTime, 'simulation/Russia2USA.json');
      if (type === 2) MassRaidPre(launchTime, 'simulation/China2USA.json');
      if (type === 3) MassRaidPre(launchTime, 'simulation/NorthKorea2USA.json');
      if (type === 4) MassRaidPre(launchTime, 'simulation/USA2Russia.json');
      if (type === 5) MassRaidPre(launchTime, 'simulation/USA2China.json');
      if (type === 6) MassRaidPre(launchTime, 'simulation/USA2NorthKorea.json');
      ga('send', 'event', 'Missile Sim', type, 'Sim Number');
      $('#ms-error').html('Large Scale Attack Loaded');
      $('#ms-error').show();
    } else {
      if (isNaN(tgtLat)) {
        $('#ms-error').html('Please enter a number<br>for Target Latitude');
        $('#ms-error').show();
        e.preventDefault();
        return;
      }
      if (isNaN(tgtLon)) {
        $('#ms-error').html('Please enter a number<br>for Target Longitude');
        $('#ms-error').show();
        e.preventDefault();
        return;
      }

      if (attacker < 200) { // USA
        var a = attacker - 100;
        var b = 500 - missilesInUse;
        var attackerName = UsaICBM[a * 4 + 2];
        Missile(UsaICBM[a * 4], UsaICBM[a * 4 + 1], tgtLat, tgtLon, 3, satSet.getSatData().length - b, launchTime, UsaICBM[a * 4 + 2], 30, 2.9, 0.07, UsaICBM[a * 4 + 3]);
      } else if (attacker < 300) { // Russian
        a = attacker - 200;
        b = 500 - missilesInUse;
        attackerName = RussianICBM[a * 4 + 2];
        Missile(RussianICBM[a * 4], RussianICBM[a * 4 + 1], tgtLat, tgtLon, 3, satSet.getSatData().length - b, launchTime, RussianICBM[a * 4 + 2], 30, 2.9, 0.07, RussianICBM[a * 4 + 3]);
      } else if (attacker < 400) { // Chinese
        a = attacker - 300;
        b = 500 - missilesInUse;
        attackerName = ChinaICBM[a * 4 + 2];
        Missile(ChinaICBM[a * 4], ChinaICBM[a * 4 + 1], tgtLat, tgtLon, 3, satSet.getSatData().length - b, launchTime, ChinaICBM[a * 4 + 2], 30, 2.9, 0.07, ChinaICBM[a * 4 + 3]);
      } else if (attacker < 500) { // North Korean
        a = attacker - 400;
        b = 500 - missilesInUse;
        attackerName = NorthKoreanBM[a * 4 + 2];
        Missile(NorthKoreanBM[a * 4], NorthKoreanBM[a * 4 + 1], tgtLat, tgtLon, 3, satSet.getSatData().length - b, launchTime, NorthKoreanBM[a * 4 + 2], 30, 2.9, 0.07, NorthKoreanBM[a * 4 + 3]);
      }
      ga('send', 'event', 'New Missile', attackerName, 'Attacker');
      ga('send', 'event', 'New Missile', tgtLat + ', ' + tgtLon, 'Target');

      $('#ms-error').html(lastMissileError);
      $('#ms-error').show();
    }
    e.preventDefault();
  });

  $('#ms-error').click(function () {
    $('#ms-error').hide();
  });

  $('#missile').change(function (e) {
    if ($('#ms-type').val() * 1 !== 0) {
      $('#ms-custom-opt').hide();
    } else {
      $('#ms-custom-opt').show();
    }
  });

  $('#cs-telescope').click(function (e) {
    if ($('#cs-telescope').is(':checked')) {
      $('#cs-minaz').attr('disabled', true);
      $('#cs-maxaz').attr('disabled', true);
      $('#cs-minel').attr('disabled', true);
      $('#cs-maxel').attr('disabled', true);
      $('#cs-minrange').attr('disabled', true);
      $('#cs-maxrange').attr('disabled', true);
      $('#cs-minaz-div').hide();
      $('#cs-maxaz-div').hide();
      $('#cs-minel-div').hide();
      $('#cs-maxel-div').hide();
      $('#cs-minrange-div').hide();
      $('#cs-maxrange-div').hide();
      $('#cs-minaz').val(0);
      $('#cs-maxaz').val(360);
      $('#cs-minel').val(10);
      $('#cs-maxel').val(90);
      $('#cs-minrange').val(100);
      $('#cs-maxrange').val(50000);
    } else {
      $('#cs-minaz').attr('disabled', false);
      $('#cs-maxaz').attr('disabled', false);
      $('#cs-minel').attr('disabled', false);
      $('#cs-maxel').attr('disabled', false);
      $('#cs-minrange').attr('disabled', false);
      $('#cs-maxrange').attr('disabled', false);
      $('#cs-minaz-div').show();
      $('#cs-maxaz-div').show();
      $('#cs-minel-div').show();
      $('#cs-maxel-div').show();
      $('#cs-minrange-div').show();
      $('#cs-maxrange-div').show();
    }
  });

  $('#customSensor').submit(function (e) {
    $('#menu-sensor-info img').removeClass('bmenu-item-disabled');
    sensorManager.whichRadar = 'CUSTOM';
    if ($('#cs-telescope').val()) {
      $('#sensor-type').html('Telescope');
    } else {
      $('#sensor-type').html('Radar');
    }
    $('#sensor-info-title').html('Custom Sensor');
    $('#sensor-country').html('Custom Sensor');

    var lon = $('#cs-lon').val();
    var lat = $('#cs-lat').val();
    var obshei = $('#cs-hei').val();
    var minaz = $('#cs-minaz').val();
    var maxaz = $('#cs-maxaz').val();
    var minel = $('#cs-minel').val();
    var maxel = $('#cs-maxel').val();
    var minrange = $('#cs-minrange').val();
    var maxrange = $('#cs-maxrange').val();

    satCruncher.postMessage({ // Send SatCruncher File information on this radar
      typ: 'offset', // Tell satcruncher to update something
      dat: (propOffset).toString() + ' ' + (propRate).toString(), // Tell satcruncher what time it is and how fast time is moving
      setlatlong: true, // Tell satcruncher we are changing observer location
      sensor: {
        lat: lat,
        long: lon,
        obshei: obshei,
        obsminaz: minaz,
        obsmaxaz: maxaz,
        obsminel: minel,
        obsmaxel: maxel,
        obsminrange: minrange,
        obsmaxrange: maxrange
      }
    });

    lookangles.setobs({
      lat: lat,
      long: lon,
      obshei: obshei,
      obsminaz: minaz,
      obsmaxaz: maxaz,
      obsminel: minel,
      obsmaxel: maxel,
      obsminrange: minrange,
      obsmaxrange: maxrange
    });

    lat = lat * 1;
    lon = lon * 1;
    camSnap(latToPitch(lat), longToYaw(lon));
    if (maxrange > 6000) {
      changeZoom('geo');
    } else {
      changeZoom('leo');
    }

    e.preventDefault();
  });

  $('#canvas').on('keypress', keyHandler); // On Key Press Event Run keyHandler Function
  $('#canvas').on('keydown', keyDownHandler); // On Key Press Event Run keyHandler Function
  $('#canvas').on('keyup', keyUpHandler); // On Key Press Event Run keyHandler Function
  $('#bottom-icons').on('click', '.bmenu-item', bottomIconPress); // Bottom Button Pressed
  $('#canvas').attr('tabIndex', 0);
  $('#canvas').focus();

  drawLoop(); // kick off the animationFrame()s
});

function socrates (row) {
  /* SOCRATES.htm is a 20 row .pl script pulled from celestrak.com/cgi-bin/searchSOCRATES.pl
  If it ever becomes unavailable a similar, but less accurate (maybe?) cron job could be
  created using satCruncer.

  The variable row determines which set of objects on SOCRATES.htm we are using. First
  row is 0 and last one is 19. */
  if (row === -1 && socratesObjOne.length === 0 && socratesObjTwo.length === 0) { // Only generate the table if receiving the -1 argument for the first time
    $.get('/SOCRATES.htm', function (socratesHTM) { // Load SOCRATES.htm so we can use it instead of index.htm
      var tableRowOne = $("[name='CATNR1']", socratesHTM).closest('tr'); // Find the row(s) containing the hidden input named CATNR1
      var tableRowTwo = $("[name='CATNR2']", socratesHTM).closest('tr'); // Find the row(s) containing the hidden input named CATNR2
      tableRowOne.each(function (rowIndex, r) {
        var cols = [];
        $(this).find('td').each(function (colIndex, c) {
          cols.push(c.textContent);
        });
        socratesObjOne.push(cols);
      });
      tableRowTwo.each(function (rowIndex, r) {
        var cols = [];
        $(this).find('td').each(function (colIndex, c) {
          cols.push(c.textContent);
        });
        socratesObjTwo.push(cols);
      });
      // SOCRATES Menu
      var tbl = document.getElementById('socrates-table'); // Identify the table to update
      tbl.innerHTML = '';                                  // Clear the table from old object data
      // var tblLength = 0;                                   // Iniially no rows to the table

      var tr = tbl.insertRow();
      var tdT = tr.insertCell();
      tdT.appendChild(document.createTextNode('Time'));
      tdT.setAttribute('style', 'text-decoration: underline');
      var tdS1 = tr.insertCell();
      tdS1.appendChild(document.createTextNode('#1'));
      tdS1.setAttribute('style', 'text-decoration: underline');
      var tdS2 = tr.insertCell();
      tdS2.appendChild(document.createTextNode('#2'));
      tdS2.setAttribute('style', 'text-decoration: underline');

      for (var i = 0; i < 20; i++) {                       // 20 rows
        tr = tbl.insertRow();
        tr.setAttribute('class', 'socrates-object link');
        tr.setAttribute('hiddenrow', i);
        tdT = tr.insertCell();
        var socratesDate = socratesObjTwo[i][4].split(' '); // Date/time is on the second line 5th column
        var socratesTime = socratesDate[3].split(':'); // Split time from date for easier management
        var socratesTimeS = socratesTime[2].split('.'); // Split time from date for easier management
        tdT.appendChild(document.createTextNode(socratesDate[2] + ' ' + socratesDate[1] + ' ' + socratesDate[0] + ' - ' + pad(socratesTime[0], 2) + ':' +
        pad(socratesTime[1], 2) + ':' + pad(socratesTimeS[0], 2) + 'Z'));
        tdS1 = tr.insertCell();
        tdS1.appendChild(document.createTextNode(socratesObjOne[i][1]));
        tdS2 = tr.insertCell();
        tdS2.appendChild(document.createTextNode(socratesObjTwo[i][0]));
      }
    });
  }
  if (row !== -1) { // If an object was selected from the menu
    findFutureDate(socratesObjTwo); // Jump to the date/time of the collision

    $('#search').val(socratesObjOne[row][1] + ',' + socratesObjTwo[row][0]); // Fill in the serach box with the two objects
    searchBox.doSearch(socratesObjOne[row][1] + ',' + socratesObjTwo[row][0]); // Actually perform the search of the two objects
    socratesOnSatCruncher = satSet.getIdFromObjNum(socratesObjOne[row][1]);
  } // If a row was selected

  function findFutureDate (socratesObjTwo) {
    var socratesDate = socratesObjTwo[row][4].split(' '); // Date/time is on the second line 5th column
    var socratesTime = socratesDate[3].split(':'); // Split time from date for easier management

    var sYear = parseInt(socratesDate[0]); // UTC Year
    var sMon = MMMtoInt(socratesDate[1]); // UTC Month in MMM prior to converting
    var sDay = parseInt(socratesDate[2]); // UTC Day
    var sHour = parseInt(socratesTime[0]); // UTC Hour
    var sMin = parseInt(socratesTime[1]); // UTC Min
    var sSec = parseInt(socratesTime[2]); // UTC Sec - This is a decimal, but when we convert to int we drop those

    function MMMtoInt (month) {
      switch (month) {
        case 'Jan':
          return 0;
        case 'Feb':
          return 1;
        case 'Mar':
          return 2;
        case 'Apr':
          return 3;
        case 'May':
          return 4;
        case 'Jun':
          return 5;
        case 'Jul':
          return 6;
        case 'Aug':
          return 7;
        case 'Sep':
          return 8;
        case 'Oct':
          return 9;
        case 'Nov':
          return 10;
        case 'Dec':
          return 11;
      }
    } // Convert MMM format to an int for Date() constructor

    var selectedDate = new Date(sYear, sMon, sDay, sHour, sMin, sSec); // New Date object of the future collision
    // Date object defaults to local time.
    selectedDate.setUTCDate(sDay); // Move to UTC day.
    selectedDate.setUTCHours(sHour); // Move to UTC Hour

    var today = new Date(); // Need to know today for offset calculation
    propOffset = selectedDate - today; // Find the offset from today
    camSnapMode = false;
    satCruncher.postMessage({ // Tell satCruncher we have changed times for orbit calculations
      typ: 'offset',
      dat: (propOffset).toString() + ' ' + (1.0).toString()
    });
    propRealTime = Date.now(); // Reset realtime TODO: This might not be necessary...
  } // Allows passing -1 argument to socrates function to skip these steps
  function pad (str, max) {
    return str.length < max ? pad('0' + str, max) : str;
  }
}

$('#socrates-menu').on('click', '.socrates-object', function (evt) {
  var hiddenRow = $(this)['context']['attributes']['hiddenrow']['value']; // TODO: Find correct code for this.
  if (hiddenRow !== null) {
    socrates(hiddenRow);
  }
});

function keyUpHandler (evt) {
  // console.log(Number(evt.keyCode));
  if (Number(evt.keyCode) === 65 || Number(evt.keyCode) === 68) {
    FPSSideSpeed = 0;
  }
  if (Number(evt.keyCode) === 83 || Number(evt.keyCode) === 87) {
    FPSForwardSpeed = 0;
  }
  if (Number(evt.keyCode) === 69 || Number(evt.keyCode) === 81) {
    FPSYawRate = 0;
  }
  if (Number(evt.keyCode) === 16) {
    FPSRun = 1;
  }
}

function keyDownHandler (evt) {
  if (Number(evt.keyCode) === 16) {
    if (CAMERA_TYPE === 2) {
      FPSRun = 3;
    }
  }
}

function keyHandler (evt) {
  // console.log(Number(evt.charCode));
  switch (Number(evt.charCode)) {
    case 87: // W
    case 119: // w
      if (CAMERA_TYPE === 2) {
        FPSForwardSpeed = 10;
      }
      break;
    case 65: // A
    case 97: // a
      if (CAMERA_TYPE === 2) {
        FPSSideSpeed = -10;
      }
      break;
    case 83: // S
    case 115: // s
      if (CAMERA_TYPE === 2) {
        FPSForwardSpeed = -10;
      }
      break;
    case 68: // D
    case 100: // d
      if (CAMERA_TYPE === 2) {
        FPSSideSpeed = 10;
      }
      break;
    case 81: // Q
    case 113: // q
      if (CAMERA_TYPE === 2) {
        FPSYawRate = -0.1;
      }
      break;
    case 69: // E
    case 101: // e
      if (CAMERA_TYPE === 2) {
        FPSYawRate = 0.1;
      }
      break;
  }

  switch (Number(evt.charCode)) {
    case 114: // r
      rotateTheEarth = !rotateTheEarth;
      // console.log('toggled rotation');
      break;
    case 99: // c
      CAMERA_TYPE += 1;
      switch (CAMERA_TYPE) {
        case 0:
          $('#camera-status-box').html('Earth Centered Camera Mode');
          break;
        case 1:
          $('#camera-status-box').html('Offset Camera Mode');
          break;
        case 2:
          $('#camera-status-box').html('Free Camera Mode');
          break;
      }
      $('#camera-status-box').show();
      setTimeout(function () {
        $('#camera-status-box').hide();
      }, 3000);
      if (CAMERA_TYPE === 3) {
        CAMERA_TYPE = 0;
        FPSPitch = 0;
        FPSYaw = 0;
        FPSxPos = 0;
        FPSyPos = 25000;
        FPSzPos = 0;
      }
      break;
    case 33: // !
      propOffset = 0; // Reset to Current Time
      isPropRateChange = true;
      break;
    case 60: // <
      propOffset -= 60000; // Move back 60 seconds
      isPropRateChange = true;
      break;
    case 62: // >
      propOffset += 60000; // Move forward 60 seconds
      isPropRateChange = true;
      break;
    case 48: // 0
      propRate = 0;
      propFrozen = new Date();
      propOffset = getPropOffset();
      isPropRateChange = true;
      break;
    case 43: // +
    case 61: // =
      if (propRate < 0.001 && propRate > -0.001) {
        propRate = 0.001;
      }

      if (propRate > 1000) {
        propRate = 1000;
      }

      if (propRate < 0) {
        propRate *= 0.666666;
      } else {
        propRate *= 1.5;
      }
      propOffset = getPropOffset();
      isPropRateChange = true;
      break;
    case 45: // -
    case 95: // _
      if (propRate < 0.001 && propRate > -0.001) {
        propRate = -0.001;
      }

      if (propRate < -1000) {
        propRate = -1000;
      }

      if (propRate > 0) {
        propRate *= 0.666666;
      } else {
        propRate *= 1.5;
      }

      propOffset = getPropOffset();
      isPropRateChange = true;
      break;
    case 49: // 1
      propRate = 1.0;
      propOffset = getPropOffset();
      isPropRateChange = true;
      break;
  }
  function getPropOffset () {
    var selectedDate = $('#datetime-text').text().substr(0, 19);
    selectedDate = selectedDate.split(' ');
    selectedDate = new Date(selectedDate[0] + 'T' + selectedDate[1] + 'Z');
    var today = new Date();
    propOffset = selectedDate - today;
    return propOffset;
  }

  if (isPropRateChange) {
    satCruncher.postMessage({
      typ: 'offset',
      dat: (propOffset).toString() + ' ' + (propRate).toString()
    });
    propRealTime = Date.now();
  }
}

function hideSideMenus () {
  // Close any open colorboxes
  $.colorbox.close();

  // Hide all side menus
  $('#sensor-info-menu').fadeOut();
  $('#lookangles-menu').fadeOut();
  $('#lookanglesmultisite-menu').fadeOut();
  $('#findByLooks-menu').fadeOut();
  $('#twitter-menu').fadeOut();
  $('#weather-menu').fadeOut();
  $('#map-menu').fadeOut();
  // $('#space-weather-menu').fadeOut();
  $('#socrates-menu').fadeOut();
  $('#settings-menu').fadeOut();
  $('#editSat-menu').fadeOut();
  $('#newLaunch-menu').fadeOut();
  $('#missile-menu').fadeOut();
  $('#customSensor-menu').fadeOut();
  $('#about-menu').fadeOut();

  // Remove red color from all menu icons
  $('#menu-sensor-info img').removeClass('bmenu-item-selected');
  $('#menu-lookangles img').removeClass('bmenu-item-selected');
  $('#menu-lookanglesmultisite img').removeClass('bmenu-item-selected');
  $('#menu-launches img').removeClass('bmenu-item-selected');
  $('#menu-find-sat img').removeClass('bmenu-item-selected');
  $('#menu-twitter img').removeClass('bmenu-item-selected');
  $('#menu-weather img').removeClass('bmenu-item-selected');
  $('#menu-map img').removeClass('bmenu-item-selected');
  // $('#menu-space-weather img').removeClass('bmenu-item-selected');
  $('#menu-satellite-collision img').removeClass('bmenu-item-selected');
  $('#menu-settings img').removeClass('bmenu-item-selected');
  $('#menu-editSat img').removeClass('bmenu-item-selected');
  $('#menu-newLaunch img').removeClass('bmenu-item-selected');
  $('#menu-missile img').removeClass('bmenu-item-selected');
  $('#menu-customSensor img').removeClass('bmenu-item-selected');
  $('#menu-about img').removeClass('bmenu-item-selected');

  // Unflag all open menu variables
  isSensorInfoMenuOpen = false;
  isLaunchMenuOpen = false;
  isTwitterMenuOpen = false;
  isFindByLooksMenuOpen = false;
  isWeatherMenuOpen = false;
  isMapMenuOpen = false;
  // isSpaceWeatherMenuOpen = false;
  isLookanglesMenuOpen = false;
  isLookanglesMultiSiteMenuOpen = false;
  isSocratesMenuOpen = false;
  isSettingsMenuOpen = false;
  isEditSatMenuOpen = false;
  isNewLaunchMenuOpen = false;
  isMissileMenuOpen = false;
  isCustomSensorMenuOpen = false;
  isAboutSelected = false;
}

function bottomIconPress (evt) {
  if (isBottomIconsEnabled === false) { return; } // Exit if menu is disabled
  ga('send', 'event', 'Bottom Icon', $(this)['context']['id'], 'Selected');
  switch ($(this)['context']['id']) {
    case 'menu-sensor-info': // No Keyboard Commands
      if (!lookangles.sensorSelected()) { // No Sensor Selected
        if (!$('#menu-sensor-info img:animated').length) {
          $('#menu-sensor-info img').effect('shake', {distance: 10});
        }
        break;
      }
      if (isSensorInfoMenuOpen) {
        hideSideMenus();
        isSensorInfoMenuOpen = false;
        break;
      } else {
        hideSideMenus();
        lookangles.getsensorinfo();
        $('#sensor-info-menu').fadeIn();
        isSensorInfoMenuOpen = true;
        $('#menu-sensor-info img').addClass('bmenu-item-selected');
        break;
      }
    case 'menu-in-coverage': // B
      if (!lookangles.sensorSelected()) { // No Sensor Selected
        if (!$('#menu-in-coverage img:animated').length) {
          $('#menu-in-coverage img').effect('shake', {distance: 10});
        }
        break;
      }
      if (isBottomMenuOpen) {
        $('#bottom-menu').fadeOut();
        $('#menu-in-coverage img').removeClass('bmenu-item-selected');
        isBottomMenuOpen = false;
        break;
      } else {
        $('#bottom-menu').fadeIn();
        $('#menu-in-coverage img').addClass('bmenu-item-selected');
        isBottomMenuOpen = true;
        break;
      }
    case 'menu-lookangles': // S
      if (isLookanglesMenuOpen) {
        isLookanglesMenuOpen = false;
        hideSideMenus();
        break;
      } else {
        if (!lookangles.sensorSelected() || selectedSat === -1) { // No Sensor or Satellite Selected
          if (!$('#menu-lookangles img:animated').length) {
            $('#menu-lookangles img').effect('shake', {distance: 10});
          }
          break;
        }
        hideSideMenus();
        $('#lookangles-menu').fadeIn();
        isLookanglesMenuOpen = true;
        $('#menu-lookangles img').addClass('bmenu-item-selected');
        if (selectedSat !== -1) {
          var sat = satSet.getSat(selectedSat);
          if (sat.static || sat.missile) {
            if (!$('#menu-lookangles img:animated').length) {
              $('#menu-lookangles img').effect('shake', {distance: 10});
            }
            break;
          } else {
            $('#loading-screen').fadeIn('slow', function () {
              lookangles.getlookangles(sat, isLookanglesMenuOpen);
              $('#loading-screen').fadeOut();
            });
          }
        }
        break;
      }
    case 'menu-lookanglesmultisite':
      if (isLookanglesMultiSiteMenuOpen) {
        isLookanglesMultiSiteMenuOpen = false;
        hideSideMenus();
        break;
      } else {
        if (selectedSat === -1) { // No Satellite Selected
          if (!$('#menu-lookanglesmultisite img:animated').length) {
            $('#menu-lookanglesmultisite img').effect('shake', {distance: 10});
          }
          break;
        }
        hideSideMenus();
        $('#lookanglesmultisite-menu').fadeIn();
        isLookanglesMultiSiteMenuOpen = true;
        $('#menu-lookanglesmultisite img').addClass('bmenu-item-selected');
        if (selectedSat !== -1) {
          $('#loading-screen').fadeIn('slow', function () {
            sat = satSet.getSat(selectedSat);
            lookangles.getlookanglesMultiSite(sat, isLookanglesMultiSiteMenuOpen);
            $('#loading-screen').fadeOut();
          });
        }
        break;
      }
    case 'menu-find-sat': // F
      if (isFindByLooksMenuOpen) {
        isFindByLooksMenuOpen = false;
        hideSideMenus();
        break;
      } else {
        hideSideMenus();
        $('#findByLooks-menu').fadeIn();
        isFindByLooksMenuOpen = true;
        $('#menu-find-sat img').addClass('bmenu-item-selected');
        break;
      }
    case 'menu-twitter': // T
      if (isTwitterMenuOpen) {
        isTwitterMenuOpen = false;
        hideSideMenus();
        break;
      } else {
        hideSideMenus();
        if ($('#twitter-menu').is(':empty')) {
          $('#twitter-menu').html('<a class="twitter-timeline" data-theme="dark" data-link-color="#2B7BB9" href="https://twitter.com/RedKosmonaut/lists/space-news">A Twitter List by RedKosmonaut</a> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>');
        }
        $('#twitter-menu').fadeIn();
        isTwitterMenuOpen = true;
        $('#menu-twitter img').addClass('bmenu-item-selected');
        break;
      }
    case 'menu-weather': // W
      if (isWeatherMenuOpen) {
        isWeatherMenuOpen = false;
        hideSideMenus();
        break;
      }
      if (!isWeatherMenuOpen && sensorManager.whichRadar !== '') {
        if (sensorManager.whichRadar === 'COD' || sensorManager.whichRadar === 'MIL') {
          $('#weather-image').attr('src', 'http://radar.weather.gov/lite/NCR/BOX_0.png');
        }
        if (sensorManager.whichRadar === 'EGL') {
          $('#weather-image').attr('src', 'http://radar.weather.gov/lite/NCR/EVX_0.png');
        }
        if (sensorManager.whichRadar === 'CLR') {
          $('#weather-image').attr('src', 'http://radar.weather.gov/lite/NCR/APD_0.png');
        }
        if (sensorManager.whichRadar === 'PAR') {
          $('#weather-image').attr('src', 'http://radar.weather.gov/lite/NCR/MVX_0.png');
        }
        if (sensorManager.whichRadar === 'BLE') {
          $('#weather-image').attr('src', 'http://radar.weather.gov/lite/NCR/DAX_0.png');
        }
        if (sensorManager.whichRadar === 'FYL') {
          $('#weather-image').attr('src', 'http://i.cdn.turner.com/cnn/.element/img/3.0/weather/maps/satuseurf.gif');
        }
        if (sensorManager.whichRadar === 'DGC') {
          $('#weather-image').attr('src', 'http://images.myforecast.com/images/cw/satellite/CentralAsia/CentralAsia.jpeg');
        }
        hideSideMenus();
        $('#weather-menu').fadeIn();
        isWeatherMenuOpen = true;
        $('#menu-weather img').addClass('bmenu-item-selected');
        break;
      } else {
        if (!$('#menu-weather img:animated').length) {
          $('#menu-weather img').effect('shake', {distance: 10});
        }
      }
      break;
    case 'menu-map': // W
      if (isMapMenuOpen) {
        isMapMenuOpen = false;
        hideSideMenus();
        break;
      }
      if (!isMapMenuOpen) {
        if (selectedSat === -1) { // No Satellite Selected
          if (!$('#menu-map img:animated').length) {
            $('#menu-map img').effect('shake', {distance: 10});
          }
          break;
        }
        hideSideMenus();
        $('#map-menu').fadeIn();
        isMapMenuOpen = true;
        updateMap();
        var satData = satSet.getSat(selectedSat);
        $('#map-sat').tooltip({delay: 50, tooltip: satData.SCC_NUM, position: 'left'});
        $('#menu-map img').addClass('bmenu-item-selected');
        break;
      }
      break;
    // case 'menu-space-weather': // Q
    //   if (isSpaceWeatherMenuOpen) {
    //     isSpaceWeatherMenuOpen = false;
    //     hideSideMenus();
    //     break;
    //   }
    //   $('#space-weather-image').attr('src', 'http://services.swpc.noaa.gov/images/animations/ovation-north/latest.png');
    //   hideSideMenus();
    //   $('#space-weather-menu').fadeIn();
    //   isSpaceWeatherMenuOpen = true;
    //   $('#menu-space-weather img').addClass('bmenu-item-selected');
    //   break;
    case 'menu-launches': // L
      if (isLaunchMenuOpen) {
        isLaunchMenuOpen = false;
        hideSideMenus();
        break;
      } else {
        hideSideMenus();
        $.colorbox({href: 'http://space.skyrocket.de/doc_chr/lau2017.htm', iframe: true, width: '80%', height: '80%', fastIframe: false, closeButton: false});
        isLaunchMenuOpen = true;
        $('#menu-launches img').addClass('bmenu-item-selected');
        break;
      }
    case 'menu-about': // No Keyboard Shortcut
      if (isAboutSelected) {
        isAboutSelected = false;
        hideSideMenus();
        break;
      } else {
        hideSideMenus();
        $('#about-menu').fadeIn();
        isAboutSelected = true;
        $('#menu-about img').addClass('bmenu-item-selected');
        break;
      }
    case 'menu-space-stations': // No Keyboard Shortcut
      if (isMilSatSelected) {
        $('#search').val('');
        searchBox.hideResults();
        isMilSatSelected = false;
        $('#menu-space-stations img').removeClass('bmenu-item-selected');
        break;
      } else {
        $('#search').val('40420,41394,32783,35943,36582,40353,40555,41032,38010,38008,38007,38009,37806,41121,41579,39030,39234,28492,36124,39194,36095,40358,40258,37212,37398,38995,40296,40900,39650,27434,31601,36608,28380,28521,36519,39177,40699,34264,36358,39375,38248,34807,28908,32954,32955,32956,35498,35500,37152,37154,38733,39057,39058,39059,39483,39484,39485,39761,39762,39763,40920,40921,40922,39765,29658,31797,32283,32750,33244,39208,26694,40614,20776,25639,26695,30794,32294,33055,39034,28946,33751,33752,27056,27057,27464,27465,27868,27869,28419,28420,28885,29273,32476,31792,36834,37165,37875,37941,38257,38354,39011,39012,39013,39239,39240,39241,39363,39410,40109,40111,40143,40275,40305,40310,40338,40339,40340,40362,40878,41026,41038,41473,28470,37804,37234,29398,40110,39209,39210,36596');
        searchBox.doSearch('40420,41394,32783,35943,36582,40353,40555,41032,38010,38008,38007,38009,37806,41121,41579,39030,39234,28492,36124,39194,36095,40358,40258,37212,37398,38995,40296,40900,39650,27434,31601,36608,28380,28521,36519,39177,40699,34264,36358,39375,38248,34807,28908,32954,32955,32956,35498,35500,37152,37154,38733,39057,39058,39059,39483,39484,39485,39761,39762,39763,40920,40921,40922,39765,29658,31797,32283,32750,33244,39208,26694,40614,20776,25639,26695,30794,32294,33055,39034,28946,33751,33752,27056,27057,27464,27465,27868,27869,28419,28420,28885,29273,32476,31792,36834,37165,37875,37941,38257,38354,39011,39012,39013,39239,39240,39241,39363,39410,40109,40111,40143,40275,40305,40310,40338,40339,40340,40362,40878,41026,41038,41473,28470,37804,37234,29398,40110,39209,39210,36596');
        isMilSatSelected = true;
        $('#menu-about img').removeClass('bmenu-item-selected');
        $('#menu-space-stations img').addClass('bmenu-item-selected');
        break;
      }
    case 'menu-satellite-collision': // No Keyboard Shortcut
      if (isSocratesMenuOpen) {
        isSocratesMenuOpen = false;
        hideSideMenus();
        break;
      } else {
        hideSideMenus();
        $('#socrates-menu').fadeIn();
        isSocratesMenuOpen = true;
        socrates(-1);
        $('#menu-satellite-collision img').addClass('bmenu-item-selected');
        break;
      }
    case 'menu-settings': // T
      if (isSettingsMenuOpen) {
        isSettingsMenuOpen = false;
        hideSideMenus();
        break;
      } else {
        hideSideMenus();
        $('#settings-menu').fadeIn();
        isSettingsMenuOpen = true;
        $('#menu-settings img').addClass('bmenu-item-selected');
        break;
      }
    case 'menu-editSat':
      if (isEditSatMenuOpen) {
        isEditSatMenuOpen = false;
        hideSideMenus();
        break;
      } else {
        if (selectedSat !== -1) {
          hideSideMenus();
          $('#editSat-menu').fadeIn();
          $('#menu-editSat img').addClass('bmenu-item-selected');
          isEditSatMenuOpen = true;

          sat = satSet.getSat(selectedSat);
          $('#es-scc').val(sat.SCC_NUM);

          var inc = (sat.inclination * RAD2DEG).toPrecision(7);
          inc = inc.split('.');
          inc[0] = inc[0].substr(-3, 3);
          inc[1] = inc[1].substr(0, 4);
          inc = (inc[0] + '.' + inc[1]).toString();

          $('#es-inc').val(pad(inc, 8));
          $('#es-year').val(sat.TLE1.substr(18, 2));
          $('#es-day').val(sat.TLE1.substr(20, 12));
          $('#es-meanmo').val(sat.TLE2.substr(52, 11));

          var rasc = (sat.raan * RAD2DEG).toPrecision(7);
          rasc = rasc.split('.');
          rasc[0] = rasc[0].substr(-3, 3);
          rasc[1] = rasc[1].substr(0, 4);
          rasc = (rasc[0] + '.' + rasc[1]).toString();

          $('#es-rasc').val(pad(rasc, 8));
          $('#es-ecen').val(sat.eccentricity.toPrecision(7).substr(2, 7));

          var argPe = (sat.argPe * RAD2DEG).toPrecision(7);
          argPe = argPe.split('.');
          argPe[0] = argPe[0].substr(-3, 3);
          argPe[1] = argPe[1].substr(0, 4);
          argPe = (argPe[0] + '.' + argPe[1]).toString();

          $('#es-argPe').val(pad(argPe, 8));
          $('#es-meana').val(sat.TLE2.substr(44 - 1, 7 + 1));
          // $('#es-rasc').val(sat.TLE2.substr(18 - 1, 7 + 1).toString());
        } else {
          if (!$('#menu-editSat img:animated').length) {
            $('#menu-editSat img').effect('shake', {distance: 10});
          }
        }
      }
      break;
    case 'menu-newLaunch':
      if (isNewLaunchMenuOpen) {
        isNewLaunchMenuOpen = false;
        hideSideMenus();
        break;
      } else {
        // TODO: NEW LAUNCH
        if (selectedSat !== -1) {
          hideSideMenus();
          $('#newLaunch-menu').fadeIn();
          $('#menu-newLaunch img').addClass('bmenu-item-selected');
          isNewLaunchMenuOpen = true;

          sat = satSet.getSat(selectedSat);
          $('#nl-scc').val(sat.SCC_NUM);
          $('#nl-inc').val((sat.inclination * RAD2DEG).toPrecision(2));
        } else {
          if (!$('#menu-newLaunch img:animated').length) {
            $('#menu-newLaunch img').effect('shake', {distance: 10});
          }
        }
        break;
      }
    case 'menu-customSensor': // T
      if (isCustomSensorMenuOpen) {
        isCustomSensorMenuOpen = false;
        hideSideMenus();
        break;
      } else {
        hideSideMenus();

        // TODO: Requires https on chrome, but I will come back to this idea another time
        // if (navigator.geolocation) {
        //   navigator.geolocation.getCurrentPosition(function (position) {
        //     console.log('Latitude: ' + position.coords.latitude);
        //     console.log('Longitude: ' + position.coords.longitude);
        //   });
        // }

        $('#customSensor-menu').fadeIn();
        isCustomSensorMenuOpen = true;
        $('#menu-customSensor img').addClass('bmenu-item-selected');
        break;
      }
    case 'menu-missile':
      if (isMissileMenuOpen) {
        isMissileMenuOpen = false;
        hideSideMenus();
        break;
      } else {
        // TODO: NEW LAUNCH
        hideSideMenus();
        $('#missile-menu').fadeIn();
        $('#menu-missile img').addClass('bmenu-item-selected');
        isMissileMenuOpen = true;
        break;
      }
  }
}

function pad (num, size) {
  var s = '   ' + num;
  return s.substr(s.length - size);
}

function updateUrl () { // URL Updater
  var arr = window.location.href.split('?');
  var url = arr[0];
  var paramSlices = [];

  if (selectedSat !== -1 && satSet.getSat(selectedSat).intlDes !== 'none') {
    paramSlices.push('intldes=' + satSet.getSat(selectedSat).intlDes);
  }

  var currentSearch = searchBox.getCurrentSearch();
  if (currentSearch != null) {
    paramSlices.push('search=' + currentSearch);
  }
  if (propRate < 0.99 || propRate > 1.01) {
    paramSlices.push('rate=' + propRate);
  }

  if (propOffset < -1000 || propOffset > 1000) {
    paramSlices.push('hrs=' + (propOffset / 1000.0 / 3600.0).toString());
  }

  if (paramSlices.length > 0) {
    url += '?' + paramSlices.join('&');
  }

  window.history.replaceState(null, 'Keeptrack', url);
}

function selectSat (satId) {
  selectedSat = satId;
  if (satId === -1) {
    $('#sat-infobox').fadeOut();
    if ($('#search-results').css('display') === 'block') {
      if ($(document).width() <= 1000) {
        $('#search-results').attr('style', 'display:block;height:110px;margin-bottom:-50px;width:100%;bottom:auto;margin-top:50px;');
        $('#controls-up-wrapper').css('top', '180px');
      } else {
        $('#search-results').attr('style', 'display:block;max-height:100%;margin-bottom:-50px;');
      }
    } else {
      if ($(document).width() <= 1000) {
        $('#search-results').attr('style', 'height:110px;margin-bottom:-50px;width:100%;bottom:auto;margin-top:50px;');
        $('#controls-up-wrapper').css('top', '80px');
      } else {
        $('#search-results').attr('style', 'max-height:100%;margin-bottom:-50px;');
      }
    }
    $('#iss-stream').html('');
    $('#iss-stream-menu').fadeOut();
    orbitDisplay.clearSelectOrbit();
    // Remove Red Box
    $('#menu-lookanglesmultisite img').removeClass('bmenu-item-selected');
    $('#menu-lookangles img').removeClass('bmenu-item-selected');
    $('#menu-editSat img').removeClass('bmenu-item-selected');
    $('#menu-map img').removeClass('bmenu-item-selected');
    $('#menu-newLaunch img').removeClass('bmenu-item-selected');
    // Add Grey Out
    $('#menu-lookanglesmultisite img').addClass('bmenu-item-disabled');
    $('#menu-lookangles img').addClass('bmenu-item-disabled');
    $('#menu-editSat img').addClass('bmenu-item-disabled');
    $('#menu-map img').addClass('bmenu-item-disabled');
    $('#menu-newLaunch img').addClass('bmenu-item-disabled');
    // Remove Side Menus
    $('#lookanglesmultisite-menu').fadeOut();
    $('#lookangles-menu').fadeOut();
    $('#editSat-menu').fadeOut();
    $('#map-menu').fadeOut();
    $('#newLaunch-menu').fadeOut();
    $('#customSensor-menu').fadeOut();
    // Toggle the side menus as closed
    isEditSatMenuOpen = false;
    isLookanglesMenuOpen = false;
    isMapMenuOpen = false;
    isLookanglesMultiSiteMenuOpen = false;
    isNewLaunchMenuOpen = false;
    isMissileMenuOpen = false;
    isCustomSensorMenuOpen = false;
  } else {
    var sat = satSet.getSat(satId);
    console.log(sat);
    if (!sat) return;
    if (sat.static) {
      sensorManager.setSensor(null, sat.staticNum); // Pass staticNum to identify which sensor the user clicked
      sensorManager.curSensorPositon = [sat.position.x, sat.position.y, sat.position.z];
      selectedSat = -1;
      return;
    }
    camZoomSnappedOnSat = true;
    camAngleSnappedOnSat = true;

    // satSet.selectSat(satId);
    orbitDisplay.setSelectOrbit(satId);
    if (sat.missile) return;

    if (lookangles.sensorSelected()) {
      $('#menu-lookangles img').removeClass('bmenu-item-disabled');
    }

    $('#menu-lookanglesmultisite img').removeClass('bmenu-item-disabled');
    $('#menu-editSat img').removeClass('bmenu-item-disabled');
    $('#menu-map img').removeClass('bmenu-item-disabled');
    $('#menu-newLaunch img').removeClass('bmenu-item-disabled');

    if ($('#search-results').css('display') === 'block') {
      if ($(document).width() <= 1000) {
        $('#search-results').attr('style', 'display:block; height:110px; width: 100%;bottom:auto;margin-top:50px;');
        $('#controls-up-wrapper').css('top', '180px');
      } else {
        $('#search-results').attr('style', 'display:block; max-height:27%');
        $('#legend-hover-menu').hide();
      }
    } else {
      if ($(document).width() <= 1000) {
        $('#search-results').attr('style', 'height:110px; width: 100%;bottom:auto;margin-top:50px;');
        $('#controls-up-wrapper').css('top', '80px');
      } else {
        $('#search-results').attr('style', 'max-height:27%');
        $('#legend-hover-menu').hide();
      }
    }
    $('#sat-infobox').fadeIn();
    $('#sat-info-title').html(sat.ON);

    if (sat.URL) {
      $('#sat-info-title').html("<a class='iframe' href='" + sat.URL + "'>" + sat.ON + '</a>');
    }

    $('#sat-intl-des').html(sat.intlDes);
    if (sat.OT === 'unknown') {
      $('#sat-objnum').html(1 + sat.TLE2.substr(2, 7).toString());
    } else {
      //      $('#sat-objnum').html(sat.TLE2.substr(2,7));
      $('#sat-objnum').html(sat.SCC_NUM);
      ga('send', 'event', 'Satellite', 'SCC: ' + sat.SCC_NUM, 'SCC Number');
    }

    var objtype;
    if (sat.OT === 0) { objtype = 'TBA'; }
    if (sat.OT === 1) { objtype = 'Payload'; }
    if (sat.OT === 2) { objtype = 'Rocket Body'; }
    if (sat.OT === 3) { objtype = 'Debris'; }
    $('#sat-type').html(objtype);

    // /////////////////////////////////////////////////////////////////////////
    // Country Correlation Table
    // /////////////////////////////////////////////////////////////////////////
    var country;
    country = tleManager.extractCountry(sat.C);
    $('#sat-country').html(country);

    // /////////////////////////////////////////////////////////////////////////
    // Launch Site Correlation Table
    // /////////////////////////////////////////////////////////////////////////
    var site = [];
    site = tleManager.extractLaunchSite(sat.LS);

    $('#sat-site').html(site.site);
    $('#sat-sitec').html(site.sitec);

    ga('send', 'event', 'Satellite', 'Country: ' + country, 'Country');
    ga('send', 'event', 'Satellite', 'Site: ' + site, 'Site');

    // /////////////////////////////////////////////////////////////////////////
    // RCS Correlation Table
    // /////////////////////////////////////////////////////////////////////////
    if (sat.R === null) {
      $('#sat-rcs').html('Unknown');
    } else {
      var rcs;
      if (sat.R < 0.1) { rcs = 'Small'; }
      if (sat.R >= 0.1) { rcs = 'Medium'; }
      if (sat.R > 1) { rcs = 'Large'; }
      $('#sat-rcs').html(rcs);
      $('#sat-rcs').tooltip({delay: 50, tooltip: sat.R, position: 'left'});
    }

    // /////////////////////////////////////////////////////////////////////////
    // Launch Vehicle Correlation Table
    // /////////////////////////////////////////////////////////////////////////
    $('#sat-vehicle').html(sat.LV);
    if (sat.LV === 'U') { $('#sat-vehicle').html('Unknown'); }
    tleManager.extractLiftVehicle(sat.LV);

    $('a.iframe').colorbox({iframe: true, width: '80%', height: '80%', fastIframe: false, closeButton: false});
    $('#sat-apogee').html(sat.apogee.toFixed(0) + ' km');
    $('#sat-perigee').html(sat.perigee.toFixed(0) + ' km');
    $('#sat-inclination').html((sat.inclination * RAD2DEG).toFixed(2) + '°');
    $('#sat-eccentricity').html((sat.eccentricity).toFixed(3));

    $('#sat-period').html(sat.period.toFixed(2) + ' min');
    $('#sat-period').tooltip({delay: 50, tooltip: 'Mean Motion: ' + MINUTES_PER_DAY / sat.period.toFixed(2), position: 'left'});

    var now = new Date();
    var jday = getDOY(now);
    now = now.getFullYear();
    now = now.toString().substr(2, 2);
    var daysold;
    if (satSet.getSat(satId).TLE1.substr(18, 2) === now) {
      daysold = jday - satSet.getSat(satId).TLE1.substr(20, 3);
    } else {
      daysold = jday - satSet.getSat(satId).TLE1.substr(20, 3) + (satSet.getSat(satId).TLE1.substr(17, 2) * 365);
    }
    $('#sat-elset-age').html(daysold + ' Days');
    $('#sat-elset-age').tooltip({delay: 50, tooltip: 'Epoch Year: ' + sat.TLE1.substr(18, 2).toString() + ' Day: ' + sat.TLE1.substr(20, 8).toString(), position: 'left'});

    now = new Date();
    var sunTime = SunCalc.getTimes(Date.now(), lookangles.obslat, lookangles.obslong);
    if (sunTime.dawn.getTime() - now > 0 || sunTime.dusk.getTime() - now < 0) {
      $('#sat-sun').html('No Sun');
    } else if (!lookangles.sensorSelected()) {
      $('#sat-sun').html('Unknown');
    } else {
      $('#sat-sun').html('Sun Exclusion');
    }

    if (lookangles.sensorSelected()) {
      lookangles.getlookangles(sat, isLookanglesMenuOpen);
    }
  }

  if (satId !== -1) {
    updateMap();
    if (sat.SCC_NUM === '25544') { // ISS is Selected
      $('#iss-stream-menu').fadeIn();
      $('#iss-stream').html('<iframe src="http://www.ustream.tv/embed/17074538?html5ui=1" allowfullscreen="true" webkitallowfullscreen="true" scrolling="no" frameborder="0" style="border: 0px none transparent;"></iframe><iframe src="http://www.ustream.tv/embed/9408562?html5ui=1" allowfullscreen="true" webkitallowfullscreen="true" scrolling="no" frameborder="0" style="border: 0px none transparent;"></iframe><br />' +
                            '<iframe src="http://www.ustream.tv/embed/6540154?html5ui=1" allowfullscreen="true" webkitallowfullscreen="true" scrolling="no" frameborder="0" style="border: 0px none transparent;"></iframe><iframe src="http://cdn.livestream.com/embed/spaceflightnow?layout=4&amp;height=340&amp;width=560&amp;autoplay=false" style="border:0;outline:0" frameborder="0" scrolling="no"></iframe>');
    } else {
      $('#iss-stream').html('');
      $('#iss-stream-menu').fadeOut();
    }
  }

  updateUrl();
}

function browserUnsupported () {
  $('#canvas-holder').hide();
  $('#no-webgl').css('display', 'block');
}

function webGlInit () {
  var can = $('#canvas')[0];

  can.width = window.innerWidth;
  can.height = window.innerHeight;

  var gl = can.getContext('webgl', {alpha: false}) || can.getContext('experimental-webgl', {alpha: false});
  if (!gl) {
    browserUnsupported();
  }

  gl.viewport(0, 0, can.width, can.height);

  gl.enable(gl.DEPTH_TEST);

  // gl.enable(0x8642);
  /* enable point sprites(?!) This might get browsers with
     underlying OpenGL to behave
     although it's not technically a part of the WebGL standard
  */

  var pFragShader = gl.createShader(gl.FRAGMENT_SHADER);
  var pFragCode = shaderLoader.getShaderCode('pick-fragment.glsl');
  gl.shaderSource(pFragShader, pFragCode);
  gl.compileShader(pFragShader);

  var pVertShader = gl.createShader(gl.VERTEX_SHADER);
  var pVertCode = shaderLoader.getShaderCode('pick-vertex.glsl');
  gl.shaderSource(pVertShader, pVertCode);
  gl.compileShader(pVertShader);

  var pickShaderProgram = gl.createProgram();
  gl.attachShader(pickShaderProgram, pVertShader);
  gl.attachShader(pickShaderProgram, pFragShader);
  gl.linkProgram(pickShaderProgram);

  pickShaderProgram.aPos = gl.getAttribLocation(pickShaderProgram, 'aPos');
  pickShaderProgram.aColor = gl.getAttribLocation(pickShaderProgram, 'aColor');
  pickShaderProgram.aPickable = gl.getAttribLocation(pickShaderProgram, 'aPickable');
  pickShaderProgram.uCamMatrix = gl.getUniformLocation(pickShaderProgram, 'uCamMatrix');
  pickShaderProgram.uMvMatrix = gl.getUniformLocation(pickShaderProgram, 'uMvMatrix');
  pickShaderProgram.uPMatrix = gl.getUniformLocation(pickShaderProgram, 'uPMatrix');

  gl.pickShaderProgram = pickShaderProgram;

  pickFb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, pickFb);

  pickTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, pickTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // makes clearing work
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  var rb = gl.createRenderbuffer(); // create RB to store the depth buffer
  gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, gl.drawingBufferWidth, gl.drawingBufferHeight);

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pickTex, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);

  gl.pickFb = pickFb;

  pickColorBuf = new Uint8Array(4);

  pMatrix = mat4.create();
  mat4.perspective(pMatrix, 1.01, gl.drawingBufferWidth / gl.drawingBufferHeight, 20.0, 600000.0);
  var eciToOpenGlMat = [
    1, 0, 0, 0,
    0, 0, -1, 0,
    0, 1, 0, 0,
    0, 0, 0, 1
  ];
  mat4.mul(pMatrix, pMatrix, eciToOpenGlMat); // pMat = pMat * ecioglMat

  window.gl = gl;
}

var glScreenX;
var glScreenY;
var screenVec;
var comboPMat;
var invMat;
var worldVec;

function unProject (mx, my) {
  glScreenX = (mx / gl.drawingBufferWidth * 2) - 1.0;
  glScreenY = 1.0 - (my / gl.drawingBufferHeight * 2);
  screenVec = [glScreenX, glScreenY, -0.01, 1.0]; // gl screen coords

  comboPMat = mat4.create();
  mat4.mul(comboPMat, pMatrix, camMatrix);
  invMat = mat4.create();
  mat4.invert(invMat, comboPMat);
  worldVec = vec4.create();
  vec4.transformMat4(worldVec, screenVec, invMat);

  return [worldVec[0] / worldVec[3], worldVec[1] / worldVec[3], worldVec[2] / worldVec[3]];
}

function getEarthScreenPoint (x, y) {
  rayOrigin = getCamPos();
  ptThru = unProject(x, y);

  rayDir = vec3.create();
  vec3.subtract(rayDir, ptThru, rayOrigin); // rayDir = ptThru - rayOrigin
  vec3.normalize(rayDir, rayDir);

  toCenterVec = vec3.create();
  vec3.scale(toCenterVec, rayOrigin, -1); // toCenter is just -camera pos because center is at [0,0,0]
  dParallel = vec3.dot(rayDir, toCenterVec);

  longDir = vec3.create();
  vec3.scale(longDir, rayDir, dParallel); // longDir = rayDir * distParallel
  vec3.add(ptThru, rayOrigin, longDir); // ptThru is now on the plane going through the center of sphere
  dPerp = vec3.len(ptThru);

  dSubSurf = Math.sqrt(RADIUS_OF_EARTH * RADIUS_OF_EARTH - dPerp * dPerp);
  dSurf = dParallel - dSubSurf;

  ptSurf = vec3.create();
  vec3.scale(ptSurf, rayDir, dSurf);
  vec3.add(ptSurf, ptSurf, rayOrigin);

  return ptSurf;
}
function getSatIdFromCoord (x, y) {
 // var start = performance.now();

  gl.bindFramebuffer(gl.FRAMEBUFFER, gl.pickFb);
  gl.readPixels(x, gl.drawingBufferHeight - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pickColorBuf);

  // var pickR = pickColorBuf[0];
  // var pickG = pickColorBuf[1];
  // var pickB = pickColorBuf[2];

  return ((pickColorBuf[2] << 16) | (pickColorBuf[1] << 8) | (pickColorBuf[0])) - 1;
}
function getCamDist () {
  return Math.pow(zoomLevel, ZOOM_EXP) * (DIST_MAX - DIST_MIN) + DIST_MIN;
}

/** TODO: Use this to calculate a launch sites X, Y, Z */

var gCPr;
var gCPz;
var gCPrYaw;
var gCPx;
var gCPy;

function getCamPos () {
  gCPr = getCamDist();
  gCPz = gCPr * Math.sin(camPitch);
  gCPrYaw = gCPr * Math.cos(camPitch);
  gCPx = gCPrYaw * Math.sin(camYaw);
  gCPy = gCPrYaw * -Math.cos(camYaw);
  return [gCPx, gCPy, gCPz];
}

// Camera Functions
function camSnapToSat (satId) {
  /* this function runs every frame that a satellite is selected.
  However, the user might have broken out of the zoom snap or angle snap.
  If so, don't change those targets. */

  var sat = satSet.getSat(satId);

  if (camAngleSnappedOnSat) {
    var pos = sat.position;
    var r = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
    var yaw = Math.atan2(pos.y, pos.x) + TAU / 4;
    var pitch = Math.atan2(pos.z, r);
    if (!pitch) {
      console.warn('Pitch Calculation Error');
      pitch = 0;
      camZoomSnappedOnSat = false;
      camAngleSnappedOnSat = false;
    }
    if (!yaw) {
      console.warn('Yaw Calculation Error');
      yaw = 0;
      camZoomSnappedOnSat = false;
      camAngleSnappedOnSat = false;
    }
    camSnap(pitch, yaw);
  }

  if (camZoomSnappedOnSat) {
    var altitude;
    if (!sat.missile && !sat.static && sat.active) { // if this is a satellite not a missile
      lookangles.getTEARR(sat);       // do lookangles on the satellite
      altitude = lookangles.currentTEARR.altitude; // and set the altitude
    } if (sat.missile) {
      altitude = sat.maxAlt + 1000;             // if it is a missile use its altitude
      orbitDisplay.setSelectOrbit(satId);
    }
    if (altitude) {
      var camDistTarget = altitude + RADIUS_OF_EARTH + 2000;
    } else {
      camDistTarget = RADIUS_OF_EARTH + 2000;  // Stay out of the center of the earth. You will get stuck there.
      console.warn('Zoom Calculation Error');
      camZoomSnappedOnSat = false;
      camAngleSnappedOnSat = false;
    }
    zoomTarget = Math.pow((camDistTarget - DIST_MIN) / (DIST_MAX - DIST_MIN), 1 / ZOOM_EXP);
  }
}
function camSnap (pitch, yaw) {
  camPitchTarget = pitch;
  camYawTarget = normalizeAngle(yaw);
  camSnapMode = true;
}
function normalizeAngle (angle) {
  angle %= TAU;
  if (angle > Math.PI) angle -= TAU;
  if (angle < -Math.PI) angle += TAU;
  return angle;
}
function longToYaw (long) {
  var selectedDate = $('#datetime-text').text().substr(0, 19);
  var today = new Date();
  var angle = 0;

  selectedDate = selectedDate.split(' ');
  selectedDate = new Date(selectedDate[0] + 'T' + selectedDate[1] + 'Z');
  // TODO: Find a formula using the date variable for this.
  today.setUTCHours(selectedDate.getUTCHours() + ((selectedDate.getUTCMonth() + 1) * 2) - 12);  // Offset has to account for time of year. Add 2 Hours per month into the year starting at -12.

  today.setUTCMinutes(selectedDate.getUTCMinutes());
  today.setUTCSeconds(selectedDate.getUTCSeconds());
  selectedDate.setUTCHours(0);
  selectedDate.setUTCMinutes(0);
  selectedDate.setUTCSeconds(0);
  var longOffset = (((today - selectedDate) / 60 / 60 / 1000)); // In Hours
  longOffset = longOffset * 15; // 15 Degress Per Hour longitude Offset

  angle = (long + longOffset) * DEG2RAD;
  angle = normalizeAngle(angle);
  return angle;
}
function latToPitch (lat) {
  var pitch = lat * DEG2RAD;
  if (pitch > TAU / 4) pitch = TAU / 4;     // Max 90 Degrees
  if (pitch < -TAU / 4) pitch = -TAU / 4;   // Min -90 Degrees
  return pitch;
}
function changeZoom (zoom) {
  if (zoom === 'geo') {
    zoomTarget = 0.82;
    return;
  }
  if (zoom === 'leo') {
    zoomTarget = 0.45;
    return;
  }
  zoomTarget = zoom;
}

function drawLoop () {
  requestAnimationFrame(drawLoop);
  drawNow = Date.now();
  dt = drawNow - (time || drawNow);
  time = drawNow;

  dragTarget = getEarthScreenPoint(mouseX, mouseY);
  if (isDragging) {
    if (isNaN(dragTarget[0]) || isNaN(dragTarget[1]) || isNaN(dragTarget[2]) ||
    isNaN(dragPoint[0]) || isNaN(dragPoint[1]) || isNaN(dragPoint[2]) || CAMERA_TYPE === 2) { // random screen drag
      xDif = screenDragPoint[0] - mouseX;
      yDif = screenDragPoint[1] - mouseY;
      yawTarget = dragStartYaw + xDif * 0.005;
      pitchTarget = dragStartPitch + yDif * -0.005;
      camPitchSpeed = normalizeAngle(camPitch - pitchTarget) * -0.005;
      camYawSpeed = normalizeAngle(camYaw - yawTarget) * -0.005;
    } else {  // earth surface point drag
      dragPointR = Math.sqrt(dragPoint[0] * dragPoint[0] + dragPoint[1] * dragPoint[1]);
      dragTargetR = Math.sqrt(dragTarget[0] * dragTarget[0] + dragTarget[1] * dragTarget[1]);

      dragPointLon = Math.atan2(dragPoint[1], dragPoint[0]);
      dragTargetLon = Math.atan2(dragTarget[1], dragTarget[0]);

      dragPointLat = Math.atan2(dragPoint[2], dragPointR);
      dragTargetLat = Math.atan2(dragTarget[2], dragTargetR);

      pitchDif = dragPointLat - dragTargetLat;
      yawDif = normalizeAngle(dragPointLon - dragTargetLon);
      camPitchSpeed = pitchDif * 0.005;
      camYawSpeed = yawDif * 0.005;
    }
    camSnapMode = false;
  } else {
    camPitchSpeed -= (camPitchSpeed * dt * 0.005); // decay speeds when globe is "thrown"
    camYawSpeed -= (camYawSpeed * dt * 0.005);
  }

  camPitch += camPitchSpeed * dt;
  camYaw += camYawSpeed * dt;

  FPSPitch -= 20 * camPitchSpeed * dt;
  FPSYaw -= 20 * camYawSpeed * dt;

  if (rotateTheEarth) {
    camYaw -= rotateTheEarthSpeed * dt;
  }

  if (camSnapMode) {
    camPitch += (camPitchTarget - camPitch) * 0.003 * dt;

    var yawErr = normalizeAngle(camYawTarget - camYaw);
    camYaw += yawErr * 0.003 * dt;

  /*   if(Math.abs(camPitchTarget - camPitch) < 0.002 && Math.abs(camYawTarget - camYaw) < 0.002 && Math.abs(zoomTarget - zoomLevel) < 0.002) {
      camSnapMode = false; Stay in camSnapMode forever. Is this a good idea? dunno....
    } */
    zoomLevel = zoomLevel + (zoomTarget - zoomLevel) * dt * 0.0025;
  } else {
    zoomLevel = zoomLevel + (zoomTarget - zoomLevel) * dt * 0.0075;
    if (zoomLevel >= zoomTarget - 0.001 && zoomLevel <= zoomTarget + 0.001) {
      zoomLevel = zoomTarget;
      // isZoomChanging = false;
    }
  }

  if (camPitch > TAU / 4) camPitch = TAU / 4;
  if (camPitch < -TAU / 4) camPitch = -TAU / 4;
  // camYaw = (camYaw % (Math.PI*2));
  camYaw = normalizeAngle(camYaw);
  if (selectedSat !== -1) {
    var sat = satSet.getSat(selectedSat);
    if (!sat.static) {
      camSnapToSat(selectedSat);
    }
    // var satposition = [sat.position.x, sat.position.y, sat.position.z];
    // debugLine.set(satposition, [0, 0, 0]);
  }

  // TODO: drawScene creates a new unattached NODE each iteration
  drawScene();
  updateHover();
  updateSelectBox();

  // drawLines();
  // var bubble = new FOVBubble();
  // bubble.set();
  // bubble.draw();
}

// function drawLines () {
//   var satData = satSet.getSatData();
//   var propTime = new Date();
//   var realElapsedMsec = Number(propTime) - Number(propRealTime);
//   var scaledMsec = realElapsedMsec * propRate;
//   if (propRate === 0) {
//     propTime.setTime(Number(propFrozen) + propOffset);
//   } else {
//     propTime.setTime(Number(propRealTime) + propOffset + scaledMsec);
//   }
//   if (satData && lookangles.sensorSelected()) {
//     if (propTime - lastRadarTrackTime > staticSet[lookangles.staticNum].changeObjectInterval) {
//       lastRadarTrackTime = 0;
//       curRadarTrackNum++;
//     }
//     if (curRadarTrackNum < satData.length) {
//       if (satData[curRadarTrackNum]) {
//         if (satData[curRadarTrackNum].inview) {
//           var debugLine = new Line();
//           var sat = satData[curRadarTrackNum];
//           var satposition = [sat.position.x, sat.position.y, sat.position.z];
//           debugLine.set(satposition, sensorManager.curSensorPositon);
//           debugLine.draw();
//           if (lastRadarTrackTime === 0) { lastRadarTrackTime = propTime; }
//           return;
//         } else { curRadarTrackNum++; }
//       } else { curRadarTrackNum++; }
//     } else { curRadarTrackNum = 0; }
//   }
// }

function drawScene () {
  gl.bindFramebuffer(gl.FRAMEBUFFER, gl.pickFb);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  if (CAMERA_TYPE === 2) {
    FPSMovement();
  }
  camMatrix = drawCamera();

  gl.useProgram(gl.pickShaderProgram);
  gl.uniformMatrix4fv(gl.pickShaderProgram.uPMatrix, false, pMatrix);
  gl.uniformMatrix4fv(gl.pickShaderProgram.camMatrix, false, camMatrix);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // if (debugLine) debugLine.draw();
  earth.draw(pMatrix, camMatrix);
  satSet.draw(pMatrix, camMatrix);
  orbitDisplay.draw(pMatrix, camMatrix);

  /* DEBUG - show the pickbuffer on a canvas */
 // debugImageData.data = pickColorMap;
 /* debugImageData.data.set(pickColorMap);
  debugContext.putImageData(debugImageData, 0, 0); */
}

var FPStimeNow;
var FPSelapsed;

function FPSMovement () {
  FPStimeNow = Date.now();
  if (FPSLastTime !== 0) {
    FPSelapsed = FPStimeNow - FPSLastTime;
    if (FPSForwardSpeed !== 0) {
      FPSxPos -= Math.sin(degToRad(FPSYaw)) * FPSForwardSpeed * FPSRun * FPSelapsed;
      FPSyPos -= Math.cos(degToRad(FPSYaw)) * FPSForwardSpeed * FPSRun * FPSelapsed;
      FPSzPos += Math.sin(degToRad(FPSPitch)) * FPSForwardSpeed * FPSRun * FPSelapsed;
    }
    if (FPSSideSpeed !== 0) {
      FPSxPos -= Math.cos(-degToRad(FPSYaw)) * FPSSideSpeed * FPSRun * FPSelapsed;
      FPSyPos -= Math.sin(-degToRad(FPSYaw)) * FPSSideSpeed * FPSRun * FPSelapsed;
    }
    FPSYaw += FPSYawRate * FPSelapsed;
    FPSPitch += FPSPitchRate * FPSelapsed;
  }
  FPSLastTime = FPStimeNow;
}

function drawCamera () {
  camMatrix = mat4.create();
  mat4.identity(camMatrix);

  /**
  * For FPS style movement rotate the camera and then translate it
  * for traditional view, move the camera and then rotate it
  */

  switch (CAMERA_TYPE) {
    /** @type 0 pivot around the earth with earth in the center */
    case 0:
      mat4.translate(camMatrix, camMatrix, [0, getCamDist(), 0]);
      mat4.rotateX(camMatrix, camMatrix, camPitch);
      mat4.rotateZ(camMatrix, camMatrix, -camYaw);
      break;
      /** @type 1 pivot around the earth with earth offset to the bottom right */
    case 1:
      mat4.translate(camMatrix, camMatrix, [15000, getCamDist(), -6000]);
      mat4.rotateX(camMatrix, camMatrix, camPitch);
      mat4.rotateZ(camMatrix, camMatrix, -camYaw);
      break;
    /** @type 2 FPS style movement */
    case 2:
      mat4.rotate(camMatrix, camMatrix, degToRad(-FPSPitch), [1, 0, 0]);
      mat4.rotate(camMatrix, camMatrix, degToRad(FPSYaw), [0, 0, 1]);
      mat4.translate(camMatrix, camMatrix, [FPSxPos, FPSyPos, -FPSzPos]);
      break;
  }
  return camMatrix;
}

function degToRad (degrees) {
  return degrees * Math.PI / 180;
}

function updateMap () {
  if (selectedSat === -1) return;
  if (!isMapMenuOpen) return;
  var satData = satSet.getSat(selectedSat);
  lookangles.getTEARR(satData);
  var map = braun({lon: satellite.degrees_long(lookangles.currentTEARR.lon), lat: satellite.degrees_lat(lookangles.currentTEARR.lat)}, {meridian: 0, latLimit: 90});
  map.x = map.x * mapWidth - 10;
  map.y = map.y / 0.6366197723675813 * mapHeight - 10;
  $('#map-sat').attr('style', 'left:' + map.x + 'px;top:' + map.y + 'px;'); // Set to size of the map image (800x600)
  if (lookangles.sensorSelected()) {
    map = braun({lon: lookangles.currentSensor.long, lat: lookangles.currentSensor.lat}, {meridian: 0, latLimit: 90});
    map.x = map.x * mapWidth - 10;
    map.y = map.y / 0.6366197723675813 * mapHeight - 10;
    $('#map-sensor').attr('style', 'left:' + map.x + 'px;top:' + map.y + 'px;z-index:11;'); // Set to size of the map image (800x600)
  }
  for (var i = 1; i <= 50; i++) {
    map = braun({lon: lookangles.map(satData, i).lon, lat: lookangles.map(satData, i).lat}, {meridian: 0, latLimit: 90});
    map.x = map.x * mapWidth - 3.5;
    map.y = map.y / 0.6366197723675813 * mapHeight - 3.5;
    if (map.y > mapHeight / 2) {
      $('#map-look' + i).tooltip({delay: 50, tooltip: lookangles.map(satData, i).time, position: 'top'});
    } else {
      $('#map-look' + i).tooltip({delay: 50, tooltip: lookangles.map(satData, i).time, position: 'bottom'});
    }
    if (lookangles.map(satData, i).inview === 1) {
      $('#map-look' + i).attr('src', 'images/yellow-square.png'); // If inview then make yellow
    } else {
      $('#map-look' + i).attr('src', 'images/red-square.png'); // If not inview then make red
    }
    $('#map-look' + i).attr('style', 'left:' + map.x + 'px;top:' + map.y + 'px;'); // Set to size of the map image (800x600)
    $('#map-look' + i).attr('time', lookangles.map(satData, i).time);
  }
}

$('#map-menu').on('click', '.map-look', function (evt) {
  mapUpdateOverride = true;
  var time = $(this)['context']['attributes']['time']['value']; // TODO: Find correct code for this.
  if (time !== null) {
    time = time.split(' ');
    time = new Date(time[0] + 'T' + time[1] + 'Z');
    var today = new Date(); // Need to know today for offset calculation
    propOffset = time - today; // Find the offset from today
    satCruncher.postMessage({ // Tell satCruncher we have changed times for orbit calculations
      typ: 'offset',
      dat: (propOffset).toString() + ' ' + (1.0).toString()
    });
  }
});

var satData;

function updateSelectBox () {
  if (selectedSat === -1) return;
  now = drawNow;
  satData = satSet.getSat(selectedSat);
  if (satData.static || satData.missile) return;

  // TODO: Include updates when satellite edited regardless of time.

  if (now > lastBoxUpdateTime + 1000) {
    lookangles.getTEARR(satData);
    if (satellite.degrees_long(lookangles.currentTEARR.lon) >= 0) {
      $('#sat-longitude').html(satellite.degrees_long(lookangles.currentTEARR.lon).toFixed(3) + '°E');
    } else {
      $('#sat-longitude').html((satellite.degrees_long(lookangles.currentTEARR.lon) * -1).toFixed(3) + '°W');
    }
    if (satellite.degrees_lat(lookangles.currentTEARR.lat) >= 0) {
      $('#sat-latitude').html(satellite.degrees_lat(lookangles.currentTEARR.lat).toFixed(3) + '°N');
    } else {
      $('#sat-latitude').html((satellite.degrees_lat(lookangles.currentTEARR.lat) * -1).toFixed(3) + '°S');
    }

    if (isMapMenuOpen && now > lastMapUpdateTime + 30000) {
      updateMap();
      lastMapUpdateTime = now;
    }

    $('#sat-altitude').html(lookangles.currentTEARR.altitude.toFixed(2) + ' km');
    $('#sat-velocity').html(satData.velocity.toFixed(2) + ' km/s');
    if (lookangles.currentTEARR.inview) {
      $('#sat-azimuth').html(lookangles.currentTEARR.azimuth.toFixed(0) + '°'); // Convert to Degrees
      $('#sat-elevation').html(lookangles.currentTEARR.elevation.toFixed(1) + '°');
      $('#sat-range').html(lookangles.currentTEARR.range.toFixed(2) + ' km');
    } else {
      $('#sat-azimuth').html('Out of Bounds');
      $('#sat-azimuth').prop('title', 'Azimuth: ' + lookangles.currentTEARR.azimuth.toFixed(0) + '°');
      $('#sat-elevation').html('Out of Bounds');
      $('#sat-elevation').prop('title', 'Elevation: ' + lookangles.currentTEARR.elevation.toFixed(1) + '°');
      $('#sat-range').html('Out of Bounds');
      $('#sat-range').prop('title', 'Range: ' + lookangles.currentTEARR.range.toFixed(2) + ' km');
    }

    if (lookangles.sensorSelected()) {
      if (selectedSat !== lastSelectedSat) {
        $('#sat-nextpass').html(lookangles.nextpass(satData));
      }
      lastSelectedSat = selectedSat;
    } else {
      $('#sat-nextpass').html('Unavailable');
    }

    lastBoxUpdateTime = now;
  }
}
var updateHoverSatId;
var updateHoverSatPos;
function updateHover () {
  if (searchBox.isHovering()) {
    updateHoverSatId = searchBox.getHoverSat();
    updateHoverSatPos = satSet.getScreenCoords(updateHoverSatId, pMatrix, camMatrix);
    if (!earthHitTest(updateHoverSatPos.x, updateHoverSatPos.y)) {
      hoverBoxOnSat(updateHoverSatId, updateHoverSatPos.x, updateHoverSatPos.y);
    } else {
      hoverBoxOnSat(-1, 0, 0);
    }
  } else {
    if (!isMouseMoving || isDragging) { return; }
    mouseSat = getSatIdFromCoord(mouseX, mouseY);
    if (mouseSat !== -1) {
      orbitDisplay.setHoverOrbit(mouseSat);
    } else {
      orbitDisplay.clearHoverOrbit();
    }
    satSet.setHover(mouseSat);
    hoverBoxOnSat(mouseSat, mouseX, mouseY);
  }
}

function hoverBoxOnSat (satId, satX, satY) {
  if (satId === -1) {
    if (!isHoverBoxVisible) return;
    $('#sat-hoverbox').html('(none)');
    $('#sat-hoverbox').css({display: 'none'});
    $('#canvas').css({cursor: 'default'});
    isHoverBoxVisible = false;
  } else if (!isDragging) {
    try {
      var sat = satSet.getSat(satId);
      var selectedSatData = satSet.getSat(selectedSat);
      isHoverBoxVisible = true;
      if (sat.static && isShowDistance) {
        $('#sat-hoverbox').html(sat.name + '<br /><center>' + sat.type + lookangles.distance(sat, selectedSatData) + '</center>');
      } else if (sat.static) {
        if (sat.type === 'Launch Facility') {
          var launchSite = tleManager.extractLaunchSite(sat.name);
          $('#sat-hoverbox').html(launchSite.site + ', ' + launchSite.sitec + '<br /><center>' + sat.type + '</center>');
        } else {
          $('#sat-hoverbox').html(sat.name + '<br /><center>' + sat.type + '</center>');
        }
      } else if (sat.missile) {
        $('#sat-hoverbox').html(sat.ON + '<br /><center>' + sat.desc + '</center>');
      } else {
        if (lookangles.sensorSelected() && isShowNextPass && isShowDistance) {
          $('#sat-hoverbox').html(sat.ON + '<br /><center>' + sat.SCC_NUM + '<br />' + lookangles.nextpass(sat) + lookangles.distance(sat, selectedSatData) + '</center>');
        } else if (isShowDistance) {
          $('#sat-hoverbox').html(sat.ON + '<br /><center>' + sat.SCC_NUM + lookangles.distance(sat, selectedSatData) + '</center>');
        } else if (lookangles.sensorSelected() && isShowNextPass) {
          $('#sat-hoverbox').html(sat.ON + '<br /><center>' + sat.SCC_NUM + '<br />' + lookangles.nextpass(sat) + '</center>');
        } else {
          $('#sat-hoverbox').html(sat.ON + '<br /><center>' + sat.SCC_NUM + '</center>');
        }
      }
      $('#sat-hoverbox').css({
        display: 'block',
        position: 'absolute',
        left: satX + 20,
        top: satY - 10
      });
      $('#canvas').css({cursor: 'pointer'});
    } catch (e) {}
  }
}

function earthHitTest (x, y) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, gl.pickFb);
  gl.readPixels(x, gl.drawingBufferHeight - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pickColorBuf);

  return (pickColorBuf[0] === 0 &&
          pickColorBuf[1] === 0 &&
          pickColorBuf[2] === 0);
}

(function () {
  var lookangles = {};
  lookangles.currentSensor = {};
  lookangles.tempSensor = {};
  lookangles.currentTEARR = {};
  lookangles.defaultSensor = {};
  lookangles.defaultSensor.observerGd = {
    lat: null,
    longitude: 0,
    latitude: 0,
    height: 0
  };
  lookangles.currentSensor = lookangles.defaultSensor;
  lookangles.sensorListUS = [
    window.sensorManager.sensorList.COD,
    window.sensorManager.sensorList.BLE,
    window.sensorManager.sensorList.CAV,
    window.sensorManager.sensorList.CLR,
    window.sensorManager.sensorList.EGL,
    window.sensorManager.sensorList.FYL,
    window.sensorManager.sensorList.THL,
    window.sensorManager.sensorList.MIL,
    window.sensorManager.sensorList.ALT,
    window.sensorManager.sensorList.ASC,
    window.sensorManager.sensorList.CDN
  ];

  lookangles.sensorSelected = function () {
    if (lookangles.currentSensor.lat != null) {
      return true;
    } else {
      return false;
    }
  };
  lookangles.currentEpoch = function (currentDate) {
    currentDate = new Date(currentDate);
    var epochYear = currentDate.getUTCFullYear();
    epochYear = parseInt(epochYear.toString().substr(2, 2));
    var epochDay = getDOY(currentDate) + (currentDate.getUTCHours() * 3600 + currentDate.getUTCMinutes() * 60 + currentDate.getUTCSeconds()) / (1440 * 60);
    return [epochYear, epochDay];
  };
  lookangles.distance = function (hoverSat, selectedSat) {
    if (selectedSat == null || hoverSat == null) {
      return '';
    }
    var distanceApartX = Math.pow(hoverSat.position.x - selectedSat.position.x, 2);
    var distanceApartY = Math.pow(hoverSat.position.y - selectedSat.position.y, 2);
    var distanceApartZ = Math.pow(hoverSat.position.z - selectedSat.position.z, 2);
    var distanceApart = Math.sqrt(distanceApartX + distanceApartY + distanceApartZ).toFixed(0);
    return '<br />' + distanceApart + ' km';
  };
  lookangles.getsensorinfo = function () {
    $('#sensor-latitude').html(lookangles.currentSensor.lat);
    $('#sensor-longitude').html(lookangles.currentSensor.long);
    $('#sensor-minazimuth').html(lookangles.currentSensor.obsminaz);
    $('#sensor-maxazimuth').html(lookangles.currentSensor.obsmaxaz);
    $('#sensor-minelevation').html(lookangles.currentSensor.obsminel);
    $('#sensor-maxelevation').html(lookangles.currentSensor.obsmaxel);
    $('#sensor-minrange').html(lookangles.currentSensor.obsminrange);
    $('#sensor-maxrange').html(lookangles.currentSensor.obsmaxrange);
  };
  lookangles.setobs = function (sensor, reset) {
    /** obslat is what is used to determine if a site is set or not. If this is null sensorSelected() will return false */
    if (reset) {
      lookangles.currentSensor = lookangles.defaultSensor;
      return;
    }

    lookangles.currentSensor = sensor;
    lookangles.currentSensor.observerGd = {   // Array to calculate look angles in propagate()
      latitude: sensor.lat * DEG2RAD,
      longitude: sensor.long * DEG2RAD,
      height: sensor.obshei * 1               // Converts from string to number TODO: Find correct way to convert string to integer
    };
  };
  lookangles.altitudeCheck = function (TLE1, TLE2, propOffset) {
    var satrec = satellite.twoline2satrec(TLE1, TLE2);// perform and store sat init calcs
    var propTime = propTimeCheck(propOffset, propRealTime);
    var j = jday(propTime.getUTCFullYear(),
                 propTime.getUTCMonth() + 1, // NOTE:, this function requires months in range 1-12.
                 propTime.getUTCDate(),
                 propTime.getUTCHours(),
                 propTime.getUTCMinutes(),
                 propTime.getUTCSeconds()); // Converts time to jday (TLEs use epoch year/day)
    j += propTime.getUTCMilliseconds() * MILLISECONDS_PER_DAY;
    var gmst = satellite.gstime_from_jday(j);

    var m = (j - satrec.jdsatepoch) * MINUTES_PER_DAY;
    var pv = satellite.sgp4(satrec, m);
    var gpos;

    try {
      gpos = satellite.eci_to_geodetic(pv.position, gmst);
    } catch (e) {
      return 0; // Auto fail the altitude check
    }
    return gpos.height;
  };
  lookangles.getTEARR = function (sat) {
    // Set default timing settings. These will be changed to find look angles at different times in future.
    var propRealTime = Date.now();
    var propOffset = getPropOffset();               // offset letting us propagate in the future (or past)
    var satrec = satellite.twoline2satrec(sat.TLE1, sat.TLE2);// perform and store sat init calcs
    var now = propTimeCheck(propOffset, propRealTime);
    var j = jday(now.getUTCFullYear(),
                 now.getUTCMonth() + 1, // NOTE:, this function requires months in range 1-12.
                 now.getUTCDate(),
                 now.getUTCHours(),
                 now.getUTCMinutes(),
                 now.getUTCSeconds()); // Converts time to jday (TLEs use epoch year/day)
    j += now.getUTCMilliseconds() * MILLISECONDS_PER_DAY;
    var gmst = satellite.gstime_from_jday(j);

    var m = (j - satrec.jdsatepoch) * MINUTES_PER_DAY;
    var pv = satellite.sgp4(satrec, m);
    var positionEcf, lookAngles;
    var gpos;

    try {
      gpos = satellite.eci_to_geodetic(pv.position, gmst);
      lookangles.currentTEARR.altitude = gpos.height;
      lookangles.currentTEARR.lon = gpos.longitude;
      lookangles.currentTEARR.lat = gpos.latitude;
      positionEcf = satellite.eci_to_ecf(pv.position, gmst); // pv.position is called positionEci originally
      lookAngles = satellite.ecf_to_look_angles(lookangles.currentSensor.observerGd, positionEcf);
      lookangles.currentTEARR.azimuth = lookAngles.azimuth * RAD2DEG;
      lookangles.currentTEARR.elevation = lookAngles.elevation * RAD2DEG;
      lookangles.currentTEARR.range = lookAngles.range_sat;
    } catch (e) {
      lookangles.currentTEARR.altitude = 0;
      lookangles.currentTEARR.lon = 0;
      lookangles.currentTEARR.lat = 0;
      positionEcf = 0;
      lookAngles = 0;
      lookangles.currentTEARR.azimuth = 0;
      lookangles.currentTEARR.elevation = 0;
      lookangles.currentTEARR.range = 0;
    }

    if (lookangles.currentSensor.obsminaz > lookangles.currentSensor.obsmaxaz) {
      if (((lookangles.currentTEARR.azimuth >= lookangles.currentSensor.obsminaz || lookangles.currentTEARR.azimuth <= lookangles.currentSensor.obsmaxaz) &&
           (lookangles.currentTEARR.elevation >= lookangles.currentSensor.obsminel && lookangles.currentTEARR.elevation <= lookangles.currentSensor.obsmaxel) &&
           (lookangles.currentTEARR.range <= lookangles.currentSensor.obsmaxrange && lookangles.currentTEARR.range >= lookangles.currentSensor.obsminrange)) ||
           ((lookangles.currentTEARR.azimuth >= lookangles.currentSensor.obsminaz2 || lookangles.currentTEARR.azimuth <= lookangles.currentSensor.obsmaxaz2) &&
           (lookangles.currentTEARR.elevation >= lookangles.currentSensor.obsminel2 && lookangles.currentTEARR.elevation <= lookangles.currentSensor.obsmaxel2) &&
           (lookangles.currentTEARR.range <= lookangles.currentSensor.obsmaxrange2 && lookangles.currentTEARR.range >= lookangles.currentSensor.obsminrange2))) {
        lookangles.currentTEARR.inview = true;
      } else {
        lookangles.currentTEARR.inview = false;
      }
    } else {
      if (((lookangles.currentTEARR.azimuth >= lookangles.currentSensor.obsminaz && lookangles.currentTEARR.azimuth <= lookangles.currentSensor.obsmaxaz) &&
           (lookangles.currentTEARR.elevation >= lookangles.currentSensor.obsminel && lookangles.currentTEARR.elevation <= lookangles.currentSensor.obsmaxel) &&
           (lookangles.currentTEARR.range <= lookangles.currentSensor.obsmaxrange && lookangles.currentTEARR.range >= lookangles.currentSensor.obsminrange)) ||
           ((lookangles.currentTEARR.azimuth >= lookangles.currentSensor.obsminaz2 && lookangles.currentTEARR.azimuth <= lookangles.currentSensor.obsmaxaz2) &&
           (lookangles.currentTEARR.elevation >= lookangles.currentSensor.obsminel2 && lookangles.currentTEARR.elevation <= lookangles.currentSensor.obsmaxel2) &&
           (lookangles.currentTEARR.range <= lookangles.currentSensor.obsmaxrange2 && lookangles.currentTEARR.range >= lookangles.currentSensor.obsminrange2))) {
        lookangles.currentTEARR.inview = true;
      } else {
        lookangles.currentTEARR.inview = false;
      }
    }
  };
  lookangles.nextpass = function (sat) {
    var propOffset = getPropOffset();
    var propTempOffset = 0;
    var satrec = satellite.twoline2satrec(sat.TLE1, sat.TLE2);// perform and store sat init calcs
    for (var i = 0; i < (lookanglesLength * 24 * 60 * 60); i += lookanglesInterval) {         // 5second Looks
      propTempOffset = i * 1000 + propOffset;                 // Offset in seconds (msec * 1000)
      var now = propTimeCheck(propTempOffset, propRealTime);
      var j = jday(now.getUTCFullYear(),
      now.getUTCMonth() + 1, // NOTE:, this function requires months in range 1-12.
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds()); // Converts time to jday (TLEs use epoch year/day)
      j += now.getUTCMilliseconds() * MILLISECONDS_PER_DAY;
      var gmst = satellite.gstime_from_jday(j);

      var m = (j - satrec.jdsatepoch) * MINUTES_PER_DAY;
      var pv = satellite.sgp4(satrec, m);
      var positionEcf, lookAngles, azimuth, elevation, range;

      positionEcf = satellite.eci_to_ecf(pv.position, gmst); // pv.position is called positionEci originally
      lookAngles = satellite.ecf_to_look_angles(lookangles.currentSensor.observerGd, positionEcf);
      azimuth = lookAngles.azimuth * RAD2DEG;
      elevation = lookAngles.elevation * RAD2DEG;
      range = lookAngles.range_sat;

      if (lookangles.currentSensor.obsminaz > lookangles.currentSensor.obsmaxaz) {
        if (((azimuth >= lookangles.currentSensor.obsminaz || azimuth <= lookangles.currentSensor.obsmaxaz) && (elevation >= lookangles.currentSensor.obsminel && elevation <= lookangles.currentSensor.obsmaxel) && (range <= lookangles.currentSensor.obsmaxrange && range >= lookangles.currentSensor.obsminrange)) ||
           ((azimuth >= lookangles.currentSensor.obsminaz2 || azimuth <= lookangles.currentSensor.obsmaxaz2) && (elevation >= lookangles.currentSensor.obsminel2 && elevation <= lookangles.currentSensor.obsmaxel2) && (range <= lookangles.currentSensor.obsmaxrange2 && range >= lookangles.currentSensor.obsminrange2))) {
          return dateFormat(now, 'isoDateTime', true);
        }
      } else {
        if (((azimuth >= lookangles.currentSensor.obsminaz && azimuth <= lookangles.currentSensor.obsmaxaz) && (elevation >= lookangles.currentSensor.obsminel && elevation <= lookangles.currentSensor.obsmaxel) && (range <= lookangles.currentSensor.obsmaxrange && range >= lookangles.currentSensor.obsminrange)) ||
           ((azimuth >= lookangles.currentSensor.obsminaz2 && azimuth <= lookangles.currentSensor.obsmaxaz2) && (elevation >= lookangles.currentSensor.obsminel2 && elevation <= lookangles.currentSensor.obsmaxel2) && (range <= lookangles.currentSensor.obsmaxrange2 && range >= lookangles.currentSensor.obsminrange2))) {
          return dateFormat(now, 'isoDateTime', true);
        }
      }
    }
    return 'No Passes in ' + lookanglesLength + ' Days';
  };
  lookangles.getlookanglesMultiSite = function (sat, isLookanglesMultiSiteMenuOpen) {
    if (!isLookanglesMultiSiteMenuOpen) return;

    var resetWhenDone = false;
    if (!lookangles.sensorSelected()) { resetWhenDone = true; }

    // Set default timing settings. These will be changed to find look angles at different times in future.
    var propTempOffset = 0;               // offset letting us propagate in the future (or past)
    // var propRealTime = Date.now();      // Set current time

    var propOffset = getPropOffset();
    lookangles.tempSensor = lookangles.currentSensor;
    lookangles.setobs(lookangles.sensorListUS[0]);

    var satrec = satellite.twoline2satrec(sat.TLE1, sat.TLE2);// perform and store sat init calcs
    var orbitalPeriod = MINUTES_PER_DAY / (satrec.no * MINUTES_PER_DAY / TAU); // Seconds in a day divided by mean motion
    var tbl = document.getElementById('looksmultisite');           // Identify the table to update
    tbl.innerHTML = '';                                   // Clear the table from old object data
    var tblLength = 0;                                   // Iniially no rows to the table
    var lastTblLength = 0;                               // Tracks when to change sensors
    var sensor = 0;
    var howManyPasses = 6; // Complete 3 passes before switching sensors

    var tr = tbl.insertRow();
    var tdT = tr.insertCell();
    tdT.appendChild(document.createTextNode('Time'));
    tdT.setAttribute('style', 'text-decoration: underline');
    var tdE = tr.insertCell();
    tdE.appendChild(document.createTextNode('El'));
    tdE.setAttribute('style', 'text-decoration: underline');
    var tdA = tr.insertCell();
    tdA.appendChild(document.createTextNode('Az'));
    tdA.setAttribute('style', 'text-decoration: underline');
    var tdR = tr.insertCell();
    tdR.appendChild(document.createTextNode('Rng'));
    tdR.setAttribute('style', 'text-decoration: underline');
    var tdS = tr.insertCell();
    tdS.appendChild(document.createTextNode('Sensor'));
    tdS.setAttribute('style', 'text-decoration: underline');

    for (var i = 0; i < (lookanglesLength * 24 * 60 * 60); i += lookanglesInterval) {         // 5second Looks
      propTempOffset = i * 1000 + propOffset;                 // Offset in seconds (msec * 1000)
      tblLength += propagateMultiSite(propTempOffset, tbl, satrec, sensor);   // Update the table with looks for this 5 second chunk and then increase table counter by 1
      if (tblLength > lastTblLength) {                           // Maximum of 1500 lines in the look angles table
        lastTblLength++;
        if (howManyPasses === 1) { // When 3 passes have been complete - looks weird with 1 instead of 0
          sensor++;
          lookangles.setobs(lookangles.sensorListUS[sensor]);
          i = 0;
          howManyPasses = 6; // Reset to 3 passes
        } else {
          howManyPasses = howManyPasses - 1;
          i = i + (orbitalPeriod * 60 * 0.75); // Jump 3/4th to the next orbit
        }
      }
      if (sensor === lookangles.sensorListUS.length - 1) {
        (resetWhenDone) ? lookangles.currentSensor = lookangles.defaultSensor : lookangles.currentSensor = lookangles.tempSensor;
        break;
      }
      if (sensor < lookangles.sensorListUS.length - 1 && i >= (lookanglesLength * 24 * 60 * 60) - lookanglesInterval) { // Move to next sensor if this sensor doesn't have enough passes.
        sensor++;
        lookangles.setobs(lookangles.sensorListUS[sensor]);
        i = 0;
        howManyPasses = 6;
      }
    }
    (resetWhenDone) ? lookangles.currentSensor = lookangles.defaultSensor : lookangles.currentSensor = lookangles.tempSensor;
  };
  lookangles.getOrbitByLatLon = function (sat, goalLat, goalLon, upOrDown, propOffset) {
    /**
     * Function to brute force find an orbit over a sites lattiude and longitude
     * @param  object       sat             satellite object with satrec
     * @param  long         goalLat         Goal Latitude
     * @param  long         goalLon         Goal Longitude
     * @param  string       upOrDown        'Up' or 'Down'
     * @param  integer      propOffset   milliseconds between now and 0000z
     * @return Array                        [0] is TLE1 and [1] is TLE2
     * @method pad                          pads front of string with 0's for TLEs
     * @method meanaCalc                    returns 1 when latitude found 2 if error
     * @method rascCalc                     returns 1 when longitude found 2 if error and 5 if it is not close
     * @method propagate                    calculates a modified TLEs latitude and longitude
     */
    var mainTLE1;
    var mainTLE2;
    var mainMeana;
    var mainRasc;
    var lastLat;
    var isUpOrDown;
    var rascOffset = false;

    for (var i = 0; i < (520 * 10); i += 1) { /** Rotate Mean Anomaly 0.1 Degree at a Time for Up To 400 Degrees */
      var meanACalcResults = meanaCalc(i, rascOffset);
      if (meanACalcResults === 1) {
        if (isUpOrDown !== upOrDown) { // If Object is moving opposite of the goal direction (upOrDown)
          // rascOffset = true;
          i = i + 20;                 // Move 2 Degrees ahead in the orbit to prevent being close on the next lattiude check
        } else {
          break; // Stop changing the Mean Anomaly
        }
      }
      if (meanACalcResults === 5) {
        i += (10 * 10); // Change meanA faster
      }
      if (meanACalcResults === 2) { return ['Error', '']; }
    }

    for (i = 0; i < (5200 * 100); i += 1) {         // 520 degress in 0.01 increments TODO More precise?
      if (rascOffset && i === 0) {
        i = (mainRasc - 10) * 100;
      }
      var rascCalcResults = rascCalc(i);
      if (rascCalcResults === 1) {
        break;
      }
      if (rascCalcResults === 5) {
        i += (10 * 100);
      }
    }

    return [mainTLE1, mainTLE2];

    function pad (str, max) {
      return str.length < max ? pad('0' + str, max) : str;
    }

    function meanaCalc (meana, rascOffset) {
      var satrec = satellite.twoline2satrec(sat.TLE1, sat.TLE2);// perform and store sat init calcs

      meana = meana / 10;
      meana = parseFloat(meana).toPrecision(7);
      meana = pad(meana, 8);

      var rasc = (sat.raan * RAD2DEG).toPrecision(7);
      // if (rascOffset) {
      //   rasc = (rasc * 1) + 180; // Spin the orbit 180 degrees.
      //   if (rasc > 360) {
      //     rasc = (rasc * 1) - 360; // angle can't be bigger than 360
      //   }
      // }
      mainRasc = rasc;
      rasc = rasc.toString().split('.');
      rasc[0] = rasc[0].substr(-3, 3);
      rasc[1] = rasc[1].substr(0, 4);
      rasc = (rasc[0] + '.' + rasc[1]).toString();
      rasc = pad(rasc, 8);

      var scc = sat.SCC_NUM;

      var intl = sat.TLE1.substr(9, 8);
      var inc = (sat.inclination * RAD2DEG).toPrecision(7);
      inc = inc.split('.');
      inc[0] = inc[0].substr(-3, 3);
      inc[1] = inc[1].substr(0, 4);
      inc = (inc[0] + '.' + inc[1]).toString();

      inc = pad(inc, 8);
      var epochyr = sat.TLE1.substr(18, 2);
      var epochday = sat.TLE1.substr(20, 12);

      var meanmo = sat.TLE2.substr(52, 11);

      var ecen = sat.eccentricity.toPrecision(7).substr(2, 7);

      var argPe = (sat.argPe * RAD2DEG).toPrecision(7);
      argPe = argPe.split('.');
      argPe[0] = argPe[0].substr(-3, 3);
      argPe[1] = argPe[1].substr(0, 4);
      argPe = (argPe[0] + '.' + argPe[1]).toString();
      argPe = pad(argPe, 8);

      var TLE1Ending = sat.TLE1.substr(32, 39);

      var TLE1 = '1 ' + scc + 'U ' + intl + ' ' + epochyr + epochday + TLE1Ending; // M' and M'' are both set to 0 to put the object in a perfect stable orbit
      var TLE2 = '2 ' + scc + ' ' + inc + ' ' + rasc + ' ' + ecen + ' ' + argPe + ' ' + meana + ' ' + meanmo + '    10';

      satrec = satellite.twoline2satrec(TLE1, TLE2);
      var propagateResults = getOrbitByLatLonPropagate(propOffset, satrec, 1);
      if (propagateResults === 1) {
        mainTLE1 = TLE1;
        mainTLE2 = TLE2;
        mainMeana = meana;
        return 1;
      }
      return propagateResults;
    }

    function rascCalc (rasc) {
      var satrec = satellite.twoline2satrec(sat.TLE1, sat.TLE2);// perform and store sat init calcs
      var meana = mainMeana;

      rasc = rasc / 100;
      if (rasc > 360) {
        rasc = rasc - 360; // angle can't be bigger than 360
      }
      rasc = rasc.toPrecision(7);
      rasc = rasc.split('.');
      rasc[0] = rasc[0].substr(-3, 3);
      rasc[1] = rasc[1].substr(0, 4);
      rasc = (rasc[0] + '.' + rasc[1]).toString();
      rasc = pad(rasc, 8);
      mainRasc = rasc;

      var scc = sat.SCC_NUM;

      var intl = sat.TLE1.substr(9, 8);
      var inc = (sat.inclination * RAD2DEG).toPrecision(7);
      inc = inc.split('.');
      inc[0] = inc[0].substr(-3, 3);
      inc[1] = inc[1].substr(0, 4);
      inc = (inc[0] + '.' + inc[1]).toString();

      inc = pad(inc, 8);
      var epochyr = sat.TLE1.substr(18, 2);
      var epochday = sat.TLE1.substr(20, 12);

      var meanmo = sat.TLE2.substr(52, 11);

      var ecen = sat.eccentricity.toPrecision(7).substr(2, 7);

      var argPe = (sat.argPe * RAD2DEG).toPrecision(7);
      argPe = argPe.split('.');
      argPe[0] = argPe[0].substr(-3, 3);
      argPe[1] = argPe[1].substr(0, 4);
      argPe = (argPe[0] + '.' + argPe[1]).toString();
      argPe = pad(argPe, 8);

      var TLE1Ending = sat.TLE1.substr(32, 39);

      mainTLE1 = '1 ' + scc + 'U ' + intl + ' ' + epochyr + epochday + TLE1Ending; // M' and M'' are both set to 0 to put the object in a perfect stable orbit
      mainTLE2 = '2 ' + scc + ' ' + inc + ' ' + rasc + ' ' + ecen + ' ' + argPe + ' ' + meana + ' ' + meanmo + '    10';

      satrec = satellite.twoline2satrec(mainTLE1, mainTLE2);

      var propNewRasc = getOrbitByLatLonPropagate(propOffset, satrec, 2);
      // 1 === If RASC within 0.15 degrees then good enough
      // 5 === If RASC outside 15 degrees then rotate RASC faster
      return propNewRasc;
    }

    function getOrbitByLatLonPropagate (propOffset, satrec, type) {
      propRealTime = Date.now();
      var now = propTimeCheck(propOffset, propRealTime);
      var j = jday(now.getUTCFullYear(),
                   now.getUTCMonth() + 1, // NOTE:, this function requires months in range 1-12.
                   now.getUTCDate(),
                   now.getUTCHours(),
                   now.getUTCMinutes(),
                   now.getUTCSeconds()); // Converts time to jday (TLEs use epoch year/day)
      j += now.getUTCMilliseconds() * MILLISECONDS_PER_DAY;
      var gmst = satellite.gstime_from_jday(j);

      var m = (j - satrec.jdsatepoch) * MINUTES_PER_DAY;
      var pv = satellite.sgp4(satrec, m);

      var gpos, lat, lon;

      try {
        gpos = satellite.eci_to_geodetic(pv.position, gmst);
      } catch (err) {
        return 2;
      }

      lat = satellite.degrees_lat(gpos.latitude) * 1;
      lon = satellite.degrees_long(gpos.longitude) * 1;

      if (lastLat == null) { // Set it the first time
        lastLat = lat;
      }

      if (type === 1) {
        if (lat === lastLat) {
          return 0; // Not enough movement, skip this
        }

        if (lat > lastLat) {
          isUpOrDown = 'N';
        }
        if (lat < lastLat) {
          isUpOrDown = 'S';
        }

        lastLat = lat;
      }

      if (lat > (goalLat - 0.15) && lat < (goalLat + 0.15) && type === 1) {
        // console.log('Lat: ' + lat);
        return 1;
      }

      if (lon > (goalLon - 0.15) && lon < (goalLon + 0.15) && type === 2) {
        // console.log('Lon: ' + lon);
        return 1;
      }

      // If current latitude greater than 11 degrees off rotate meanA faster
      if (!(lat > (goalLat - 11) && lat < (goalLat + 11)) && type === 1) {
        return 5;
      }

      // If current longitude greater than 11 degrees off rotate RASC faster
      if (!(lon > (goalLon - 11) && lon < (goalLon + 11)) && type === 2) {
        return 5;
      }

      return 0;
    }
  };
  lookangles.getlookangles = function (sat, isLookanglesMenuOpen) {
    if (!isLookanglesMenuOpen) {
      return;
    }
    if (lookangles.sensorSelected()) {
      // Set default timing settings. These will be changed to find look angles at different times in future.
      var propTempOffset = 0;               // offset letting us propagate in the future (or past)
      // var propRealTime = Date.now();      // Set current time

      var propOffset = getPropOffset();

      var satrec = satellite.twoline2satrec(sat.TLE1, sat.TLE2);// perform and store sat init calcs
      var tbl = document.getElementById('looks');           // Identify the table to update
      tbl.innerHTML = '';                                   // Clear the table from old object data
      var tblLength = 0;                                   // Iniially no rows to the table

      var tr = tbl.insertRow();
      var tdT = tr.insertCell();
      tdT.appendChild(document.createTextNode('Time'));
      tdT.setAttribute('style', 'text-decoration: underline');
      var tdE = tr.insertCell();
      tdE.appendChild(document.createTextNode('El'));
      tdE.setAttribute('style', 'text-decoration: underline');
      var tdA = tr.insertCell();
      tdA.appendChild(document.createTextNode('Az'));
      tdA.setAttribute('style', 'text-decoration: underline');
      var tdR = tr.insertCell();
      tdR.appendChild(document.createTextNode('Rng'));
      tdR.setAttribute('style', 'text-decoration: underline');

      if (isRiseSetLookangles) {
        var tempLookanglesInterval = lookanglesInterval;
        lookanglesInterval = 1;
      }

      for (var i = 0; i < (lookanglesLength * 24 * 60 * 60); i += lookanglesInterval) {         // lookanglesInterval in seconds
        propTempOffset = i * 1000 + propOffset;                 // Offset in seconds (msec * 1000)
        if (tblLength >= 1500) {                           // Maximum of 1500 lines in the look angles table
          break;                                            // No more updates to the table (Prevent GEO object slowdown)
        }
        tblLength += propagate(propTempOffset, tbl, satrec);   // Update the table with looks for this 5 second chunk and then increase table counter by 1
      }

      if (isRiseSetLookangles) {
        lookanglesInterval = tempLookanglesInterval;
      }
    }
  };
  lookangles.map = function (sat, i) {
    // Set default timing settings. These will be changed to find look angles at different times in future.
    var propOffset = getPropOffset();
    var satrec = satellite.twoline2satrec(sat.TLE1, sat.TLE2);// perform and store sat init calcs
    var propTempOffset = i * sat.period / 50 * 60 * 1000 + propOffset;             // Offset in seconds (msec * 1000)
    return propagate(propTempOffset, satrec);   // Update the table with looks for this 5 second chunk and then increase table counter by 1

    function propagate (propOffset, satrec) {
      var now = propTimeCheck(propOffset, propRealTime);
      var j = jday(now.getUTCFullYear(),
                   now.getUTCMonth() + 1, // NOTE:, this function requires months in range 1-12.
                   now.getUTCDate(),
                   now.getUTCHours(),
                   now.getUTCMinutes(),
                   now.getUTCSeconds()); // Converts time to jday (TLEs use epoch year/day)
      j += now.getUTCMilliseconds() * MILLISECONDS_PER_DAY;
      var gmst = satellite.gstime_from_jday(j);

      var m = (j - satrec.jdsatepoch) * MINUTES_PER_DAY;
      var pv = satellite.sgp4(satrec, m);

      var gpos, lat, lon;

      gpos = satellite.eci_to_geodetic(pv.position, gmst);

      lat = satellite.degrees_lat(gpos.latitude);
      lon = satellite.degrees_long(gpos.longitude);
      var time = dateFormat(now, 'isoDateTime', true);

      var positionEcf, lookAngles, azimuth, elevation, range;
      positionEcf = satellite.eci_to_ecf(pv.position, gmst); // pv.position is called positionEci originally
      lookAngles = satellite.ecf_to_look_angles(lookangles.currentSensor.observerGd, positionEcf);
      azimuth = lookAngles.azimuth * RAD2DEG;
      elevation = lookAngles.elevation * RAD2DEG;
      range = lookAngles.range_sat;
      var inview = 0;

      if (lookangles.currentSensor.obsminaz < lookangles.currentSensor.obsmaxaz) {
        if (((azimuth >= lookangles.currentSensor.obsminaz && azimuth <= lookangles.currentSensor.obsmaxaz) && (elevation >= lookangles.currentSensor.obsminel && elevation <= lookangles.currentSensor.obsmaxel) && (range <= lookangles.currentSensor.obsmaxrange && range >= lookangles.currentSensor.obsminrange)) ||
           ((azimuth >= lookangles.currentSensor.obsminaz2 && azimuth <= lookangles.currentSensor.obsmaxaz2) && (elevation >= lookangles.currentSensor.obsminel2 && elevation <= lookangles.currentSensor.obsmaxel2) && (range <= lookangles.currentSensor.obsmaxrange2 && range >= lookangles.currentSensor.obsminrange2))) {
          inview = 1;
        }
      } else {
        if (((azimuth >= lookangles.currentSensor.obsminaz || azimuth <= lookangles.currentSensor.obsmaxaz) && (elevation >= lookangles.currentSensor.obsminel && elevation <= lookangles.currentSensor.obsmaxel) && (range <= lookangles.currentSensor.obsmaxrange && range >= lookangles.currentSensor.obsminrange)) ||
           ((azimuth >= lookangles.currentSensor.obsminaz2 || azimuth <= lookangles.currentSensor.obsmaxaz2) && (elevation >= lookangles.currentSensor.obsminel2 && elevation <= lookangles.currentSensor.obsmaxel2) && (range <= lookangles.currentSensor.obsmaxrange2 && range >= lookangles.currentSensor.obsminrange2))) {
          inview = 1;
        }
      }

      return {lat: lat, lon: lon, time: time, inview: inview};
    }
  };

  function getPropOffset () {
    var selectedDate = $('#datetime-text').text().substr(0, 19);
    selectedDate = selectedDate.split(' ');
    selectedDate = new Date(selectedDate[0] + 'T' + selectedDate[1] + 'Z');
    var today = new Date();
    var propOffset = selectedDate - today;// - (selectedDate.getTimezoneOffset() * 60 * 1000);
    return propOffset;
  }
  function propagate (propTempOffset, tbl, satrec) {
    var propRealTime = Date.now();
    var now = propTimeCheck(propTempOffset, propRealTime);
    var j = jday(now.getUTCFullYear(),
    now.getUTCMonth() + 1, // NOTE:, this function requires months in range 1-12.
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()); // Converts time to jday (TLEs use epoch year/day)
    j += now.getUTCMilliseconds() * MILLISECONDS_PER_DAY;
    var gmst = satellite.gstime_from_jday(j);

    var m = (j - satrec.jdsatepoch) * MINUTES_PER_DAY;
    var pv = satellite.sgp4(satrec, m);
    var positionEcf, lookAngles, azimuth, elevation, range;

    positionEcf = satellite.eci_to_ecf(pv.position, gmst); // pv.position is called positionEci originally
    lookAngles = satellite.ecf_to_look_angles(lookangles.currentSensor.observerGd, positionEcf);
    azimuth = lookAngles.azimuth * RAD2DEG;
    elevation = lookAngles.elevation * RAD2DEG;
    range = lookAngles.range_sat;

    if (lookangles.currentSensor.obsminaz < lookangles.currentSensor.obsmaxaz) {
      if (!((azimuth >= lookangles.currentSensor.obsminaz && azimuth <= lookangles.currentSensor.obsmaxaz) && (elevation >= lookangles.currentSensor.obsminel && elevation <= lookangles.currentSensor.obsmaxel) && (range <= lookangles.currentSensor.obsmaxrange && range >= lookangles.currentSensor.obsminrange)) ||
      ((azimuth >= lookangles.currentSensor.obsminaz2 && azimuth <= lookangles.currentSensor.obsmaxaz2) && (elevation >= lookangles.currentSensor.obsminel2 && elevation <= lookangles.currentSensor.obsmaxel2) && (range <= lookangles.currentSensor.obsmaxrange2 && range >= lookangles.currentSensor.obsminrange2))) {
        return 0;
      }
    }
    if (((azimuth >= lookangles.currentSensor.obsminaz || azimuth <= lookangles.currentSensor.obsmaxaz) && (elevation >= lookangles.currentSensor.obsminel && elevation <= lookangles.currentSensor.obsmaxel) && (range <= lookangles.currentSensor.obsmaxrange && range >= lookangles.currentSensor.obsminrange)) ||
    ((azimuth >= lookangles.currentSensor.obsminaz2 || azimuth <= lookangles.currentSensor.obsmaxaz2) && (elevation >= lookangles.currentSensor.obsminel2 && elevation <= lookangles.currentSensor.obsmaxel2) && (range <= lookangles.currentSensor.obsmaxrange2 && range >= lookangles.currentSensor.obsminrange2))) {
      if (isRiseSetLookangles) {
        // Previous Pass to Calculate first line of coverage
        var now1 = propTimeCheck(propTempOffset - (lookanglesInterval * 1000), propRealTime);
        var j1 = jday(now1.getUTCFullYear(),
        now1.getUTCMonth() + 1, // NOTE:, this function requires months in range 1-12.
        now1.getUTCDate(),
        now1.getUTCHours(),
        now1.getUTCMinutes(),
        now1.getUTCSeconds()); // Converts time to jday (TLEs use epoch year/day)
        j1 += now1.getUTCMilliseconds() * MILLISECONDS_PER_DAY;
        var gmst1 = satellite.gstime_from_jday(j1);

        var m1 = (j1 - satrec.jdsatepoch) * MINUTES_PER_DAY;
        var pv1 = satellite.sgp4(satrec, m1);
        var positionEcf1, lookAngles1, azimuth1, elevation1, range1;

        positionEcf1 = satellite.eci_to_ecf(pv1.position, gmst1); // pv.position is called positionEci originally
        lookAngles1 = satellite.ecf_to_look_angles(lookangles.currentSensor.observerGd, positionEcf1);
        azimuth1 = lookAngles1.azimuth * RAD2DEG;
        elevation1 = lookAngles1.elevation * RAD2DEG;
        range1 = lookAngles1.range_sat;
        if (!((azimuth >= lookangles.currentSensor.obsminaz || azimuth <= lookangles.currentSensor.obsmaxaz) && (elevation >= lookangles.currentSensor.obsminel && elevation <= lookangles.currentSensor.obsmaxel) && (range <= lookangles.currentSensor.obsmaxrange && range >= lookangles.currentSensor.obsminrange)) ||
        ((azimuth >= lookangles.currentSensor.obsminaz2 || azimuth <= lookangles.currentSensor.obsmaxaz2) && (elevation >= lookangles.currentSensor.obsminel2 && elevation <= lookangles.currentSensor.obsmaxel2) && (range <= lookangles.currentSensor.obsmaxrange2 && range >= lookangles.currentSensor.obsminrange2))) {
          var tr = tbl.insertRow();
          var tdT = tr.insertCell();
          tdT.appendChild(document.createTextNode(dateFormat(now, 'isoDateTime', true)));
          // tdT.style.border = '1px solid black';
          var tdE = tr.insertCell();
          tdE.appendChild(document.createTextNode(elevation.toFixed(1)));
          var tdA = tr.insertCell();
          tdA.appendChild(document.createTextNode(azimuth.toFixed(0)));
          var tdR = tr.insertCell();
          tdR.appendChild(document.createTextNode(range.toFixed(0)));
          return 1;
        } else {
          // Next Pass to Calculate Last line of coverage
          now1 = propTimeCheck(propTempOffset + (lookanglesInterval * 1000), propRealTime);
          j1 = jday(now1.getUTCFullYear(),
          now1.getUTCMonth() + 1, // NOTE:, this function requires months in range 1-12.
          now1.getUTCDate(),
          now1.getUTCHours(),
          now1.getUTCMinutes(),
          now1.getUTCSeconds()); // Converts time to jday (TLEs use epoch year/day)
          j1 += now1.getUTCMilliseconds() * MILLISECONDS_PER_DAY;
          gmst1 = satellite.gstime_from_jday(j1);

          m1 = (j1 - satrec.jdsatepoch) * MINUTES_PER_DAY;
          pv1 = satellite.sgp4(satrec, m1);

          positionEcf1 = satellite.eci_to_ecf(pv1.position, gmst1); // pv.position is called positionEci originally
          lookAngles1 = satellite.ecf_to_look_angles(lookangles.currentSensor.observerGd, positionEcf1);
          azimuth1 = lookAngles1.azimuth * RAD2DEG;
          elevation1 = lookAngles1.elevation * RAD2DEG;
          range1 = lookAngles1.range_sat;
          if (!((azimuth1 >= lookangles.currentSensor.obsminaz || azimuth1 <= lookangles.currentSensor.obsmaxaz) && (elevation1 >= lookangles.currentSensor.obsminel && elevation1 <= lookangles.currentSensor.obsmaxel) && (range1 <= lookangles.currentSensor.obsmaxrange && range1 >= lookangles.currentSensor.obsminrange)) ||
          ((azimuth1 >= lookangles.currentSensor.obsminaz2 || azimuth1 <= lookangles.currentSensor.obsmaxaz2) && (elevation1 >= lookangles.currentSensor.obsminel2 && elevation1 <= lookangles.currentSensor.obsmaxel2) && (range1 <= lookangles.currentSensor.obsmaxrange2 && range1 >= lookangles.currentSensor.obsminrange2))) {
            tr = tbl.insertRow();
            tdT = tr.insertCell();
            tdT.appendChild(document.createTextNode(dateFormat(now, 'isoDateTime', true)));
            // tdT.style.border = '1px solid black';
            tdE = tr.insertCell();
            tdE.appendChild(document.createTextNode(elevation.toFixed(1)));
            tdA = tr.insertCell();
            tdA.appendChild(document.createTextNode(azimuth.toFixed(0)));
            tdR = tr.insertCell();
            tdR.appendChild(document.createTextNode(range.toFixed(0)));
            return 1;
          }
        }
        return 0;
      }

      tr = tbl.insertRow();
      tdT = tr.insertCell();
      tdT.appendChild(document.createTextNode(dateFormat(now, 'isoDateTime', true)));
      // tdT.style.border = '1px solid black';
      tdE = tr.insertCell();
      tdE.appendChild(document.createTextNode(elevation.toFixed(1)));
      tdA = tr.insertCell();
      tdA.appendChild(document.createTextNode(azimuth.toFixed(0)));
      tdR = tr.insertCell();
      tdR.appendChild(document.createTextNode(range.toFixed(0)));
      return 1;
    }
    return 0;
  }
  function propagateMultiSite (propTempOffset, tbl, satrec, sensor) {
    // Changes Sensor Name for Lookangles Table
    sensor = lookangles.sensorListUS[sensor].googleName;
    var propRealTimeTemp = Date.now();
    var now = propTimeCheck(propTempOffset, propRealTimeTemp);
    var j = jday(now.getUTCFullYear(),
    now.getUTCMonth() + 1, // NOTE:, this function requires months in range 1-12.
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()); // Converts time to jday (TLEs use epoch year/day)
    j += now.getUTCMilliseconds() * MILLISECONDS_PER_DAY;
    var gmst = satellite.gstime_from_jday(j);

    var m = (j - satrec.jdsatepoch) * MINUTES_PER_DAY;
    var pv = satellite.sgp4(satrec, m);
    var positionEcf, lookAngles, azimuth, elevation, range;

    positionEcf = satellite.eci_to_ecf(pv.position, gmst); // pv.position is called positionEci originally
    lookAngles = satellite.ecf_to_look_angles(lookangles.currentSensor.observerGd, positionEcf);
    azimuth = lookAngles.azimuth * RAD2DEG;
    elevation = lookAngles.elevation * RAD2DEG;
    range = lookAngles.range_sat;

    if (lookangles.currentSensor.obsminaz < lookangles.currentSensor.obsmaxaz) {
      if (!((azimuth >= lookangles.currentSensor.obsminaz && azimuth <= lookangles.currentSensor.obsmaxaz) && (elevation >= lookangles.currentSensor.obsminel && elevation <= lookangles.currentSensor.obsmaxel) && (range <= lookangles.currentSensor.obsmaxrange && range >= lookangles.currentSensor.obsminrange)) ||
      ((azimuth >= lookangles.currentSensor.obsminaz2 && azimuth <= lookangles.currentSensor.obsmaxaz2) && (elevation >= lookangles.currentSensor.obsminel2 && elevation <= lookangles.currentSensor.obsmaxel2) && (range <= lookangles.currentSensor.obsmaxrange2 && range >= lookangles.currentSensor.obsminrange2))) {
        return 0;
      }
    }
    if (((azimuth >= lookangles.currentSensor.obsminaz || azimuth <= lookangles.currentSensor.obsmaxaz) && (elevation >= lookangles.currentSensor.obsminel && elevation <= lookangles.currentSensor.obsmaxel) && (range <= lookangles.currentSensor.obsmaxrange && range >= lookangles.currentSensor.obsminrange)) ||
    ((azimuth >= lookangles.currentSensor.obsminaz2 || azimuth <= lookangles.currentSensor.obsmaxaz2) && (elevation >= lookangles.currentSensor.obsminel2 && elevation <= lookangles.currentSensor.obsmaxel2) && (range <= lookangles.currentSensor.obsmaxrange2 && range >= lookangles.currentSensor.obsminrange2))) {
      var tr;
      if (tbl.rows.length > 0) {
        // console.log(tbl.rows[0].cells[0].textContent);
        for (var i = 0; i < tbl.rows.length; i++) {
          var dateString = tbl.rows[i].cells[0].textContent;

          var sYear = parseInt(dateString.substr(0, 4)); // UTC Year
          var sMon = parseInt(dateString.substr(5, 2)) - 1; // UTC Month in MMM prior to converting
          var sDay = parseInt(dateString.substr(8, 2)); // UTC Day
          var sHour = parseInt(dateString.substr(11, 2)); // UTC Hour
          var sMin = parseInt(dateString.substr(14, 2)); // UTC Min
          var sSec = parseInt(dateString.substr(17, 2)); // UTC Sec

          var topTime = new Date(sYear, sMon, sDay, sHour, sMin, sSec); // New Date object of the future collision
          // Date object defaults to local time.
          topTime.setUTCDate(sDay); // Move to UTC day.
          topTime.setUTCHours(sHour); // Move to UTC Hour

          if (now < topTime) {
            tr = tbl.insertRow(i);
            break;
          }
        }
      }

      if (tr == null) {
        tr = tbl.insertRow();
      }

      var tdT = tr.insertCell();
      tdT.appendChild(document.createTextNode(dateFormat(now, 'isoDateTime', true)));
      // tdT.style.border = '1px solid black';
      var tdE = tr.insertCell();
      tdE.appendChild(document.createTextNode(elevation.toFixed(1)));
      var tdA = tr.insertCell();
      tdA.appendChild(document.createTextNode(azimuth.toFixed(0)));
      var tdR = tr.insertCell();
      tdR.appendChild(document.createTextNode(range.toFixed(0)));
      var tdS = tr.insertCell();
      tdS.appendChild(document.createTextNode(sensor));
      return 1;
    }
    return 0;
  }
  function propTimeCheck (propTempOffset, propRealTime) {
    'use strict';
    var now = new Date();                                     // Make a time variable
    now.setTime(Number(propRealTime) + propTempOffset);           // Set the time variable to the time in the future
    return now;
  }

  window.lookangles = lookangles;
})();

/* **** start Date Format ***
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes ENHANCEMENT by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */
var dateFormat = (function () {
  var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g;
  var timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
  var timezoneClip = /[^-+\dA-Z]/g;
  var pad = function (val, len) {
    val = String(val);
    len = len || 2;
    while (val.length < len) val = '0' + val;
    return val;
  };

  // Regexes and supporting functions are cached through closure
  return function (date, mask, utc) {
    var dF = dateFormat;

    // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
    if (arguments.length === 1 && Object.prototype.toString.call(date) === '[object String]' && !/\d/.test(date)) {
      mask = date;
      date = undefined;
    }

    // Passing date through Date applies Date.parse, if necessary
    date = date ? new Date(date) : new Date();
    if (isNaN(date)) throw SyntaxError('invalid date');

    mask = String(dF.masks[mask] || mask || dF.masks['default']);

    // Allow setting the utc argument via the mask
    if (mask.slice(0, 4) === 'UTC:') {
      mask = mask.slice(4);
      utc = true;
    }

    var _ = utc ? 'getUTC' : 'get';
    var d = date[_ + 'Date']();
    var D = date[_ + 'Day']();
    var m = date[_ + 'Month']();
    var y = date[_ + 'FullYear']();
    var H = date[_ + 'Hours']();
    var M = date[_ + 'Minutes']();
    var s = date[_ + 'Seconds']();
    var L = date[_ + 'Milliseconds']();
    var o = utc ? 0 : date.getTimezoneOffset();
    var flags = {
      d: d,
      dd: pad(d),
      ddd: dF.i18n.dayNames[D],
      dddd: dF.i18n.dayNames[D + 7],
      m: m + 1,
      mm: pad(m + 1),
      mmm: dF.i18n.monthNames[m],
      mmmm: dF.i18n.monthNames[m + 12],
      yy: String(y).slice(2),
      yyyy: y,
      h: H % 12 || 12,
      hh: pad(H % 12 || 12),
      H: H,
      HH: pad(H),
      M: M,
      MM: pad(M),
      s: s,
      ss: pad(s),
      l: pad(L, 3),
      L: pad(L > 99 ? Math.round(L / 10) : L),
      t: H < 12 ? 'a' : 'p',
      tt: H < 12 ? 'am' : 'pm',
      T: H < 12 ? 'A' : 'P',
      TT: H < 12 ? 'AM' : 'PM',
      Z: utc ? 'UTC' : (String(date).match(timezone) || ['']).pop().replace(timezoneClip, ''),
      o: (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
      S: ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10]
    };

    return mask.replace(token, function ($0) {
      return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
  };
})();

// Some common format strings
dateFormat.masks = {
  'default': 'ddd mmm dd yyyy HH:MM:ss',
  shortDate: 'm/d/yy',
  mediumDate: 'mmm d, yyyy',
  longDate: 'mmmm d, yyyy',
  fullDate: 'dddd, mmmm d, yyyy',
  shortTime: 'h:MM TT',
  mediumTime: 'h:MM:ss TT',
  longTime: 'h:MM:ss TT Z',
  isoDate: 'yyyy-mm-dd',
  isoTime: 'HH:MM:ss',
  isoDateTime: "yyyy-mm-dd' 'HH:MM:ss",
  isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
  dayNames: [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ],
  monthNames: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
  ]
};

// **** 2 - shader-loader ***
(function () {
  var shaderLoader = {};

  shaderLoader.getShaderCode = function (name) {
    for (var i = 0; i < window.shaderData.length; i++) {
      if (shaderData[i].name === name) {
        return shaderData[i].code;
      }
    }
    return null;
  };

  window.shaderLoader = shaderLoader;
})();

// **** 3 - color-scheme ***
(function () {
  var ColorScheme = function (colorizer) {
    this.colorizer = colorizer;
    this.colorBuf = gl.createBuffer();
    this.pickableBuf = gl.createBuffer();
  };

  ColorScheme.prototype.calculateColorBuffers = function () {
    var numSats = satSet.numSats;
    var colorData = new Float32Array(numSats * 4);
    var pickableData = new Float32Array(numSats);
    for (var i = 0; i < numSats; i++) {
      var colors = this.colorizer(i);
      colorData[i * 4] = colors.color[0];  // R
      colorData[i * 4 + 1] = colors.color[1]; // G
      colorData[i * 4 + 2] = colors.color[2]; // B
      colorData[i * 4 + 3] = colors.color[3]; // A
      pickableData[i] = colors.pickable ? 1 : 0;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuf);
    gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pickableBuf);
    gl.bufferData(gl.ARRAY_BUFFER, pickableData, gl.STATIC_DRAW);
    return {
      colorBuf: this.colorBuf,
      pickableBuf: this.pickableBuf
    };
  };

  ColorScheme.init = function () {
    ColorScheme.default = new ColorScheme(function (satId) {
      var sat = satSet.getSat(satId);
      if (sat.static && sat.type === 'Launch Facility') {
        return {
          color: [0.54, 0.0, 0.54, 1.0],
          pickable: true
        };
      }
      if (sat.static) {
        return {
          color: [1.0, 0.0, 0.0, 1.0],
          pickable: true
        };
      }
      if (sat.missile && !sat.inview) {
        return {
          color: [1.0, 1.0, 0.0, 1.0],
          pickable: true
        };
      }
      if (sat.missile && sat.inview) {
        return {
          color: [1.0, 0.0, 0.0, 1.0],
          pickable: true
        };
      }
      var ap = sat.apogee;
      var pe = sat.perigee;
      var color;
      if (sat.inview) {
        color = [0.85, 0.5, 0.0, 1.0];
      } else if (sat.OT === 1) { // Payload
        color = [0.2, 1.0, 0.0, 0.5];
      } else if (sat.OT === 2) { // Rocket Body
        color = [0.2, 0.5, 1.0, 0.85];
        //  return [0.6, 0.6, 0.6];
      } else if (sat.OT === 3) { // Debris
        color = [0.5, 0.5, 0.5, 0.85];
      } else {
        color = [0.5, 0.5, 0.5, 0.85];
      }

      if ((pe > lookangles.obsmaxrange || ap < lookangles.obsminrange)) {
        return {
          color: [1.0, 1.0, 1.0, otherSatelliteTransparency],
          pickable: false
        };
      }

      return {
        color: color,
        pickable: true
      };
    });
    ColorScheme.onlyFOV = new ColorScheme(function (satId) {
      var sat = satSet.getSat(satId);
      if (sat.inview) {
        return {
          color: [0.85, 0.5, 0.0, 1.0],
          pickable: true
        };
      } else {
        return {
          color: [1.0, 1.0, 1.0, otherSatelliteTransparency],
          pickable: false
        };
      }
    });
    ColorScheme.apogee = new ColorScheme(function (satId) {
      var ap = satSet.getSat(satId).apogee;
      var gradientAmt = Math.min(ap / 45000, 1.0);
      return {
        color: [1.0 - gradientAmt, gradientAmt, 0.0, 1.0],
        pickable: true
      };
    });
    ColorScheme.smallsats = new ColorScheme(function (satId) {
      if (satSet.getSat(satId).R < 0.1 && satSet.getSat(satId).OT === 1) {
        return {
          color: [0.2, 1.0, 0.0, 0.65],
          pickable: true
        };
      } else {
        return {
          color: [1.0, 1.0, 1.0, otherSatelliteTransparency],
          pickable: false
        };
      }
    });
    ColorScheme.rcs = new ColorScheme(function (satId) {
      var rcs = satSet.getSat(satId).R;
      if (rcs < 0.1) {
        return {
          color: [1.0, 0, 0, 0.6],
          pickable: true
        };
      }
      if (rcs >= 0.1 && rcs <= 1) {
        return {
          color: [1.0, 1.0, 0, 0.6],
          pickable: true
        };
      }
      if (rcs > 1) {
        return {
          color: [0, 1.0, 0, 0.6],
          pickable: true
        };
      }
      return {
        color: [0, 0, 1.0, 0.6],
        pickable: true
      };
    });
    ColorScheme.lostobjects = new ColorScheme(function (satId) {
      var sat = satSet.getSat(satId);
      if (sat.static && sat.type === 'Launch Facility') {
        return {
          color: [0.54, 0.0, 0.54, 1.0],
          pickable: true
        };
      }
      if (sat.static) {
        return {
          color: [1.0, 0.0, 0.0, 1.0],
          pickable: true
        };
      }
      if (sat.missile && !sat.inview) {
        return {
          color: [1.0, 1.0, 0.0, 1.0],
          pickable: true
        };
      }
      if (sat.missile && sat.inview) {
        return {
          color: [1.0, 0.0, 0.0, 1.0],
          pickable: true
        };
      }
      var pe = sat.perigee;
      var now = new Date();
      var jday = getDOY(now);
      now = now.getFullYear();
      now = now.toString().substr(2, 2);
      var daysold;
      if (sat.TLE1.substr(18, 2) === now) {
        daysold = jday - sat.TLE1.substr(20, 3);
      } else {
        daysold = jday - sat.TLE1.substr(20, 3) + (sat.TLE1.substr(17, 2) * 365);
      }
      if (pe > lookangles.obsmaxrange || daysold < 31) {
        return {
          color: [1.0, 1.0, 1.0, otherSatelliteTransparency],
          pickable: false
        };
      } else {
        if ($('#search').val() === '') {
          $('#search').val($('#search').val() + sat.SCC_NUM);
        } else {
          $('#search').val($('#search').val() + ',' + sat.SCC_NUM);
        }
        return {
          color: [0.2, 1.0, 0.0, 0.65],
          pickable: true
        };
      }
    });
    ColorScheme.leo = new ColorScheme(function (satId) {
      var ap = satSet.getSat(satId).apogee;
      if (ap > 2000) {
        return {
          color: [1.0, 1.0, 1.0, otherSatelliteTransparency],
          pickable: false
        };
      } else {
        return {
          color: [0.2, 1.0, 0.0, 0.65],
          pickable: true
        };
      }
    });
    ColorScheme.geo = new ColorScheme(function (satId) {
      var pe = satSet.getSat(satId).perigee;
      if (pe < 35000) {
        return {
          color: [1.0, 1.0, 1.0, otherSatelliteTransparency],
          pickable: false
        };
      } else {
        return {
          color: [0.2, 1.0, 0.0, 0.65],
          pickable: true
        };
      }
    });
    ColorScheme.velocity = new ColorScheme(function (satId) {
      var vel = satSet.getSat(satId).velocity;
      var gradientAmt = Math.min(vel / 15, 1.0);
      return {
        color: [1.0 - gradientAmt, gradientAmt, 0.0, 1.0],
        pickable: true
      };
    });
    ColorScheme.group = new ColorScheme(function (satId) {
      if (groups.selectedGroup.hasSat(satId)) {
        return {
          color: [0.2, 1.0, 0.0, 0.5],
          pickable: true
        };
      } else {
        return {
          color: [1.0, 1.0, 1.0, otherSatelliteTransparency],
          pickable: false
        };
      }
    });

    $('#color-schemes-submenu').mouseover(function () {
    });
  };

  window.ColorScheme = ColorScheme;
})();

// **** 4 - groups ***

// function clearMenuCountries () {
//   groups.clearSelect();
//   $('#menu-groups .menu-title').text('Groups');
//   $('#menu-countries .menu-title').text('Countries');
//
//   searchBox.fillResultBox('');
//
//   $('#menu-countries .clear-option').css({display: 'none'}); // Hide Clear Option
//   $('#menu-countries .country-option').css({display: 'block'}); // Show Country Options
// }
(function () {
  var groups = {};
  groups.selectedGroup = null;

  function SatGroup (groupType, data) {
    this.sats = [];
    if (groupType === 'intlDes') {
      for (var i = 0; i < data.length; i++) {
        var theSatId = satSet.getIdFromIntlDes(data[i]);
        if (theSatId === null) continue;
        this.sats.push({
          satId: theSatId,
          isIntlDes: true
          // isObjnum: false,
          // strIndex: 0
        });
      }
    } else if (groupType === 'nameRegex') {
      var satIdList = satSet.searchNameRegex(data);
      for (i = 0; i < satIdList.length; i++) {
        this.sats.push({
          satId: satIdList[i]
          // isIntlDes: false,
          // isObjnum: false,
          // strIndex: 0
        });
      }
    } else if (groupType === 'countryRegex') {
      satIdList = satSet.searchCountryRegex(data);
      for (i = 0; i < satIdList.length; i++) {
        this.sats.push({
          satId: satIdList[i]
          // isIntlDes: false,
          // isObjnum: false,
          // strIndex: 0
        });
      }
    } else if (groupType === 'objNum') {
      for (i = 0; i < data.length; i++) {
        theSatId = satSet.getIdFromObjNum(data[i]);
        if (theSatId === null) continue;
        this.sats.push({
          satId: theSatId,
          // isIntlDes: false,
          isObjnum: true
          // strIndex: 0
        });
      }
    } else if (groupType === 'idList') {
      for (i = 0; i < data.length; i++) {
        this.sats.push({
          satId: data[i]
          // isIntlDes: false,
          // isObjnum: false,
          // strIndex: 0
        });
      }
    }
  }

  SatGroup.prototype.hasSat = function (id) {
    var len = this.sats.length;
    for (var i = 0; i < len; i++) {
      if (this.sats[i].satId === id) return true;
    }
    return false;
  };

  SatGroup.prototype.updateOrbits = function () {
    // What calls the orbit buffer when selected a group from the menu.
    for (var i = 0; i < this.sats.length; i++) {
      orbitDisplay.updateOrbitBuffer(this.sats[i].satId);
    }
  };

  SatGroup.prototype.forEach = function (callback) {
    for (var i = 0; i < this.sats.length; i++) {
      callback(this.sats[i].satId);
    }
  };

  groups.SatGroup = SatGroup;

  groups.selectGroup = function (group) {
    // console.log('selectGroup with ' + group);
    if (group === null || group === undefined) {
      return;
    }
    // var start = performance.now();
    groups.selectedGroup = group;
    group.updateOrbits();
    satSet.setColorScheme(ColorScheme.group);
    // var t = performance.now() - start;
    // console.log('selectGroup: ' + t + ' ms');
  };

  groups.clearSelect = function () {
    groups.selectedGroup = null;
    if (isOnlyFOVChecked) { satSet.setColorScheme(ColorScheme.onlyFOV); }
    if (!isOnlyFOVChecked) { satSet.setColorScheme(ColorScheme.default); }
  };

  groups.init = function () {
    // var start = performance.now();

    // $('#groups-display>li').mouseover(function () {
    // NOTE:: This runs on mouseover of any li elements
    //
    // });

    $('#countries-menu>li').click(function () {
      var groupName = $(this).data('group');
      if (groupName === '<clear>') {
        // clearMenuCountries();
      } else {
        selectSat(-1); // Clear selected sat
        groups.selectGroup(groups[groupName]);
        searchBox.fillResultBox(groups[groupName].sats, '');

        $('#search').val('');

        var results = groups[groupName].sats;
        for (var i = 0; i < results.length; i++) {
          var satId = groups[groupName].sats[i].satId;
          var scc = satSet.getSat(satId).SCC_NUM;
          if (i === results.length - 1) {
            $('#search').val($('#search').val() + scc);
          } else {
            $('#search').val($('#search').val() + scc + ',');
          }
        }

        $('#menu-countries .clear-option').css({display: 'block'}); // Show Clear Option
        $('#menu-countries .country-option').css({display: 'none'}); // Hide Country Options
        // $('#menu-groups .clear-option').css({display: 'block'});
        // $('#menu-groups .menu-title').text('Groups (' + $(this).text() + ')');
        $('#menu-countries .menu-title').text('Countries (' + $(this).text() + ')');
      }

      $('#groups-display').css({
        display: 'none'
      });
    });
    $('#colors-menu>li').click(function () {
      selectSat(-1); // clear selected sat
      var colorName = $(this).data('color');
      // Hide All legends
      $('#legend-list-default').hide();
      $('#legend-list-default-sensor').hide();
      $('#legend-list-rcs').hide();
      $('#legend-list-small').hide();
      $('#legend-list-near').hide();
      $('#legend-list-deep').hide();
      $('#legend-list-velocity').hide();
      switch (colorName) {
        case 'default':
          if (lookangles.sensorSelected()) {
            $('#legend-list-default-sensor').show();
          } else {
            $('#legend-list-default').show();
          }
          satSet.setColorScheme(ColorScheme.default);
          ga('send', 'event', 'ColorScheme Menu', 'Default Color', 'Selected');
          break;
        case 'velocity':
          $('#legend-list-velocity').show();
          satSet.setColorScheme(ColorScheme.velocity);
          ga('send', 'event', 'ColorScheme Menu', 'Velocity', 'Selected');
          break;
        case 'near-earth':
          $('#legend-list-near').show();
          satSet.setColorScheme(ColorScheme.leo);
          ga('send', 'event', 'ColorScheme Menu', 'near-earth', 'Selected');
          break;
        case 'deep-space':
          $('#legend-list-deep').show();
          satSet.setColorScheme(ColorScheme.geo);
          ga('send', 'event', 'ColorScheme Menu', 'Deep-Space', 'Selected');
          break;
        case 'lost-objects':
          $('#search').val('');
          satSet.setColorScheme(ColorScheme.lostobjects);
          ga('send', 'event', 'ColorScheme Menu', 'Lost Objects', 'Selected');
          searchBox.doSearch($('#search').val());
          break;
        case 'rcs':
          $('#legend-list-rcs').show();
          satSet.setColorScheme(ColorScheme.rcs);
          ga('send', 'event', 'ColorScheme Menu', 'RCS', 'Selected');
          break;
        case 'smallsats':
          $('#legend-list-small').show();
          satSet.setColorScheme(ColorScheme.smallsats);
          ga('send', 'event', 'ColorScheme Menu', 'Small Satellites', 'Selected');
          break;
      }
    });

    // COUNTRIES
    groups.Canada = new SatGroup('countryRegex', /CA/);
    groups.China = new SatGroup('countryRegex', /PRC/);
    groups.France = new SatGroup('countryRegex', /FR/);
    groups.India = new SatGroup('countryRegex', /IND/);
    groups.Israel = new SatGroup('countryRegex', /ISRA/);
    groups.Japan = new SatGroup('countryRegex', /JPN/);
    groups.Russia = new SatGroup('countryRegex', /CIS/);
    groups.UnitedKingdom = new SatGroup('countryRegex', /UK/);
    groups.UnitedStates = new SatGroup('countryRegex', /US/);

    // GROUPS
    groups.SpaceStations = new SatGroup('objNum', [25544, 41765]);
    groups.GlonassGroup = new SatGroup('nameRegex', /GLONASS/);
    groups.GalileoGroup = new SatGroup('nameRegex', /GALILEO/);
    groups.GPSGroup = new SatGroup('nameRegex', /NAVSTAR/);
    groups.AmatuerRadio = new SatGroup('objNum', [7530, 14781, 20442, 22826, 24278, 25338, 25397, 25544, 26931,
      27607, 27844, 27848, 28895, 32785, 32788, 32789, 32791, 33493, 33498, 33499, 35932, 35933, 35935, 37224,
      37839, 37841, 37855, 38760, 39090, 39134, 39136, 39161, 39417, 39430, 39436, 39439, 39440, 39444, 39469,
      39770, 40014, 40021, 40024, 40025, 40030, 40032, 40042, 40043, 40057, 40071, 40074, 40377, 40378, 40379,
      40380, 40654, 40719, 40900, 40903, 40906, 40907, 40908, 40910, 40911, 40912, 40926, 40927, 40928, 40931,
      40967, 40968, 41168, 41171, 41340, 41459, 41460, 41465, 41474, 41600, 41619, 41789, 41932, 41935, 42017]);
    // SCC#s based on Uninon of Concerned Scientists
    groups.MilitarySatellites = new SatGroup('objNum', [40420, 41394, 32783, 35943, 36582, 40353, 40555, 41032, 38010, 38008, 38007, 38009,
      37806, 41121, 41579, 39030, 39234, 28492, 36124, 39194, 36095, 40358, 40258, 37212,
      37398, 38995, 40296, 40900, 39650, 27434, 31601, 36608, 28380, 28521, 36519, 39177,
      40699, 34264, 36358, 39375, 38248, 34807, 28908, 32954, 32955, 32956, 35498, 35500,
      37152, 37154, 38733, 39057, 39058, 39059, 39483, 39484, 39485, 39761, 39762, 39763,
      40920, 40921, 40922, 39765, 29658, 31797, 32283, 32750, 33244, 39208, 26694, 40614,
      20776, 25639, 26695, 30794, 32294, 33055, 39034, 28946, 33751, 33752, 27056, 27057,
      27464, 27465, 27868, 27869, 28419, 28420, 28885, 29273, 32476, 31792, 36834, 37165,
      37875, 37941, 38257, 38354, 39011, 39012, 39013, 39239, 39240, 39241, 39363, 39410,
      40109, 40111, 40143, 40275, 40305, 40310, 40338, 40339, 40340, 40362, 40878, 41026,
      41038, 41473, 28470, 37804, 37234, 29398, 40110, 39209, 39210, 36596]);
    groups.Tag42 = new SatGroup('objNum', ['25544']);

    // console.log('groups init: ' + (performance.now() - start) + ' ms');
  };
  window.groups = groups;
})();
// **** 5 - search-box ***
(function () {
  var searchBox = {};
  var SEARCH_LIMIT = 200; // Set Maximum Number of Satellites for Search
  var satData;

  var hovering = false;
  var hoverSatId = -1;

  var resultsOpen = false;
  var lastResultGroup;

  searchBox.isResultBoxOpen = function () {
    return resultsOpen;
  };

  searchBox.getLastResultGroup = function () {
    return lastResultGroup;
  };

  searchBox.getCurrentSearch = function () {
    if (resultsOpen) {
      return $('#search').val();
    } else {
      return null;
    }
  };

  searchBox.isHovering = function () {
    return hovering;
  };

  searchBox.getHoverSat = function () {
    return hoverSatId;
  };

  searchBox.hideResults = function () {
    var sr = $('#search-results');
    sr.slideUp();
    groups.clearSelect();
    resultsOpen = false;
  };

  searchBox.doSearch = function (str) {
    selectSat(-1);

    if (str.length === 0) {
      searchBox.hideResults();
      return;
    }

    // var searchStart = performance.now();

    var bigstr = str.toUpperCase();
    var arr = str.split(',');

    var bigarr = bigstr.split(',');
    var results = [];

    for (var i = 0; i < satData.length; i++) {
      for (var j = 0; j < arr.length; j++) {
        bigstr = bigarr[j];
        str = arr[j];
        if (str.length <= 2) { return; }
        var len = arr[j].length;
        if (satData[i].static) { continue; }
        if (satData[i].missile && !satData[i].active) { continue; }
        if (!satData[i].ON) { continue; }
        if ((satData[i].ON.indexOf(str) !== -1) || (satData[i].ON.indexOf(bigstr) !== -1)) {
          results.push({
            isIntlDes: false,
            isInView: satData[i].inview,
            isObjnum: false,
            strIndex: satData[i].ON.indexOf(str),
            SCC_NUM: satData[i].SCC_NUM,
            desc: satData[i].desc,
            patlen: len,
            satId: i
          });
        }
        if (satData[i].missile) { continue; }

        if (satData[i].intlDes.indexOf(str) !== -1) {
          if (satData[i].SCC_NUM.indexOf(str) !== -1) {
            results.push({
              // isIntlDes: true,
              isInView: satData[i].inview,
              // isObjnum: true,
              strIndex: satData[i].intlDes.indexOf(str),
              SCC_NUM: satData[i].SCC_NUM,
              patlen: len,
              satId: i
            });
          } else {
            results.push({
              // isIntlDes: true,
              isInView: satData[i].inview,
              // isObjnum: false,
              strIndex: satData[i].intlDes.indexOf(str),
              SCC_NUM: satData[i].SCC_NUM,
              patlen: len,
              satId: i
            });
          }
        } else if (satData[i].SCC_NUM.indexOf(str) !== -1) {
          if (satData[i].intlDes.indexOf(str) !== -1) {
            results.push({
              // isIntlDes: true,
              isInView: satData[i].inview,
              // isObjnum: true,
              strIndex: satData[i].intlDes.indexOf(str),
              SCC_NUM: satData[i].SCC_NUM,
              patlen: len,
              satId: i
            });
          } else {
            results.push({
              // isIntlDes: false,
              isInView: satData[i].inview,
              // isObjnum: true,
              strIndex: satData[i].SCC_NUM.indexOf(str),
              SCC_NUM: satData[i].SCC_NUM,
              patlen: len,
              satId: i
            });
          }
        }
        if (parseInt(satData[i].SCC_NUM) >= 80000) { continue; }
        if ((satData[i].LV.indexOf(str) !== -1) || (satData[i].LV.indexOf(bigstr) !== -1)) {
          results.push({
            // isIntlDes: false,
            isInView: satData[i].inview,
            // isObjnum: false,
            strIndex: satData[i].LV.indexOf(str),
            SCC_NUM: satData[i].SCC_NUM,
            patlen: len,
            satId: i
          });
        }
      }
    }

    if (results.length > SEARCH_LIMIT) {
      results.length = SEARCH_LIMIT;
    }

    // Make a group to hilight results
    var idList = [];
    for (i = 0; i < results.length; i++) {
      idList.push(results[i].satId);
    }
    var dispGroup = new groups.SatGroup('idList', idList);
    lastResultGroup = dispGroup;
    groups.selectGroup(dispGroup);

    searchBox.fillResultBox(results);
    $('#legend-hover-menu').hide();
    // searchBox.filterInView(results);
    updateUrl();
  };

  searchBox.fillResultBox = function (results) {
    var resultBox = $('#search-results');
    var html = '';
    for (var i = 0; i < results.length; i++) {
      var sat = satData[results[i].satId];
      html += '<div class="search-result" data-sat-id="' + sat.id + '">';
      if (results[i].isIntlDes || results[i].isObjnum) {
        html += sat.ON;
      } else {
        html += sat.ON.substring(0, results[i].strIndex);
        html += '<span class="search-hilight">';
        html += sat.ON.substring(results[i].strIndex, results[i].strIndex + results[i].patlen);
        html += '</span>';
        html += sat.ON.substring(results[i].strIndex + results[i].patlen);
      }
      html += '<div class="search-result-scc">';
      if (results[i].isObjnum) {
        html += sat.SCC_NUM.substring(0, results[i].strIndex);
        html += '<span class="search-hilight">';
        html += sat.SCC_NUM.substring(results[i].strIndex, results[i].strIndex + results[i].patlen);
        html += '</span>';
        html += sat.SCC_NUM.substring(results[i].strIndex + results[i].patlen);
      } else if (results[i].desc) {
        html += sat.desc;
      } else {
        html += sat.SCC_NUM;
      }
      html += '</div></div>';
    }
    // var resultStart = performance.now();
    resultBox[0].innerHTML = html;
    resultBox.slideDown();
    resultsOpen = true;
  };

  searchBox.init = function (_satData) {
    satData = _satData;
    $('#search-results').on('click', '.search-result', function (evt) {
      var satId = $(this).data('sat-id');
      selectSat(satId);
    });

    $('#search-results').on('mouseover', '.search-result', function (evt) {
      var satId = $(this).data('sat-id');
      orbitDisplay.setHoverOrbit(satId);
      satSet.setHover(satId);

      hovering = true;
      hoverSatId = satId;
    });

    $('#search-results').mouseout(function () {
      orbitDisplay.clearHoverOrbit();
      satSet.setHover(-1);
      hovering = false;
    });

    $('#search').on('input', function () {
      // var initStart = performance.now();
      var searchStr = $('#search').val();

      searchBox.doSearch(searchStr);
    });

    $('#all-objects-link').click(function () {
      if (selectedSat === -1) {
        return;
      }
      var intldes = satSet.getSat(selectedSat).intlDes;
      var searchStr = intldes.slice(0, 8);
      searchBox.doSearch(searchStr);
      $('#search').val(searchStr);
    });
    $('#near-objects-link').click(function () {
      if (selectedSat === -1) {
        return;
      }
      var sat = selectedSat;
      var SCCs = [];
      var pos = satSet.getSat(sat).position;
      var posXmin = pos.x - 100;
      var posXmax = pos.x + 100;
      var posYmin = pos.y - 100;
      var posYmax = pos.y + 100;
      var posZmin = pos.z - 100;
      var posZmax = pos.z + 100;
      $('#search').val('');
      for (var i = 0; i < satSet.numSats; i++) {
        pos = satSet.getSat(i).position;
        if (pos.x < posXmax && pos.x > posXmin && pos.y < posYmax && pos.y > posYmin && pos.z < posZmax && pos.z > posZmin) {
          SCCs.push(satSet.getSat(i).SCC_NUM);
        }
      }

      for (i = 0; i < SCCs.length; i++) {
        if (i < SCCs.length - 1) {
          $('#search').val($('#search').val() + SCCs[i] + ',');
        } else {
          $('#search').val($('#search').val() + SCCs[i]);
        }
      }

      searchBox.doSearch($('#search').val());
    });
  };
  window.searchBox = searchBox;
})();
// **** 6 - orbit-display ***
(function () {
  var NUM_SEGS = 255;

  var glBuffers = [];
  var inProgress = [];

  var orbitDisplay = {};

  var pathShader;

  var selectOrbitBuf;
  var hoverOrbitBuf;

  var selectColor = [1.0, 0.0, 0.0, 1.0];
  var hoverColor = [0.5, 0.5, 1.0, 1.0];
  var groupColor = [0.3, 0.5, 1.0, 0.4];

  var currentHoverId = -1;
  var currentSelectId = -1;

  var orbitMvMat = mat4.create();

  var orbitWorker = new Worker('js/orbit-calculation-worker.js');

  var initialized = false;

  orbitDisplay.init = function () {
    // var startTime = performance.now();

    var vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, shaderLoader.getShaderCode('path-vertex.glsl'));
    gl.compileShader(vs);

    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, shaderLoader.getShaderCode('path-fragment.glsl'));
    gl.compileShader(fs);

    pathShader = gl.createProgram();
    gl.attachShader(pathShader, vs);
    gl.attachShader(pathShader, fs);
    gl.linkProgram(pathShader);

    pathShader.aPos = gl.getAttribLocation(pathShader, 'aPos');
    pathShader.uMvMatrix = gl.getUniformLocation(pathShader, 'uMvMatrix');
    pathShader.uCamMatrix = gl.getUniformLocation(pathShader, 'uCamMatrix');
    pathShader.uPMatrix = gl.getUniformLocation(pathShader, 'uPMatrix');
    pathShader.uColor = gl.getUniformLocation(pathShader, 'uColor');

    selectOrbitBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, selectOrbitBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array((NUM_SEGS + 1) * 3), gl.STATIC_DRAW);

    hoverOrbitBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, hoverOrbitBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array((NUM_SEGS + 1) * 3), gl.STATIC_DRAW);

    for (var i = 0; i < satSet.numSats; i++) {
      glBuffers.push(allocateBuffer());
    }
    orbitWorker.postMessage({
      isInit: true,
      satData: satSet.satDataString,
      numSegs: NUM_SEGS
    });
    initialized = true;

    // var time = performance.now() - startTime;
    // console.log('orbitDisplay init: ' + time + ' ms');
  };

  orbitDisplay.updateOrbitBuffer = function (satId, force, TLE1, TLE2, missile, latList, lonList, altList) {
    if (!inProgress[satId]) {
      if (force) {
        orbitWorker.postMessage({
          isInit: false,
          isUpdate: true,
          satId: satId,
          realTime: propRealTime,
          offset: propOffset,
          rate: propRate,
          // NOTE: STATIC TLE
          TLE1: TLE1,
          TLE2: TLE2
        });
      } else if (missile) {
        orbitWorker.postMessage({
          isInit: false,
          isUpdate: true,
          missile: true,
          satId: satId,
          latList: latList,
          lonList: lonList,
          altList: altList
        });
      } else {
        orbitWorker.postMessage({
          isInit: false,
          satId: satId,
          realTime: propRealTime,
          offset: propOffset,
          rate: propRate
        });
        inProgress[satId] = true;
      }
    } else {
    }
  };

  orbitWorker.onmessage = function (m) {
    var satId = m.data.satId;
    var pointsOut = new Float32Array(m.data.pointsOut);
    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers[satId]);
    gl.bufferData(gl.ARRAY_BUFFER, pointsOut, gl.DYNAMIC_DRAW);
    inProgress[satId] = false;
  };

  /* orbitDisplay.setOrbit = function (satId) {
    var sat = satSet.getSat(satId);
    mat4.identity(orbitMvMat);
    //apply steps in reverse order because matrix multiplication
    // (last multiplied in is first applied to vertex)

    //step 5. rotate to RAAN
    mat4.rotateZ(orbitMvMat, orbitMvMat, sat.raan + Math.PI/2);
    //step 4. incline the plane
    mat4.rotateY(orbitMvMat, orbitMvMat, -sat.inclination);
    //step 3. rotate to argument of periapsis
    mat4.rotateZ(orbitMvMat, orbitMvMat, sat.argPe - Math.PI/2);
    //step 2. put earth at the focus
    mat4.translate(orbitMvMat, orbitMvMat, [sat.semiMajorAxis - sat.apogee - RADIUS_OF_EARTH, 0, 0]);
    //step 1. stretch to ellipse
    mat4.scale(orbitMvMat, orbitMvMat, [sat.semiMajorAxis, sat.semiMinorAxis, 0]);

  };

  orbitDisplay.clearOrbit = function () {
    mat4.identity(orbitMvMat);
  } */

  orbitDisplay.setSelectOrbit = function (satId) {
   // var start = performance.now();
    currentSelectId = satId;
    orbitDisplay.updateOrbitBuffer(satId);
   // console.log('setOrbit(): ' + (performance.now() - start) + ' ms');
  };

  orbitDisplay.clearSelectOrbit = function () {
    currentSelectId = -1;
    gl.bindBuffer(gl.ARRAY_BUFFER, selectOrbitBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array((NUM_SEGS + 1) * 3), gl.DYNAMIC_DRAW);
  };

  orbitDisplay.setHoverOrbit = function (satId) {
    if (satId === currentHoverId) return;
    currentHoverId = satId;
    orbitDisplay.updateOrbitBuffer(satId);
  };

  orbitDisplay.clearHoverOrbit = function (satId) {
    if (currentHoverId === -1) return;
    currentHoverId = -1;

    gl.bindBuffer(gl.ARRAY_BUFFER, hoverOrbitBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array((NUM_SEGS + 1) * 3), gl.DYNAMIC_DRAW);
  };

  orbitDisplay.draw = function (pMatrix, camMatrix) { // lol what do I do here
    if (!initialized) return;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(pathShader);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
   // gl.depthMask(false);

    gl.uniformMatrix4fv(pathShader.uMvMatrix, false, orbitMvMat);
    gl.uniformMatrix4fv(pathShader.uCamMatrix, false, camMatrix);
    gl.uniformMatrix4fv(pathShader.uPMatrix, false, pMatrix);

    if (currentSelectId !== -1) {
      gl.uniform4fv(pathShader.uColor, selectColor);
      gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers[currentSelectId]);
      gl.vertexAttribPointer(pathShader.aPos, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.LINE_STRIP, 0, NUM_SEGS + 1);
    }

    if (currentHoverId !== -1 && currentHoverId !== currentSelectId) { // avoid z-fighting
      gl.uniform4fv(pathShader.uColor, hoverColor);
      gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers[currentHoverId]);
      gl.vertexAttribPointer(pathShader.aPos, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.LINE_STRIP, 0, NUM_SEGS + 1);
    }
    if (groups.selectedGroup !== null) {
      gl.uniform4fv(pathShader.uColor, groupColor);
      groups.selectedGroup.forEach(function (id) {
        // if (groups.selectedGroup.sats.length <= maxOrbitsDisplayed) {
        gl.bindBuffer(gl.ARRAY_BUFFER, glBuffers[id]);
        gl.vertexAttribPointer(pathShader.aPos, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINE_STRIP, 0, NUM_SEGS + 1);
        // }
      });
    }

    //  gl.depthMask(true);
    gl.disable(gl.BLEND);
  };

  function allocateBuffer () {
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array((NUM_SEGS + 1) * 3), gl.STATIC_DRAW);
    return buf;
  }

  orbitDisplay.getPathShader = function () {
    return pathShader;
  };

  window.orbitDisplay = orbitDisplay;
})();
// **** 7 - line ***
(function () {
  function Line () {
    this.vertBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(6), gl.STREAM_DRAW);
  }

  Line.prototype.set = function (pt1, pt2) {
    var buf = [];
    buf.push(pt1[0]);
    buf.push(pt1[1]);
    buf.push(pt1[2]);
    buf.push(pt2[0]);
    buf.push(pt2[1]);
    buf.push(pt2[2]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buf), gl.STREAM_DRAW);
  };

  Line.prototype.draw = function () {
    var shader = orbitDisplay.getPathShader();
    gl.useProgram(shader);
    gl.uniform4fv(shader.uColor, [1.0, 0.0, 1.0, 1.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuf);
    gl.vertexAttribPointer(shader.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, 2);
  };

  window.Line = Line;
})();

(function () {
  function FOVBubble () {
    this.vertBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(72), gl.STREAM_DRAW);
  }

  FOVBubble.prototype.set = function () {
    var buf = [
      // Front face
      -100.0, -100.0, 100.0,
      100.0, -100.0, 100.0,
      100.0, 100.0, 100.0,
      -100.0, 100.0, 100.0,

      // Back face
      -100.0, -100.0, -100.0,
      -100.0, 100.0, -100.0,
      100.0, 100.0, -100.0,
      100.0, 100.0, -100.0,

      // Top face
      -100.0, 100.0, -100.0,
      -100.0, 100.0, 100.0,
      100.0, 100.0, 100.0,
      100.0, 100.0, -100.0,

      // Bottom face
      -100.0, -100.0, -100.0,
      100.0, -100.0, -100.0,
      100.0, -100.0, 100.0,
      -100.0, -100.0, 100.0,

      // Right face
      100.0, -100.0, -100.0,
      100.0, 100.0, -100.0,
      100.0, 100.0, 100.0,
      100.0, -100.0, 100.0,

      // Left face
      -100.0, -100.0, -100.0,
      -100.0, -100.0, 100.0,
      -100.0, 100.0, 100.0,
      -100.0, 100.0, -100.0
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buf), gl.STREAM_DRAW);
  };

  FOVBubble.prototype.draw = function () {
    if (!shadersReady || !cruncherReady) return;
    var bubbleShader = orbitDisplay.getPathShader();

    gl.useProgram(bubbleShader);
    gl.disable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.uniform4fv(bubbleShader.uColor, [0.0, 1.0, 1.0, 0.2]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuf);
    gl.vertexAttribPointer(bubbleShader.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 24); // Mode, First Vertex, Number of Vertex
    gl.enable(gl.BLEND);
  };

  window.FOVBubble = FOVBubble;
})();

// **** propTime used by sun and earth.js
var realElapsedMsec;
var scaledMsec;
function propTime () {
  'use strict';
  now = new Date();
  realElapsedMsec = Number(now) - Number(propRealTime);
  scaledMsec = realElapsedMsec * propRate;
  if (propRate === 0) {
    now.setTime(Number(propFrozen) + propOffset);
  } else {
    now.setTime(Number(propRealTime) + propOffset + scaledMsec);
  }
  // console.log('propTime: ' + now + ' elapsed=' + realElapsedMsec/1000);
  return now;
}
// **** 8 - earth ***
(function () {
  var earth = {};
  var NUM_LAT_SEGS = 64;
  var NUM_LON_SEGS = 64;

  var vertPosBuf, vertNormBuf, texCoordBuf, vertIndexBuf; // GPU mem buffers, data and stuff?
  var vertCount;

  var earthShader;

  earth.pos = [0, 0, 0];

  var texture, nightTexture;

  var texLoaded = false;
  var nightLoaded = false;
  var loaded = false;

  function onImageLoaded () {
    if (texLoaded && nightLoaded) {
      loaded = true;
      $('#loader-text').text('Drawing Dots in Space...');
    }
  }

  earth.init = function () {
    // var startTime = new Date().getTime();

    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    var fragCode = shaderLoader.getShaderCode('earth-fragment.glsl');
    gl.shaderSource(fragShader, fragCode);
    gl.compileShader(fragShader);

    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    var vertCode = shaderLoader.getShaderCode('earth-vertex.glsl');
    gl.shaderSource(vertShader, vertCode);
    gl.compileShader(vertShader);

    earthShader = gl.createProgram();
    gl.attachShader(earthShader, vertShader);
    gl.attachShader(earthShader, fragShader);
    gl.linkProgram(earthShader);

    earthShader.aVertexPosition = gl.getAttribLocation(earthShader, 'aVertexPosition');
    earthShader.aTexCoord = gl.getAttribLocation(earthShader, 'aTexCoord');
    earthShader.aVertexNormal = gl.getAttribLocation(earthShader, 'aVertexNormal');
    earthShader.uPMatrix = gl.getUniformLocation(earthShader, 'uPMatrix');
    earthShader.uCamMatrix = gl.getUniformLocation(earthShader, 'uCamMatrix');
    earthShader.uMvMatrix = gl.getUniformLocation(earthShader, 'uMvMatrix');
    earthShader.uNormalMatrix = gl.getUniformLocation(earthShader, 'uNormalMatrix');
    earthShader.uLightDirection = gl.getUniformLocation(earthShader, 'uLightDirection');
    earthShader.uAmbientLightColor = gl.getUniformLocation(earthShader, 'uAmbientLightColor');
    earthShader.uDirectionalLightColor = gl.getUniformLocation(earthShader, 'uDirectionalLightColor');
    earthShader.uSampler = gl.getUniformLocation(earthShader, 'uSampler');
    earthShader.uNightSampler = gl.getUniformLocation(earthShader, 'uNightSampler');

    texture = gl.createTexture();
    var img = new Image();
    img.onload = function () {
      $('#loader-text').text('Painting the Earth...');
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      // console.log('earth.js loaded texture');
      texLoaded = true;
      onImageLoaded();
    };
    img.src = 'images/dayearth-4096.jpg';
  //  img.src = '/mercator-tex-512.jpg';

    nightTexture = gl.createTexture();
    var nightImg = new Image();
    nightImg.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, nightTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, nightImg);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      // console.log('earth.js loaded nightearth');
      nightLoaded = true;
      onImageLoaded();
    };
    nightImg.src = 'images/nightearth-4096.png';
   // nightImg.src = '/nightearth-512.jpg';

    // generate a uvsphere bottom up, CCW order
    var vertPos = [];
    var vertNorm = [];
    var texCoord = [];
    for (var lat = 0; lat <= NUM_LAT_SEGS; lat++) {
      var latAngle = (Math.PI / NUM_LAT_SEGS) * lat - (Math.PI / 2);
      var diskRadius = Math.cos(Math.abs(latAngle));
      var z = Math.sin(latAngle);
      // console.log('LAT: ' + latAngle * RAD2DEG + ' , Z: ' + z);
      // var i = 0;
      for (var lon = 0; lon <= NUM_LON_SEGS; lon++) { // add an extra vertex for texture funness
        var lonAngle = (Math.PI * 2 / NUM_LON_SEGS) * lon;
        var x = Math.cos(lonAngle) * diskRadius;
        var y = Math.sin(lonAngle) * diskRadius;
        // console.log('i: ' + i + '    LON: ' + lonAngle * RAD2DEG + ' X: ' + x + ' Y: ' + y)

        // mercator cylindrical projection (simple angle interpolation)
        var v = 1 - (lat / NUM_LAT_SEGS);
        var u = 0.5 + (lon / NUM_LON_SEGS); // may need to change to move map
        // console.log('u: ' + u + ' v: ' + v);
        // normals: should just be a vector from center to point (aka the point itself!

        vertPos.push(x * RADIUS_OF_EARTH);
        vertPos.push(y * RADIUS_OF_EARTH);
        vertPos.push(z * RADIUS_OF_EARTH);
        texCoord.push(u);
        texCoord.push(v);
        vertNorm.push(x);
        vertNorm.push(y);
        vertNorm.push(z);

        // i++;
      }
    }

    // ok let's calculate vertex draw orders.... indiv triangles
    var vertIndex = [];
    for (lat = 0; lat < NUM_LAT_SEGS; lat++) { // this is for each QUAD, not each vertex, so <
      for (lon = 0; lon < NUM_LON_SEGS; lon++) {
        var blVert = lat * (NUM_LON_SEGS + 1) + lon; // there's NUM_LON_SEGS + 1 verts in each horizontal band
        var brVert = blVert + 1;
        var tlVert = (lat + 1) * (NUM_LON_SEGS + 1) + lon;
        var trVert = tlVert + 1;
        // console.log('bl: ' + blVert + ' br: ' + brVert +  ' tl: ' + tlVert + ' tr: ' + trVert);
        vertIndex.push(blVert);
        vertIndex.push(brVert);
        vertIndex.push(tlVert);

        vertIndex.push(tlVert);
        vertIndex.push(trVert);
        vertIndex.push(brVert);
      }
    }
    vertCount = vertIndex.length;

    vertPosBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertPosBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

    vertNormBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertNormBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertNorm), gl.STATIC_DRAW);

    texCoordBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoord), gl.STATIC_DRAW);

    vertIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertIndexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertIndex), gl.STATIC_DRAW);

    // var end = new Date().getTime() - startTime;
    // console.log('earth init: ' + end + ' ms');
  };

  $('#datetime-text').click(function () {
    if (!isEditTime) {
      $('#datetime-text').fadeOut();
      $('#datetime-input').fadeIn();
      $('#datetime-input-tb').focus();
      isEditTime = true;
    }
  });

  earth.draw = function (pMatrix, camMatrix) {
    if (!loaded) return;

    // var now = new Date();
    earthNow = propTime();

    // wall time is not propagation time, so better print it
    // TODO substring causes 12kb memory leak every frame.
    tDS = earthNow.toJSON();
    timeTextStr = tDS.substring(0, 10) + ' ' + tDS.substring(11, 19);
    if (isPropRateChange) {
      if (propRate > 1.01 || propRate < 0.99) {
        if (propRate < 10) $('#propRate-status-box').html('Propagation Speed: ' + propRate.toFixed(1) + 'x');
        if (propRate >= 10) $('#propRate-status-box').html('Propagation Speed: ' + propRate.toFixed(2) + 'x');
        $('#propRate-status-box').show();
        isPropRateVisible = true;
      } else {
        if (isPropRateVisible) {
          $('#propRate-status-box').hide();
          isPropRateVisible = false;
        }
      }
      isPropRateChange = false;
    }

    // NOTE: jQuery call was causing additional Node every iteration.
    document.getElementById('datetime-text').innerText = timeTextStr;

    // Don't update the time input unless it is currently being viewed.
    if (isEditTime) {
      $('#datetime-input-tb').val(timeTextStr);
    }

    earthJ = jday(earthNow.getUTCFullYear(),
                 earthNow.getUTCMonth() + 1, // NOTE:, this function requires months in range 1-12.
                 earthNow.getUTCDate(),
                 earthNow.getUTCHours(),
                 earthNow.getUTCMinutes(),
                 earthNow.getUTCSeconds());
    earthJ += earthNow.getUTCMilliseconds() * MILLISECONDS_PER_DAY;

    earthEra = satellite.gstime_from_jday(earthJ);

    lightDirection = sun.currentDirection();
    vec3.normalize(lightDirection, lightDirection);

    mvMatrix = mat4.create();
    mat4.identity(mvMatrix);
    mat4.rotateZ(mvMatrix, mvMatrix, earthEra);
    mat4.translate(mvMatrix, mvMatrix, earth.pos);
    nMatrix = mat3.create();
    mat3.normalFromMat4(nMatrix, mvMatrix);

    gl.useProgram(earthShader);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.uniformMatrix3fv(earthShader.uNormalMatrix, false, nMatrix);
    gl.uniformMatrix4fv(earthShader.uMvMatrix, false, mvMatrix);
    gl.uniformMatrix4fv(earthShader.uPMatrix, false, pMatrix);
    gl.uniformMatrix4fv(earthShader.uCamMatrix, false, camMatrix);
    gl.uniform3fv(earthShader.uLightDirection, lightDirection);
    gl.uniform3fv(earthShader.uAmbientLightColor, [0.03, 0.03, 0.03]); // RGB ambient light
    gl.uniform3fv(earthShader.uDirectionalLightColor, [1, 1, 0.9]); // RGB directional light

    gl.uniform1i(earthShader.uSampler, 0); // point sampler to TEXTURE0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture); // bind texture to TEXTURE0

    gl.uniform1i(earthShader.uNightSampler, 1);  // point sampler to TEXTURE1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, nightTexture); // bind tex to TEXTURE1

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuf);
    gl.enableVertexAttribArray(earthShader.aTexCoord);
    gl.vertexAttribPointer(earthShader.aTexCoord, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertPosBuf);
    gl.enableVertexAttribArray(earthShader.aVertexPosition);
    gl.vertexAttribPointer(earthShader.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(gl.pickShaderProgram.aPos, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertNormBuf);
    gl.enableVertexAttribArray(earthShader.aVertexNormal);
    gl.vertexAttribPointer(earthShader.aVertexNormal, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertIndexBuf);
    gl.drawElements(gl.TRIANGLES, vertCount, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(gl.pickShaderProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, gl.pickFb);
    // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.uniformMatrix4fv(gl.pickShaderProgram.uMvMatrix, false, mvMatrix); // set up picking
    gl.disableVertexAttribArray(gl.pickShaderProgram.aColor);
    gl.enableVertexAttribArray(gl.pickShaderProgram.aPos);
    gl.drawElements(gl.TRIANGLES, vertCount, gl.UNSIGNED_SHORT, 0);
  };

  window.earth = earth;
})();
// **** 9 - sun ***
(function () {
  var j, n, L, g, ecLon, ob, x, y, z, obliq, t;
  function currentDirection () {
    now = propTime();
    j = jday(now.getUTCFullYear(),
                 now.getUTCMonth() + 1, // NOTE:, this function requires months in range 1-12.
                 now.getUTCDate(),
                 now.getUTCHours(),
                 now.getUTCMinutes(),
                 now.getUTCSeconds());
    j += now.getUTCMilliseconds() * MILLISECONDS_PER_DAY;

    return getDirection(j);
  }

  function getDirection (jd) {
    n = jd - 2451545;
    L = (280.460) + (0.9856474 * n); // mean longitude of sun
    g = (357.528) + (0.9856003 * n); // mean anomaly
    L = L % 360.0;
    g = g % 360.0;

    ecLon = L + 1.915 * Math.sin(g * DEG2RAD) + 0.020 * Math.sin(2 * g * DEG2RAD);
    ob = getObliquity(jd);

    x = Math.cos(ecLon * DEG2RAD);
    y = Math.cos(ob * DEG2RAD) * Math.sin(ecLon * DEG2RAD);
    z = Math.sin(ob * DEG2RAD) * Math.sin(ecLon * DEG2RAD);

    return [x, y, z];
   // return [1, 0, 0];
  }

  function getObliquity (jd) {
    t = (jd - 2451545) / 3652500;

    obliq = 84381.448 - 4680.93 * t - 1.55 * Math.pow(t, 2) + 1999.25 *
    Math.pow(t, 3) - 51.38 * Math.pow(t, 4) - 249.67 * Math.pow(t, 5) -
    39.05 * Math.pow(t, 6) + 7.12 * Math.pow(t, 7) + 27.87 * Math.pow(t, 8) +
    5.79 * Math.pow(t, 9) + 2.45 * Math.pow(t, 10);

    /* Human Readable Version
    var ob =  // arcseconds
      84381.448
     - 4680.93  * t
     -    1.55  * Math.pow(t, 2)
     + 1999.25  * Math.pow(t, 3)
     -   51.38  * Math.pow(t, 4)
     -  249.67  * Math.pow(t, 5)
     -   39.05  * Math.pow(t, 6)
     +    7.12  * Math.pow(t, 7)
     +   27.87  * Math.pow(t, 8)
     +    5.79  * Math.pow(t, 9)
     +    2.45  * Math.pow(t, 10);
     */

    return obliq / 3600.0;
  }

  window.sun = {
    getDirection: getDirection,
    currentDirection: currentDirection
  };
})();

var jDayStart;
var jDayDiff;

function jday (year, mon, day, hr, minute, sec) { // from satellite.js
  'use strict';

  if (!year) {
    now = Date.now();
    jDayStart = new Date(now.getFullYear(), 0, 0);
    jDayDiff = now - jDayStart;
    return Math.floor(jDayDiff / MILLISECONDS_PER_DAY);
  } else {
    return (367.0 * year -
          Math.floor((7 * (year + Math.floor((mon + 9) / 12.0))) * 0.25) +
          Math.floor(275 * mon / 9.0) +
          day + 1721013.5 +
          ((sec / 60.0 + minute) / 60.0 + hr) / 24.0  //  ut in days
          // #  - 0.5*sgn(100.0*year + mon - 190002.5) + 0.5;
          );
  }
}

// **** 10 - sat ***
(function () {
  var satSet = {};
  var dotShader;
  var satPosBuf;
  var satColorBuf;
  var pickColorBuf;
  var pickableBuf;
  var currentColorScheme;

  var satPos;
  var satVel;
  var satInView;
  var satData;
  var satExtraData;
  var hoveringSat = -1;
  // var selectedSat = -1;
  var hoverColor = [0.1, 1.0, 0.0, 1.0];
  var selectedColor = [0.0, 1.0, 1.0, 1.0];

  try {
    $('#loader-text').text('Locating ELSETs...');
    satCruncher = new Worker('js/sat-cruncher.js');
  } catch (E) {
    browserUnsupported();
  }

  /**
   * NOTE: These variables are here rather inside the function because as they
   * loop each iteration it was causing the jsHeap to grow. This isn't noticeable
   * on faster computers because the garbage collector takes care of it, but on
   * slower computers it would noticeably lag when the garbage collector ran.
   *
   * The arbitrary convention used is to put the name of the loop/function the
   * variable is part of at the front of what the name used to be
   * (ex: now --> drawNow) (ex: i --> SCi)
  */

  // draw Loop
  var drawNow = 0;
  var lastDrawTime = 0;
  var drawDivisor;
  var drawDt;
  var drawI;

  var SCi; // Sat Cruncher i loop
  var SCnow = 0;

  var lastFOVUpdateTime = 0;
  var cruncherReadyCallback;
  var gotExtraData = false;

  satCruncher.onmessage = function (m) {
    if (!gotExtraData) { // store extra data that comes from crunching
      // Only do this once

      satExtraData = JSON.parse(m.data.extraData);

      for (SCi = 0; SCi < satSet.numSats; SCi++) {
        satData[SCi].inclination = satExtraData[SCi].inclination;
        satData[SCi].eccentricity = satExtraData[SCi].eccentricity;
        satData[SCi].raan = satExtraData[SCi].raan;
        satData[SCi].argPe = satExtraData[SCi].argPe;
        satData[SCi].meanMotion = satExtraData[SCi].meanMotion;

        satData[SCi].semiMajorAxis = satExtraData[SCi].semiMajorAxis;
        satData[SCi].semiMinorAxis = satExtraData[SCi].semiMinorAxis;
        satData[SCi].apogee = satExtraData[SCi].apogee;
        satData[SCi].perigee = satExtraData[SCi].perigee;
        satData[SCi].period = satExtraData[SCi].period;
      }

      gotExtraData = true;
      return;
    }

    if (m.data.extraUpdate) {
      satExtraData = JSON.parse(m.data.extraData);
      SCi = m.data.satId;

      satData[SCi].inclination = satExtraData[0].inclination;
      satData[SCi].eccentricity = satExtraData[0].eccentricity;
      satData[SCi].raan = satExtraData[0].raan;
      satData[SCi].argPe = satExtraData[0].argPe;
      satData[SCi].meanMotion = satExtraData[0].meanMotion;

      satData[SCi].semiMajorAxis = satExtraData[0].semiMajorAxis;
      satData[SCi].semiMinorAxis = satExtraData[0].semiMinorAxis;
      satData[SCi].apogee = satExtraData[0].apogee;
      satData[SCi].perigee = satExtraData[0].perigee;
      satData[SCi].period = satExtraData[0].period;
      satData[SCi].TLE1 = satExtraData[0].TLE1;
      satData[SCi].TLE2 = satExtraData[0].TLE2;
      return;
    }

    satPos = new Float32Array(m.data.satPos);
    satVel = new Float32Array(m.data.satVel);
    satInView = new Float32Array(m.data.satInView);

    if (isMapMenuOpen || mapUpdateOverride) {
      SCnow = Date.now();
      if (SCnow > lastMapUpdateTime + 30000) {
        updateMap();
        lastMapUpdateTime = SCnow;
        mapUpdateOverride = false;
      } else if (mapUpdateOverride) {
        updateMap();
        lastMapUpdateTime = SCnow;
        mapUpdateOverride = false;
      }
    }

    if (socratesOnSatCruncher) {
      selectSat(socratesOnSatCruncher);
      socratesOnSatCruncher = null;
    }

    if (currentColorScheme === ColorScheme.default && !lookangles.sensorSelected()) {
      // Don't force color recalc if default colors and no sensor for inview color
    } else {
      satSet.setColorScheme(currentColorScheme); // force color recalc
    }

    if (!cruncherReady) {
      // NOTE:: This is called right after all the objects load on the screen.

      // Version Info Updated
      $('#version-info').html(VERSION_NUMBER);
      $('#version-info').tooltip({delay: 50, tooltip: VERSION_DATE, position: 'top'});

      // Loading Screen Resized
      $('#loading-screen').removeClass('full-loader');
      $('#loading-screen').addClass('mini-loader-container');
      $('#logo-inner-container').addClass('mini-loader');
      $('#logo-text').html('');
      $('#loader-text').html('Attempting to Math...');

      // Hide Menus on Small Screens
      if ($(document).width() <= 1000) {
        // TODO FullScreen Option
        // document.documentElement.webkitRequestFullScreen();
        $('#menu-sensor-info img').hide();
        $('#menu-in-coverage img').hide();
        // $('#menu-lookangles img').removeClass('bmenu-item-disabled');
        // $('#menu-lookanglesmultisite img').removeClass('bmenu-item-disabled');
        $('#zoom-in').show();
        $('#zoom-out').show();
        $('#zoom-in img').removeClass('bmenu-item-disabled');
        $('#zoom-out img').removeClass('bmenu-item-disabled');
        $('#menu-find-sat img').removeClass('bmenu-item-disabled');
        $('#menu-twitter img').hide();
        $('#menu-weather img').hide();
        // $('#menu-map img').removeClass('bmenu-item-disabled');
        $('#menu-launches img').hide();
        $('#menu-about img').removeClass('bmenu-item-disabled');
        $('#menu-about img').attr('style', 'border-right:0px;');
        $('#menu-space-stations img').hide();
        $('#menu-satellite-collision img').removeClass('bmenu-item-disabled');
        $('#menu-customSensor img').removeClass('bmenu-item-disabled');
        $('#menu-settings').hide();
        $('#menu-editSat img').show();
        $('#menu-newLaunch img').hide();
        $('#menu-missile img').show();
        $('#social').hide();
        $('#version-info').hide();
        $('#legend-menu').hide();
        $('#mobile-warning').show();
        $('#changelog-row').addClass('center-align');
        $('#fastCompSettings').hide();
        $('#social-alt').show();
        $('.side-menu').attr('style', 'width:100%;height:auto;');
        $('#canvas-holder').attr('style', 'overflow:auto;');
        $('#datetime').attr('style', 'position:fixed;left:130px;top:10px;width:141px;height:32px');
        $('#datetime-text').attr('style', 'padding:6px;height:100%;');
        $('#datetime-input').attr('style', 'bottom:0px;');
        $('#bottom-icons').attr('style', 'position:inherit;');
        $('#mobile-controls').show();
        $('#search').attr('style', 'width:55px;');
        if ($(document).height() >= 600) {
          $('#sat-infobox').attr('style', 'width:100%;top:60%;');
        } else {
          $('#sat-infobox').attr('style', 'width:100%;top:50%;');
        }
      }

      /** Hide SOCRATES menu if not all the satellites are currently available to view */
      if (limitSats !== '') {
        $('#menu-satellite-collision img').hide();
      }

      // Hide More Stuff on Little Screens
      if ($(document).width() <= 400) {
        $('#menu-satellite-collision img').hide();
        $('#reddit-share').hide();
        $('#menu-find-sat').hide();
        $('#sat-infobox').attr('style', 'width:100%;top:60%;');
        $('#datetime').attr('style', 'position:fixed;left:85px;top:10px;width:141px;height:32px');
      }

      // $('#load-cover').fadeOut();
      $('#loading-screen').fadeOut();
      $('body').attr('style', 'background:black');
      $('#canvas-holder').attr('style', 'display:block');
      // $('#menu-sensor-info img').removeClass('bmenu-item-disabled');
      // $('#menu-in-coverage img').removeClass('bmenu-item-disabled');
      // $('#menu-lookangles img').removeClass('bmenu-item-disabled');
      // $('#menu-lookanglesmultisite img').removeClass('bmenu-item-disabled');
      $('#menu-find-sat img').removeClass('bmenu-item-disabled');
      $('#menu-twitter img').removeClass('bmenu-item-disabled');
      // $('#menu-weather img').removeClass('bmenu-item-disabled');
      // $('#menu-map img').removeClass('bmenu-item-disabled');
      // $('#menu-space-weather img').removeClass('bmenu-item-disabled');
      $('#menu-launches img').removeClass('bmenu-item-disabled');
      $('#menu-about img').removeClass('bmenu-item-disabled');
      $('#menu-space-stations img').removeClass('bmenu-item-disabled');
      $('#menu-satellite-collision img').removeClass('bmenu-item-disabled');
      $('#menu-customSensor img').removeClass('bmenu-item-disabled');
      $('#menu-missile img').removeClass('bmenu-item-disabled');
      $('#menu-settings img').removeClass('bmenu-item-disabled');
      isBottomIconsEnabled = true;
      satSet.setColorScheme(currentColorScheme); // force color recalc
      cruncherReady = true;
      if (cruncherReadyCallback) {
        cruncherReadyCallback(satData);
      }

      if ($(window).width() > $(window).height()) {
        mapWidth = $(window).width(); // Subtract 12 px for the scroll
        $('#map-image').width(mapWidth);
        mapHeight = mapWidth * 3 / 4;
        $('#map-image').height(mapHeight);
        $('#map-menu').width($(window).width());
      } else {
        mapHeight = $(window).height() - 100; // Subtract 12 px for the scroll
        $('#map-image').height(mapHeight);
        mapWidth = mapHeight * 4 / 3;
        $('#map-image').width(mapWidth);
        $('#map-menu').width($(window).width());
      }
    }

    satExtraData = null;
  };

  satSet.init = function (satsReadyCallback) {
    /** Parses GET variables for Possible sharperShaders */
    (function parseFromGETVariables () {
      var queryStr = window.location.search.substring(1);
      var params = queryStr.split('&');
      for (var i = 0; i < params.length; i++) {
        var key = params[i].split('=')[0];
        if (key === 'sharperShaders') {
          isSharperShaders = true;
          document.getElementById('settings-shaders').checked = true;
        }
      }
    })();

    dotShader = gl.createProgram();

    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    if (isSharperShaders) {
      gl.shaderSource(vertShader, shaderLoader.getShaderCode('dot-vertex-sharp.glsl'));
    } else {
      gl.shaderSource(vertShader, shaderLoader.getShaderCode('dot-vertex.glsl'));
    }
    gl.compileShader(vertShader);

    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, shaderLoader.getShaderCode('dot-fragment.glsl'));
    gl.compileShader(fragShader);

    gl.attachShader(dotShader, vertShader);
    gl.attachShader(dotShader, fragShader);
    gl.linkProgram(dotShader);

    dotShader.aPos = gl.getAttribLocation(dotShader, 'aPos');
    dotShader.aColor = gl.getAttribLocation(dotShader, 'aColor');
    dotShader.uMvMatrix = gl.getUniformLocation(dotShader, 'uMvMatrix');
    dotShader.uCamMatrix = gl.getUniformLocation(dotShader, 'uCamMatrix');
    dotShader.uPMatrix = gl.getUniformLocation(dotShader, 'uPMatrix');

    var tleSource = $('#tle-source').text();
    $.get('' + tleSource, function (resp) { // + '?fakeparameter=to_avoid_browser_cache'
      var obslatitude;
      var obslongitude;
      var obsheight;
      var obsminaz;
      var obsmaxaz;
      var obsminel;
      var obsmaxel;
      var obsminrange;
      var obsmaxrange;
      var limitSatsArray = [];

      /** Parses GET variables for SatCruncher initialization */
      (function parseFromGETVariables () {
        var queryStr = window.location.search.substring(1);
        var params = queryStr.split('&');
        for (var i = 0; i < params.length; i++) {
          var key = params[i].split('=')[0];
          var val = params[i].split('=')[1];
          switch (key) {
            case 'limitSats':
              limitSats = val;
              $('#limitSats').val(val);
              document.getElementById('settings-limitSats-enabled').checked = true;
              $('#limitSats-Label').addClass('active');
              limitSatsArray = val.split(',');
              break;
            case 'lat':
              obslatitude = val;
              break;
            case 'long':
              obslongitude = val;
              break;
            case 'hei':
              obsheight = val;
              break;
            case 'minaz':
              obsminaz = val;
              break;
            case 'maxaz':
              obsmaxaz = val;
              break;
            case 'minel':
              obsminel = val;
              break;
            case 'maxel':
              obsmaxel = val;
              break;
            case 'minrange':
              obsminrange = val;
              break;
            case 'maxrange':
              obsmaxrange = val;
              break;
          }
        }
        // TODO: Create logical checks to prevent 'bad' sesnors from being generated
      })();

      /**
       * Filters out extra satellites if limitSats is set
       * @param  limitSats Array of satellites
       * @return Returns only requested satellites if limitSats is setobs
       */
      function filterTLEDatabase (limitSatsArray) {
        var tempSatData = [];
        if (limitSatsArray[0] == null) { // If there are no limits then just process like normal
          limitSats = '';
        }

        for (var i = 0; i < resp.length; i++) {
          resp[i].SCC_NUM = pad(resp[i].TLE1.substr(2, 5).trim(), 5);
          var year;
          var prefix;
          var rest;
          if (limitSats === '') { // If there are no limits then just process like normal
            year = resp[i].TLE1.substr(9, 8).trim().substring(0, 2); // clean up intl des for display
            if (year === '') {
              resp[i].intlDes = 'none';
            } else {
              prefix = (year > 50) ? '19' : '20';
              year = prefix + year;
              rest = resp[i].TLE1.substr(9, 8).trim().substring(2);
              resp[i].intlDes = year + '-' + rest;
            }
            resp[i].id = i;
            resp[i].active = true;
            tempSatData.push(resp[i]);
            continue;
          } else { // If there are limited satellites
            for (var x = 0; x < limitSatsArray.length; x++) {
              if (resp[i].SCC_NUM === limitSatsArray[x]) {
                year = resp[i].TLE1.substr(9, 8).trim().substring(0, 2); // clean up intl des for display
                if (year === '') {
                  resp[i].intlDes = 'none';
                } else {
                  prefix = (year > 50) ? '19' : '20';
                  year = prefix + year;
                  rest = resp[i].TLE1.substr(9, 8).trim().substring(2);
                  resp[i].intlDes = year + '-' + rest;
                }
                resp[i].id = i;
                resp[i].active = true;
                tempSatData.push(resp[i]);
              }
            }
          }
        }
        for (i = 0; i < tleManager.staticSet.length; i++) {
          tempSatData.push(tleManager.staticSet[i]);
        }
        for (i = 0; i < tleManager.analSatSet.length; i++) {
          tleManager.analSatSet[i].id = tempSatData.length;
          tempSatData.push(tleManager.analSatSet[i]);
        }
        for (i = 0; i < tleManager.missileSet.length; i++) {
          tempSatData.push(tleManager.missileSet[i]);
        }
        // console.log(tempSatData.length);
        return tempSatData;
      }

      satData = filterTLEDatabase(limitSatsArray);
      resp = null;
      satSet.satDataString = JSON.stringify(satData);

      propRealTime = Date.now(); // assumed same as value in Worker, not passing

      /** If custom sensor set then send parameters to lookangles and satCruncher */
      if (obslatitude !== undefined && obslongitude !== undefined && obsheight !== undefined && obsminaz !== undefined && obsmaxaz !== undefined && obsminel !== undefined &&
          obsmaxel !== undefined && obsminrange !== undefined && obsmaxrange !== undefined) {
        lookangles.setobs({
          lat: obslatitude,
          long: obslongitude,
          obshei: obsheight,
          obsminaz: obsminaz,
          obsmaxaz: obsmaxaz,
          obsminel: obsminel,
          obsmaxel: obsmaxel,
          obsminrange: obsminrange,
          obsmaxrange: obsmaxrange
        });

        satCruncher.postMessage({
          typ: 'offset',
          dat: (propOffset).toString() + ' ' + (propRate).toString(),
          setlatlong: true,
          lat: obslatitude,
          long: obslongitude,
          obshei: obsheight,
          obsminaz: obsminaz,
          obsmaxaz: obsmaxaz,
          obsminel: obsminel,
          obsmaxel: obsmaxel,
          obsminrange: obsminrange,
          obsmaxrange: obsmaxrange
        });

        $('#menu-in-coverage img').removeClass('bmenu-item-disabled');
      }

      /** Send satDataString to satCruncher to begin propagation loop */
      satCruncher.postMessage({
        typ: 'satdata',
        dat: satSet.satDataString
      });
      $('#loader-text').text('Drawing Satellites...');

      // populate GPU mem buffers, now that we know how many sats there are
      satPosBuf = gl.createBuffer();
      satPos = new Float32Array(satData.length * 3);

      var pickColorData = [];
      pickColorBuf = gl.createBuffer();
      for (var i = 0; i < satData.length; i++) {
        var byteR = (i + 1) & 0xff;
        var byteG = ((i + 1) & 0xff00) >> 8;
        var byteB = ((i + 1) & 0xff0000) >> 16;
        pickColorData.push(byteR / 255.0);
        pickColorData.push(byteG / 255.0);
        pickColorData.push(byteB / 255.0);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, pickColorBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pickColorData), gl.STATIC_DRAW);

      satSet.numSats = satData.length;

      satSet.setColorScheme(ColorScheme.default);

      shadersReady = true;
      if (satsReadyCallback) {
        $('#loader-text').text('Coloring Inside the Lines...');
        satsReadyCallback(satData);
      }
    });
  };

  satSet.getSatData = function () {
    return satData;
  };

  satSet.setColorScheme = function (scheme) {
    currentColorScheme = scheme;
    var buffers = scheme.calculateColorBuffers();
    satColorBuf = buffers.colorBuf;
    pickableBuf = buffers.pickableBuf;
  };

  satSet.draw = function (pMatrix, camMatrix) {
    // NOTE: 640 byte leak.

    if (!shadersReady || !cruncherReady) return;

    drawNow = Date.now();
    drawDivisor = Math.max(propRate, 0.001);
    drawDt = Math.min((drawNow - lastDrawTime) / 1000.0, 1.0 / drawDivisor);
    for (drawI = 0; drawI < (satData.length * 3); drawI++) {
      satPos[drawI] += satVel[drawI] * drawDt * propRate;
    }
    // console.log('interp dt=' + dt + ' ' + drawNow);

    gl.useProgram(dotShader);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    //  gl.bindFramebuffer(gl.FRAMEBUFFER, gl.pickFb);

    gl.uniformMatrix4fv(dotShader.uMvMatrix, false, mat4.create());
    gl.uniformMatrix4fv(dotShader.uCamMatrix, false, camMatrix);
    gl.uniformMatrix4fv(dotShader.uPMatrix, false, pMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, satPosBuf);
    gl.bufferData(gl.ARRAY_BUFFER, satPos, gl.STREAM_DRAW);
    gl.vertexAttribPointer(dotShader.aPos, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, satColorBuf);
    gl.enableVertexAttribArray(dotShader.aColor);
    gl.vertexAttribPointer(dotShader.aColor, 4, gl.FLOAT, false, 0, 0);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.depthMask(false);

    gl.drawArrays(gl.POINTS, 0, satData.length);

    gl.depthMask(true);
    gl.disable(gl.BLEND);

    // now pickbuffer stuff......

    gl.useProgram(gl.pickShaderProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, gl.pickFb);
    //  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.uniformMatrix4fv(gl.pickShaderProgram.uMvMatrix, false, mat4.create());
    gl.uniformMatrix4fv(gl.pickShaderProgram.uCamMatrix, false, camMatrix);
    gl.uniformMatrix4fv(gl.pickShaderProgram.uPMatrix, false, pMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, satPosBuf);
    gl.enableVertexAttribArray(gl.pickShaderProgram.aPos);
    gl.vertexAttribPointer(gl.pickShaderProgram.aPos, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(gl.pickShaderProgram.aColor);
    gl.bindBuffer(gl.ARRAY_BUFFER, pickColorBuf);
    gl.vertexAttribPointer(gl.pickShaderProgram.aColor, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, pickableBuf);
    gl.enableVertexAttribArray(gl.pickShaderProgram.aPickable);
    gl.vertexAttribPointer(gl.pickShaderProgram.aPickable, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, satData.length); // draw pick

    lastDrawTime = drawNow;
    satSet.updateFOV(null, drawNow);
  };

  var uFOVSearchItems;
  var inViewObs = [];
  satSet.updateFOV = function (curSCC, now) {
    if (now - lastFOVUpdateTime > 1 * 1000 / propRate && isBottomMenuOpen === true) { // If it has been 1 seconds since last update that the menu is open
      curObjsHTML = document.getElementById('bottom-menu');
      inViewObs = [];
      curObjsHTML.innerHTML = '';
      for (uFOVi = 0; uFOVi < (satData.length); uFOVi++) {
        if ($('#search').val() === '') {
          if (satData[uFOVi].inview) {
            inViewObs.push(satData[uFOVi].SCC_NUM);
          }
        } else {
          uFOVSearchItems = $('#search').val().split(',');
          for (uFOVs = 0; uFOVs < ($('#datetime-text').length); uFOVs++) {
            if (satData[uFOVi].inview && satData[uFOVi].SCC_NUM === uFOVSearchItems[uFOVs]) {
              inViewObs.push(satData[uFOVi].SCC_NUM);
            }
          }
        }
      }
      curObjsHTMLText = '';
      for (uFOVi = 0; uFOVi < inViewObs.length; uFOVi++) {
        curObjsHTMLText += "<span class='FOV-object link'>" + inViewObs[uFOVi] + '</span>\n';
      }
      curObjsHTML.innerHTML = curObjsHTMLText;
      lastFOVUpdateTime = now;
    }
  };

  satSet.setSat = function (i, satObject) {
    if (!satData) return null;
    satData[i] = satObject;
  };

  satSet.getSat = function (i) {
    if (!satData) return null;

    var ret = satData[i];
    if (!ret) return null;
    if (gotExtraData) {
      // ret.perigee = satData[i].perigee;
      ret.inview = satInView[i];
      ret.velocity = Math.sqrt(
        satVel[i * 3] * satVel[i * 3] +
        satVel[i * 3 + 1] * satVel[i * 3 + 1] +
        satVel[i * 3 + 2] * satVel[i * 3 + 2]
      );
      // ret.altitude = lookangles.altitude;
      // ret.longitude = lookangles.lon;
      // ret.latitude = lookangles.lat;
      // ret.azimuth = lookangles.azimuth;
      // ret.elevation = lookangles.elevation;
      // ret.range = lookangles.range;
      ret.position = {
        x: satPos[i * 3],
        y: satPos[i * 3 + 1],
        z: satPos[i * 3 + 2]
      };
    }

    return ret;
  };

  satSet.getIdFromIntlDes = function (intlDes) {
    for (var i = 0; i < satData.length; i++) {
      if (satData[i].intlDes === intlDes) {
        return i;
      }
    }
    return null;
  };

  function pad (str, max) {
    return str.length < max ? pad('0' + str, max) : str;
  }

  satSet.getIdFromObjNum = function (objNum) {
    for (var i = 0; i < satData.length; i++) {
      if (satData[i].static || satData[i].missile) {
        continue;
      } else {
        var scc = pad(satData[i].TLE1.substr(2, 5).trim(), 5);
      }

      if (scc.indexOf(objNum) === 0) { // && satData[i].OBJECT_TYPE !== 'unknown') { // OPTIMIZATION: Determine if this code can be removed.
        return i;
      }
    }
    return null;
  };

  satSet.getScreenCoords = function (i, pMatrix, camMatrix) {
    var pos = satSet.getSat(i).position;
    var posVec4 = vec4.fromValues(pos.x, pos.y, pos.z, 1);
    // var transform = mat4.create();

    vec4.transformMat4(posVec4, posVec4, camMatrix);
    vec4.transformMat4(posVec4, posVec4, pMatrix);

    var glScreenPos = {
      x: (posVec4[0] / posVec4[3]),
      y: (posVec4[1] / posVec4[3]),
      z: (posVec4[2] / posVec4[3])
    };

    return {
      x: (glScreenPos.x + 1) * 0.5 * window.innerWidth,
      y: (-glScreenPos.y + 1) * 0.5 * window.innerHeight
    };
  };

  satSet.searchNameRegex = function (regex) {
    var res = [];
    for (var i = 0; i < satData.length; i++) {
      if (regex.test(satData[i].ON)) {
        res.push(i);
      }
    }
    return res;
  };

  satSet.searchCountryRegex = function (regex) {
    var res = [];
    for (var i = 0; i < satData.length; i++) {
      if (regex.test(satData[i].C)) {
        res.push(i);
      }
    }
    return res;
  };

  satSet.searchAzElRange = function (azimuth, elevation, range, inclination, azMarg, elMarg, rangeMarg, incMarg, period, periodMarg) {
    var isCheckAz = !isNaN(parseFloat(azimuth)) && isFinite(azimuth);
    var isCheckEl = !isNaN(parseFloat(elevation)) && isFinite(elevation);
    var isCheckRange = !isNaN(parseFloat(range)) && isFinite(range);
    var isCheckInclination = !isNaN(parseFloat(inclination)) && isFinite(inclination);
    var isCheckPeriod = !isNaN(parseFloat(period)) && isFinite(period);
    var isCheckAzMarg = !isNaN(parseFloat(azMarg)) && isFinite(azMarg);
    var isCheckElMarg = !isNaN(parseFloat(elMarg)) && isFinite(elMarg);
    var isCheckRangeMarg = !isNaN(parseFloat(rangeMarg)) && isFinite(rangeMarg);
    var isCheckIncMarg = !isNaN(parseFloat(incMarg)) && isFinite(incMarg);
    var isCheckPeriodMarg = !isNaN(parseFloat(periodMarg)) && isFinite(periodMarg);
    if (!isCheckEl && !isCheckRange && !isCheckAz && !isCheckInclination && !isCheckPeriod) return; // Ensure there is a number typed.

    if (!isCheckAzMarg) { azMarg = 5; }
    if (!isCheckElMarg) { elMarg = 5; }
    if (!isCheckRangeMarg) { rangeMarg = 200; }
    if (!isCheckIncMarg) { incMarg = 1; }
    if (!isCheckPeriodMarg) { periodMarg = 0.5; }
    var res = [];

    var s = 0;
    for (var i = 0; i < satData.length; i++) {
      if (satData[i].static || satData[i].missile || !satData[i].active) { continue; }
      res.push(satData[i]);
      lookangles.getTEARR(res[s]);
      res[s]['azimuth'] = lookangles.azimuth;
      res[s]['elevation'] = lookangles.elevation;
      res[s]['range'] = lookangles.range;
      res[s]['inview'] = lookangles.inview;
      s++;
    }

    if (!isCheckInclination && !isCheckPeriod) {
      res = checkInview(res);
    }

    if (isCheckAz) {
      azimuth = azimuth * 1; // Convert azimuth to int
      azMarg = azMarg * 1;
      var minaz = azimuth - azMarg;
      var maxaz = azimuth + azMarg;
      res = checkAz(res, minaz, maxaz);
    }

    if (isCheckEl) {
      elevation = elevation * 1; // Convert elevation to int
      elMarg = elMarg * 1;
      var minel = elevation - elMarg;
      var maxel = elevation + elMarg;
      res = checkEl(res, minel, maxel);
    }

    if (isCheckRange) {
      range = range * 1; // Convert range to int
      rangeMarg = rangeMarg * 1;
      var minrange = range - rangeMarg;
      var maxrange = range + rangeMarg;
      res = checkRange(res, minrange, maxrange);
    }

    if (isCheckInclination) {
      inclination = inclination * 1; // Convert inclination to int
      incMarg = incMarg * 1;
      var minInc = inclination - incMarg;
      var maxInc = inclination + incMarg;
      res = checkInc(res, minInc, maxInc);
    }

    if (isCheckPeriod) {
      period = period * 1; // Convert period to int
      periodMarg = periodMarg * 1;
      var minPeriod = period - periodMarg;
      var maxPeriod = period + periodMarg;
      res = checkPeriod(res, minPeriod, maxPeriod);
    }

    function checkInview (possibles) {
      var inviewRes = [];
      for (var i = 0; i < possibles.length; i++) {
        if (possibles[i].inview) {
          inviewRes.push(possibles[i]);
        }
      }
      return inviewRes;
    }

    function checkAz (possibles, minaz, maxaz) {
      var azRes = [];
      for (var i = 0; i < possibles.length; i++) {
        if (possibles[i].azimuth < maxaz && possibles[i].azimuth > minaz) {
          azRes.push(possibles[i]);
        }
      }
      return azRes;
    }
    function checkEl (possibles, minel, maxel) {
      var elRes = [];
      for (var i = 0; i < possibles.length; i++) {
        if (possibles[i].elevation < maxel && possibles[i].elevation > minel) {
          elRes.push(possibles[i]);
        }
      }
      return elRes;
    }
    function checkRange (possibles, minrange, maxrange) {
      var rangeRes = [];
      for (var i = 0; i < possibles.length; i++) {
        if (possibles[i].range < maxrange && possibles[i].range > minrange) {
          rangeRes.push(possibles[i]);
        }
      }
      return rangeRes;
    }
    function checkInc (possibles, minInc, maxInc) {
      var IncRes = [];
      for (var i = 0; i < possibles.length; i++) {
        if ((possibles[i].inclination * RAD2DEG).toFixed(2) < maxInc && (possibles[i].inclination * RAD2DEG).toFixed(2) > minInc) {
          IncRes.push(possibles[i]);
        }
      }
      return IncRes;
    }
    function checkPeriod (possibles, minPeriod, maxPeriod) {
      var PeriodRes = [];
      for (var i = 0; i < possibles.length; i++) {
        if (possibles[i].period < maxPeriod && possibles[i].period > minPeriod && PeriodRes.length <= 200) { // Don't display more than 200 results - this is because LEO and GEO belt have a lot of satellites
          PeriodRes.push(possibles[i]);
        }
      }
      if (PeriodRes.length >= 200) {
        $('#findByLooks-results').text('Limited to 200 Results!');
      }
      return PeriodRes;
    }
    // $('#findByLooks-results').text('');
    // TODO: Intentionally doesn't clear previous searches. Could be an option later.
    var SCCs = [];
    for (i = 0; i < res.length; i++) {
      // $('#findByLooks-results').append(res[i].SCC_NUM + '<br />');
      if (i < res.length - 1) {
        $('#search').val($('#search').val() + res[i].SCC_NUM + ',');
      } else {
        $('#search').val($('#search').val() + res[i].SCC_NUM);
      }
      SCCs.push(res[i].SCC_NUM);
    }
    searchBox.doSearch($('#search').val());
    // console.log(SCCs);
    return res;
  };

  satSet.setHover = function (i) {
    if (i === hoveringSat) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, satColorBuf);
    if (hoveringSat !== -1 && hoveringSat !== selectedSat) {
      gl.bufferSubData(gl.ARRAY_BUFFER, hoveringSat * 4 * 4, new Float32Array(currentColorScheme.colorizer(hoveringSat).color));
    }
    if (i !== -1) {
      gl.bufferSubData(gl.ARRAY_BUFFER, i * 4 * 4, new Float32Array(hoverColor));
    }
    hoveringSat = i;
  };

  satSet.selectSat = function (i) {
    if (i === selectedSat) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, satColorBuf);
    if (selectedSat !== -1) {
      gl.bufferSubData(gl.ARRAY_BUFFER, selectedSat * 4 * 4, new Float32Array(currentColorScheme.colorizer(selectedSat).color));
    }
    if (i !== -1) {
      gl.bufferSubData(gl.ARRAY_BUFFER, i * 4 * 4, new Float32Array(selectedColor));
    }
    selectedSat = i;
    if (lookangles.sensorSelected()) {
      $('#menu-lookangles img').removeClass('bmenu-item-disabled');
    }
    $('#menu-lookanglesmultisite img').removeClass('bmenu-item-disabled');
    $('#menu-map img').removeClass('bmenu-item-disabled');
    $('#menu-editSat img').removeClass('bmenu-item-disabled');
    $('#menu-newLaunch img').removeClass('bmenu-item-disabled');
  };

  satSet.onCruncherReady = function (cruncherReadyCallback) {
    if (cruncherReady) cruncherReadyCallback(); // Prevent cruncher callbacks until cruncher ready.
  };

  window.satSet = satSet;
})();

function isLeapYear (date) {
  var year = date.getFullYear();
  if ((year & 3) !== 0) return false;
  return ((year % 100) !== 0 || (year % 400) === 0);
}

// Get Day of Year
function getDOY (date) {
  var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  var mn = date.getMonth();
  var dn = date.getDate();
  var dayOfYear = dayCount[mn] + dn;
  if (mn > 1 && isLeapYear(date)) dayOfYear++;
  return dayOfYear;
}
