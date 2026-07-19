import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import "dotenv/config";

const fetchUser = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("auth-token");
  if (!token) {
    res.status(401).send({ error: "Please authenticate using a valid token" });
  }
  try {
    const data = jwt.verify(token!, process.env.JWT_SECRET!) as {
      user: { id: string };
    };
    req.user = data.user;
    next();
  } catch (error) {
    res.status(401).send({ error: "Please authenticate using a valid token" });
  }
};

export default fetchUser;
