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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: DataTypes.STRING,
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: DataTypes.STRING,
    keyword: DataTypes.STRING,
    metaDescription: DataTypes.STRING(160),
    imageDescription: DataTypes.STRING,
    externalLinks: DataTypes.TEXT, // URLs separadas por vírgula
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  { sequelize, modelName: "blogPost" }
);

// Sync models with database
sequelize.sync();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
  try {
    const posts = await BlogPost.findAll();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar posts" });
  }
});

app.get("/posts/:id", async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post não encontrado" });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar o post" });
  }
});

app.post("/posts", upload.single("image"), async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      keyword,
      metaDescription,
      imageDescription,
      externalLinks,
    } = req.body;
    const image = req.file
      ? `${process.env.BASE_URL}/uploads/${req.file.filename}`
      : null;

    if (!title || !content) {
      return res
        .status(400)
        .json({ error: "Título e conteúdo são obrigatórios" });
    }

    const post = await BlogPost.create({
      title,
      content,
      category,
      keyword,
      metaDescription,
      imageDescription,
      externalLinks,
      image,
    });

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar o post" });
  }
});

app.put("/posts/:id", upload.single("image"), async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      keyword,
      metaDescription,
      imageDescription,
      externalLinks,
    } = req.body;
    const post = await BlogPost.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    post.title = title ?? post.title;
    post.content = content ?? post.content;
    post.category = category ?? post.category;
    post.keyword = keyword ?? post.keyword;
    post.metaDescription = metaDescription ?? post.metaDescription;
    post.imageDescription = imageDescription ?? post.imageDescription;
    post.externalLinks = externalLinks ?? post.externalLinks;

    if (req.file) {
      post.image = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
    }

    await post.save();
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar o post" });
  }
});

app.delete("/posts/:id", async (req, res) => {
  try {
    const post = await BlogPost.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post não encontrado" });
    }
    await post.destroy();
    res.json({ message: "Post excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir o post" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
