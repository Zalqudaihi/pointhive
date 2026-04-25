import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import productsRouter from "./products";
import transactionsRouter from "./transactions";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(productsRouter);
router.use(transactionsRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);
router.use(adminRouter);

export default router;
