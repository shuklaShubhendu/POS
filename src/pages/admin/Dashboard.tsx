import {
  ShoppingBag,
  Users,
  DollarSign, // Although DollarSign icon is imported, it's not used for currency display, just for the visual card.
  TrendingUp,
  CalendarClock
} from 'lucide-react';
import { useTransactions } from '../../contexts/TransactionContext';
import { useUsers } from '../../contexts/UserContext';
import { useMenu } from '../../contexts/MenuContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { transactions, getSalesData } = useTransactions();
  const { users } = useUsers();
  const { menuItems, menuSections } = useMenu();

  // Get sales data from TransactionContext
  const { dailySales, topSellingItems } = getSalesData();

  // Determine the most popular item name
  const mostPopularItemName = topSellingItems.length > 0
    ? topSellingItems[0].name
    : 'N/A'; // Fallback if no items are sold or transactions exist


  // Get recent transactions (last 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Calculate metrics
 const totalSales = transactions
  .filter(t => t.status.toLowerCase() === 'completed')
  .reduce((sum, t) => sum + t.totalAmount, 0);
const totalOrders = transactions.filter(t => t.status.toLowerCase() === 'completed').length;
const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  

  // Prepare data for weekly sales chart
  const salesData = {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    datasets: [
      {
        label: 'Daily Sales',
        data: dailySales,
        borderColor: '#FF0000',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="space-y-6 fade-in">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <DollarSign size={20} className="text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm font-semibold">Total Sales</h3>
              {/* Change $ to ₹ */}
              <p className="text-2xl font-bold">₹{totalSales.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingBag size={20} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm font-semibold">Total Orders</h3>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm font-semibold">Avg. Order Value</h3>
              {/* Change $ to ₹ */}
              <p className="text-2xl font-bold">₹{averageOrderValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <Users size={20} className="text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm font-semibold">Users</h3>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Weekly Sales</h2>
          <div className="h-80">
            <Line data={salesData} options={chartOptions} />
          </div>
        </div>

        {/* Menu Stats */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Menu Stats</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Menu Sections</h3>
                <p className="text-gray-500 text-sm">Active categories</p>
              </div>
              <span className="text-xl font-bold">{menuSections.length}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Menu Items</h3>
                <p className="text-gray-500 text-sm">Products available</p>
              </div>
              <span className="text-xl font-bold">{menuItems.length}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Most Popular</h3>
                <p className="text-gray-500 text-sm">Highest selling item</p>
              </div>
              <span className="font-medium">{mostPopularItemName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-cell-header">Transaction ID</th>
                <th className="table-cell-header">Customer</th>
                <th className="table-cell-header">Date</th>
                <th className="table-cell-header">Amount</th>
                <th className="table-cell-header">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentTransactions.map((transaction) => (
                <tr key={transaction.id} className="table-row">
                  <td className="table-cell font-medium text-gray-800">
                    #{transaction.id.substring(0, 8)}
                  </td>
                  <td className="table-cell">
                    {transaction.customerName || 'Walk-in Customer'}
                  </td>
                  <td className="table-cell flex items-center">
                    <CalendarClock size={16} className="mr-2 text-gray-400" />
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                  <td className="table-cell font-medium">
                    {/* Change $ to ₹ here as well */}
                    ₹{transaction.totalAmount.toFixed(2)}
                  </td>
                  <td className="table-cell">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;