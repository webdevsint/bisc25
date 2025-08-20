const session = require("express-session");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const port = process.env.PORT || 3000;

const connectDB = require("./db"); // Import the DB connection function
const Token = require("./models/Token"); // Import the Mongoose model

app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 3600000,
    },
  })
);

connectDB();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/success", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "success.html"));
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/admin");
  } else {
    res.sendFile(path.resolve("./views/login.html"));
  }
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    req.session.user = { username: process.env.ADMIN_USERNAME };
    res.redirect("/admin");
  } else {
    res.redirect("/login?success=false");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

app.get("/admin", (req, res) => {
  if (req.session.user) {
    res.sendFile(path.resolve("./views/admin.html"));
  } else {
    res.redirect("/login");
  }
});

app.post("/api/tokens", async (req, res) => {
  try {
    const { name, number, transactionID, dueAmount, plusOne, plusOneName } =
      req.body; // Create a new token

    const newToken = new Token({
      name,
      number,
      transactionID,
      dueAmount,
      plusOne,
      plusOneName: plusOne ? plusOneName : "",
    });

    await newToken.save(); // Send a success message and the transaction ID as JSON
    res.status(200).json({
      message: "Registration successful!",
      transactionID: transactionID,
    });
  } catch (error) {
    console.error("Error creating token:", error);
    res
      .status(500)
      .json({ message: "Failed to create token", error: error.message });
  }
});

// Route to get all tokens
app.get("/api/tokens", async (req, res) => {
  try {
    const tokens = await Token.find();
    res.status(200).json(tokens);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving tokens",
      error: error.message,
    });
  }
});

// Route to get a single token by transactionID
app.get("/api/tokens/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const token = await Token.findOne({
      transactionID: id,
    });
    if (!token) {
      return res.status(404).json({
        message: "Token not found",
      });
    }
    res.status(200).json(token);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving token",
      error: error.message,
    });
  }
});

app.patch("/api/tokens/approve/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedToken = await Token.findOneAndUpdate(
      { transactionID: id },
      { isApproved: true }, // Update the isApproved field
      { new: true } // Return the updated document
    );

    if (!updatedToken) {
      return res.status(404).json({
        message: "Token not found",
      });
    }

    res.status(200).json({
      message: "Token approved successfully!",
      token: updatedToken,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error approving token",
      error: error.message,
    });
  }
});

// Route to revoke an approved token
app.patch("/api/tokens/revoke/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedToken = await Token.findOneAndUpdate(
      { transactionID: id },
      { isApproved: false },
      { new: true }
    );

    if (!updatedToken) {
      return res.status(404).json({
        message: "Token not found",
      });
    }

    res.status(200).json({
      message: "Token revoked successfully!",
      token: updatedToken,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error revoking token",
      error: error.message,
    });
  }
});

// Route to delete a pending token
app.delete("/api/tokens/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedToken = await Token.findOneAndDelete({
      transactionID: id,
    });

    if (!deletedToken) {
      return res.status(404).json({
        message: "Token not found",
      });
    }

    res.status(200).json({
      message: "Token deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting token",
      error: error.message,
    });
  }
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "views", "404.html"));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
