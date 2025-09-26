const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/about', (req, res) => {
  res.send('This is the about page');
});

app.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  res.send(`User ID is: ${userId}`);
});

app.get('/contact', (req, res) => {
  if (req.query.name) {
    res.send(`Hello ${req.query.name}`);
  } else {
    res.send('Please provide a name');
  }
});

app.get('/duplicate', (req, res) => {
  res.send('This is the duplicate route (only defined once now)');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
