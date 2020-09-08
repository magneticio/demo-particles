const yargs = require("yargs");
const express = require("express");
const app = express();
const port = 5000;

const uuid = require("uuid");

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

const useConfig = (req, res) => {
  let config = Object.assign({}, argv);
  delete config.$0;
  delete config._;
  if (argv.backgroundColor) {
    config.backgroundColor = hexToRgb(argv.backgroundColor);
  }
  if (req.params.id) {
    config.text = `${config.text || ""} Tenant: ${req.params.id}`;
  }
  res.send(config);
};

var count = 0;
const useParticles = (req, res) => {
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

app.get("/user/:id/config", useConfig);
app.get("/user/:id/particles", useParticles);
app.get("/config", useConfig);
app.get("/particles", useParticles);

app.use("/user/:id", express.static("public"));
app.use("/", express.static("public"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

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

console.log(process.memoryUsage());
