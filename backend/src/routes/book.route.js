import { Router } from 'express';
import { verifyJWT, optionalJWT } from '../middleware/auth.middleware.js';
import {
  createBook,
  updateBook,
  getBooks,
  getPublicDiaries,
  getPurchasedDiaries,
  updateCover,
  deleteBook,
  getBookById,
  addDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
  uploadMedia,
} from '../controller/book.controller.js';
import upload from '../middleware/upload.middleware.js';

const router = Router();

// Public explore feed (optionally personalized if logged in)
router.route('/explore').get(optionalJWT, getPublicDiaries);

// Media upload for photos & video clips
router.route('/upload-media').post(verifyJWT, upload.single('media'), uploadMedia);

// Specific diary view (accessible with preview if public, full if unlocked/owned)
router.route('/view/:id').get(optionalJWT, getBookById);

// Protected routes (User's own diaries and actions)
router.route('/').post(verifyJWT, createBook).get(verifyJWT, getBooks);
router.route('/purchased').get(verifyJWT, getPurchasedDiaries);

// Living daily entries management (Add new entry anytime, edit, delete)
router.route('/:id/entry').post(verifyJWT, addDiaryEntry);
router
  .route('/:id/entry/:entryId')
  .put(verifyJWT, updateDiaryEntry)
  .delete(verifyJWT, deleteDiaryEntry);

// Single diary operations
router
  .route('/:id')
  .get(optionalJWT, getBookById)
  .put(verifyJWT, updateBook)
  .delete(verifyJWT, deleteBook);

router.route('/cover/:id').put(verifyJWT, upload.single('coverImage'), updateCover);

export default router;
