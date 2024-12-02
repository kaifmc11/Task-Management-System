import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useUploadFileMutation, useGetTaskFilesQuery, useDeleteFileMutation, usePostTaskActivityMutation } from '../redux/slices/api/taskApiSlice';
import Button from '../components/Button';
import { Loader } from 'lucide-react';

const AssetManagement = ({ taskId, refetchTask }) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const { data: filesData, refetch: refetchFiles, isLoading: isLoadingFiles } = useGetTaskFilesQuery(taskId);
  const [uploadFile] = useUploadFileMutation();
  const [deleteFile] = useDeleteFileMutation();
  const [postActivity] = usePostTaskActivityMutation();

  const validateFile = useCallback((file) => {
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      throw new Error(`File ${file.name} is too large. Maximum size is 20MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File ${file.name} has invalid type. Allowed types: JPG, PNG, PDF, DOC, DOCX`);
    }

    return true;
  }, []);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      // Validate all files first
      Array.from(files).forEach(validateFile);

      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('taskId', taskId);
        
        try {
          const response = await uploadFile({ formData, taskId }).unwrap();
          return { success: true, file: response.file };
        } catch (error) {
          return { success: false, file: file.name, error: error?.data?.message || 'Upload failed' };
        }
      });

      const results = await Promise.all(uploadPromises);
      
      // Handle results
      const successes = results.filter(r => r.success);
      const failures = results.filter(r => !r.success);

      if (successes.length > 0) {
        toast.success(`Successfully uploaded ${successes.length} file(s)`);
        await refetchTask();
        await refetchFiles();
      }

      if (failures.length > 0) {
        failures.forEach(failure => {
          toast.error(`Failed to upload ${failure.file}: ${failure.error}`);
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Error uploading files. Please try again.');
    } finally {
      setUploading(false);
      event.target.value = ''; // Reset input
    }
  };

  const handleDeleteFile = async (fileId, filename) => {
    if (!fileId || !taskId) {
      toast.error('Missing file or task ID');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }
  
    setDeleting(true);
    try {
      const response = await deleteFile({
        taskId,
        fileId
      }).unwrap();
      
      if (response.success) {
        await postActivity({
          id: taskId,
          data: {
            type: 'file_deleted',
            activity: `File "${filename}" was deleted from task`,
          }
        });

        toast.success('File deleted successfully');
        await refetchTask();
        await refetchFiles();
      } else {
        throw new Error(response.message || 'Error deleting file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error?.data?.message || 'Error deleting file. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleFileView = useCallback((fileId, filename) => {
    if (!fileId) {
      toast.error('Invalid file ID');
      return;
    }
    
    // Create blob URL for downloading
    const url = `/api/tasks/files/${fileId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const files = filesData?.files || [];

  if (isLoadingFiles) {
    return (
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full md:w-1/2 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-lg font-semibold">ASSETS</p>
          <p className="text-sm text-gray-500">
            {files.length} file{files.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
        <div className="relative">
          <input
            type="file"
            id="fileUpload"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
          />
          <Button
            type="button"
            label={uploading ? "Uploading..." : "Add Files"}
            onClick={() => document.getElementById('fileUpload').click()}
            className={`bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2
              ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            disabled={uploading}
          >
            {uploading && <Loader className="w-4 h-4 animate-spin" />}
            {uploading ? "Uploading..." : "Add Files"}
          </Button>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No files uploaded yet</p>
        </div>
      ) : (
        <div className="w-full grid grid-cols-2 gap-4">
          {files.map((file, index) => (
            <div key={`${file._id}-${index}`} className="relative group">
              <div
                onClick={() => handleFileView(file._id, file.originalname)}
                className="cursor-pointer"
              >
                {file.contentType?.startsWith('image/') ? (
                  <div className="relative aspect-video">
                    <img
                      src={`/api/tasks/files/${file._id}`}
                      alt={file.originalname}
                      className="w-full h-full rounded object-cover transition-all duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center aspect-video bg-gray-100 rounded group-hover:bg-gray-200">
                    <div className="text-center px-4">
                      <div className="text-gray-400 mb-2">
                        {file.contentType?.includes('pdf') ? '📄' :
                         file.contentType?.includes('doc') ? '📝' : '📎'}
                      </div>
                      <p className="text-gray-600 text-sm truncate max-w-[90%] mx-auto">
                        {file.originalname}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDeleteFile(file._id, file.originalname)}
                disabled={deleting}
                className={`absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full 
                  opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600
                  ${deleting ? 'cursor-not-allowed opacity-50' : ''}`}
                aria-label="Delete file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssetManagement;