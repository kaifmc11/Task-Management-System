import React, { useState } from 'react';
import { useGetPendingApprovalsQuery, useApproveUserMutation, useRejectUserMutation } from '../redux/slices/api/userApiSlice';
import { toast } from 'sonner';

const UserApprovalTable = () => {
  const { data: response, isLoading, refetch } = useGetPendingApprovalsQuery();
  const [approveUser] = useApproveUserMutation();
  const [rejectUser] = useRejectUserMutation();
  
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get the actual pending approvals array from the response
  const pendingApprovals = response?.data || [];

  const handleApprove = async (id) => {
    try {
      setIsProcessing(true);
      await approveUser(id).unwrap();
      toast.success('User approved successfully');
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to approve user');
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectDialog = (id) => {
    setSelectedUserId(id);
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setIsProcessing(true);
      await rejectUser({ id: selectedUserId, reason: rejectReason }).unwrap();
      toast.success('User rejected successfully');
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedUserId(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to reject user');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">User Approval Requests</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage pending user approval requests
          {pendingApprovals?.length > 0 && (
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
              {pendingApprovals.length} pending
            </span>
          )}
        </p>
      </div>
      <div className="p-6">
        {!pendingApprovals?.length ? (
          <div className="text-center py-8 text-gray-500">
            No pending approvals at this time
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingApprovals.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleApprove(user._id)}
                        disabled={isProcessing}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed mr-4"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectDialog(user._id)}
                        disabled={isProcessing}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rejectDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reject User Application</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a reason"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setRejectDialogOpen(false)}
                  disabled={isProcessing}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Reject'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserApprovalTable;