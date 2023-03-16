import mongoose from "mongoose";

const { Schema, model } = mongoose;

const articleSchema = new Schema(
  {
    category: { type: String, required: true },
    title: { type: String, required: true },
    cover: { type: String },
    readTime: {
      value: { type: Number },
      unit: { type: String, enum: ["minutes", "seconds", "hours"] },
    },
    author: { type: Schema.Types.ObjectId, ref: "Author" },
    content: { type: String },
    comments: [
      {
        title: String,
        text: String,
        dateOfPosting: Date,
        dateOfUpdate: Date,
      },
    ],
    likes: [{ authorId: { type: mongoose.Types.ObjectId, ref: "Author" } }],
  },
  {
    timestamps: true,
  }
);

export default model("Article", articleSchema);
