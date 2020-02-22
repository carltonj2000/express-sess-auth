const express = require("express");
const session = require("express-session");

const TWO_HOURS = 1000 * 60 * 60 * 2;

const {
  PORT = 3000,
  NODE_ENV = "development",
  SESSION_LIFETIME = TWO_HOURS,
  SESSION_NAME = "sid",
  SESSION_SECRET = "keyboard_cat"
} = process.env;

const IN_PROD = NODE_ENV === "production";

const users = [
  { id: 1, name: "Carlton", email: "carlton@gmail.com", password: "secret" },
  { id: 2, name: "Sophie", email: "sophie@gmail.com", password: "secret" },
  { id: 3, name: "Champagne", email: "champagne@gmail.com", password: "secret" }
];
const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: SESSION_NAME,
    resave: false,
    saveUninitialized: false,
    secret: SESSION_SECRET,
    cookie: {
      maxAge: SESSION_LIFETIME,
      sameSite: "lax",
      secure: IN_PROD
    }
  })
);

const redirectLogin = (req, res, next) => {
  if (!req.session.userId) {
    res.redirect("/login");
  } else next();
};

const redirectHome = (req, res, next) => {
  if (req.session.userId) {
    res.redirect("/home");
  } else next();
};

app.use((req, res, next) => {
  const { userId } = req.session;
  if (userId) res.locals.user = users.find(u => u.id === userId);
  next();
});

app.get("/", redirectLogin, (req, res) => {
  res.send(`
    <h1>Welcome</h1>
    ${
      req.session.userId
        ? `
    <a href="/home">home<a>
    <form method="post" action="/logout" style="display: inline;">
      <button>Logout</button>
    </form>
    `
        : `
    <a href="/login">Login<a>
    <a href="/register">Register<a>
    `
    }
  `);
});

app.get("/home", redirectLogin, (req, res) => {
  const { user } = res.locals;
  res.send(`
    <h1>Home</h1>
    <a href='/'>Main</a>
    <ul>
      <li>Name: ${user.name}</li>
      <li>Email: ${user.email}</li>
    </ul>
  `);
});

app.get("/login", redirectHome, (req, res) => {
  res.send(`
    <h1>Login</h1>
    <form method="post" action="/login">
      <input type="email" name="email" placeholder="Email" required />
      <input type="password" name="password" placeholder="Password" required />
      <input type="submit" />
    </form>
    <a href='/register'>Register<a>
  `);
});

app.get("/register", redirectHome, (req, res) => {
  res.send(`
    <h1>Login</h1>
    <form method="post" action="/register">
      <input type="text" name="name" placeholder="Name" required />
      <input type="email" name="email" placeholder="Email" required />
      <input type="password" name="password" placeholder="Password" required />
      <input type="submit" />
    </form method="/login">
    <a href='/login'>Login<a>
  `);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      req.session.userId = user.id;
      return res.redirect("/home");
    }
  }
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  if (name && email && password) {
    const user = users.some(u => u.email === email);
    if (!user) {
      const user = { id: users.length + 1, name, email, password };
      users.push(user);
      req.session.userId = user.id;
      return res.redirect("/home");
    }
  }
  res.redirect("/register");
});

app.post("/logout", redirectLogin, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect("/home");
    }
    res.clearCookie(SESSION_NAME);
    res.redirect("/login");
  });
});

app.listen(PORT, () => console.log(`App running on port ${PORT}`));
