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
  .help()
  .alias("help", "h").argv;

const version = argv.version || uuid.v4();

app.use(express.static("public"));

app.get("/config", (req, res) => {
  let config = Object.assign({}, argv);
  delete config.$0;
  delete config._;
  if (argv.backgroundColor) {
    config.backgroundColor = hexToRgb(argv.backgroundColor);
  }
  res.send(config);
});

var count = 0;
app.get("/particles", (req, res) => {
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
});

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
