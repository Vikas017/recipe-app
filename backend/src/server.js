import express from 'express';
import { ENV } from './config/env.js';
import { db } from './config/db.js';
import { favoritesTable } from './db/schema.js';
import { and, eq } from 'drizzle-orm';
import job from "./config/cron.js"; 

const app = express();
const port = ENV.PORT || 3000;

if (ENV.NODE_ENV === 'production') job.start();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is healthy" })
});

app.get("/api/favorites/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const favorites =await db.select(favoritesTable).where(
      eq(favoritesTable.userId, userId)
    );
    res.status(200).json(favorites);
  } catch (error) {
    res.status(500).json({message: `Internal server error: ${error.message}`});
  }
})

app.post("/api/favorites", async (req, res) => {
  try {
    const { userId, recipeId, title, image, cookTime, servings } = req.body;

    if (!userId || !recipeId || !title) {
      return res.status(400).json({ message: "Missing required fields" }); 
    }
    const newFavorite = await db.insert(favoritesTable).values({
        userId,
        recipeId,
        title,
        image,
        cookTime,
        servings
    }).returning();

    res.status(201).json(newFavorite[0]);
  } catch (error) {
    console.log("Error adding favorites values:", error);
      res.status(500).json({message: `Internal server error: ${error.message}`});
  }
});

app.delete("/api/favorites/:userId/:recipeId", async (req, res) => {
  try {
    const { userId, recipeId } = req.params;

    await db.delete(favoritesTable).where(
      and(
        eq(favoritesTable.userId, userId),
        eq(favoritesTable.recipeId, parseInt(recipeId))
      )
    )

    res.status(200).json({ message: "Favorite item deleted successfully" })
  } catch (error) {
    console.log("Error deleting favorite:", error)
    res.status(500).json({message: `Internal server error: ${error.message}`});
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});