import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { 
  Calendar, 
  Download, 
  TrendingUp,
  BarChart4,
  PieChart as PieChartIcon
} from 'lucide-react';
import { useTransactions } from '../../contexts/TransactionContext';

const SalesReport = () => {
  const { getSalesData } = useTransactions();
  const { dailySales, monthlySales, topSellingItems, salesBySection } = getSalesData();
  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Format data for charts
  const dailyData = days.map((day, index) => ({
    name: day.substring(0, 3),
    sales: dailySales[index] || 0,
  }));
  
  const monthlyData = months.map((month, index) => ({
    name: month,
    sales: monthlySales[index] || 0,
  }));
  
  // Colors for charts
  const COLORS = ['#FF0000', '#990000', '#CC0000', '#FF3333', '#FF6666'];
  
  // Export report
  const exportReport = () => {
    // In a real app, this would generate a PDF or Excel file
    alert('In a real app, this would download a sales report as PDF or Excel');
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Sales Reports</h1>
        
        <button 
          className="btn btn-primary flex items-center gap-2"
          onClick={exportReport}
        >
          <Download size={18} />
          Export Report
        </button>
      </div>
      
      {/* Date Range Selector */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select className="input-field">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This month</option>
              <option>Last month</option>
              <option>Custom range</option>
            </select>
          </div>
          
          <div className="flex gap-3">
            <button className="btn btn-secondary flex items-center gap-2">
              <Calendar size={18} />
              <span>Date Range</span>
            </button>
            
            <button className="btn btn-primary">
              Apply
            </button>
          </div>
        </div>
      </div>
      
      {/* Daily Sales Chart */}
      <div className="card p-6">
        <div className="flex items-center mb-4">
          <BarChart4 size={24} className="text-red-600 mr-2" />
          <h2 className="text-lg font-semibold">Daily Sales</h2>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`$${value}`, 'Sales']}
                labelStyle={{ color: '#111' }}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }}
              />
              <Legend />
              <Bar dataKey="sales" fill="#FF0000" name="Daily Sales ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Monthly Sales Chart */}
      <div className="card p-6">
        <div className="flex items-center mb-4">
          <TrendingUp size={24} className="text-red-600 mr-2" />
          <h2 className="text-lg font-semibold">Monthly Sales Trend</h2>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`$${value}`, 'Sales']}
                labelStyle={{ color: '#111' }}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#FF0000" 
                activeDot={{ r: 8 }} 
                name="Monthly Sales ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Top Selling Items & Sales by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <BarChart4 size={24} className="text-red-600 mr-2" />
            <h2 className="text-lg font-semibold">Top Selling Items</h2>
          </div>
          
          <div className="table-container mb-4">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topSellingItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{item.count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${item.revenue.toFixed(2)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Sales by Category */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <PieChartIcon size={24} className="text-red-600 mr-2" />
            <h2 className="text-lg font-semibold">Sales by Category</h2>
          </div>
          
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesBySection}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                  nameKey="section"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {salesBySection.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;