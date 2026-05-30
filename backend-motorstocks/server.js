const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api', require('./routes/auth.routes'));
app.use('/api', require('./routes/usuarios.routes'));
app.use('/api', require('./routes/carros.routes'));
app.use('/api', require('./routes/vehiculos.routes'));
app.use('/api', require('./routes/ordenes.routes'));
app.use('/api', require('./routes/citas.routes'));

app.listen(PORT, () => {
    console.log(`\n🚀 MotorStocks Backend en http://localhost:${PORT}`);
});
