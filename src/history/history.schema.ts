import * as mongoose from 'mongoose';

export const HistorySchema = new mongoose.Schema(
  {
    context: String,
    chatroomID: String,
    author: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);
