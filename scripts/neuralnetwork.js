//Use CPU
tf.setBackend("cpu")

//Create base model
function createModel(numberOfInputNodes, numberOfHiddenLayer1Nodes, numberOfHiddenLayer2Nodes, numberOfHiddenLayer3Nodes, numberOfOutputNodes) {
    const model = tf.sequential();
    model.add(tf.layers.dense({units: numberOfInputNodes, inputShape: [null, numberOfInputNodes], activation: "relu"}));
    model.add(tf.layers.dense({units: numberOfHiddenLayer1Nodes, activation: "relu"}));
    if (numberOfHiddenLayer2Nodes > 0) {
        model.add(tf.layers.dense({units: numberOfHiddenLayer2Nodes, activation: "relu"}));
    }
    if (numberOfHiddenLayer3Nodes > 0) {
        model.add(tf.layers.dense({units: numberOfHiddenLayer3Nodes, activation: "relu"}));
    }
    model.add(tf.layers.dense({units: numberOfOutputNodes, activation: "tanh"}));
    return model;
}

function copyModel(model, shapeArray) {
    return tf.tidy(() => {
        let numberOfInputNodes = shapeArray[0];
        let numberOfHiddenLayer1Nodes = shapeArray[1];
        let numberOfHiddenLayer2Nodes = shapeArray[2];
        let numberOfHiddenLayer3Nodes = shapeArray[3];
        //console.log(shapeArray);
        let numberOfOutputNodes = shapeArray[4];
        const modelCopy = createModel(numberOfInputNodes, numberOfHiddenLayer1Nodes, numberOfHiddenLayer2Nodes, numberOfHiddenLayer3Nodes, numberOfOutputNodes);
        const modelWeights = model.getWeights();
        const modelWeightsCopy = [];
        for (let i = 0; i < modelWeights.length; i++) {
            modelWeightsCopy[i] = modelWeights[i].clone();
        }
        modelCopy.setWeights(modelWeightsCopy);
        return modelCopy;
    })
}

//Load model with weights and compile the model
async function loadModels() {
    diverModel = await tf.loadLayersModel("models/divermodel/brain.json");
    await diverModel.compile({loss: "meanSquaredError", optimizer: tf.train.adam(0.001)});
    
    sharkModel = await tf.loadLayersModel("models/sharkmodel/brain.json");
    await sharkModel.compile({loss: "meanSquaredError", optimizer: tf.train.adam(0.001)});

    fishModel = await tf.loadLayersModel("models/fishmodel/brain.json");
    await fishModel.compile({loss: "meanSquaredError", optimizer: tf.train.adam(0.001)});

    console.log("Models have been loaded.");
    console.log("Models have been compiled.");
}

async function saveModel() {
    await player.brain.save("downloads://brain");
}

function getPrediction(data, model) {
    return tf.tidy(() => {
        let predictionData = data;
        let predictionTensor = tf.tensor3d(predictionData, [1, predictionData.length / numberOfInputs, numberOfInputs]);
        const predictions = model.predict(predictionTensor);
        let predictRes = predictions.dataSync();
        predictions.dispose();
        predictionTensor.dispose();
        return predictRes;
    });
}

//Define neural network settings
let numberOfInputs = 384;
let hidden1 = 64;
let hidden2 = 0;
let hidden3 = 0;
let numberOfOutputs = 3;

//Set up an empty neural network
let diverModel;
let sharkModel;
let fishModel;
//Load existing pretrained model with weights into it
loadModels();

//Set up an additional untrained model for training
let newNet = createModel(numberOfInputs, hidden1, hidden2, hidden3, numberOfOutputs);