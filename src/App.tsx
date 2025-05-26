import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { MenuProvider } from './contexts/MenuContext';
import { UserProvider } from './contexts/UserContext';
import { TransactionProvider } from './contexts/TransactionContext';
import AdminLayout from './layouts/AdminLayout';
import PosLayout from './layouts/PosLayout';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import MenuManagement from './pages/admin/MenuManagement';
import Transactions from './pages/admin/Transactions';
import UserManagement from './pages/admin/UserManagement';
import SalesReport from './pages/admin/SalesReport';
import Settings from './pages/admin/Settings';
import PosTerminal from './pages/pos/PosTerminal';
import ProtectedRoute from './components/ProtectedRoute';
import RegisterRestaurant from './pages/Register';
import Coustomer from './pages/admin/Customers';

function App() {
  return (
    <Router>
      <AuthProvider>
        <MenuProvider>
          <UserProvider>
            <TransactionProvider>
              <CartProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="register" element={<RegisterRestaurant />} />
                  {/* Admin Routes */}
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="menu" element={<MenuManagement />} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="reports" element={<SalesReport />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path ="Coustomer" element={<Coustomer />} />
                    
                  </Route>
                  
                  {/* POS Terminal Routes */}
                  <Route 
                    path="/" 
                    element={
                      <ProtectedRoute requiredRole="employee">
                        <PosLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<PosTerminal />} />
                  </Route>
                </Routes>
              </CartProvider>
            </TransactionProvider>
          </UserProvider>
        </MenuProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;