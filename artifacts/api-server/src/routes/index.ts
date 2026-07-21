import { Router, type IRouter } from "express";
import healthRouter from "./health";
import songsRouter from "./songs";
import songDetailsRouter from "./song-details";
import usersRouter from "./users";
import libraryRouter from "./library";
import chordsRouter from "./chords";
import learningRouter from "./learning";
import uploadsRouter from "./uploads/uploads.route";
import analyzeRouter from "./analyze";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/songs", songsRouter);
router.use("/songs", analyzeRouter);
router.use("/song-details", songDetailsRouter);
router.use("/users", usersRouter);
router.use("/library", libraryRouter);
router.use("/chords", chordsRouter);
router.use("/learning", learningRouter);
router.use("/uploads", uploadsRouter);

export default router;
