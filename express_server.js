/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable camelcase */
const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookie = require('cookie-parser');
const morgan = require('morgan');
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookie());
app.use(morgan('tiny'));

const {verifyShortUrl, randomString, checkIfAvail, addUser, fetchUserInfo} = require('./helperFunctions');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
const userDatabase = {
// };
// const checkIfAvail  =   (email, userDatabase) => {
//   if (email === userDatabase) {
//     return userDatabase[ids]['This email is already registered'];}
//     else {
//       return

  //if the email -the perameter of the function- is inside the user database, we return true, otherwise we return false
  // in order to check the user data base, we are going to loop over the user database to check each individual email to find a match.

};

const currentUser = cookie => {
  for (let ids in userDatabase) {
    if (cookie === ids) {
      return userDatabase[ids]['email-address'];
    }
  }
};


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// displaying all urls
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, current_user: currentUser(req.cookies['user_id']) };
  res.render("urls_index", templateVars);
});

// new url created below
app.get("/urls/new", (req, res) => {
  const current_user = currentUser(req.cookies['user_id']);
  if (!current_user) {
    res.redirect('/login');
  }

  let templateVars = { current_user: current_user };
  res.render("urls_new", templateVars);
});

// new page added below
app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  if (verifyShortUrl(shortURL, urlDatabase)) {
    let longURL = urlDatabase[req.params.shortURL];
    let templateVars = { shortURL: shortURL, longURL: longURL, current_user: currentUser(req.cookies['user_id'])};
    res.render("urls_show", templateVars);
  } else {
    res.send('does not exist');
  }
});

// url added with rest of urls
app.post("/urls", (req, res) => {
  const shortURL = randomString();
  const newURL = req.body.longURL;
  urlDatabase[shortURL] = newURL;
  console.log('test',shortURL);
  res.redirect(`/urls/${shortURL}`);
});

// redirecting to longURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (verifyShortUrl(shortURL, urlDatabase)) {
    const longURL = urlDatabase[shortURL];
    res.redirect(longURL);
  } else {
    res.status(404);
    res.send('Does not exist');
  }
});

// delete url
app.post("/urls/:shortURL/delete", (req, res) => {
  const urlToDelete = req.params.shortURL;
  delete urlDatabase[urlToDelete];
  res.redirect('/urls');
});

//for editing
app.post("/urls/:shortURL/edit", (req, res) => {
  const key = req.params.shortURL;
  urlDatabase[key] = req.body.longURL;
  res.redirect('/urls');
});

// registration form
app.get("/register", (req, res) => {
  templateVars = { current_user: currentUser(req.cookies['user_id'])};
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const {password} = req.body;
  const email = req.body['email-address'];
  if (email === '') {
    res.status(400).send('Email is required');
  } else if (password === '') {
    res.status(400).send('Password is required');
  } else if (!checkIfAvail(email, userDatabase)) {
    res.status(400).send('This email is already registered');
  } else {
    newUser = addUser(req.body, userDatabase);
    res.cookie('user_id', newUser.id);
    res.redirect('/urls');
  }
  console.log(userDatabase);
});

app.get("/login", (req, res) => {
  templateVars = { current_user: currentUser(req.cookies['user_id']) };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const emailUsed = req.body['email-address'];
  const pwdUsed = req.body['password'];
  if (fetchUserInfo(emailUsed, userDatabase)) {
    const password = fetchUserInfo(emailUsed, userDatabase).password;
    const id = fetchUserInfo(emailUsed, userDatabase).id;
    if (password !== pwdUsed) {
      res.status(403).send('Error 403... re-enter your password');
    } else {
      res.cookie('user_id', id);
      res.redirect('/urls');
    }
  } else {
    res.status(403).send('Error 403... email not found');
  }
});

// endpoint to logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});