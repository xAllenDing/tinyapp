const express = require("express");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const cookieSession = require("cookie-session");
const app = express();
const PORT = 8080; // default port 8080

const generateRandomString = function () {
  let r = (Math.random() + 1).toString(36).substring(6);
  return r;
};

const getUserByEmail = function (email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
};

const userUrls = function (id) {
  const urls = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      urls[key] = urlDatabase[key].longURL;
    }
  }
  return urls;
}


app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID"
  }
};

const users = {
    userRandomID: {
      id: "userRandomID",
      email: "user@example.com",
      hasedPassword: bcrypt.hashSync("purple-monkey-dinosaur", 10)
    },
    user2RandomID: {
      id: "user2RandomID",
      email: "user2@example.com",
      hasedPassword: bcrypt.hashSync("dishwasher-funk", 10)
    }
  };

  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cookieSession({
    name: "session",
    keys: ["user_id"]
  }));


  // home page //
  app.get("/", (req, res) => {
    res.redirect("/urls");
  });

  // login page
  app.post("/login", (req, res) => {
    const user = getUserByEmail(req.body.email);
    if (!user) {
      return res.status(403).send("This email is not registered");
    }
    // if(password !== user.password) {
    //   return res.status(403).send("Please enter correct password.");
    // }
    res.cookie("user_id", user);
    res.redirect("/urls");
  });

  app.get("/login", (req, res) => {
    const userID = req.session.user_id;
    if (userID) {
      return res.redirect("/urls");
    }
    const user = users[userID];
    const templateVars = { user: user };
    res.render("login", templateVars);
  });

  // registration page //
  app.post("/registeration", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).send("Please enter in username or password.");
    }
    if (getUserByEmail(email, users)) {
      return res.status(400).send("This email is already registered.");
    }

    const id = generateRandomString();
    res.cookie("user_id", id);
    users[id] = {
      id: id,
      email: email,
      password: password
    }
    res.redirect("/urls");
  });

  app.get("/registeration", (req, res) => {
    const userID = req.session.user_id;
    const email = req.body.email;
    if (userID) {
      return res.redirect("/urls");
    }
    const user = users[userID];
    const templateVars = { email: email, user: user };
    res.render("registeration", templateVars);
  });

  // user URL page //
  app.get("/urls", (req, res) => {
    const user = users[req.cookies["user_id"]];
    const templateVars = { urls: urlDatabase, user: user }
    res.render("urls_index", templateVars);
  });

  // new URL page //
  app.get("/urls/new", (req, res) => {
    const userID = req.session.user_id;
    if (!userID) {
      res.redirect("/login");
    }
    const user = users[userID];
    const templateVars = { user: user };
    res.render("urls_new", templateVars);
  });

  app.post("/urls", (req, res) => {
    const userID = req.session.user_id;
    const longURL = req.body.longURL;
    if (!userID) {
      return res.status(403).send("You must be logged in to view URLs");
    }
    if (longURL === "") {
      return res.status(400).send("Cannot shorten empty url");
    }
    const id = generateRandomString();
    urlDatabase[id] = { longURL: longURL, userID: userID };
    res.redirect(`/urls/${id}`);
  });

  // displaying URL page //
  app.get("/urls/:id", (req, res) => {
    const user = users[req.cookies["user_id"]];
    const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: user };
    res.render("urls_show", templateVars);
  });

  app.get("/u/:id", (req, res) => {
    const longURL = urlDatabase[id].longURL;
    const id = req.params.id;
    if (!(id in urlDatabase)) {
      return res.status(404).send("This URL does not exist");
    }
    res.redirect(longURL);
  });

  // redirecting long URL //
  app.post("/urls/:id", (req, res) => {
    urlDatabase[req.params.id] = req.body.longURL;
    res.redirect("/urls");
  });

  app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
  });

  // logout and clearing cookies
  app.post("/urls/:id/delete", (req, res) => {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  });

  app.post("/logout", (req, res) => {
    res.clearCookie("user_id");
    res.redirect("/login");
  });

  app.listen(PORT, () => {
    console.log(`URL app listening on port ${PORT}!`);
  });