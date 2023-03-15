import mongoose from "mongoose";

const { Schema, model } = mongoose;

const articleSchema = new Schema(
  {
    category: { type: String, required: true },
    title: { type: String, required: true },
    cover: { type: String, required: true },
    readTime: {
      value: { type: Number },
      unit: { type: String, enum: ["minutes", "seconds", "hours"] },
    },
    author: {
      name: { type: String },
      avatar: { type: String },
    },
    content: { type: String, required: true },
    comments: [
      {
        title: String,
        text: String,
        dateOfPosting: Date,
        dateOfUpdate: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default model("Article", articleSchema);
