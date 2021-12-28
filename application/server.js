/* eslint-disable no-console */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/connections/mongodb');
const config = require('./config/index');
const userRoute = require('./routes/user.route');
const fortvestRoute = require('./routes/fortvest.route');
const transactionRoutes = require('./routes/transaction.route');
const cardRoutes = require('./routes/card.route');
const logger = require('./utils/logger');
const correlationIDMidware = require('./middleware/correlation-id-middleware');
const apiAccessAuthMiddleware = require('./middleware/api-access-auth');
const { job } = require('./services/jobs');

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

app.use('/v1/user', userRoute);
app.use('/v1/fortvest', fortvestRoute);
app.use('/v1/transaction', transactionRoutes);
app.use('/v1/card', cardRoutes);

app.listen(config.PORT, () => {
  console.log(`Server is up and running on port number ${config.PORT}`);
  const server = process.env.SERVER || 'LOCAL';
  // Connect Database
  connectDB(() => {
    if (server === 'LOCAL' || server === 'AWS') job();
  });
});
