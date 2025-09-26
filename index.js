const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World
});

app.get('/about', (req, res) => {
  re is the about page');
});

app.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  res.send(`User ID is: ${userId}`);
});

app.get('/contact', (req, res) => {
  if (req.query.name) {
    reme');
  }
});

app.get('/duplicate', (req, res) => {
  res.send('This is the duplicate route (only defined once now)');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
