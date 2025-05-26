import { useState, useEffect, useMemo, memo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, UtensilsCrossed, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-toastify';
import { ErrorBoundary } from 'react-error-boundary';

// Interfaces for type safety
interface CurrentUser {
  name: string;
  id: string;
  email?: string;
}

interface CartItem {
  id: string;
  quantity: number;
}

interface Cart {
  items: CartItem[];
}

interface AuthContext {
  currentUser: CurrentUser | null;
  logout: () => Promise<void>;
}

interface CartContext {
  cart: Cart;
}

// Error fallback component with enhanced logging
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  useEffect(() => {
    console.error('Error caught in ErrorBoundary:', error);
  }, [error]);

  return (
    <div className="p-4 text-center">
      <h2 className="text-lg font-bold text-red-600">Something went wrong</h2>
      <p className="text-sm text-gray-600">{error.message || 'An unexpected error occurred'}</p>
      <button
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        onClick={resetErrorBoundary}
        aria-label="Try again after error"
      >
        Try Again
      </button>
    </div>
  );
};

const PosLayout = () => {
  const auth = useAuth() as AuthContext | undefined;
  const cartContext = useCart() as CartContext | undefined;
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Ensure contexts are available
  if (!auth || !cartContext) {
    throw new Error('PosLayout must be used within AuthProvider and CartProvider');
  }

  const { currentUser, logout } = auth;
  const { cart } = cartContext;

  // Memoize formatted time and date
  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(currentTime),
    [currentTime]
  );

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(currentTime),
    [currentTime]
  );

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      toast.success('Successfully logged out');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error('Failed to log out. Please try again.');
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to login if no user is authenticated
  useEffect(() => {
    if (!currentUser && !isLoading) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, navigate, isLoading]);

  // Calculate cart item count
  const cartItemCount = cart.items.length;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
        {/* Header */}
        <header className="bg-red-600 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UtensilsCrossed size={24} aria-hidden="true" />
              <h1 className="text-xl font-bold">ezPay POS</h1>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:block text-right" aria-live="polite">
                <div className="text-sm opacity-80">{formattedDate}</div>
                <div className="font-medium">{formattedTime}</div>
              </div>

              <div
                className="hidden md:block text-right"
                aria-label={`Logged in as ${currentUser?.name ?? 'Guest'}`}
              >
                <div className="text-sm opacity-80">Logged in as</div>
                <div className="font-medium">{currentUser?.name ?? 'Guest'}</div>
              </div>

              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-700 hover:bg-red-800 disabled:bg-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                aria-label={isLoading ? 'Logging out' : 'Logout'}
              >
                <LogOut size={18} aria-hidden="true" />
                <span>{isLoading ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Cart indicator - mobile only */}
        <div className="md:hidden fixed bottom-4 right-4 z-10">
          <button
            className="flex items-center justify-center w-14 h-14 bg-red-600 text-white rounded-full shadow-lg relative focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={() => navigate('/cart')}
            aria-label={`View cart with ${cartItemCount} item${cartItemCount !== 1 ? 's' : ''}`}
          >
            <ShoppingCart aria-hidden="true" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default memo(PosLayout);