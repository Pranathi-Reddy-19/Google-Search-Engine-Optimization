const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "*" })); // Allow extension requests
app.use(express.json());

// ✅ MongoDB Connection
const MONGO_URI = "mongodb+srv://pranathi_research:pranathi19@cluster0.fp7x1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ Schema & Model
const LinkSchema = new mongoose.Schema({
  url: String,
  query: String,
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  voters: { type: [String], default: [] }
});

const Link = mongoose.model("Link", LinkSchema);

// ✅ API: Get links for a query
app.get("/api/links", async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) return res.status(400).json({ error: "Query parameter required" });

    const links = await Link.find({ query }).sort({ upvotes: -1 });
    res.json(links);
  } catch (err) {
    console.error("Error fetching links:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ API: Add new link
app.post("/api/addLink", async (req, res) => {
  try {
    const { url, query } = req.body;
    if (!url || !query) return res.status(400).json({ error: "URL and query required" });

    const existing = await Link.findOne({ url, query });
    if (existing) {
      return res.status(400).json({ error: "Link already exists for this query" });
    }

    const newLink = new Link({ url, query });
    await newLink.save();
    res.json(newLink);
  } catch (err) {
    console.error("Error adding link:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ API: Rate (upvote/downvote)
app.post("/api/rate", async (req, res) => {
  try {
    const { url, query, rating, user } = req.body;
    if (!url || !query || !rating) {
      return res.status(400).json({ error: "URL, query, and rating required" });
    }

    const link = await Link.findOne({ url, query });
    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    // Prevent duplicate votes if user exists
    if (user && link.voters.includes(user)) {
      return res.status(400).json({ error: "User already voted" });
    }

    if (rating === "up") {
      link.upvotes += 1;
    } else if (rating === "down") {
      link.downvotes += 1;
    }

    if (user) {
      link.voters.push(user);
    }

    await link.save();
    res.json(link);
  } catch (err) {
    console.error("Error rating link:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Root route
app.get("/", (req, res) => {
  res.send("🎉 Student Notes Backend is running!");
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
