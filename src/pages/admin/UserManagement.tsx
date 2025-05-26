import { useState } from 'react';
import { 
  PlusCircle, 
  Edit, 
  Trash, 
  Search,
  User,
  Users,
  Calendar
} from 'lucide-react';
import { useUsers } from '../../contexts/UserContext';
import { User as UserType, UserRole } from '../../types';
import AddUserModal from '../../components/modals/AddUserModal';
import EditUserModal from '../../components/modals/EditUserModal';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';

const UserManagement = () => {
  const { users, deleteUser } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Modals
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  
  // Handle loading state
  if (!users) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading users...</div>
      </div>
    );
  }

  // Filter users with safeguards for undefined properties
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (user.name?.toLowerCase()?.includes(searchLower) || false) ||
      (user.email?.toLowerCase()?.includes(searchLower) || false);
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });
  
  // Handle edit user
  const handleEditUser = (user: UserType) => {
    setSelectedUser(user);
    setEditUserModalOpen(true);
  };
  
  // Handle delete user
  const handleDeleteUser = (user: UserType) => {
    setSelectedUser(user);
    setDeleteConfirmModalOpen(true);
  };
  
  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (selectedUser) {
      deleteUser(selectedUser.id);
    }
    setDeleteConfirmModalOpen(false);
    setSelectedUser(null); // Clear selected user after deletion
  };
  
  // Get badge color based on role
  const getRoleBadgeColor = (role: UserRole): string => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        
        <button 
          className="btn btn-primary flex items-center gap-2"
          onClick={() => setAddUserModalOpen(true)}
        >
          <PlusCircle size={18} />
          Add User
        </button>
      </div>
      
      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow relative">
            <Search 
              size={18} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <div className="w-40">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-cell-header">Name</th>
                <th className="table-cell-header">Email</th>
                <th className="table-cell-header">Role</th>
                <th className="table-cell-header">Created</th>
                <th className="table-cell-header">Last Login</th>
                <th className="table-cell-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="table-cell font-medium text-gray-800 flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      {user.name || 'N/A'}
                    </td>
                    <td className="table-cell">
                      {user.email || 'N/A'}
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role || 'Unknown'}
                      </span>
                    </td>
                    <td className="table-cell">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="table-cell">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                          onClick={() => handleDeleteUser(user)}
                          disabled={user.role === 'admin'} // Prevent deleting admin users
                          title={user.role === 'admin' ? "Admin users cannot be deleted" : "Delete user"}
                        >
                          <Trash size={16} className={user.role === 'admin' ? 'text-gray-300' : ''} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['admin', 'manager', 'employee'].map((role) => {
          const count = users.filter(user => user.role === role).length;
          const icon = role === 'admin' 
            ? <User size={20} /> 
            : role === 'manager' 
            ? <Users size={20} /> 
            : <Users size={20} />;
            
          return (
            <div key={role} className="card p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${
                  role === 'admin' 
                    ? 'bg-red-100 text-red-600' 
                    : role === 'manager' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-green-100 text-green-600'
                }`}>
                  {icon}
                </div>
                <div className="ml-4">
                  <h3 className="text-gray-500 text-sm font-semibold capitalize">{role}s</h3>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Modals */}
      <AddUserModal 
        isOpen={addUserModalOpen} 
        onClose={() => setAddUserModalOpen(false)} 
      />
      
      {selectedUser && (
        <EditUserModal 
          isOpen={editUserModalOpen} 
          onClose={() => {
            setEditUserModalOpen(false);
            setSelectedUser(null); // Clear selected user after closing
          }}
          user={selectedUser} 
        />
      )}
      
      <DeleteConfirmModal 
        isOpen={deleteConfirmModalOpen} 
        onClose={() => {
          setDeleteConfirmModalOpen(false);
          setSelectedUser(null); // Clear selected user after closing
        }}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.name || 'this user'}? This cannot be undone.`}
      />
    </div>
  );
};

export default UserManagement;