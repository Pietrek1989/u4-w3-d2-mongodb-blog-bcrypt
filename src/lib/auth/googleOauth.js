import GoogleStrategy from "passport-google-oauth20";
import AuthorsModel from "../../api/users/model.js";
import createHttpError from "http-errors";
import { createAccessToken } from "./tools.js";

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/authors/googleRedirect`,
  },
  async (accessToken, refreshToken, profile, passportNext) => {
    try {
      const { email, given_name, family_name, picture, sub } = profile._json;
      console.log("Profile:", profile);
      const author = await AuthorsModel.findOne({ email });

      if (author) {
        const accessToken = await createAccessToken({
          _id: author._id,
          role: author.role,
        });
        passportNext(null, { accessToken });
      } else {
        const newAuthor = new AuthorsModel({
          name: given_name + " " + family_name,
          email,
          avatar: picture,
          googleId: sub,
        });
        const createdAuthor = await newAuthor.save();
        const accessToken = await createAccessToken({
          _id: createdAuthor._id,
          role: createdAuthor.role,
        });
        passportNext(null, { accessToken });
      }
    } catch (error) {
      passportNext(error);
    }
  }
);

export default googleStrategy;
