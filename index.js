const express = require("express");
const bodyParser = require("body-parser");
const { Sequelize, Model, DataTypes } = require("sequelize");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = 3003;

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./blogAndForm.sqlite",
});

// Define BlogPost model
class BlogPost extends Model {}
BlogPost.init(
  {
    title: DataTypes.STRING,
    image: DataTypes.STRING,
    content: DataTypes.TEXT,
    category: DataTypes.STRING,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  { sequelize, modelName: "blogPost" }
);

// Define FormSubmission model
class FormSubmission extends Model {}
FormSubmission.init(
  {
    fullName: DataTypes.STRING,
    phone: DataTypes.STRING,
    position: DataTypes.STRING,
    email: DataTypes.STRING,
  },
  { sequelize, modelName: "formSubmission" }
);

// Sync models with database
sequelize.sync();

// Middleware for parsing request body
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files from the "uploads" directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// CRUD routes for BlogPost model
app.get("/posts", async (req, res) => {
  const posts = await BlogPost.findAll();
  res.json(posts);
});

app.get("/posts/:id", async (req, res) => {
  const post = await BlogPost.findByPk(req.params.id);
  res.json(post);
});

app.post("/posts", upload.single("image"), async (req, res) => {
  const { title, content, category } = req.body;
  const image = req.file
    ? `${process.env.BASE_URL}/uploads/${req.file.filename}`
    : null;
  const post = await BlogPost.create({ title, image, content, category });
  res.json(post);
});

app.put("/posts/:id", upload.single("image"), async (req, res) => {
  const post = await BlogPost.findByPk(req.params.id);
  if (post) {
    const { title, content, category } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : post.image;
    await post.update({ title, image, content, category });
    res.json(post);
  } else {
    res.status(404).json({ message: "Post not found" });
  }
});

app.delete("/posts/:id", async (req, res) => {
  const post = await BlogPost.findByPk(req.params.id);
  if (post) {
    await post.destroy();
    res.json({ message: "Post deleted" });
  } else {
    res.status(404).json({ message: "Post not found" });
  }
});

// Route to handle form submissions
app.post("/form", async (req, res) => {
  const { fullName, phone, position, email } = req.body;
  const formSubmission = await FormSubmission.create({
    fullName,
    phone,
    position,
    email,
  });
  res.json(formSubmission);
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
