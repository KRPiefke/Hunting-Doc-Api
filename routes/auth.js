const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { verifyRefreshToken } = require("../helpers/verify");
const { registerValidation, loginValidation } = require("../validations/user");

// * Functions

//Create a jwt access token
function createAccessToken(user) {
  const access_token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15min",
  });
  return access_token;
}

//Create a jwt refresh token
function createRefreshToken(user) {
  const refresh_token = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "30d",
  });
  return refresh_token;
}

// * Register User incl. validation
router.post("/register", async (req, res) => {
  //Validate the data
  const { error, value } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //Check if the user already exists
  const emailExist = await User.findOne({ email: value.email });
  if (emailExist)
    return res
      .status(400)
      .json({ ok: false, message: "An User with this Email already exists." });
  const usernameExist = await User.findOne({ username: value.username });
  if (usernameExist)
    return res
      .status(400)
      .json({
        ok: false,
        message: "An User with this Username already exists.",
      });

  //Hash the passwords
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(value.password, salt);

  //Create a new User
  const user = new User({
    username: value.username,
    password: hashPassword,
    email: value.email,
  });

  //save the user to db
  try {
    const savedUser = await user.save();
    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error while save data to DB" });
  }
});

// * Login
router.post("/login", async (req, res) => {
  //Validate the data
  const { error, value } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //Check if the user exists
  const user = await User.findOne({ username: value.username });
  if (!user)
    return res
      .status(400)
      .json({ ok: false, message: "The username or password is wrong." });

  //Check if the password ist correct
  const validPass = await bcrypt.compare(value.password, user.password);
  if (!validPass)
    return res
      .status(400)
      .json({ ok: false, message: "The username or password is wrong." });

  //Create tokens
  var userJSON = user.toJSON();
  delete userJSON.password;
  delete userJSON.__v;
  delete userJSON.refresh_tokens;
  const refresh_token = createRefreshToken(userJSON);
  const access_token = createAccessToken(userJSON);

  //Check max logins on different devices
  if (user.refresh_tokens.length == 10)
    return res.status(403).json({ ok: false, message: "Max logins reached" });

  //Push refresh token to db
  try {
    user.refresh_tokens.push(refresh_token);
    user.save();
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, message: "Error while save data to DB" });
  }

  //Delete old refresh token if no refresh token isset check all tokens in dp if expired
  const { cookies } = req;
  if (cookies.refresh_token) {
    try {
      await user.updateOne({
        $pull: { refresh_tokens: cookies.refresh_token },
      });
    } catch (error) {
      return res
        .status(500)
        .json({ ok: false, message: "Error while save data to DB" });
    }
  } else {
    for (i = 0; i < user.refresh_tokens.length; i++) {
      try {
        const verified = jwt.verify(
          user.refresh_tokens[i],
          process.env.REFRESH_TOKEN_SECRET
        );
        console.log(verified);
      } catch (error) {
        try {
          await user.updateOne({
            $pull: { refresh_tokens: user.refresh_tokens[i] },
          });
        } catch (error_1) {
          return res
            .status(500)
            .json({ ok: false, message: "Error while save data to DB" });
        }
      }
    }
  }

  //Set cookies
  res
    .cookie("refresh_token", refresh_token, {
      httpOnly: true,
      //secure: true, // TODO: enable secure for https only
      domain: process.env.DOMAIN,
      path: "/api/auth",
    })
    .cookie("access_token", access_token, {
      httpOnly: true,
      //secure: true, // TODO: enable secure for https only
      domain: process.env.DOMAIN,
      path: "/api",
      expires: new Date(Date.now() + 899700),
    })
    .json({ ok: true });
});

module.exports = router;
