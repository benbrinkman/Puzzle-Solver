
//Define the spots the Nodes can't be placed
var disabledSpots = [
    { x: 0, y: 6 },
    { x: 1, y: 6 },
    { x: 6, y: 3 },
    { x: 6, y: 4 },
    { x: 6, y: 5 },
    { x: 6, y: 6 }
];

//Define the shapes of the puzzle piece tiles
var tileData = [
    [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 2 },
    ],
    [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
    ],
    [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
    ],
    [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 0, y: 3 },
        { x: 1, y: 1 },
    ],
    [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 0, y: 3 },
        { x: 1, y: 0 },
    ],
    [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 1, y: 2 },
        { x: 1, y: 3 },
    ],
    [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
    ],
    [
        { x: 0, y: 0 },
        { x: 0, y: 2 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 2 },
    ]
];


var dates = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC"
];

//Object to represent the pieces (I sometimes call them tiles, sry for the inconsistent naming)
var pieceObj = {
    id: -1,
    grid: null,
    worldTiles: [], //The location of the tiles this piece covers
    tileForms: [], //Holds the different forms (Dihedral group)
    numTileForms: -1,
    tileFormSize: -1,
    currentForm: [],
    placed: false,
    pos: { x: 0, y: 0 },
    coveredNodes: [], //The nodes that this piece is currently covering
    init: function (id, grid) {
        this.id = id;
        this.grid = grid;
        this.worldTiles = [];
        this.coveredNodes = [];
        this.tileForms = allPiecesData[this.id];
        this.numTileForms = this.tileForms.length;
        this.tileFormSize = this.tileForms[0].length;
        this.currentForm = this.tileForms[0];
        this.placed = false;
    },
    setForm: function (formIndex) { //change current form
        this.currentForm = this.tileForms[formIndex];
        this.setPos(this.pos);
    },
    resetNodes: function () { //reset the covered nodes
        for (var node of this.coveredNodes) {
            node.clearNode();
        }
        this.coveredNodes = [];
        this.placed = false;
    },
    checkNodes: function () { //Check to make sure all of the nodes this piece covers are free to be placed on
        for (var node of this.worldTiles) {

            //make sure it is in bounds
            var isInBounds = node.x >= 0 && node.x < 7 && node.y >= 0 && node.y < 7;
            if (!isInBounds) { return false }

            //make sure the tile is not disabled or full
            var targetNode = this.grid.nodes[node.x][node.y];
            if (!targetNode.enabled || targetNode.full) { return false }
        }
        return true;
    },
    assignNodes: function () { //Cover them nodes
        this.coveredNodes = [];
        for (var node of this.worldTiles) {
            var targetNode = this.grid.nodes[node.x][node.y];
            targetNode.setFull(this.id);
            this.coveredNodes.push(targetNode);
        }
        this.placed = true;
    },
    setPos: function (pos) {
        this.pos = { x: pos.x, y: pos.y };
        this.worldTiles = [];
        for (var i = 0; i < this.tileFormSize; i++) {
            this.worldTiles.push({
                x: this.currentForm[i].x + this.pos.x,
                y: this.currentForm[i].y + this.pos.y
            });
        }
    },
};

//Constructor function
function Piece(id, grid) {
    var object = Object.create(pieceObj);
    object.init(id, grid);
    return object;
}

//Object to represent the positions on the board
var nodeObj = {
    pos: { x: -1, y: -1 },
    enabled: true,
    isMonth: false,
    index: -1,
    value: "",
    display: "",
    piece: -1, //the id of the piece placed on this node
    full: false, //is there a piece on this node?
    isTarget: false, //is this the target node?
    alwaysDisabled: false, //is this a border piece that should always be ignored?
    init: function (pos, index) {
        this.pos = {
            x: pos[0],
            y: pos[1]
        };
        this.index = index;
        this.enabled = true;

        //Set month/day values and display text/number
        this.isMonth = this.pos.x <= 1 ? true : false;
        if (this.isMonth) {
            this.value = index;
            this.display = dates[index - 1];
        } else {
            this.value = index - 12;
            this.display = this.value;
        }

        //check to see if this is one of the disabled spots
        var key = JSON.stringify(this.pos);
        if (JSON.stringify(disabledSpots).includes(key)) {
            this.alwaysDisabled = true;
            this.enabled = false;
            this.index = -1;
        }
    },
    setTarget: function (target) {
        this.isTarget = target;
        this.full = target;
        this.setEnable(!target);
    },
    setEnable: function (enable) {
        this.enabled = enable;
        if (this.alwaysDisabled) {
            this.enabled = false;
        }
    },
    setFull: function (id) {
        this.piece = id;;
        this.full = true;
    },
    clearNode: function () {
        this.full = false;
        this.piece = -1;
    },
    setValue: function (value) {
        this.value = value;
    }
};

//Node object constructor
function Node(pos, index) {
    var object = Object.create(nodeObj);
    object.init(pos, index);
    return object;
}

//Object to represent the board/grid of nodes
var nodesObj = {
    nodes: [],  //array of rows of nodes
    targetDate: [-1, -1],
    sizex: 0,
    sizey: 0,
    init: function (sizex, sizey, target) {
        this.sizex = sizex;
        this.sizey = sizey;
        var counter = 1;
        this.nodes = [];
        for (var i = 0; i < this.sizex; i++) {
            var nodeRow = [];
            //Fill each node row with nodes (columns)
            for (var j = 0; j < this.sizey; j++) {
                var nodePos = [i, j];
                var newNode = Node(nodePos, counter);
                if (newNode.enabled) {
                    counter++;
                }
                nodeRow.push(newNode);
            }
            this.nodes.push(nodeRow);
        }
        this.setTarget(target);
    },
    async setTarget(target) {
        //set target date
        this.targetDate = target;
        for (var nodeRow of this.nodes) {
            for (var node of nodeRow) {
                //reset all nodes
                node.setTarget(false);

                //create new targets
                if (node.index == this.targetDate[0]) {
                    node.setTarget(true);
                }
                if (node.index - 12 == this.targetDate[1]) {
                    node.setTarget(true);
                }
            }
        }
        //Removed/debugging features - fetching already found solutions stored in localData
        // completedBoards = await fetchSolutions();
        // var currentSolves = completedBoards[this.targetDate[0] - 1].days[this.targetDate[1] - 1];
        // document.getElementById("solutionDisplay").innerHTML = "";
        // for (var solves of currentSolves.solutions) {
        //     displaySolution(solves);
        // }
    }
};

//Constructor function for nodes object
function Nodes(x, y, target) {
    var object = Object.create(nodesObj);
    object.init(x, y, target);
    return object;
}

//Helper function to get the min/max of set of positions
function getMinMaxPos(points, isGetMax) {
    var xMinMax = points[0].x;
    var yMinMax = points[0].y;
    for (var point of points) {
        var testX = isGetMax ? point.x > xMinMax : point.x < xMinMax;
        var testY = isGetMax ? point.y > yMinMax : point.y < yMinMax;
        xMinMax = testX ? point.x : xMinMax;
        yMinMax = testY ? point.y : yMinMax;
    }
    return { x: xMinMax, y: yMinMax };
}

//Shift a form so its origin is 0,0 so it can be compared to other forms
function normalize(points) {
    var min = getMinMaxPos(points, false);
    var shiftedPoints = [];
    for (var point of points) {
        shiftedPoints.push({
            x: point.x - min.x,
            y: point.y - min.y
        });
    }
    return shiftedPoints;
}

//rotate a form
function rot90(matrix) {
    var rotated = matrix.map(point => ({
        x: -point.y,
        y: point.x
    }));
    return normalize(rotated);
}

//flip a form
function flip(matrix) {
    var flipped = matrix.map(point => ({
        x: -point.x,
        y: point.y
    }));
    return normalize(flipped);
}

//Sort the form positions so they are in the same order for comparison
function sortPieceNodes(piece) {
    return piece.slice().sort((a, b) => {
        if (a.x !== b.x) return a.x - b.x;
        return a.y - b.y;
    });
}

//Get all forms a piece can be in by rotating and flipping it
function createDihedralGroup(matrix) {
    var group = [];
    var current = matrix;

    for (var i = 0; i < 4; i++) {
        group.push(current);
        group.push(flip(current));
        current = rot90(current);
    }

    var valuesAlreadySeen = new Set();
    var uniqueGroup = [];

    //Check to see if the group already has this form
    for (var piece of group) {
        var sorted = sortPieceNodes(piece);
        var key = JSON.stringify(sorted);

        if (!valuesAlreadySeen.has(key)) {
            valuesAlreadySeen.add(key);
            uniqueGroup.push(sorted);
        }
    }
    return uniqueGroup;
}

//Used to check if islands created by piece placement are the same shape as any unused tiles
function checkDihedralGroupForPiece(matrix, isFiveTiles, usedPieces) {


    var sortedInput = sortPieceNodes(matrix);
    //Once a form/shape/island/matrix is sorted and normalized, compare it in string form
    var inputKey = JSON.stringify(sortedInput);

    //Find all remaining pieces that have not yet been placed
    var unplacedPieces = [];

    //The only piece that is 6 tiles instead of 5 is the first piece (id = 0)
    //so only check first piece if !ifFiveTiles, and only check the other ones if isFiveTiles
    var startIndex = isFiveTiles ? 1 : 0;
    var endIndex = isFiveTiles ? pieces.length : 1;

    //get all unplaced pieces
    for (var i = startIndex; i < endIndex; i++) {
        if (!usedPieces[i]) {
            unplacedPieces.push(pieceById(i));
        }
    }


    for (var p = 0; p < unplacedPieces.length; p++) {
        var piece = unplacedPieces[p];
        for (var f = 0; f < piece.tileForms.length; f++) {
            //for every form of every unplaced piece, check if it matches the island shape
            var direction = piece.tileForms[f];
            var sorted = sortPieceNodes(direction);
            var key = JSON.stringify(sorted);
            if (key === inputKey) { //If the island shape matches an unused piece, return its ID and form
                return {
                    pieceId: piece.id,
                    formIndex: f
                };
            }
        }
    }
    return null;
}


//Initial function to create the UI board
function createNodeElements(x, y) {
    var wrapper = document.getElementById("nodeGridWrapper");
    for (var i = 0; i < x; i++) {
        const row = document.createElement("div");
        row.classList.add("row");
        row.id = "Row" + i;
        for (var j = 0; j < y; j++) {
            const nodeElemWrapper = document.createElement("div");
            const nodeElem = document.createElement("div");
            nodeElem.classList.add("node");
            nodeElemWrapper.classList.add("nodeWrapper");
            nodeElem.id = "Node" + i + "-" + j;
            if (nodeGrid.nodes[i][j].alwaysDisabled) {
                nodeElem.classList.add("disabled");
                nodeElem.classList.remove("node");
            }
            else if (nodeGrid.nodes[i][j].isMonth) {
                nodeElemWrapper.classList.add("month");
                nodeElem.classList.add("viableMonthTarget");
                nodeElem.innerHTML = nodeGrid.nodes[i][j].display;
                nodeElem.value = nodeGrid.nodes[i][j].value;
                nodeElem.setAttribute("onclick", "SelectNode(this, true)");
            } else {
                nodeElemWrapper.classList.add("day");
                nodeElem.classList.add("viableDayTarget");
                nodeElem.innerHTML = nodeGrid.nodes[i][j].display;
                nodeElem.value = nodeGrid.nodes[i][j].value;
                nodeElem.setAttribute("onclick", "SelectNode(this, false)");
            }
            nodeElemWrapper.appendChild(nodeElem);
            row.appendChild(nodeElemWrapper);
        }
        wrapper.appendChild(row);
    }
}

//Draw the current node states onto the ui board
function fillTileElements() {
    for (var nodeRow of nodeGrid.nodes) {
        for (var node of nodeRow) {
            var x = node.pos.x;
            var y = node.pos.y;
            var idString = "Node" + x + "-" + y;
            var currentNode = document.getElementById(idString);

            if (!currentNode) continue;

            currentNode.className = node.alwaysDisabled ? 'disabled' : 'node';

            //Check the nodes around this node to see if it contains the same piece
            //this is just for asthetic reasons - for drawing the beveled/chiseled edges on the UI pieces

            //clear old corner elements        
            var oldPatches = currentNode.querySelectorAll('.corner-patch');
            for (var patch of oldPatches) {
                patch.remove();
            }


            if (node.enabled && node.piece !== -1) {
                var pId = node.piece;
                currentNode.innerHTML = "";
                currentNode.classList.add("piece-" + pId);

                //Check orthagonal nodes to see if they are the same piece
                var topMatch = (x > 0 && nodeGrid.nodes[x - 1][y].piece === pId);
                var bottomMatch = (x < nodeGrid.sizex - 1 && nodeGrid.nodes[x + 1][y].piece === pId);
                var leftMatch = (y > 0 && nodeGrid.nodes[x][y - 1].piece === pId);
                var rightMatch = (y < nodeGrid.sizey - 1 && nodeGrid.nodes[x][y + 1].piece === pId);

                //Add borders next to to nodes that don't match this node's piece
                if (!leftMatch) currentNode.classList.add("b-left");
                if (!topMatch) currentNode.classList.add("b-top");
                if (!rightMatch) currentNode.classList.add("b-right");
                if (!bottomMatch) currentNode.classList.add("b-bottom");

                //corner patches are added on inside corners so the border/bevel of the pieces looks seamless

                //constructor function to make corner patches
                function addPatch(type) {
                    var patch = document.createElement('div');
                    patch.className = "corner-patch " + type;
                    return patch;
                }

                //Check diagonal directions between orthagonal matches
                if (topMatch && leftMatch && nodeGrid.nodes[x - 1][y - 1].piece !== pId) {
                    currentNode.appendChild(addPatch('patch-tl'));
                }
                if (topMatch && rightMatch && nodeGrid.nodes[x - 1][y + 1].piece !== pId) {
                    currentNode.appendChild(addPatch('patch-tr'));
                }
                if (bottomMatch && leftMatch && nodeGrid.nodes[x + 1][y - 1].piece !== pId) {
                    currentNode.appendChild(addPatch('patch-bl'));
                }
                if (bottomMatch && rightMatch && nodeGrid.nodes[x + 1][y + 1].piece !== pId) {
                    currentNode.appendChild(addPatch('patch-br'));
                }

            } else if (node.isTarget) {
                currentNode.classList.add("target");
                currentNode.innerHTML = node.display;
            }
        }
    }
}

//make ms look pretty
function formatMilliseconds(ms) {
    var seconds = Math.floor(ms / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);

    seconds = seconds % 60;
    minutes = minutes % 60;
    var msDisplay = ms % 1000;

    //I took this line from someone online because it was a lot easier than figuring it out myself
    var pad = (n) => n.toString().padStart(2, '0');


    if (hours == 0) {
        if (minutes == 0) {
            if (seconds == 0) {
                return pad(msDisplay) + "ms";
            } else {
                return seconds + "." + msDisplay + "s";
            }
        } else {
            return pad(minutes) + "m:" + pad(seconds) + "s:" + pad(msDisplay) + "ms";
        }
    } else {
        return pad(hours) + "h:" + pad(minutes) + "m:" + pad(seconds) + "s:" + pad(msDisplay) + "ms";
    }
}

//slow down there cowboy
function sleep(ms) {
    var promise = new Promise(function (resolve) {
        setTimeout(function () {
            resolve();
        }, ms);
    });
    return promise;
}

//After a piece has found an empty spot, check to see if that spot makes sense
function checkPlacement() {

    //create object for each node with info for checking for islands (contiguous empty gaps created when a piece is placed)
    var nodesInfo = new Array(nodeGrid.nodes.length);
    for (var x = 0; x < nodeGrid.nodes.length; x++) {
        nodesInfo[x] = new Array(nodeGrid.nodes[x].length);
        for (var y = 0; y < nodeGrid.nodes[x].length; y++) {
            var node = nodeGrid.nodes[x][y];

            nodesInfo[x][y] = { x: x, y: y, full: !node.enabled || node.full, inIslandGroup: false, islandIndex: -1 };
        }
    }

    //Create the island groups by going through each node and checking its neighbors
    var islandCounter = 0;
    for (var x = 0; x < nodesInfo.length; x++) {
        for (var y = 0; y < nodesInfo[x].length; y++) {
            var node = nodesInfo[x][y];
            if (!node.full && !node.inIslandGroup) {
                node.inIslandGroup = true;
                node.islandIndex = islandCounter;
                checkContiguity(nodesInfo, x, y, islandCounter);
                islandCounter++;
            }
        }
    }

    var usedPieces = new Array(pieces.length);
    for (var i = 0; i < pieces.length; i++) {
        usedPieces[i] = (pieceById(i).placed);
    }



    var perfectFits = []; //store the info for any gap that perfectly matches one of the remaining pieces

    //Check each island
    for (var i = 0; i < islandCounter; i++) {
        var islandGroup = [];
        var size = 0;
        for (var x = 0; x < nodesInfo.length; x++) {
            for (var y = 0; y < nodesInfo[x].length; y++) {
                if (nodesInfo[x][y].islandIndex == i) {
                    size++;
                    islandGroup.push({ x: x, y: y });
                }
            }
        }

        var groupOrigin;
        if (size > 0) {
            groupOrigin = getMinMaxPos(islandGroup, false);
        }

        //check island sizes:

        //anything less than 5 simply will not do
        if (size < 5) { return { isValid: false }; }

        if (size % 5 != 0) { //if the island cannot be divided by 5

            if (pieceById(0).placed) { //area not divisible by 5 and the 6 piece has been used
                return { isValid: false };
            } else if (size % 5 == 1) { //area is divisible by 5 with remainder 1, and 6 piece has not been used
                if (size == 6) {
                    //check if island shape fits any of the 6 piece forms
                    islandGroup = normalize(islandGroup);
                    var result = checkDihedralGroupForPiece(islandGroup, false, usedPieces);
                    if (!result) {
                        return { isValid: false };
                    } else {
                        //if it is, mark the piece as used and add it to perfectFits
                        usedPieces[result.pieceId] = true;
                        perfectFits.push({ p: result, o: groupOrigin });
                    }
                }
            } else { //area not divisible by 5 or 5 remainder 1, and 6 is not in the game yet
                return { isValid: false };
            }
        } else if (size == 5) { //If the remaining size is exactly 5, check its shape against all remaining pieces

            //put group into normalized tiles sequence
            islandGroup = normalize(islandGroup);
            var result = checkDihedralGroupForPiece(islandGroup, true, usedPieces);
            if (!result) {//Island shape does not match any piece shape
                return { isValid: false };
            } else { //a piece matches the shape, mark as used and add to perfectFits
                perfectFits.push({ p: result, o: groupOrigin });
                usedPieces[result.pieceId] = true;
            }
        }
    }
    //If the group is valid, return the collected data
    return { isValid: true, fits: perfectFits };
}

//Get the island created by contiguous groups of empty nodes
function checkNeighbors(nodes, x, y, islandCounter) {

    var emptyNeighbors = [];
    var up = x - 1;
    var down = x + 1;
    var left = y - 1;
    var right = y + 1;

    function addNeighbor(node) {
        if (!node.full && !node.inIslandGroup) {
            node.inIslandGroup = true;
            node.islandIndex = islandCounter;
            emptyNeighbors.push(node);
        }
    }
    //Make sure it isn't checking nodes outside the bounds
    if (up >= 0) {
        //get top neighbor
        addNeighbor(nodes[up][y]);
    }
    if (down < nodes.length) {
        //get bottom neighbor
        addNeighbor(nodes[down][y]);
    }
    if (left >= 0) {
        //get left neighbor
        addNeighbor(nodes[x][left]);
    }
    if (right < nodes[x].length) {
        //get right neighbor
        addNeighbor(nodes[x][right]);
    }
    return emptyNeighbors;
}

function checkContiguity(nodes, x, y, islandCounter) {
    var emptyNeighbors = checkNeighbors(nodes, x, y, islandCounter);

    //keep checking empty neighbors until there are none left
    while (emptyNeighbors.length > 0) {
        var posx = emptyNeighbors[0].x;
        var posy = emptyNeighbors[0].y;
        var newNeighbors = checkNeighbors(nodes, posx, posy, islandCounter);
        
        //remove them when they have been checked 
        emptyNeighbors.splice(0, 1);
        
        //add new empty neighbors to the array and continue checking
        emptyNeighbors.push(...newNeighbors);
    }
}


//cancel feature just in case...
var cancelSearch = false;
window.addEventListener('keydown', function (event) {
    if (event.key === "Escape") {
        cancelSearch = true;
        console.log("ah shit we gotta stop this");
    }
});

//Recursively try to place tiles until it finds all solutions that fit
async function updateTiles() {

    //Reset all search variables and nodes
    cancelSearch = false;
    var startTime = Date.now();
    var attemptCounter = 0;
    var solutionsFound = 0;

    for (var nodeRow of nodeGrid.nodes) {
        for (var node of nodeRow) {
            node.clearNode();
        }
    }
    for (var p of pieces) {
        p.resetNodes();
    }

    //recursive function
    async function solve(pieceIndex) {
        if (cancelSearch) return false;
        if (pieceIndex === pieces.length) { //if we manage to get to the last piece, we have found a solution
            CaptureBoard();
            fillTileElements(); //This shows the solution on the board, but slows things down
            await sleep(1);
            solutionsFound++;
            return true;
        }

        //set/check indexed piece
        var piece = pieces[pieceIndex];
        if (piece.placed) {
            return await solve(pieceIndex + 1);
        }

        //go through every form of the peice (Dihedral group)
        for (var f = 0; f < piece.numTileForms; f++) {
            piece.setForm(f);
            for (var r = 0; r < 7; r++) {
                for (var c = 0; c < 7; c++) {
                    //for every form of the piece, check every node
                    if (cancelSearch) return false;

                    //Set the piece's position, then check if it is valid
                    piece.setPos({ x: r, y: c });
                    attemptCounter++;
                    // if (attemptCounter % 1000000 == 0) {
                    // console.log(attemptCounter + " attempts made");
                    // await sleep(0);
                    // }

                    if (piece.checkNodes()) { //returns false if the piece cannot be placed in current spot
                        //Let the nodes know they have a piece on them
                        piece.assignNodes();

                        //checkPlacement() makes sure the placed piece fits a few key requirements
                        var result = checkPlacement();

                        if (result.isValid) {

                            var forcedPieces = [];
                            if (result.fits.length !== 0) {
                                //If there is a gap that perfectly fits one or more of the reminaing pieces, fill it with the required piece
                                for (var fit of result.fits) {
                                    var t = pieceById(fit.p.pieceId);
                                    t.setForm(fit.p.formIndex);
                                    t.setPos(fit.o);
                                    t.assignNodes();
                                    forcedPieces.push(t);
                                }
                            }
                            //run for the next piece
                            await solve(pieceIndex + 1);

                            //If a remaining piece can't be placed, reset the pieces that were forced in out of order
                            for (var fp of forcedPieces) {
                                fp.resetNodes();
                            }
                        }
                    }
                    //If the piece doesn't fit, reset the nodes it was covering
                    piece.resetNodes();
                }
            }
        }
        return false;
    }

    //start the function
    await solve(0);

    //Once it completes, log info and update UI
    console.log("We found " + solutionsFound + " solutions for " + nodeGrid.targetDate[0] + "-" + nodeGrid.targetDate[1] + " in " + formatMilliseconds(Date.now() - startTime) + " in " + attemptCounter + " checks");
    isSolving = false;
    isSolved = true;
    document.getElementById("clearButton").innerHTML = "Clear";
    document.getElementById("cover").classList.remove("block");

    if (cancelSearch) {
        document.getElementById("status").innerHTML = "Canceled";
    } else {
        document.getElementById("status").innerHTML = "Finished!";
    }
    return solutionsFound;
}

//Save a copy of a solved board's data
function CaptureBoard() {
    var results = [];
    for (var i = 0; i < 7; i++) {
        var row = [];
        for (var j = 0; j < 7; j++) {
            //get either target (-1), piece number, or null for border
            var currentNode = nodeGrid.nodes[i][j];
            if (currentNode.isTarget) {
                row.push(-1);
            } else if (!currentNode.enabled) {
                row.push(null);
            } else {
                row.push(currentNode.piece);
            }
        }
        results.push(row);
    }
    displaySolution(results);


    //The below was written during testing to log solutions in localStorage

    // console.log(results);
    // completedBoards.push(results);

    // var rawData = localStorage.getItem('savedSolutions');
    // var allData = rawData ? JSON.parse(rawData) : [];
    // var mIndex = nodeGrid.targetDate[0] - 1;
    // var dIndex = nodeGrid.targetDate[1] - 1;
    // if (allData[mIndex] && allData[mIndex].days[dIndex]) {
    //     var existingSolutions = allData[mIndex].days[dIndex].solutions;
    //     var newResults = JSON.stringify(results);
    //     var isDuplicate = existingSolutions.some(sltn =>
    //         JSON.stringify(sltn) === newResults
    //     );

    //     // console.log("BRAND NEW BRAND NEW LOOK AT ME IM NEW AROUND HERE YEEEEEHAW!");
    //     displaySolution(results);

    //     // allData[mIndex].days[dIndex].solutions.push(results);

    //     if (isDuplicate) {
    //         // console.log("We have found this one already!");
    //         return false;
    //     }
    //     existingSolutions.push(results);
    //     localStorage.setItem('savedSolutions', JSON.stringify(allData));
    //     // console.log("Solution saved for Month " + mIndex + ", Day " + dIndex);
    //     return true;
    // } else {
    //     console.error("Could not find the specified month or day in storage.");
    //     return false;
    // }
}

//fetch a piece by its id rather than its index in the pieces group
function pieceById(id) {
    for (var piece of pieces) {
        if (piece.id == id) {
            return piece;
        }
    }
    console.warn("No piece with that id");
    return null;


}

//add solution to the ui
function displaySolution(solution) {
    var wrapper = document.createElement("div");
    wrapper.classList.add("displayWrapper");
    wrapper.value = solution;
    wrapper.setAttribute("onclick", "SetBoard(this.value)");

    for (var i = 0; i < 7; i++) {
        var row = document.createElement("div");
        row.classList.add("row");
        for (var j = 0; j < 7; j++) {
            var tinyNode = document.createElement("div");

            var currentNode = solution[i][j];
            if (currentNode !== null) {
                if (currentNode > -1) {
                    tinyNode.classList.add("piece-" + currentNode);
                } else {
                    tinyNode.classList.add("tinyTarget");
                }
            } else {
                //don't add any class to the empty tiles
            }

            tinyNode.classList.add("tinyNode");
            row.appendChild(tinyNode);
        }
        wrapper.appendChild(row);

    }

    document.getElementById("solutionDisplay").appendChild(wrapper);
    document.getElementById("displayText").innerHTML = "Click on a solution below to view it on the board";

}

//Creates ui to represent the different pieces in the info ui
function createDisplay(formIndex) {
    var form = tileData[formIndex];
    var wrapper = document.createElement("div");
    wrapper.classList.add("pieceWrapper");

    var max = getMinMaxPos(form, true);
    max.y++;
    max.x++;

    // console.log(form);
    for (var i = 0; i < max.x; i++) {
        var row = document.createElement("div");
        // console.log('Row ' + i);
        row.classList.add("row");
        for (var j = 0; j < max.y; j++) {
            // console.log('column ' + j);
            var tinyNode = document.createElement("div");
            for (var x = 0; x < form.length; x++) {
                // console.log('Checking form node ' + x + ": " + form[x].x + ", " + form[x].y);
                if (form[x].y == j && form[x].x == i) {
                    // tinyNode.classList.add("drawTile");
                    tinyNode.classList.add("piece-" + formIndex);
                }
            }
            tinyNode.classList.add("tinyPiece");
            row.appendChild(tinyNode);
        }
        wrapper.appendChild(row);

    }
    // console.log(document.getElementById("pieceDisplay"));
    document.getElementById("pieceDisplay").appendChild(wrapper);
}

//Send a solution to be displayed on the main board
function SetBoard(inputBoard) {
    targetDate = [-1, -1];
    document.getElementById("status").innerHTML = "Finished!";
    document.getElementById("solveButton").classList.add("disabledButton");
    isSolved = true;
    for (var nodeRow of nodeGrid.nodes) {
        for (var node of nodeRow) {
            node.clearNode();
        }
    }
    for (var p of pieces) {
        p.resetNodes();
    }
    for (var x = 0; x < inputBoard.length; x++) {
        for (var y = 0; y < inputBoard[x].length; y++) {
            var tileVal = inputBoard[x][y];
            var node = nodeGrid.nodes[x][y];
            if (tileVal != null) {

                if (tileVal == -1) {
                    node.setTarget(true);
                    document.getElementById("Node" + x + "-" + y).classList.add("target");
                } else {
                    node.setFull(tileVal);
                }
            }

        }
    }
    fillTileElements();
}


var nodeGrid; //The board where all the action is displayed
var pieces = []; //array of all the pieces
var targetDate = [-1, -1]; //The target date to solve for
var isSolving = false; //ui status variable
var isSolved = false; //ui status variable
var helpScreenOpen = true; //ui status variable

var completedBoards; //outdated/unused - previously for saving solutions to localStorage

var allPiecesData = []; //Get all the forms (Dihedral group) of the pieces
for (var i = 0; i < tileData.length; i++) {
    var dihedralGroup = createDihedralGroup(tileData[i]);
    allPiecesData.push(dihedralGroup);
}



//runs when the user selects a month/day on the calendar to solve for
function SelectNode(elem, isMonth) {
    console.log("selecting node");
    if (isSolved) {
        clearBoard();
    }

    var classString = isMonth ? "viableMonthTarget" : "viableDayTarget";
    var typeNodes = document.getElementsByClassName(classString);
    for (var node of typeNodes) {
        // console.log(node.children);

        node.classList.remove("target");
    }
    elem.classList.add("target");
    var index = isMonth ? 0 : 1;
    targetDate[index] = elem.value;
    // console.log(targetDate);

    if (targetDate[0] > -1 && targetDate[1] > -1) {
        document.getElementById("solveButton").classList.remove("disabledButton");
        document.getElementById("status").innerHTML = "Ready! Press solve to find solutions";

    }


}

//Clears all the visual data from the main board
function clearBoard() {
    if (isSolving) {
        cancelSearch = true;

    } else {
        console.log("clearing board");
        document.getElementById("status").innerHTML = "Select a date below";

        var typeNodes = document.getElementsByClassName("node");
        for (var node of typeNodes) {
            // console.log(node.children);
            node.className = "node";
            if (node.parentElement.classList.contains("month")) {
                node.classList.add("viableMonthTarget");
                node.innerHTML = dates[node.value - 1];
            } else {

                node.classList.add("viableDayTarget");
                node.innerHTML = node.value;
            }
        }
        document.getElementById("cover").classList.remove("block");
        isSolved = false;
        targetDate = [-1, -1];
        document.getElementById("solveButton").classList.add("disabledButton");
    }
}

//Begin a solve for the selected date
async function SolveDate() {

    console.log("starting...");

    //Shouldn't be able to run unless a valid date is selected, but check just in case
    if (targetDate[0] > -1 && targetDate[1] > -1) {
        document.getElementById("cover").classList.add("block");
        // document.getElementById("solutionDisplay").innerHTML = "";
        var displays = [...document.getElementsByClassName("displayWrapper")];
        for (let elem of displays) {
            elem.remove();
        }
        document.getElementById("clearButton").innerHTML = "Cancel";
        document.getElementById("solveButton").classList.add("disabledButton");
        nodeGrid.setTarget(targetDate);
        isSolving = true;
        document.getElementById("status").innerHTML = "Solving...";
        if (helpScreenOpen) {
            doToggleHelp();
        }
        await updateTiles();
    } else {
        //If this function somehow runs with an invalid date
        document.getElementById("status").innerHTML = "You must select a date before solving";
    }


}


//If empty tab in the ui is selected, switch to that tab (I know the name doesn't make sense, I just don't wanna change it)
function ToggleHelp(elem) {
    if (elem.classList.contains("tabIn")) {
        doToggleHelp();
    }
}

//Switch UI tabs
function doToggleHelp() {
    var hlp = document.getElementById("helpScreen");
    var sol = document.getElementById("solutionDisplay");

    var tText = document.getElementById("titleSpan");
    var iText = document.getElementById("moreInfo");
    var hide = "hideDisplay";
    if (helpScreenOpen) {
        hlp.classList.add(hide);
        sol.classList.remove(hide);
        tText.classList.remove("tabIn");
        iText.classList.add("tabIn");

    } else {
        sol.classList.add(hide);
        hlp.classList.remove(hide);
        iText.classList.remove("tabIn");
        tText.classList.add("tabIn");

    }
    helpScreenOpen = !helpScreenOpen;
}


//On load, set up the board and create elements
document.addEventListener('DOMContentLoaded', async function () {
    nodeGrid = Nodes(7, 7, [5, 11]);
    for (var i = 0; i < allPiecesData.length; i++) {
        var newPiece = Piece(i, nodeGrid);
        pieces.push(newPiece);
    }
    createNodeElements(nodeGrid.sizex, nodeGrid.sizey);
    for (var i = 0; i < tileData.length; i++) {
        createDisplay(i);

    }

}, false);



/********************************vvv Unused functions vvv**********************************/

async function fetchSolutions() {
    const localData = localStorage.getItem('savedSolutions');

    if (localData) {
        return JSON.parse(localData);
    } else {
        // If nothing in storage, create the empty 12-month structure
        console.log("Initializing fresh storage structure...");
        const data = createJson();
        localStorage.setItem('savedSolutions', JSON.stringify(data));
        return data;
    }
}

function saveSolution(newEntry) {
    let rawData = localStorage.getItem('savedSolutions');
    let data = rawData ? JSON.parse(rawData) : [];
    data.push(newEntry);
    localStorage.setItem('savedSolutions', JSON.stringify(data));
}

function createJson() {
    var storedSolutions = [];
    for (var i = 0; i < 12; i++) {
        var dayObjs = [];
        for (var j = 0; j < 31; j++) {
            var day = {
                solutions: [],
            };
            dayObjs.push(day);
        }
        var monthObj = {
            days: dayObjs
        }
        storedSolutions.push(monthObj);
    }
    return storedSolutions;
}