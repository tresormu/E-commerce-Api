import { Router } from "express";
import {
  NewOrder,
  updateOrder,
  DeleteOrder,
  getUserOrders,
  cancelOrder,
  updateOrderStatus,
  getAllOrders,
} from "../controllers/orders.controller";
import { protect } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/authorize";

const app = Router();
app.post("/", protect, NewOrder);
app.get("/", protect, authorizeRoles("admin", "manager"), getAllOrders);
app.get("/user", protect, getUserOrders);
app.put("/:orderId", protect, authorizeRoles("admin", "manager"), updateOrder);
app.patch("/:orderId/cancel", protect, cancelOrder);
app.patch("/:orderId/status", protect, authorizeRoles("admin", "manager"), updateOrderStatus);
app.delete("/:orderId", protect, authorizeRoles("admin"), DeleteOrder);
export default app;
