
// Copyright 2010 William Malone (www.williammalone.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var canvas;
var context;
var canvasWidth = 1000;
var canvasHeight = 500;
var padding = 25;
var lineWidth = 8;
var outlineImage = new Image();
var undoHistory = [];
var clickX = [];
var clickY = [];
var clickColor = [];
var clickSize = [];
var clickDrag = [];
var paint = false;
var curColor = "#000000";
var curTool = "marker";
var curSize = "normal";
var mediumStartX = 18;
var mediumStartY = 19;
var mediumImageWidth = 93;
var mediumImageHeight = 46;
var drawingAreaX = 10;
var drawingAreaY = 11;
var drawingAreaWidth = 1000;
var drawingAreaHeight = 500;
var toolHotspotStartY = 23;
var toolHotspotHeight = 38;
var sizeHotspotStartY = 157;
var sizeHotspotHeight = 36;
var sizeHotspotWidthObject = new Object();
sizeHotspotWidthObject.huge = 39;
sizeHotspotWidthObject.large = 25;
sizeHotspotWidthObject.normal = 18;
sizeHotspotWidthObject.small = 16;
var totalLoadResources = 1;
var curLoadResNum = 0;
var redraw_count = 0;

/**
* Calls the redraw function after all neccessary resources are loaded.
*/
function resourceLoaded()
{
	if(++curLoadResNum >= totalLoadResources){
		redraw();
	}
}

/**
* Creates a canvas element, loads images, adds events, and draws the canvas for the first time.
*/
function prepareCanvas()
{
	// Create the canvas (Neccessary for IE because it doesn't know what a canvas element is)
	var canvasDiv = document.getElementById('canvasDiv');
	canvas = document.createElement('canvas');
	canvas.setAttribute('width', canvasWidth);
	canvas.setAttribute('height', canvasHeight);
	canvas.setAttribute('id', 'canvas');
	canvasDiv.appendChild(canvas);
	if(typeof G_vmlCanvasManager != 'undefined') {
		canvas = G_vmlCanvasManager.initElement(canvas);
	}
	context = canvas.getContext("2d"); // Grab the 2d canvas context
	// Note: The above code is a workaround for IE 8 and lower. Otherwise we could have used:
	//     context = document.getElementById('canvas').getContext("2d");
	
	// Load images
	// -----------
	
	context.fillStyle="#FFFFFF";
	context.fillRect(drawingAreaX, drawingAreaY, drawingAreaWidth-1, drawingAreaHeight-1);
	
	outlineImage.onload = function() { resourceLoaded(); 
	};
	
	outlineImage.src = "images/oF94e1N.png";

	// Add mouse events
	// ----------------
	$('#canvas').mousedown(function(e)
	{
		// Mouse down location
		var mouseX = e.pageX - this.offsetLeft;
		var mouseY = e.pageY - this.offsetTop;
		

		paint = true;
		addClick(mouseX, mouseY, false);
		redraw();
	});
	
	$('#canvas').mousemove(function(e) {
		if(paint==true){
			curSize = document.getElementById("brushSize").value
			addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
			redraw();
		}
	});
	
	$('#canvas').mouseup(function(e) {
		paint = false;
		undoHistory.push(canvas.toDataURL());
		console.log(undoHistory.length);
	  	redraw();
	});
	
	$('#canvas').mouseleave(function(e){
		paint = false;
	});
}

/**
* Adds a point to the drawing array.
* @param x
* @param y
* @param dragging
*/
function addClick(x, y, dragging)
{
	clickX.push(x);
	clickY.push(y);
	clickColor.push(curColor);
	clickSize.push(curSize);
	clickDrag.push(dragging);
}

function newCanvas()
{
	clickX = [];
	clickY = [];				
	clickColor = [];
	clickSize = [];
	clickDrag = [];
	clearCanvas();
	redraw();
	context.fillStyle="#FFFFFF";
	context.fillRect(drawingAreaX, drawingAreaY, drawingAreaWidth-1, drawingAreaHeight-1);
	context.drawImage(outlineImage, drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);
}

/**
* Clears the canvas.
*/
function clearCanvas()
{
	context.clearRect(0, 0, canvasWidth, canvasHeight);
}

/**
* Redraws the canvas.
*/

function redraw()
{
	// Make sure required resources are loaded before redrawing
	if(curLoadResNum < totalLoadResources){ return; }

	redraw_count++;
	
	var locX;
	var locY;

	if (redraw_count > 200)
	{
		var image = new Image(500, 1000);
		image.scr = canvas.toDataURL();
		context.drawImage(image, drawingAreaHeight, drawingAreaWidth);
		clickX = clickX.slice(-100);
		clickY = clickY.slice(-100);
		clickColor = clickColor.slice(-100);
		clickSize = clickSize.slice(-100);
		clickDrag = clickDrag.slice(-100);
		redraw_count = 0;
	}
	
	// Keep the drawing in the drawing area
	context.save();
	context.beginPath();
	context.rect(drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);
	context.clip();
		
	var radius;
	var i = 0;
		
	for(; i < clickX.length; i++)
	{		
		radius = clickSize[i];
		
		context.beginPath();
		if(clickDrag[i] && i){
			context.moveTo(clickX[i-1], clickY[i-1]);
		}else{
			context.moveTo(clickX[i], clickY[i]);
		}
		context.lineTo(clickX[i], clickY[i]);
		context.closePath();

		context.strokeStyle = clickColor[i];

		context.lineJoin = "round";
		context.lineWidth = radius;
		context.stroke();
		
	}
	//context.globalCompositeOperation = "source-over";// To erase instead of draw over with white
	context.restore();
	
	// Overlay a crayon texture (if the current tool is crayon)

	context.globalAlpha = 1; // No IE support
	
	// Draw the outline image
	
	context.drawImage(outlineImage, drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);
}
