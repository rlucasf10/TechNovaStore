const express = require('express');
const app = express();
const PORT = 8000;

app.get('/', (req, res) => {
  res.send('TechNovaStore Backend funcionando correctamente');
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
