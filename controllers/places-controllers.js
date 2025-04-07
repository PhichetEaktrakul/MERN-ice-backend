import fs from 'fs';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import httpError from '../util/http-error.js';
import Place from '../models/place.js';
import User from '../models/user.js';

// ---------------- Handler to fetch a place by its ID -----------------
const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(new httpError('Something went wrong, could not find a place.', 500));
  }

  if (!place) {
    return next(new httpError('Could not find place for the provided id.', 404));
  }

  res.json({ place: place.toObject({ getters: true }) });
};

// ---------------- Handler to fetch all places for a specific user ----------------
const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate('places');
  } catch (err) {
    return next(new httpError('Fetching places failed, please try again later.', 500));
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(new httpError('Could not find places for the provided user id.', 404));
  }

  res.json({
    places: userWithPlaces.places.map(place => place.toObject({ getters: true }))
  });
};

// ---------------- Handler to create a new place ----------------
const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new httpError('Invalid inputs passed, please check your data.', 422));
  }

  const { title, description, address } = req.body;

  const createdPlace = new Place({
    title,
    description,
    address,
    image: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.asiahighlights.com%2Fthailand&psig=AOvVaw1NCQWxjvBwBajXQ32bZbIA&ust=1744111742054000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCJjD1tjoxYwDFQAAAAAdAAAAABAJ',/*  req.file.path */
    creator: req.userData.userId
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(new httpError('Creating place failed, please try again.', 500));
  }

  if (!user) {
    return next(new httpError('Could not find user for provided id.', 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    return next(new httpError('Creating place failed, please try again.', 500));
  }

  res.status(201).json({ place: createdPlace });
};

// ---------------- Handler to update an existing place ----------------
const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new httpError('Invalid inputs passed, please check your data.', 422));
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(new httpError('Something went wrong, could not update place.', 500));
  }

  if (place.creator.toString() !== req.userData.userId) {
    return next(new httpError('You are not allowed to edit this place.', 401));
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    return next(new httpError('Something went wrong, could not update place.', 500));
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

// ---------------- Handler to delete a place ----------------
const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    return next(new httpError('Something went wrong, could not delete place.', 500));
  }

  if (!place) {
    return next(new httpError('Could not find place for this id.', 404));
  }

  if (place.creator.id !== req.userData.userId) {
    return next(new httpError('You are not allowed to delete this place.', 401));
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await place.deleteOne({ session: sess }); // ใช้ deleteOne แทน remove
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });

    await sess.commitTransaction();
} catch (err) {
    return next(new httpError('Something went wrong, could not delete place.', 500));
}

  fs.unlink(imagePath, err => {
    if (err) {
      console.error('Error deleting image file:', err);
    }
  });

  res.status(200).json({ message: 'Deleted place.' });
};

// Export handlers
const placesControllers = {
  getPlaceById,
  getPlacesByUserId,
  createPlace,
  updatePlace,
  deletePlace
};
export default placesControllers;