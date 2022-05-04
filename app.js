//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

//Connect to a data data base
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});

//schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

//Secret word to encryption
const secret = process.env.SECRET;
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] });

//Model
const User = new mongoose.model("User", userSchema);

//Setting everything up

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});


//New User with the post register route
app.post("/register", (req, res) => {

  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });

  newUser.save((err) => {
    if (err) {
      console.log(err);
    } else {
      res.render("secrets");
    }
  });
});

//Checking if our user was creating in the login screen

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({
    email: username
  }, (err, userFound) => {
    if (err) {
      console.log(err);
    } else {
      if (userFound) {
        if (userFound.password === password) {
          res.render("secrets");
        }
      }
    }
  });
});









app.listen(3000, () => {
  console.log("Server running on port 3000");
});