import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import multer from 'multer';
import { Readable } from 'stream';
import path from 'path';

let bucket;

// Initialize GridFS bucket when MongoDB connects
mongoose.connection.once('open', async () => {
  try {
    bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });
    
    // Create indexes for chunks and files collections
    await mongoose.connection.db.collection('uploads.chunks').createIndex({ files_id: 1, n: 1 }, { unique: true });
    await mongoose.connection.db.collection('uploads.files').createIndex({ filename: 1 });
    
    console.log('GridFS bucket initialized with indexes');
  } catch (error) {
    console.error('Error initializing GridFS:', error);
  }
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
}).single('file');

// Upload middleware
export const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      console.error('Upload middleware error:', err);
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// File upload handler
// Modified uploadFile handler to associate files with tasks
export const uploadFile = async (req, res) => {
  try {
    const taskId = req.body.taskId;
    if (!taskId) {
      return res.status(400).json({ 
        success: false, 
        message: 'TaskId is required' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    // Ensure user information is available
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const { originalname, mimetype, buffer, size } = req.file;

    // Create readable stream from buffer
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);

    // Create unique filename
    const filename = `${Date.now()}-${originalname}`;

    // Open upload stream
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimetype,
      metadata: {
        originalName: originalname,
        uploadDate: new Date(),
        taskId: taskId,
        uploadedBy: req.user  // Track who uploaded the file
      }
    });

    // Stream file to GridFS
    const fileId = await new Promise((resolve, reject) => {
      readableStream
        .pipe(uploadStream)
        .on('error', reject)
        .on('finish', () => resolve(uploadStream.id));
    });

    // Create asset object
    const asset = {
      _id: fileId,
      filename: filename,
      originalname: originalname,
      size: size,
      contentType: mimetype,
      uploadDate: new Date(),
      uploadedBy: req.user // Track who uploaded the file
    };

    // Update task with new asset
    const task = await mongoose.model('Task').findById(taskId);
    if (!task) {
      // If task not found, delete the uploaded file
      await bucket.delete(fileId);
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Add asset to task
    task.assets.push(asset);
    
    // Add file upload activity with user reference
    task.activities.push({
      type: 'file_added',
      activity: `File "${originalname}" uploaded`,
      date: new Date(),
      by: req.user.userId // Add the required 'by' field
    });

    await task.save();

    return res.status(200).json({
      success: true,
      message: 'File uploaded and associated with task successfully',
      file: asset
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
};

// Modified getTaskFiles handler
export const getTaskFiles = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    
    // Find task and validate
    const task = await mongoose.model('Task').findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Return the files associated with the task
    return res.status(200).json({
      success: true,
      files: task.assets
    });
  } catch (error) {
    console.error('Get task files error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving task files',
      error: error.message
    });
  }
};

// Modified getFile handler to check task association
export const getFile = async (req, res) => {
  try {
    const fileId = new ObjectId(req.params.fileId);
    
    // Find file metadata
    const file = await mongoose.connection.db
      .collection('uploads.files')
      .findOne({ _id: fileId });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Get content type from file metadata or fall back to a default
    const contentType = file.contentType || file.metadata?.contentType || 'application/octet-stream';

    // Set proper headers for content disposition and type
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.metadata?.originalName || 'download')}"`,
      'Cache-Control': 'max-age=31536000', // Cache for 1 year
      'Accept-Ranges': 'bytes'
    });

    // Handle range requests for better streaming support
    let downloadStream;
    
    if (req.headers.range) {
      const parts = req.headers.range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
      const chunksize = (end - start) + 1;

      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${file.length}`,
        'Content-Length': chunksize
      });

      downloadStream = bucket.openDownloadStream(fileId, {
        start,
        end: end + 1
      });
    } else {
      res.set('Content-Length', file.length);
      downloadStream = bucket.openDownloadStream(fileId);
    }

    // Handle stream errors
    downloadStream.on('error', (error) => {
      console.error('Download stream error:', error);
      // Only send error if headers haven't been sent
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file',
          error: error.message
        });
      }
    });

    // Pipe the file stream to response
    downloadStream.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    // Only send error if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error retrieving file',
        error: error.message
      });
    }
  }
};

// Modified deleteFile handler to remove file from task
export const deleteFile = async (req, res) => {
  try {
    const { taskId, fileId } = req.params;
    
    console.log('Delete file request:', {
      taskId,
      fileId
    });
    
    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task or file ID format'
      });
    }

    // Convert string IDs to ObjectId instances
    const taskObjectId = new mongoose.Types.ObjectId(taskId);
    const fileObjectId = new mongoose.Types.ObjectId(fileId);

    // Find the task and ensure it exists
    const task = await mongoose.model('Task').findById(taskObjectId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Find the asset in the task's assets array
    const assetIndex = task.assets.findIndex(
      asset => asset._id.toString() === fileObjectId.toString()
    );

    if (assetIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'File not found in task assets'
      });
    }

    // Get the asset details before removal
    const deletedAsset = task.assets[assetIndex];

    // Remove the asset from the task's assets array
    task.assets.splice(assetIndex, 1);

    // Add deletion activity to task history
    task.activities.push({
      type: 'file_deleted',
      activity: `File "${deletedAsset.originalname}" deleted`,
      by: req.user.userId,
      date: new Date()
    });

    // Delete the file from GridFS
    try {
      await bucket.delete(fileObjectId);
    } catch (gridFsError) {
      console.error('GridFS deletion error:', gridFsError);
      // Log the error but continue with task update
    }

    // Save the updated task
    await task.save();

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
};