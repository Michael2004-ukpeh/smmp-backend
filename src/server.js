const http = require('http');
const dotenv = require('dotenv');
const app = require('./app');

const colors = require('colors');
const connectDB = require('./db/db');
dotenv.config({ path: './config.env' });

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception!! Shutting Down');
  console.log({ name: err.name, message: err.message });
  process.exit(1);
});

connectDB();
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`.bgCyan);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION!! Closing Server then shutting down');
  console.log({ name: err.name, message: err.message });
  server.close(() => {
    process.exit(1);
  });
});
