import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json' with { type: "json" };

import cors from './middleware/cors.js';
import placesRoutes from './routes/places-routes.js';
import usersRoutes from './routes/users-routes.js';
import httpError from './util/http-error.js';

const app = express();

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** -------------------- Middlewares -------------------- **/

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join(__dirname, 'uploads', 'images')));

app.use(cors);

/** -------------------- Routes -------------------- **/

app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res, next) => {
  const error = new httpError('Could not find this route.', 404);
  next(error);
});

/** -------------------- Error Handling -------------------- **/

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, err => {
      if (err) console.log('File deletion error:', err);
    });
  }

  if (res.headersSent) {
    return next(error);
  }

  res.status(error.code || 500).json({
    message: error.message || 'An unknown error occurred!',
  });
});
export default app;
/** -------------------- Database Connection & Server Start -------------------- **/

mongoose
  .connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@mycluster.h22woub.mongodb.net/?retryWrites=true&w=majority&appName=MyCluster`)
  .then(() => {
    console.log('Connected to MongoDB. Server is running on port 5000.');
    app.listen(5000);
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });