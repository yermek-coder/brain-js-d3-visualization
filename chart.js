window.addEventListener("DOMContentLoaded", () => {
  const visualDataCount = 250;
  const trainDataCount = 250;
  let noise = 0.01;

  const visualData = generateDotes(visualDataCount, noise);
  const trainData = getTrainData(generateDotes(trainDataCount, noise));

  const config = {
    binaryThresh: 0.5,
    hiddenLayers: [4, 2], // array of ints for the sizes of the hidden layers in the network
    activation: "tanh", // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
    leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
  };

  let net = new brain.NeuralNetwork(config);

  const learningCanvas = new UI(visualData);

  const matrix = new Array(100).fill("").map((el) => {
    return new Array(100).fill(0);
  });

  const xScale = d3
    .scaleLinear()
    .domain([0, 100 - 1])
    .range([-1, 1]);
  const yScale = d3
    .scaleLinear()
    .domain([100 - 1, 0])
    .range([-1, 1]);
  let frameCounter = 0;

  // neurons ui
  let neuronsGraph = null;

  // UI показатели обучения
  let error = 0;
  let iterations = 0;

  const iterationsEl = document.querySelector('#stats-iterations');
  const errorEl = document.querySelector('#stats-error');

  const updateStats = (iterations, error) => {
    iterationsEl.textContent = iterations;
    errorEl.textContent = error.toFixed(4);
  }

  const runDrawing = () => {
    frameCounter += 1;
    requestAnimationFrame(runDrawing);

    if (frameCounter > 6) {
      frameCounter = 0;
      const heatMatrix = matrix.map((arr, indexY) => {
        return arr.map((_, indexX) => {
          const output = net.run({ x: xScale(indexX), y: yScale(indexY) });
          return output.label;
        });
      });
      learningCanvas.updateCanvas(heatMatrix);
      updateStats(iterations, error);
      neuronsGraph.updateNodes(net.toJSON());
    }
  };

  const trainConfig = {
    callback: (status) => {
      error = status.error;
      iterations = status.iterations;
    },
    learningRate: 0.003,
    iterations: 50000,
    errorThresh: 0.0005,
    callbackPeriod: 10,
  };

  const stopNet = () => {
    net.updateTrainingOptions({iterations: 1})
  };

  const startNetTrain = () => {
    net.trainAsync(trainData, trainConfig);
    neuronsGraph = new neuronsUI(net.toJSON());
  };

  const restartNet = () => {
    stopNet();
    net = new brain.NeuralNetwork(config);
    setTimeout(startNetTrain, 0)
  }

  startNetTrain();

  window.requestAnimationFrame(runDrawing);

  // сгенерировать рандомные точки
  const regenerateAllData = () => {
    visualData.splice(0, visualData.length);
    trainData.splice(0, visualData.length);

    visualData.push(...generateDotes(visualDataCount, noise));
    visualData.push(...getTrainData(generateDotes(trainDataCount, noise)));

    restartNet();
    learningCanvas.updateCircles(visualData);
  };

  // update activation buttons states
  const activationButtons = document.querySelector('.activation-types').querySelectorAll('button');
  const setActivationButtonsStates = () => {
    const activeClassName = 'button--passive';
    activationButtons.forEach((el) => {
      const [_, activationFoo] = el.getAttribute('id').split('--');
      el.classList.toggle(activeClassName, activationFoo !== config.activation);
    });
  }
  setActivationButtonsStates();
  
  // поменять функцию активации
  const setActivationFoo = (id) => {
    const [_, foo] = id.split('--');
    config.activation = foo;
    restartNet();
    setActivationButtonsStates();
  };

  // отработка нажатий на экран
  const clickHandler = (event) => {
    const { target } = event;
    const buttonEl = target?.closest('button');
    if (!target && buttonEl) return;
  
    const id = buttonEl?.getAttribute('id');
    if (!id) return;
    if (id.startsWith('regenerate')) regenerateAllData();
    if (id.startsWith('activation')) setActivationFoo(id);
  };
  window.addEventListener('click', clickHandler);

  // задать learning rate
  const learningRateInputEl = document.querySelector('#input-learningRate');
  learningRateInputEl.value = trainConfig.learningRate;

  const changeLearningRate = (event) => {
    const { value } = event.target;
    let parsedValue = trainConfig.learningRate;
    try {
      parsedValue = parseFloat(value) ?? parsedValue;
    } catch (error) {};
    trainConfig.learningRate = parsedValue;
    restartNet();
  }

  learningRateInputEl.addEventListener('change', changeLearningRate);

  // задать noise
  const noiseInputEl = document.querySelector('#input-noise');
  noiseInputEl.value = noise;

  const changeNoise = (event) => {
    const { value } = event.target;
    let parsedValue = noise;
    try {
      parsedValue = parseFloat(value) ?? parsedValue;
    } catch (error) {};
    noise = parsedValue;
    regenerateAllData();
  }

  noiseInputEl.addEventListener('change', changeNoise);

  // задать слои
  const layersInput = document.querySelector('#input-layers');
  layersInput.value = config.hiddenLayers;

  const changeLayers = (event) => {
    const { value } = event.target;
    try {
      const newLayers = value.split(',').map((str) => parseInt(str));
      if (!newLayers.length || newLayers.some((num) => isNaN(num))) {
        throw new Error('Введите числа через запятую')
      }
      config.hiddenLayers = newLayers;
    } catch (error) {
      window.alert(error)
      layersInput.value = config.hiddenLayers;
    }
    
    restartNet();
  }

  layersInput.addEventListener('change', changeLayers);
});
