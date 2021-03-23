// TinyApp
// Author: Farouk (@faroukalsajee)
const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
// const saltRounds = 10;

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieSession({
  name: 'session',
  keys: ['userId']
}));
app.set("view engine", "ejs");
app.use(morgan('tiny'));

const {urlsForUser, checkOwner, currentUser, verifyShortUrl, randomString, checkIfRegistered, addUser, fetchUserInfo} = require('./helperFunctions');

const urlDatabase = {
  
};
const userDatabase = {

};


app.get('/', (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (!user) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/register', (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (user) {
    res.redirect('/urls');
  } else {
    let templateVars = { currentUser: user };
    res.render('urls_register', templateVars);
  }
});

// new url created below
app.get('/urls/new', (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (!user) {
    res.redirect('/login');
  } else {
    let templateVars = { currentUser: user };
    res.render('urls_new', templateVars);
  }
});

// new page added below
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const user = currentUser(req.session.userId, userDatabase);
  if (verifyShortUrl(shortURL, urlDatabase)) {
    if (user !== urlDatabase[shortURL].userID) {
      res.send('Wrong ID');
    } else {
      const longURL = urlDatabase[shortURL].longURL;
      let templateVars = { shortURL: shortURL, longURL: longURL, currentUser: user};
      res.render('urls_show', templateVars);
    }
  } else {
    res.send('Url does not exist');
  }
});

// redirecting to longURL
app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  if (verifyShortUrl(shortURL, urlDatabase)) {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send('Not found');
  }
});

// loginUser
app.get('/login', (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (user) {
    res.redirect('/urls');
  } else {
    let templateVars = { currentUser: user };
    res.render('login', templateVars);
  }
});
app.get('/urls', (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (!user) {
    res.render('urls_errors');
  } else {
    const usersLinks = urlsForUser(user, urlDatabase);
    let templateVars = { urls: usersLinks, currentUser: currentUser(req.session.userId, userDatabase) };
    res.render('urls_index', templateVars);
  }
});
app.post('/login', (req, res) => {
  const emailUsed = req.body['email'];
  const pwdUsed = req.body['password'];
  if (fetchUserInfo(emailUsed, userDatabase)) {
    const { password, id } = fetchUserInfo(emailUsed, userDatabase);
    if (!bcrypt.compareSync(pwdUsed, password)) {
      res.status(403).send('Error 403... Please enter your password again');
    } else {
      req.session.userId = id;
      res.redirect('/urls');
    }
  } else {
    res.status(403).send('Error 403... email not found');
  }
});

// url added with rest of urls
app.post('/urls', (req, res) => {
  const user = currentUser(req.session.userId, userDatabase);
  if (!user) {
    res.redirect('/login');
  } else {
    const shortURL = randomString();
    const newURL = req.body.longURL;
    urlDatabase[shortURL] = { longURL: newURL, userID: user };
    res.redirect(`/urls/${shortURL}`);
  }
});

// delete url
app.post('/urls/:shortURL/delete', (req, res) => {
  if (!checkOwner(currentUser(req.session.userId, userDatabase), req.params.shortURL, urlDatabase)) {
    res.send('Wrong ID');
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

//for editing
app.post('/urls/:shortURL/edit', (req, res) => {
  if (!checkOwner(currentUser(req.session.userId, userDatabase), req.params.shortURL, urlDatabase)) {
    res.send('Wrong ID');
  } else {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect('/urls');
  }
});

//registerUser
app.post('/register', (req, res) => {
  const {email, password} = req.body;
  if (email === '') {
    res.status(400).send('Email is required');
  } else if (password === '') {
    res.status(400).send('Password is required');
  } else if (!checkIfRegistered(email, userDatabase)) {
    res.status(400).send('Email already registered');
  } else {
    const newUser = addUser(req.body, userDatabase);
    req.session.userId = newUser.id;
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});