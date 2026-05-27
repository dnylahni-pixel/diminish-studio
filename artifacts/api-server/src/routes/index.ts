import { Router, type IRouter } from "express";
import healthRouter from "./health";
import songsRouter from "./songs";
import usersRouter from "./users";
import libraryRouter from "./library";
import chordsRouter from "./chords";
import learningRouter from "./learning";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/songs", songsRouter);
router.use("/users", usersRouter);
router.use("/library", libraryRouter);
router.use("/chords", chordsRouter);
router.use("/learning", learningRouter);

export default router;
