(function (global) {
	"use strict";
	
	var CELL_SIZE = 20,
	    DEFAULT_HEIGHT = 10,
	    DEFAULT_WIDTH = 10,
	    SVG_NS = "http://www.w3.org/2000/svg",
	    XLINK_NS = "http://www.w3.org/1999/xlink",
	    grid;
	
	var svgAttributes = function (element, options) {
		var keys = Object.keys(options),
		    i;
		if (element !== undefined) {
			for (i in keys) {
				element.setAttribute(keys[i], options[keys[i]]);
			}
		}
	};
	
	var Grid = function (height, width) {
		var data = [],
		    colRules = [],
		    rowRules = [],
		    col, row;
		
		var Cell = function (state) {
			var subscribers = [];
			
			state = (state !== undefined) ? state : 0;
			
			var notify = function (data) {
				subscribers.forEach(function (element/*, index, array*/) {
					setTimeout(element.bind(this, data));
				});
			};
			
			this.setFilled = function () {
				state = 1;
				notify({state: state});
			};
			
			this.setEmpty = function () {
				state = 0;
				notify({state: state});
			};
			
			this.setCross = function () {
				state = -1;
				notify({state: state});
			};
			
			this.isFilled = function () {
				return state === 1;
			};
			
			this.isEmpty = function () {
				return state === 0;
			};
			
			this.isCross = function () {
				return state === -1;
			};
			
			this.subscribe = function (callback) {
				var index = subscribers.indexOf(callback);
				if (index === -1) {
					subscribers.push(callback);
					return true;
				} else {
					return false;
				}
			};
			
			this.unsubscribe = function (callback) {
				var index = subscribers.indexOf(callback);
				if (index !== -1) {
					subscribers.splice(index, 1);
					return true;
				} else {
					return false;
				}
			};
		};
		
		var Rule = function (size, array) {
			var isValid = function (array) {
				var i, sum;
				
				if (array === undefined || array === []) {
					return false;
				};
				
				sum = array.length - 1;
				for (i = 0; i < array.length; i += 1) {
					sum += array[i];
					if (sum > size) {
						return false;
					}
				};
				return true;
			};
			
			size = (size !== undefined) ? size : 0;
			array = (isValid(array)) ? array : [0];
			
			this.set = function (newArray) {
				if (!isValid(newArray)) {
					return false;
				};
				array = newArray;
				return true;
			};
			
			this.get = function (index) {
				return (index !== undefined ? ((0 <= index && index < array.length) ? array[index] : false) : array);
			};
			
			this.length = function () {
				return array.length;
			};
		};
		
		for (row = 0; row < height; row += 1) {
			for (col = 0; col < width; col += 1) {
				data[(row * height) + col] = new Cell();
			};
		};
		
		for (row = 0; row < height; row += 1) {
			rowRules[row] = new Rule(width);
		};
		
		for (col = 0; col < width; col += 1) {
			colRules[col] = new Rule(height);
		};
		
		this.getHeight = function () {
			return height;
		};
		
		this.getWidth = function () {
			return width;
		};
		
		this.getSize = function () {
			return height * width;
		};
		
		this.getCells = function () {
			return data;
		};
		
		this.getCell = function (index) {
			return (0 <= index && index < data.length) ? data[index] : false;
		};
		
		this.getColRules = function () {
			return colRules;
		};
		
		this.getColRule = function (index) {
			return (0 <= index && index < colRules.length) ? colRules[index] : false;
		};
		
		this.getRowRules = function () {
			return rowRules;
		};
		
		this.getRowRule = function (index) {
			return (0 <= index && index < rowRules.length) ? rowRules[index] : false;
		};
		
		this.setColRule = function (index, array) {
			var newRule;
			if (index < 0 || index >= colRules.length) {
				return false;
			};
			newRule = new Rule(height, array);
			if (newRule.get() !== array) {
				return false;
			};
			colRules[index] = newRule;
			return true;
		};
		
		this.setRowRule = function (index, array) {
			var newRule;
			if (index < 0 || index >= rowRules.length) {
				return false;
			};
			newRule = new Rule(width, array);
			if (newRule.get() !== array) {
				return false;
			};
			rowRules[index] = newRule;
			return true;
		};
	};
	
	var onCellClick = function (ev) {
		// TODO: Implement Observer/PubSub pattern
		var cell = grid.getCell(parseInt(/(?:(?=^cell\d+))*\d+/.exec(ev.target.id)[0], 10));
		if (cell.isEmpty()) {
			cell.setFilled();
			document.getElementById(ev.target.id).setAttributeNS(XLINK_NS, "xlink:href", "#filledCell");
		} else if (cell.isFilled()) {
			cell.setCross();
			document.getElementById(ev.target.id).setAttributeNS(XLINK_NS, "xlink:href", "#crossCell");
		} else {
			cell.setEmpty();
			document.getElementById(ev.target.id).setAttributeNS(XLINK_NS, "xlink:href", "#emptyCell");
		}
	};
	
	var onRuleClick = function (ev) {
		var errorStr, getRule, i, max, newRuleArray, newRuleStr, oldRule, oldRuleStr, regex, rule, setRule, type;
		if (/^rulerow/.test(ev.target.id)) {
			getRule = grid.getRowRule;
			setRule = grid.setRowRule;
			regex = /(?:(?=^rulerow\d+))*\d+/;
			type = "row";
		} else {
			getRule = grid.getColRule;
			setRule = grid.setColRule;
			regex = /(?:(?=^rulecol\d+))*\d+/;
			type = "column"
		};
		rule = parseInt(regex.exec(ev.target.id)[0], 10); // rule is the index used to get the Rule object from the getRule function
		oldRule = getRule(rule); // oldRule is the Rule object
		oldRuleStr = "";
		for (i = 0, max = oldRule.length(); i < max; i += 1) {
			oldRuleStr += oldRule.get(i) + ((i < max - 1) ? " " : "")
		};
		do {
			newRuleStr = prompt("Please enter the clue for this " + type + ", with spaces in between runs of filled squares. Only digits and spaces are allowed." + (errorStr ? "\n" + errorStr : ""), oldRuleStr);
			errorStr = "";
			if (newRuleStr !== null) {
				newRuleStr = newRuleStr.replace(/ +/g, " ").trim();
				newRuleArray = newRuleStr.split(" ");
				newRuleArray.forEach(function (element, index, array) {
					array[index] = parseInt(element, 10);
				});
				if (setRule(rule, newRuleArray)) {
					return;
				} else {
					errorStr = "Invalid rule.";
				}
			}
		} while (errorStr || (newRuleStr && /[^ \d]/.test(newRuleStr)));
	};
	
	var onClick = function (ev) {
		if (/^cell/.test(ev.target.id)) {
			return onCellClick(ev);
		};
		if (/^rule/.test(ev.target.id)) {
			return onRuleClick(ev);
		};
	};
	
	var clearGrid = function () {
		// TODO: Implement Observer/PubSub pattern
		var currNode = document.getElementById("cellGrid").firstChild,
		    i;
		for (i = 0; i < grid.getCells().length; i += 1) {
			if (!grid.getCell(i).isEmpty()) {
				grid.getCell(i).setEmpty();
				currNode.setAttributeNS(XLINK_NS, "xlink:href", "#emptyCell");
			};
			currNode = currNode.nextSibling;
		};
	};
	
	var resizeGrid = function (svg, grid) {
		var height = grid.getHeight(),
		    width = grid.getWidth(),
		    cellGrid, container, element, i, j, max, outline, totalHeight, totalWidth;
		
		container = document.getElementById("nonogramGrid");
		container.innerHTML = "";
		
		// Calculate space needed for the row and column rules
		max = 0;
		for (i = 0; i < height; i += 1) {
			if (grid.getRowRule(i).get().length > max) {
				max = grid.getRowRule(i).get().length;
			}
		};
		totalHeight = height + max;
		
		max = 0;
		for (i = 0; i < width; i += 1) {
			if (grid.getColRule(i).get().length > max) {
				max = grid.getColRule(i).get().length;
			}
		};
		totalWidth = width + max;
		
		svgAttributes(svg, {
			height: totalHeight * CELL_SIZE,
			width: totalWidth * CELL_SIZE
		});
		
		// Create the border around the game board
		outline = document.createElementNS(SVG_NS, "rect");
		container.appendChild(outline);
		svgAttributes(outline, {
			x: 0,
			y: 0,
			height: height * CELL_SIZE,
			width: width * CELL_SIZE,
			stroke: "black",
			fill: "transparent"
		});
		
		// Create the empty cells
		cellGrid = document.createElementNS(SVG_NS, "g");
		cellGrid.id = "cellGrid";
		for (i = 0; i < height; i += 1) {
			for (j = 0; j < width; j += 1) {
				element = document.createElementNS(SVG_NS, "use");
				element.id = "cell" + ((i * width) + j);
				svgAttributes(element, {
					x: j * CELL_SIZE,
					y: i * CELL_SIZE
				});
				element.setAttributeNS(XLINK_NS, "xlink:href", "#emptyCell");
				element.addEventListener("click", onClick);
				cellGrid.appendChild(element);
			};
		};
		container.appendChild(cellGrid);
		
		// Create the 5-guide lines
		for (i = 0; i < height; i += 5) {
			element = document.createElementNS(SVG_NS, "line");
			svgAttributes(element, {
				x1: 0,
				y1: i * CELL_SIZE,
				x2: width * CELL_SIZE,
				y2: i * CELL_SIZE,
				stroke: "black"
			});
			container.appendChild(element);
		};
		
		for (i = 0; i < width; i += 5) {
			element = document.createElementNS(SVG_NS, "line");
			svgAttributes(element, {
				x1: i * CELL_SIZE,
				y1: 0,
				x2: i * CELL_SIZE,
				y2: height * CELL_SIZE,
				stroke: "black"
			});
			container.appendChild(element);
		};
		
		// Create and fill the rule boxes
		for (i = 0; i < height; i += 1) {
			for (j = 0; j < grid.getRowRule(i).get().length; j += 1) {
				element = document.createElementNS(SVG_NS, "g");
				element.id = "rulerow" + i + "cell" + j;
				element.appendChild(document.createElementNS(SVG_NS, "rect"));
				svgAttributes(element.firstChild, {
					x: (width + j) * CELL_SIZE,
					y: i * CELL_SIZE,
					height: CELL_SIZE,
					width: CELL_SIZE,
					stroke: "black",
					fill: "white"
				});
				element.firstChild.id = element.id + "rect";
				element.appendChild(document.createElementNS(SVG_NS, "text"));
				svgAttributes(element.lastChild, {
					x: (width + j + 0.5) * CELL_SIZE,
					y: (i + 1) * CELL_SIZE - (0.2 * CELL_SIZE),
					"text-anchor": "middle",
					textLength: CELL_SIZE
				});
				element.lastChild.innerHTML = grid.getRowRule(i).get(j);
				element.lastChild.id = element.id + "text";
				element.addEventListener("click", onClick);
				container.appendChild(element);
			};
		};
		
		for (i = 0; i < width; i += 1) {
			for (j = 0; j < grid.getColRule(i).get().length; j += 1) {
				element = document.createElementNS(SVG_NS, "g");
				element.id = "rulecol" + i + "cell" + j;
				element.appendChild(document.createElementNS(SVG_NS, "rect"));
				svgAttributes(element.firstChild, {
					x: i * CELL_SIZE,
					y: (height + j) * CELL_SIZE,
					height: CELL_SIZE,
					width: CELL_SIZE,
					stroke: "black",
					fill: "white"
				});
				element.firstChild.id = element.id + "rect";
				element.appendChild(document.createElementNS(SVG_NS, "text"));
				svgAttributes(element.lastChild, {
					x: (i + 0.5) * CELL_SIZE,
					y: (height + j + 1) * CELL_SIZE - (0.2 * CELL_SIZE),
					"text-anchor": "middle",
					textLength: CELL_SIZE
				});
				element.lastChild.innerHTML = grid.getColRule(i).get(j);
				element.lastChild.id = element.id + "text";
				element.addEventListener("click", onClick);
				container.appendChild(element);
			};
		};
		
		// Create the game board and rule separator lines
		element = document.createElementNS(SVG_NS, "line");
		svgAttributes(element, {
			x1: 0,
			y1: height * CELL_SIZE,
			x2: width * CELL_SIZE,
			y2: height * CELL_SIZE,
			stroke: "red"
		});
		container.appendChild(element);
		
		element = document.createElementNS(SVG_NS, "line");
		svgAttributes(element, {
			x1: width * CELL_SIZE,
			y1: 0,
			x2: width * CELL_SIZE,
			y2: height * CELL_SIZE,
			stroke: "red"
		});
		container.appendChild(element);
	};
	
	var resize = function (event) {
		if (event && event.target && event.target.id === "inputSubmit") {
			grid = new Grid(parseInt(document.getElementById("inputHeight").value, 10), parseInt(document.getElementById("inputWidth").value, 10), grid);
			resizeGrid(document.getElementById("nonogramSVG"), grid);
		}
	};
	
	var reset = function (event) {
		if (event && event.target && event.target.id === "resetGrid") {
			document.getElementById("inputHeight").value = DEFAULT_HEIGHT;
			document.getElementById("inputWidth").value = DEFAULT_WIDTH;
			grid = new Grid(DEFAULT_HEIGHT, DEFAULT_WIDTH);
			resizeGrid(document.getElementById("nonogramSVG"), grid);
		}
	};
	
	var clear = function (event) {
		if (event && event.target && event.target.id === "clearGrid") {
			clearGrid();
		}
	};
	
	var init = function () {
		var container = document.createElementNS(SVG_NS, "g"),
		    crossCell = document.createElementNS(SVG_NS, "g"),
		    crossCellBox = document.createElementNS(SVG_NS, "rect"),
		    crossCellCross = document.createElementNS(SVG_NS, "g"),
		    crossCellLeft = document.createElementNS(SVG_NS, "line"),
		    crossCellRight = document.createElementNS(SVG_NS, "line"),
		    definitions = document.createElementNS(SVG_NS, "defs"),
		    emptyCell = document.createElementNS(SVG_NS, "rect"),
		    filledCell = document.createElementNS(SVG_NS, "rect"),
		    svg = document.getElementById("nonogramSVG");
		
		grid = new Grid(DEFAULT_HEIGHT, DEFAULT_WIDTH);
		
		document.getElementById("inputHeight").value = DEFAULT_HEIGHT;
		document.getElementById("inputWidth").value = DEFAULT_WIDTH;
		svgAttributes(svg, {
			height: DEFAULT_HEIGHT * CELL_SIZE,
			width: DEFAULT_WIDTH * CELL_SIZE
		});
		
		emptyCell.id = "emptyCell";
		svgAttributes(emptyCell, {
			x: 0,
			y: 0,
			height: CELL_SIZE,
			width: CELL_SIZE,
			stroke: "gray",
			fill: "white"
		});
		definitions.appendChild(emptyCell);
		
		filledCell.id = "filledCell";
		svgAttributes(filledCell, {
			x: 0,
			y: 0,
			height: CELL_SIZE,
			width: CELL_SIZE,
			stroke: "gray",
			fill: "black"
		});
		definitions.appendChild(filledCell);
		
		crossCell.id = "crossCell";
		svgAttributes(crossCellBox, {
			x: 0,
			y: 0,
			height: CELL_SIZE,
			width: CELL_SIZE,
			stroke: "gray",
			fill: "white"
		});
		crossCell.appendChild(crossCellBox);
		crossCellCross.id = "crossCellCross";
		svgAttributes(crossCellCross, {
			stroke: "black",
			fill: "black"
		});
		svgAttributes(crossCellLeft, {
			x1: 0,
			y1: 0,
			x2: CELL_SIZE,
			y2: CELL_SIZE
		});
		crossCellCross.appendChild(crossCellLeft);
		svgAttributes(crossCellRight, {
			x1: 0,
			y1: CELL_SIZE,
			x2: CELL_SIZE,
			y2: 0
		});
		crossCellCross.appendChild(crossCellRight);
		crossCell.appendChild(crossCellCross);
		definitions.appendChild(crossCell);
		svg.appendChild(definitions);
		
		container.id = "nonogramGrid";
		svg.appendChild(container);
		
		resizeGrid(svg, grid);
	};
	
	document.getElementById("inputSubmit").onclick = resize;
	document.getElementById("resetGrid").onclick = reset;
	document.getElementById("clearGrid").onclick = clear;
	init();
}(this));
