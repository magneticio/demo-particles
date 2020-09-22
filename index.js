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
  .option("clusterCount", {
    description: "Number of partifcle groups showing on the screen",
    type: "number",
    default: 50
  })
  .option("updateInterval", {
    description: "Milliseconds between requests to the server",
    type: "number",
    default: 5000
  })
  .option("healthCheckGracePeriodSeconds", {
    description: "Period in which health check will always be healthy",
    type: "number",
    default: 0
  })
  .option("resourceCheckGracePeriodSeconds", {
    description: "Additional delay before health check reacts to low CPU and memory limits",
    type: "number",
    default: 0
  })
  .option("minCPU", {
    description: "The health check will fail if the Pod resources.limits.cpu is less than this value (m)",
    type: "number"
  })
  .option("minMem", {
    description: "The health check will fail if the Pod resources.limits.memory is less than this value (Mi)",
    type: "number"
  })
  .option("extraMemPerRequest", {
    description: "The Pod memory usage will be increased by this value, after every request (Ki)",
    type: "number"
  })
  .help()
  .alias("help", "h").argv;

const healthCheckAfterMs = Date.now() + (argv.healthCheckGracePeriodSeconds * 1000);
const resourceCheckAfterMs = healthCheckAfterMs + (argv.resourceCheckGracePeriodSeconds * 1000);

const useConfig = (req, res) => {
  let config = Object.assign({}, argv);
  delete config.$0;
  delete config._;
  if (argv.backgroundColor) {
    config.backgroundColor = hexToRgb(argv.backgroundColor);
  }
  if (!config.clusterCount) {
    config.clusterCount = argv.clusterCount;
  }
  if (!config.updateInterval) {
    config.updateInterval = argv.updateInterval;
  }
  if (req.params.id) {
    config.text = `${config.text || ""} Tenant: ${req.params.id}`;
  }
  res.send(config);
};

// modified if health check fails
let errorRate = argv.errorRate;

// used to calc "load"
var countPerWindow = 0;

var count = 0;
const useParticles = (req, res) => {
  countPerWindow++;

  let particles = { version: argv.version };
  if (argv.color) {
    particles = Object.assign({}, particles, { color: hexToRgb(argv.color) });
  }
  if (argv.shape) {
    particles = Object.assign({}, particles, { shape: argv.shape });
  }
  if (errorRate) {
    if (count++ % errorRate == 0) {
      if (count == 100) {
        count = 0;
      }
      res.status(500);
    }
  }
  if (argv.extraMemPerRequest) {
    allocations.push(alloc(argv.extraMemPerRequest * 1024));
  }
  res.send(particles);
};

const LOAD_OK = "ok";
const LOAD_HIGH = "high";
const LOAD_LOW = "low";
const LOAD_WINDOW_MS = 15000;
const HIGH_COUNT_PER_WINDOW = argv.clusterCount * LOAD_WINDOW_MS / argv.updateInterval * 50 / 100;
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

const getHealth = (req, res) => {
  console.log('Checking health');
  if (healthCheckAfterMs > Date.now()) {
    console.log('Healthy - not checking resources');
    res.send('ok');
    return;
  }

  // Return unhealthy, if limit is less than minMem
  console.log(`minMem: ${argv.minMem}Mi; MEM_LIMIT: ${process.env.MEM_LIMIT}Mi`);
  if (argv.minMem) {
    if (process.env.MEM_LIMIT && !isNaN(process.env.MEM_LIMIT)) {
      if (argv.minMem > process.env.MEM_LIMIT) {
        console.log('Unhealthy - memory limit to low');
        if (resourceCheckAfterMs > Date.now()) {
          console.log('Generating errors');
          // generate 20% errors
          errorRate = 5;
          res.send('ok');
          return;
        }
        res.status(500);
        res.send('error: memory limit to low');
        return;
      }
    }
  }

  // Return unhealthy, if limit is less than minCPU
  console.log(`minCPU: ${argv.minCPU}m; CPU_LIMIT: ${process.env.CPU_LIMIT}m`);
  if (argv.minCPU) {
    if (process.env.CPU_LIMIT && !isNaN(process.env.CPU_LIMIT)) {
      if (argv.minCPU > process.env.CPU_LIMIT) {
        console.log('Unhealthy - CPU limit to low');
        if (resourceCheckAfterMs > Date.now()) {
          console.log('Generating errors');
          // generate 20% errors
          errorRate = 5;
          res.send('ok');
          return;
        }
        res.status(500);
        res.send('error: CPU limit to low');
        return;
      }
    }
  }

  console.log('Healthy');
  res.send('ok');
}

app.get("/user/:id/config", useConfig);
app.get("/user/:id/particles", useParticles);
app.get("/config", useConfig);
app.get("/particles", useParticles);
app.get("/load", getLoad);
app.get("/health", getHealth);

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
