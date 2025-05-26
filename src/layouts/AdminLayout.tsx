import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Receipt, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu as MenuIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

const AdminLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items
  const navItems = [
    { to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/admin/menu', icon: <UtensilsCrossed size={20} />, label: 'Menu Management' },
    { to: '/admin/transactions', icon: <Receipt size={20} />, label: 'Transactions' },
    { to: '/admin/users', icon: <Users size={20} />, label: 'User Management' },
    { to: '/', icon: <Users size={20} />, label: 'POS' },
    { to: '/admin/reports', icon: <BarChart3 size={20} />, label: 'Sales Reports' },

    { to: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Sidebar */}
      <div 
        className={`bg-red-600 text-white w-full md:w-64 md:flex md:flex-col md:min-h-screen ${
          isMobileMenuOpen ? 'fixed inset-0 z-50 block' : 'hidden md:flex'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-red-700">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={24} />
            <h1 className="text-xl font-bold">ezPay POS</h1>
          </div>
          <button 
            className="md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <MenuIcon size={24} />
          </button>
        </div>
        
        <div className="flex flex-col py-4 flex-1">
          <div className="px-4 mb-6">
            <div className="text-sm opacity-70">Welcome,</div>
            <div className="font-semibold">{currentUser?.name}</div>
          </div>
          
          <nav className="flex-1">
            {navItems.map((item) => (
              <NavLink 
                key={item.to} 
                to={item.to} 
                end={item.to === '/admin'}
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          
          <div className="mt-auto">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-white hover:bg-red-700 w-full text-left"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile header */}
        <header className="bg-white p-4 shadow md:hidden flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={24} className="text-red-600" />
            <h1 className="text-xl font-bold">ezPay POS</h1>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)}>
            <MenuIcon size={24} />
          </button>
        </header>
        
        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;