const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

const AppError = require('./utils/AppError');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// 1) Global Middlewares
// This is how we use middleware (app.use)

// Set security HTTP Header (Helmet )
app.use(helmet());

// Use Morgan to log api request in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Enabling CORS
app.use(cors());

// Body Parser (To parse body form the request that was made || Reading Request from the body || PUT, POST, PATCH requests)
app.use(express.json());

// Data Sanitization against NOSQL Query Injection
app.use(mongoSanitize());

// Data Sanitization against XSS
app.use(xss());

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/chats', chatRoutes);

app.all('*', (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server`, 404);

  // The next function accepts an argument that we use as the error object
  next(err);
});

app.use(errorHandler);
module.exports = app;
