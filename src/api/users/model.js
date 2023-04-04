import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema, model } = mongoose;

const authorsSchema = new Schema(
  {
    name: { type: String, required: true },
    avatar: { type: String, required: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

authorsSchema.pre("save", async function () {
  const newAuthorData = this;

  if (newAuthorData.isModified("password")) {
    const plainPW = newAuthorData.password;

    const hash = await bcrypt.hash(plainPW, 11);
    newAuthorData.password = hash;
  }
});

authorsSchema.methods.toJSON = function () {
  const currentAuthorDocument = this;
  const currentAuthor = currentAuthorDocument.toObject();
  delete currentAuthor.password;
  delete currentAuthor.createdAt;
  delete currentAuthor.updatedAt;
  delete currentAuthor.__v;
  return currentAuthor;
};

authorsSchema.static("checkCredentials", async function (name, plainPW) {
  const author = await this.findOne({ name });

  if (author) {
    const passwordMatch = await bcrypt.compare(plainPW, author.password);

    if (passwordMatch) {
      return author;
    } else {
      return null;
    }
  } else {
    return null;
  }
});

export default model("Author", authorsSchema);
