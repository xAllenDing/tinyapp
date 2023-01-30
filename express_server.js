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

const urlsForUser = function (id) {
  const urls = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      urls[key] = urlDatabase[key].longURL;
    }
  }
  return urls;
};

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
  
  app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
  });

  // This will bring you to the main home page 
  app.get("/", (req, res) => {
    res.redirect("/urls");
  });

  // This is the login page 
  app.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const user = getUserByEmail(email, users);
    if (!user) {
      return res.status(403).send("This email is not registered");
    }
    if (!bcrypt.compareSync(password, user.hasedPassword)) {
      return res.status(403).send("Your password does not match");
    }
    req.session.user_id = user.id;
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
  
  // This is the registration page 
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
    bcrypt.genSalt(10)
    .then((salt) => {
      return bcrypt.hashSync(password, salt);
    })
    .then((hash) => {
      users[id] = { id: id, email: email, hasedPassword: hash};
        req.session.user_id = id;
        res.redirect("/urls");
      });
  });


  // This is the user url page and logout
  app.get("/urls", (req, res) => {
    const userID = req.session.user_id;
    const user = users[userID];
    const urls = urlsForUser(userID);
    if (!userID) {
      return res.status(403).send("Please login to your account");
    }
    const templateVars = { urls: urls, user: user }
    res.render("urls_index", templateVars);
  });
  
  app.post("/logout", (req, res) => {
    req.session.user_id = null;
    res.redirect("/login");
  });

  // This is the new URL page
  app.get("/urls/new", (req, res) => {
    const userID = req.session.user_id;
    if (!userID) {
      return res.redirect("/login");
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

  // This displays the url page
  app.get("/urls/:id", (req, res) => {
    const userID = req.session.user_id;
    const id = req.params.id;
    if (!userID) {
      return res.status(403).send("Please login to your account");
    }
    if (!(id in urlDatabase)) {
      return res.status(404).send("This URL does not exist");
    }
    if (userID !== urlDatabase[id].userID) {
      return res.status(403).send("This URL does not belong to you");
    }
    const user = users[userID];
    const longURL = urlDatabase[id].longURL;
    const templateVars = { id: id, longURL: longURL, user: user };
    res.render("urls_show", templateVars);
  });

  app.post("/urls/:id", (req, res) => {
    const userID = req.session.user_id;
    const id = req.params.id;
    const longURL = req.body.longURL;
    if (!userID) {
      return res.status(403).send("Please login to your account");
    }
    if (!(id in urlDatabase)) {
      return res.status(404).send("This URL does not exist");
    }
    if (userID !== urlDatabase[id].userID) {
      return res.status(403).send("This URL does not belong to you");
    }
    if (longURL === "") {
      return res.status(400).send("Cannot shorten empty url");
    }
    urlDatabase[id] = { longURL: longURL, userID: userID };
    res.redirect("/urls");
  });

  // This will delete the urls
  app.post("/urls/:id/delete", (req, res) => {
    const id = req.params.id;
    const userID = req.session.user_id;
    if (!userID) {
      return res.status(403).send("Please login to your account");
    } 
    if (!(id in urlDatabase)) {
      return res.status(404).send("This URL does not exist");
    }
    if (userID !== urlDatabase[id].userID) {
      return res.status(403).send("This URL does not belong to you");
    }
    delete urlDatabase[id];
    res.redirect("/urls");
  });

  // This will redirect the short URL to the long URL
  app.get("/u/:id", (req, res) => {
    const id = req.params.id;
    if (!(id in urlDatabase)) {
      return res.status(404).send("This URL does not exist");
    }
    const longURL = urlDatabase[id].longURL;
    res.redirect(longURL);
  });



  app.listen(PORT, () => {
    console.log(`URL app listening on port ${PORT}!`);
  });