//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
var session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

//Setting session
app.use(session({
  secret: "keyboard cat",
  resave: false,
  saveUninitialized: true
}));
//Initialize passport
app.use(passport.initialize());
//Using passport to setup a session
app.use(passport.session());

//Connect to a data data base
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});

//schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

//Use your mongoose schema to setup passport local mongoose.
userSchema.plugin(passportLocalMongoose);
//Use mongoose to turn on the findorcreate page.
userSchema.plugin(findOrCreate);

//Secret word to encryption


//Model
const User = new mongoose.model("User", userSchema);

//serializing users
passport.use(User.createStrategy());
passport.serializeUser((user, done)=>{
  done(null, user.id);
});

passport.deserializeUser((id, done)=>{
  User.findById(id, (err, user)=>{
    done(err,user);
  });
});

//Oauth code
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//Setting everything up

app.get("/", (req, res) => {
  res.render("home");
});

//Route to Authentication with google
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

//Route authenticated
app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

//Secret get route
app.get("/secrets", (req, res) => {
User.find({"secret": {$ne: null}}, (err, foundUsers)=>{
  if(err){
  console.log(err);
  }else{
    if(foundUsers){
        res.render("secrets", {usersWithSecrets: foundUsers});
    }
  }
});
});

//Submit secrets get  route
app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});
 //Submit secret post Route
 app.post("/submit", (req, res) => {
   const submittedSecret = req.body.secret;

   console.log(req.user.id);

   User.findById(req.user.id, (err, foundUser) =>{
     if(err){
       console.log(err);
     } else{
       if(foundUser){
         foundUser.secret = submittedSecret;
         foundUser.save(function(){
           res.redirect("/secrets");
         });
       }
     }
   });
 });

//Logout screen

app.get("/logout", (req, res)=>{
  req.logout();
  res.redirect("/");
});

//New User with the post register route
app.post("/register", (req, res) => {

  User.register({
    username: req.body.username
  }, req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });

});

//Checking if our user was creating in the login screen

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});









app.listen(3000, () => {
  console.log("Server running on port 3000");
});
