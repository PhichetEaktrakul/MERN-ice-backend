import mongoose from 'mongoose';

const { Schema } = mongoose;

const placeSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  address: { type: String, required: true },
  creator: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
});

const Place = mongoose.model('Place', placeSchema);

export default Place;