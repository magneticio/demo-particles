const yargs = require("yargs");
const express = require("express");
const uuid = require("uuid");
const cron = require("node-cron");

const app = express();
const port = 5000;

const argv = yargs
  .option("errorRate", {
    description: "Rate which 500 error will be returned",
    type: "number"
  })
  .option("appVersion", {
    description: "Version of the application",
    type: "string",
    default: uuid.v4()
  })
  .help()
  .alias("help", "h").argv;

const version = argv.appVersion || uuid.v4();

if (argv.clusterCount && (isNaN(argv.clusterCount) || argv.clusterCount < 1)) {
  console.error(`clusterCount must be a number >= 1 (${argv.clusterCount})`);
  process.exitCode = 1;
}
const clusterCount = argv.clusterCount || 50;

if (argv.updateInterval && (isNaN(argv.updateInterval) || argv.updateInterval < 1000)) {
  console.error(`updateInterval must be a number >= 1000 (${argv.updateInterval})`);
  process.exitCode = 1;
}
const updateInterval = argv.updateInterval || 5000;

const useConfig = (req, res) => {
  let config = Object.assign({}, argv);
  delete config.$0;
  delete config._;
  if (argv.backgroundColor) {
    config.backgroundColor = hexToRgb(argv.backgroundColor);
  }
  if (!config.clusterCount) {
    config.clusterCount = clusterCount;
  }
  if (!config.updateInterval) {
    config.updateInterval = updateInterval;
  }
  if (req.params.id) {
    config.text = `${config.text || ""} Tenant: ${req.params.id}`;
  }
  res.send(config);
};

// used to calc "load"
var countPerWindow = 0;

var count = 0;
const useParticles = (req, res) => {
  countPerWindow++;

  let particles = { version: version };
  if (argv.color) {
    particles = Object.assign({}, particles, { color: hexToRgb(argv.color) });
  }
  if (argv.shape) {
    particles = Object.assign({}, particles, { shape: argv.shape });
  }
  if (argv.errorRate) {
    if (count++ % argv.errorRate == 0) {
      if (count == 100) {
        count = 0;
      }
      res.status(500);
    }
  }
  res.send(particles);
};

const LOAD_OK = "ok";
const LOAD_HIGH = "high";
const LOAD_LOW = "low";
const LOAD_WINDOW_MS = 15000;
const HIGH_COUNT_PER_WINDOW = clusterCount * LOAD_WINDOW_MS / updateInterval * 95 / 100;
const LOW_COUNT_PER_WINDOW = HIGH_COUNT_PER_WINDOW * 40 / 100;
var load = LOAD_OK;

console.log(`HIGH_COUNT_PER_WINDOW: ${HIGH_COUNT_PER_WINDOW}`);
console.log(`LOW_COUNT_PER_WINDOW: ${LOW_COUNT_PER_WINDOW}`);

// check "load" every window 
cron.schedule("0,15,30,45 * * * * *", () => {
  let c = countPerWindow;
  countPerWindow = 0;
  if (c >= HIGH_COUNT_PER_WINDOW) {
    load = LOAD_HIGH;
  } else if (c <= LOW_COUNT_PER_WINDOW) {
    load = LOAD_LOW;
  } else {
    load = LOAD_OK;
  }
  console.log(`load: ${load} (count: ${c})`);
});


const getLoad = (req, res) => {
  var l = load;
  load = LOAD_OK;
  res.send({ load: l });
};

app.get("/user/:id/config", useConfig);
app.get("/user/:id/particles", useParticles);
app.get("/config", useConfig);
app.get("/particles", useParticles);
app.get("/load", getLoad);

app.use("/user/:id", express.static("public"));
app.use("/", express.static("public"));

app.listen(port, () => console.log(`App listening on port ${port}!`));

const hexToRgb = hex => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    }
    : null;
};

//
// Keep allocations referenced so they aren't garbage collected.
//
const allocations = [];

//
// Allocate a certain size
//
const alloc = (size) => {
  const numbers = size / 8;
  const arr = []
  arr.length = numbers; // Simulate allocation of 'size' bytes.
  for (let i = 0; i < numbers; i++) {
    arr[i] = i;
  }
  return arr;
};

if (argv.extraMem && !isNaN(argv.extraMem)) {
  allocations.push(alloc(argv.extraMem * 1024 * 1024))
}
