//App config
const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
//Secures passwords and does not save them in raw form
const bcrypt = require('bcryptjs');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

//Variables: Database for urls and users
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

//Helper functions from helpers.js
const { getUserByEmail, generateRandomID, urlsForUser } = require('./helpers')

//Encrypted cookies
const cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  keys: ["lknt42fnoh90hn2hf90w8fhofnwe0"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


// Redirects to /urls if logged in, otherwise to /login
app.get('/', (req, res) => {
  if (users[req.session.user]) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
})

//Registration page
app.get("/register", (req, res) => {
  let user;
  if (users[req.session.user]) {
    user = users[req.session.user].email
  }
  const templateVars = { urls: urlDatabase, user: user };
  res.render("register", templateVars);
});


//Register page, redirects to urls if valid credentials are entered
//Or will redirect to the failed to register page
app.post("/register", (req, res) => {
  console.log("before new user", users)
  let id = generateRandomID()
  if (getUserByEmail(req.body.email, users)) {
    res.status(400).send("Email already registered");
    return;
  }
  if (req.body.email && req.body.password) {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    const newUser = {
      id: id,
      email: req.body.email,
      password: hashedPassword
    }
    users[newUser["id"]] = newUser
    console.log("after new user", users);
    req.session.user = id;
    console.log(req.session, "text")
    res.redirect('/urls')
  } else {
    const templateVars = { user: null };
    res.status(400)
    res.render("registerFail", templateVars);
  }
});

//Login page 
app.get("/login", (req, res) => {
  let user;
  if (users[req.session.user]) {
    user = users[req.session.user].email
  }
  const templateVars = { urls: urlDatabase, user: user };
  res.render("login", templateVars);
});

//Redirects to the urls page if proper account credentials are entered
//or will reidrect to the login failed page
app.post("/login", (req, res) => {
  let userEmail = req.body.email;
  let password = req.body.password;
  let userobj = getUserByEmail(userEmail, users);
  console.log(userobj, "text");

  if (userobj && userEmail === userobj.email && bcrypt.compareSync(password, userobj.password)) {
    req.session.user = userobj.id
    res.redirect("/urls");
  } else {
    const templateVars = { user: null };
    res.status(403)
    res.render("loginFail", templateVars);
  }
});

//Logs the user out and deletes the cookie
app.post('/logout', (req, res) => {
  res.clearCookie("session");
  res.redirect("/urls");
});

//Urls index page that contains urls exclusive to logged in users
app.get("/urls", (req, res) => {
  let user;
  if (users[req.session.user]) {
    user = users[req.session.user].email
  }
  const templateVars = { urls: urlsForUser(req.session.user, urlDatabase), user: user || null };
  res.render("urls_index", templateVars);
});

//User will be directed to the urls page containing all urls entered by the users account. 
//If a user is not logged in it will redirect them to the login page. 
//Users can only edit their own created urls. Urls created will generate a random string of 6 characters
app.post("/urls", (req, res) => {
  if (!users[req.session.user]) {
    res.redirect("/login")
  }
  const shortURL = generateRandomID();
  const longURL = req.body.longURL
  urlDatabase[shortURL] = { longURL, userID: users[req.session.user].id }
  console.log(urlDatabase);
  res.redirect(`/urls`);
});

//New urls page, can only be accessed by users that are logged in 
//Otherwise will redirect them to the login page.
//Creation page for new urls
app.get("/urls/new", (req, res) => {
  let user;
  if (!users[req.session.user]) {
    res.redirect("/login")
  }
  if (users[req.session.user]) {
    user = users[req.session.user].email
  }
  const templateVars = { url: urlDatabase, user: user || null };
  res.render("urls_new", templateVars);
});

//Url update page, users can edit urls that they have made
app.post("/urls/:shortURL", (req, res) => {
  const obj = urlDatabase[req.params.shortURL];
  if (req.session.user !== obj.userID) {
    return res.status(400).send("<p>Error</p>")
  }
  const shortURL = req.params.shortURL
  const longURL = req.body.longURL
  urlDatabase[shortURL].longURL = longURL
  console.log(urlDatabase)
  res.redirect("/urls")
});

//Short urls page
//shows information of urls that belong to the user
app.get("/urls/:shortURL", (req, res) => {
  const obj = urlDatabase[req.params.shortURL];
  if (req.session.user !== obj.userID) {
    return res.status(400).send("<p>Error</p>")
  }
  let user;
  if (users[req.session.user]) {
    user = users[req.session.user].email
  }
  const shortURL = req.params.shortURL
  const templateVars = { url: urlDatabase, longURL: urlDatabase[shortURL].longURL, shortURL, user: user || null };
  res.render("urls_show", templateVars);
});

//Url redirects, needs a full valid url address or else it will result in an error
app.get("/u/:shortURL", (req, res) => {
  console.log(urlDatabase[req.params.shortURL].longURL);
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});



app.get("/urls/:shortURL", (req, res) => {
  let user;
  if (users[req.session.user]) {
    user = users[req.session.user].email
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: user || null };
  res.render("urls_show", templateVars);
});

//Deletes urls from the database that were exclusive to the user
app.post('/urls/:shortURL/delete', (req, res) => {
  const obj = urlDatabase[req.params.shortURL];
  if (req.session.user !== obj.userID) {
    return res.status(400).send("<p>Error</p>")
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

//server listen
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});