import { protectRoute } from "./auth.middleware.js";

export const adminOnly = (req, res, next) => {
  protectRoute(req, res, () => {
    if (req.user?.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden - Admin access required" });
  });
};

