// buggy_node_app.js
const express = require("express");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
const crypto = require("crypto");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global variables pollution
globalVar = "I am global";
leakyObject = {};

// Unsecured route + callback hell
app.post("/save", (req, res) => {
    const data = req.body.data;
    fs.writeFile("output.txt", data, (err) => {
        if (err) throw err; // will crash server
        fs.appendFile("log.txt", data, (err) => {
            if (err) console.log("ignored error");
            res.send("Saved"); // could be called multiple times
        });
    });
});

// Async / Promise mistakes
app.get("/fetch", async (req, res) => {
    const urls = ["https://nonexistent1.com", "https://nonexistent2.com"];
    const results = [];
    urls.forEach(async (url) => {
        const resp = await axios.get(url); // unhandled promise rejection
        results.push(resp.data);
    });
    res.json(results); // likely empty because forEach async
});

// Memory leak + interval hell
const bigArray = [];
setInterval(() => {
    const tmp = new Array(1000000).fill(Math.random());
    bigArray.push(tmp);
}, 500);

// Unused variables + bad JSON parsing
app.post("/parse-json", (req, res) => {
    const data = req.body.data;
    try {
        const parsed = JSON.parse(data);
        unusedVar = parsed.foo; // unused
        res.send(parsed);
    } catch {} // silently ignore errors
});

// Infinite loop + blocking event loop
app.get("/block", (req, res) => {
    res.send("done");
});

// Unsafe eval + command injection
//Consider using vm2 module
const {VM} = require('vm2');

app.post('/run', (req, res) => {
  const code = req.body.code;

  const vm = new VM({
    timeout: 1000,
    sandbox: {}
  });

  try {
    vm.run(code);
    res.send('Executed');
  } catch (err) {
    console.error(err);
    res.status(500).send('Execution failed');
  }
});

// Synchronous fs calls in async route
app.get("/sync-file", (req, res) => {
    const content = fs.readFileSync("nonexistent.txt", "utf8"); // crashes server
    res.send(content);
});

// Callback hell + nested timeouts
const util = require('util');

const setTimeoutPromise = util.promisify(setTimeout);

async function nestedTimeouts(a, b) {
    await setTimeoutPromise(100);
    await setTimeoutPromise(100);
    await setTimeoutPromise(100);
    return a + b;
}

async function main() {
    let sum = await nestedTimeouts(1, 2);
    sum = await nestedTimeouts(sum, 3);
    sum = await nestedTimeouts(sum, 4);
    console.log("Nested sum:", sum);
}

main();
// Deprecated crypto usage
app.get("/hash", (req, res) => {
    const hash = crypto.createHash("md5").update("password").digest("hex"); // insecure
    res.send(hash);
});

// Server listen
app.listen(3000, function() {
    console.log("Buggy server running on port 3000");
});

// Random unhandled promise rejection
Promise.reject("Oops, unhandled!");

// Unused imported module
path.join("a", "b");

// Another memory leak + huge object
const memoryHog = {};
setInterval(() => {
    memoryHog[Math.random()] = new Array(1000000).fill("leak");
}, 1000);

// Endless recursion
function recurse(n) {
    return recurse(n + 1); // stack overflow
}
// recurse(0); // Uncomment to crash

console.log("All intentionally buggy code loaded.");
