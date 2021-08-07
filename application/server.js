/* eslint-disable no-console */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/connections/mongodb');
const config = require('./config/index');
const userRoute = require('./routes/spectrumteam.route');
const clientRoute = require('./routes/teamclient.route');
const idmanRoute = require('./routes/idman.route');

const logger = require('./utils/logger');
const correlationIDMidware = require('./middleware/correlation-id-middleware');
const apiAccessAuthMiddleware = require('./middleware/api-access-auth');
// Connect Database
connectDB();

const app = express();
app.use(cors());
// sent the maximum input
app.use(bodyParser.json({ limit: 16777216 }));
// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

app.use(bodyParser.json({ type: '*/*' }));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
app.use(correlationIDMidware);
app.use(apiAccessAuthMiddleware);

app.use((req, res, next) => {
  // eslint-disable-next-line no-underscore-dangle
  logger.trace(req.method, `[${req._entity}]`, req.path);
  next();
});

app.get('/healthcheck', async (req, res) => {
  res.send('User Management Service is Up v1.0');
});

app.use('/v1/staff', userRoute);
app.use('/v1/client', clientRoute);
app.use('/v1/idman', idmanRoute);
app.listen(config.PORT, () => {
  console.log(`Server is up and running on port number ${config.PORT}`);
});
