//Setup
//Create canvas
const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");

//Set canvas dimensions
canvas.width = 640;
canvas.height = 640;

//Set up music
const audioPath = "music/";
const audio = new Audio(audioPath);
audio.loop = true;
audio.volume = 0.1;

//Mute or unmute audio when button is clicked and change mute symbol
function muteOrUnmute() {
    if (audio.volume == 0) {
        audio.volume = 0.1;
        document.getElementById("mute-svg").setAttribute("d", "M10.717 3.55A.5.5 0 0 1 11 4v8a.5.5 0 0 1-.812.39L7.825 10.5H5.5A.5.5 0 0 1 5 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z");
    } else {
        audio.volume = 0;
        document.getElementById("mute-svg").setAttribute("d", "M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zm7.137 2.096a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0z");
    }
}

//Get menu items from HTML
const scoreElement = document.querySelector("#score-element");
const finalScoreElement = document.querySelector("#final-score-element");
const highScoreElement = document.querySelector("#high-score-element");
const aiHighScoreElement = document.querySelector("#ai-high-score-element");
const startGameButton = document.querySelector("#start-game-button");
const startSimButton = document.querySelector("#start-sim-button");
const trainNetButton = document.querySelector("#train-net-button");
const modalElement = document.querySelector("#modal-element");
const trainingElement = document.querySelector("#training-element");
const alertElement = document.querySelector("#alert-element");
const arrowKeyButtonUp = document.querySelector("#arrow-key-button-up");
const arrowKeyButtonLeft = document.querySelector("#arrow-key-button-left");
const arrowKeyButtonRight = document.querySelector("#arrow-key-button-right");
const arrowKeyButtonDown = document.querySelector("#arrow-key-button-down");



//If isHumanPlaying is true, the user can play. Otherwise, the AI will play.
let isHumanPlaying = true;
//Variable for touchscreen devices
let isPointerCoarse = (matchMedia("(pointer:coarse)").matches);

//Variables for keyboard event listeners
let rightPressed = 0;
let leftPressed = 0;
let upPressed = 0;
let downPressed = 0;

//Number of enemies
const numberOfEnemies = 16;

//Scores
let score = 0;
let highScore = 0;
let aiHighScore = 0;
let targetScore = 1000000;

//Function that returns a random number in a range
function random(minimum, maximum) {
    return Math.random() * (maximum - minimum) + minimum;
}

class Unit {
    constructor(x, y, velocity, radius, brain, isPlayable) {
        //Positions and velocity
        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.speed = 0;
        this.turnRight = 0;
        this.turnLeft = 0;
        this.moveForward = 0;
        //Radius
        this.radius = radius;
        this.hypot = Math.hypot(this.radius, this.radius)
        //Playability
        this.isPlayable = isPlayable;
        //Image/Animation
        this.scale = 3;
        this.img = new Image();
        this.staggerCounter = 0;
        this.staggerCounterMax = 7;
        this.clock = 1;
        this.tileX = 0;
        this.state = "gostraight";
        //Neural network
        this.brain = brain;
        this.isUntrained = true;
        //Sensor
        this.sensor = new Sensor(this);
        //Data
        this.frameInputData = [];
        this.frameOutputData = [];
        this.totalInputData = [];
        this.totalOutputData = [];
        this.netOutput = [];
    }
    //Create shape that sensor can detect
    createPolygon() {
        const points = [];
        const alpha = Math.atan2(this.radius, this.radius);
        points.push({
            x: this.x - Math.sin(-alpha) * this.hypot,
            y: this.y - Math.cos(-alpha) * this.hypot
        });
        points.push({
            x: this.x - Math.sin(alpha) * this.hypot,
            y: this.y - Math.cos(alpha) * this.hypot
        });
        points.push({
            x: this.x - Math.sin(Math.PI - alpha) * this.hypot,
            y: this.y - Math.cos(Math.PI - alpha) * this.hypot
        });
        points.push({
            x: this.x - Math.sin(Math.PI + alpha) * this.hypot,
            y: this.y - Math.cos(Math.PI + alpha) * this.hypot
        });
        return points;
    }
    draw() {
        const imgXCenter = (this.img.width * this.scale) / 2;
        const imgYCenter = (this.img.height * this.scale) / 2;
        const tileWidth = this.img.width / this.imgXTiles;
        const tileHeight = this.img.height / this.imgYTiles;
        if (this.staggerCounter < this.staggerCounterMax) {
            this.staggerCounter++;
        } else {
            this.tileX = this.clock % this.imgMap[this.state][1];
            this.clock++
            this.staggerCounter = 0;
        }
        const tileY = this.imgMap[this.state][0];
        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        c.save();
        c.translate(this.x, this.y);
        c.rotate(angle + 1.5707963267948966);
        c.drawImage(this.img, this.tileX * tileWidth, tileY * tileHeight, tileWidth, tileHeight, 0 - imgXCenter / this.imgXTiles, 0 - imgYCenter / this.imgYTiles, tileWidth * this.scale, tileHeight * this.scale)
        c.restore();
    }
    drawSensor() {
        this.sensor.draw(c);
    }
    resetBeforeGame() {
        this.isPlayable = isHumanPlaying;
        this.x = playerStartX;
        this.y = playerStartY;
        this.velocity = {x: 0, y: -1};
        this.frameInputData = [];
        this.frameOutputData = [];
    }
    resetFrameData() {
        this.frameInputData = [];
        this.frameOutputData = [];
    }
     //Get output from neural network
     makePrediction() {
        return getPrediction(this.frameInputData, this.brain);
    }
    updateMovementData() {
            //For AI player
            //If it has a neural network
            if (this.brain && !this.isPlayable) {
                this.netOutput = this.makePrediction();
                this.turnRight = Math.round(this.netOutput[0]);
                this.turnLeft = Math.round(this.netOutput[1]);
                this.moveForward = Math.round(this.netOutput[2]);
                this.speed = this.maxSpeed * this.moveForward;
            } else {
                if (upPressed == 1) {
                    this.moveForward = 1;
                } else {
                    this.moveForward = 0;
                }
                switch(1) {
                    case rightPressed:
                        this.turnRight = 1;
                        this.turnLeft = 0;
                        break;
                    case leftPressed:
                        this.turnLeft = 1;
                        this.turnRight = 0;
                        break;
                    default:
                        this.turnRight = 0;
                        this.turnLeft = 0;
                }
            }
            switch (true) {
                case this.turnRight == 1:
                    this.velocity = rotateUnitVector(this.velocity, this.turningAngle);
                    this.state = "turnright";
                    break;
                case this.turnLeft == 1:
                    this.velocity = rotateUnitVector(this.velocity, -this.turningAngle);
                    this.state = "turnleft";
                    break;
                default:
                    this.state = "gostraight";
            }
            this.speed = this.maxSpeed * this.moveForward;
    }
    updateHitbox() {
        this.polygon = this.createPolygon();
    }
    fixedUpdate() {
        this.x = this.x + this.velocity.x * this.speed
        this.y = this.y + this.velocity.y * this.speed
    }
    updateSensor() {
        this.sensor.update();
    }
    updateInputData() {
        if (this.sensor.getInputs().length == 0) {
            for (let i = 0; i < numberOfInputs; i++) {
                this.frameInputData.push(1);
            }
        } else {
            this.frameInputData = this.frameInputData.concat(this.sensor.getInputs());
        }
    }
    updateOutputData() {
        this.frameOutputData.push(this.turnRight);
        this.frameOutputData.push(this.turnLeft);
        this.frameOutputData.push(this.moveForward);
    }
    saveData() {
        //Only save data when a human is playing and no touchscreen device is used
        if (this.isPlayable && !isPointerCoarse) {
            this.totalInputData = this.totalInputData.concat(this.frameInputData);
            this.totalOutputData = this.totalOutputData.concat(this.frameOutputData);
        }
    }
    async trainNet(inputs, outputs, batchsize, epochs, iterations) {
        console.log("training input data:", inputs, "training output data:", outputs);
        console.time("training completed in");
        let xs = tf.tensor3d(inputs, [1, inputs.length / numberOfInputs, numberOfInputs]);
        let ys = tf.tensor3d(outputs, [1, outputs.length / numberOfOutputs, numberOfOutputs]);
        console.log("xs shape", xs.shape);
        console.log("ys shape", ys.shape);
        for (let i = 0; i < iterations; i++) {
            //Update DOM before training net to ensure loading element shows up; both the Promise and tf.nextFrame() are required
            await new Promise(requestAnimationFrame)
            await tf.nextFrame();
            const res = await this.brain.fit(xs, ys, {
                batchSize: batchsize,
                epochs: epochs,
                shuffle: true
                });
        console.log("iteration:", i, "loss after training:", res.history.loss);
        document.getElementById("training-percent").innerText = i + 1 + "%";
        }
        console.timeEnd("training completed in");
        await xs.dispose();
        await ys.dispose();
        console.log("xs and ys disposed.");
    }
}

class Diver extends Unit {
    constructor(x, y, velocity, radius, brain, isPlayable) {
        super(x, y, velocity, radius, brain, isPlayable)
        this.isPredator = 0;
        this.isHuman = 1;
        this.maxSpeed = 2;
        this.speed = this.maxSpeed;
        this.turningAngle = 0.3;
        //Image
        this.img.src = "images/diver.png"
        this.scale = 1.5;
        this.imgXTiles = 2;
        this.imgYTiles = 3;
        this.imgMap = {
            turnright: [1, 2],
            turnleft: [0, 2],
            gostraight: [2, 2]
        }
    }
}

class Shark extends Unit {
    constructor(x, y, velocity, radius, brain, isPlayable) {
        super(x, y, velocity, radius, brain, isPlayable)
        this.isPredator = 1;
        this.isHuman = 0;
        this.maxSpeed = 2;
        this.speed = this.maxSpeed;
        this.turningAngle = 0.2;
        //Image
        this.img.src = "images/hai-fin-shadow.png"
        this.scale = 0.5;
        this.imgXTiles = 4;
        this.imgYTiles = 4;
        this.imgMap = {
            turnright: [3, 4],
            turnleft: [3, 4],
            gostraight: [3, 4]
        }
    }
}

class Fish extends Unit {
    constructor(x, y, velocity, radius, brain, isPlayable) {
        super(x, y, velocity, radius, brain, isPlayable)
        this.isPredator = 0;
        this.isHuman = 0;
        this.maxSpeed = 3;
        this.speed = this.maxSpeed;
        this.turningAngle = 0.4;
        //Image
        this.img.src = "images/fish.png"
        this.scale = 0.8
        this.imgXTiles = 2;
        this.imgYTiles = 3;
        this.imgMap = {
            turnright: [1, 2],
            turnleft: [0, 2],
            gostraight: [2, 2]
        }
    }
}

//Player starts in the center of the canvas
const playerStartX = canvas.width / 2;
const playerStartY = canvas.height / 2;

let units = [];

let player;

function initGame() {
    previous = performance.now();
    //Reset timer
    timestamp = 0;
    //Remove all units
    units = [];
    //If there is no player, create one
    if (!player) {
        player = new Diver(playerStartX, playerStartY, {x: 0, y: -1}, 20, diverModel, isHumanPlaying);
    //Otherwise reset it
    } else {
        player.resetBeforeGame();
    }
    units.push(player);
    //units.push(new Diver(playerStartX, playerStartY, {x: 0, y: -1}, 20, copyModel(diverModel, [192, 64, 0, 0, 3]), false));
    //Reset scores
    score = 0;
    scoreElement.innerHTML = 0;
    finalScoreElement.innerHTML = 0;
}

function spawnEnemies() {
    //Create a new enemy if the amount of enemies is less than specified
    while (units.length < numberOfEnemies + 1) {
        const radius = 20;
        let x;
        let y;

        //Pick positions inside all sides of the canvas
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 + radius : canvas.width - radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 + radius : canvas.height - radius;
        }

        let angle;
        //Spawn enemies that aim at the center of the canvas
        angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x)
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        if (Math.random() < 0.2) {
            units.push(new Shark(x, y, { ...velocity }, radius, copyModel(sharkModel, [192, 64, 0, 0, 3]), false));
        } else {
            units.push(new Fish(x, y, { ...velocity }, radius, copyModel(fishModel, [192, 64, 0, 0, 3]), false));
        }
    }
}

class StaticObject {
    constructor(x, y, imgSrc, scale) {
        this.x = x;
        this.y = y;
        this.img = new Image();
        this.img.src = imgSrc;
        this.scale = scale;
    }
    draw() {
        c.drawImage(this.img, this.x, this.y, this.img.width * this.scale, this.img.height * this.scale);
    }
}

//Update current score and player/AI high scores
function updateScores() {
    //Increment score and update score in UI
    score += 10
    scoreElement.innerHTML = score
    if (score > highScore && isHumanPlaying == true) {
        highScore = score;
        highScoreElement.innerHTML = highScore;
    }
    if (score > aiHighScore && isHumanPlaying == false) {
        aiHighScore = score;
        aiHighScoreElement.innerHTML = aiHighScore;
    }
}

//End game by cancelling animation, setting the score, and displaying the modal again
function endGame() {
    cancelAnimationFrame(animationId);
    finalScoreElement.innerHTML = score;
    modalElement.style.display = "flex";
    audio.pause();
    audio.currentTime = 0;
}

//Timer
let timestamp = 0;
function update() {
    //End game at current frame if target score is reached
    if (score == targetScore) {
        endGame();
        return;
    }
    //Update all scores
    updateScores();
    //Spawn enemies if there are less enemies than specified
    spawnEnemies();
    //Every x frames, get inputs, make decisions and save data; makes AI less jittery but makes inputs less responsive
    if (timestamp % 8 == 0) {
        units.forEach(unit => {
            unit.updateHitbox();
        })
        units.forEach(unit => {
            unit.resetFrameData();
            unit.updateSensor();
            unit.updateInputData();
            unit.updateMovementData();
            unit.updateOutputData();
            unit.saveData();
        })
    }
    units.forEach(unit => {
        unit.fixedUpdate();
    })
    //End game if player leaves the canvas
    if (player.x + player.radius < 0 || 
        player.x - player.radius > canvas.width ||
        player.y + player.radius < 0 ||
        player.y - player.radius > canvas.height
    ) {
        endGame();
        return;
    }
    //Remove enemy if it has left the canvas with some additional clearance
    units.forEach((unit, unitIndex) => {
        const clearance = unit.radius + 10;
        if (unit.x + clearance < 0 || 
            unit.x - clearance > canvas.width ||
            unit.y + clearance < 0 ||
            unit.y - clearance > canvas.height
        ) {
            if (unit.brain instanceof tf.Sequential) {
                unit.brain.dispose();
            }
            units.splice(unitIndex, 1);
        }
    })
    //End game if player touches an enemy
    // units.forEach((unit, unitIndex) => {
    //     p1 = player.x;
    //     p2 = player.y;
    //     q1 = unit.x;
    //     q2 = unit.y;
    //     const squareDistance = getSquareDistance(p1, p2, q1, q2);
    //     if (squareDistance <= (player.radius * player.radius) + (unit.radius * unit.radius)) {
    //         endGame();
    //         return;
    //     }
    // })
    //Increment timer
    timestamp++;
}

const staticObjects = [];

function draw() {
    //Clear canvas
    c.clearRect(0, 0, canvas.width, canvas.height);
    //Draw the static objects before everything else
    staticObjects.forEach(staticObject => {
        staticObject.draw();
    })
    //Draw units
    units.forEach(unit => {
        unit.draw();
    })
}

//animationId is needed to cancel at current frame
let animationId;
//Animation loop
let current;
let previous;
let elapsed;
const tickDuration = 1000 / 60;
let accumulator = 0;
function animate () {
    animationId = requestAnimationFrame(animate)
    current = performance.now();
    elapsed = current - previous;
    previous = current;
    accumulator += elapsed;
    while (accumulator > tickDuration) {
        accumulator -= tickDuration;
        update();
    }
    draw();
}

//Add button event listeners
startGameButton.addEventListener("click", () => {
    isHumanPlaying = true;
    initGame();
    animate();
    modalElement.style.display = "none";
    audio.play();
})
startSimButton.addEventListener("click", () => {
    isHumanPlaying = false;
    initGame();
    animate();
    modalElement.style.display = "none";
    audio.play();
})

async function onTrainNetButton() {
    if (player && player.totalInputData.length != 0) {
        //If the player has not been trained, replace its neural network with a fresh one
        if (player.isUntrained) {
            player.brain = newNet;
            player.brain.compile({loss: "meanSquaredError", optimizer: tf.train.adam(0.001)});
            console.log("Replaced net with new net");
            player.isUntrained = false;
        //Otherwise, train the new model some more
        } else {
            console.log("New net will be trained further");
        }
        modalElement.style.display = "none";
        trainingElement.style.display = "flex";
        await player.trainNet(player.totalInputData, player.totalOutputData, 1, 1, 100);
        modalElement.style.display = "flex";
        trainingElement.style.display = "none";
    } else {
        console.log("Net cannot be trained. No training data available.");
        alertElement.style.display = "flex";
    }
}

trainNetButton.addEventListener("click", () => {
    onTrainNetButton();
})

function closeAlertElement() {
    alertElement.style.display = "none";
}

//Add event listeners for arrow keys that show up on touchscreen devices
arrowKeyButtonUp.addEventListener("touchstart", () => {
    upPressed = 1;
})
arrowKeyButtonLeft.addEventListener("touchstart", () => {
    leftPressed = 1;
})
arrowKeyButtonRight.addEventListener("touchstart", () => {
    rightPressed = 1;
})
arrowKeyButtonDown.addEventListener("touchstart", () => {
    downPressed = 1;
})
arrowKeyButtonUp.addEventListener("touchend", () => {
    upPressed = 1;
})
arrowKeyButtonLeft.addEventListener("touchend", () => {
    leftPressed = 1;
})
arrowKeyButtonRight.addEventListener("touchend", () => {
    rightPressed = 1;
})
arrowKeyButtonDown.addEventListener("touchend", () => {
    downPressed = 1;
})

//Prepare functions for detecting keyboard inputs and add corresponding event listeners
const arrowKeys = { left: 37, up: 38, right: 39, down: 40 }
function keyDown(event) {
    if (event.keyCode == arrowKeys.left) {
        leftPressed = 1;
    }
    if (event.keyCode == arrowKeys.right) {
        rightPressed = 1;
    }
    if (event.keyCode == arrowKeys.up) {
        upPressed = 1;
    }
    if (event.keyCode == arrowKeys.down) {
        downPressed = 1;
    }
}
function keyUp(event) {
    if (event.keyCode == arrowKeys.left) {
        leftPressed = 0;
    }
    if (event.keyCode == arrowKeys.right) {
        rightPressed = 0;
    }
    if (event.keyCode == arrowKeys.up) {
        upPressed = 0;
    }
    if (event.keyCode == arrowKeys.down) {
        downPressed = 0;
    }
}
addEventListener("keydown", keyDown, false);
addEventListener("keyup", keyUp, false);

//On touchscreen devices
if (isPointerCoarse) {
    //Stop context menu from opening after long touch
    window.oncontextmenu = function(e) {
        e.preventDefault();
        e.stopPropagation();
    }
}