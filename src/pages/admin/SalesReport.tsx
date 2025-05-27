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
  ResponsiveContainer,
} from 'recharts';
import { Download, TrendingUp, BarChart4, PieChart as PieChartIcon } from 'lucide-react';
import { useTransactions } from '../../contexts/TransactionContext';
import { jsPDF } from 'jspdf';
import { useMemo, useState, Component, ReactNode } from 'react';

// Configurable currency symbol
const CURRENCY_SYMBOL = '₹';

// Error Boundary Component
class SalesReportErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-600">Error Loading Sales Report</h2>
          <p className="text-red-500">An error occurred: {this.state.error?.message}</p>
          <p className="text-gray-600">Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const SalesReport = () => {
  const { getSalesData } = useTransactions();
  const [dateRange, setDateRange] = useState<'7days' | '30days'>('7days');

  // Fetch sales data with range
  const { dailySalesData, monthlySales, topSellingItems, salesBySection, statusBreakdown } = getSalesData({ range: dateRange });

  // Validate dailySalesData length
  if (dailySalesData.length !== (dateRange === '7days' ? 7 : 30)) {
    console.warn(`Expected ${dateRange === '7days' ? 7 : 30} days in dailySalesData, got ${dailySalesData.length}`);
  }

  const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayLabels = dateRange === '7days'
    ? days.map(day => day.substring(0, 3))
    : Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      });

  // Format daily sales data
  const dailyData = useMemo(
    () =>
      dayLabels.map((day, index) => ({
        name: day,
        sales: dailySalesData[index] || 0,
      })),
    [dailySalesData, dayLabels]
  );

  // Format monthly sales data
  const monthlyData = useMemo(() => {
    const currentMonthIndex = new Date().getMonth();
    const orderedMonths = Array.from({ length: 12 }, (_, i) => {
      const monthIndex = (currentMonthIndex - 11 + i + 12) % 12;
      return allMonths[monthIndex];
    });

    return orderedMonths.map((monthName, index) => ({
      name: monthName,
      sales: monthlySales[index] || 0,
    }));
  }, [monthlySales]);

  // Theme-friendly color palette
  const COLORS = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEEAD', // Yellow
    '#D4A5A5', // Pink
    '#9B59B6', // Purple
    '#3498DB', // Light Blue
  ];

  // Export report as PDF
  const exportReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Sales Report', 20, 20);

    // Daily Sales
    doc.setFontSize(12);
    doc.text(`Daily Sales (Last ${dateRange === '7days' ? '7' : '30'} Days)`, 20, 30);
    dailyData.forEach((data, index) => {
      doc.text(`${data.name}: ${CURRENCY_SYMBOL}${data.sales.toFixed(2)}`, 20, 40 + index * 10);
    });

    // Monthly Sales
    doc.text('Monthly Sales (Last 12 Months)', 20, 40 + dailyData.length * 10 + 10);
    monthlyData.forEach((data, index) => {
      doc.text(`${data.name}: ${CURRENCY_SYMBOL}${data.sales.toFixed(2)}`, 20, 50 + dailyData.length * 10 + index * 10);
    });

    // Top Selling Items
    doc.text('Top Selling Items', 20, 50 + dailyData.length * 10 + monthlyData.length * 10 + 10);
    topSellingItems.forEach((item, index) => {
      doc.text(
        `${item.name}: ${item.count} units, ${CURRENCY_SYMBOL}${item.revenue.toFixed(2)}`,
        20,
        60 + dailyData.length * 10 + monthlyData.length * 10 + index * 10
      );
    });

    // Sales by Category
    doc.text('Sales by Category', 20, 60 + dailyData.length * 10 + monthlyData.length * 10 + topSellingItems.length * 10 + 10);
    salesBySection.forEach((category, index) => {
      doc.text(
        `${category.name}: ${category.count} units, ${CURRENCY_SYMBOL}${category.revenue.toFixed(2)}`,
        20,
        70 + dailyData.length * 10 + monthlyData.length * 10 + topSellingItems.length * 10 + index * 10
      );
    });

    // Transaction Status Breakdown
    doc.text('Transaction Status Breakdown', 20, 70 + dailyData.length * 10 + monthlyData.length * 10 + topSellingItems.length * 10 + salesBySection.length * 10 + 10);
    statusBreakdown.forEach((data, index) => {
      doc.text(
        `${data.day}: Completed=${data.completed}, Refunded=${data.refunded}, Cancelled=${data.cancelled}`,
        20,
        80 + dailyData.length * 10 + monthlyData.length * 10 + topSellingItems.length * 10 + salesBySection.length * 10 + index * 10
      );
    });

    doc.save(`sales_report_${dateRange}.pdf`);
  };

  // Check if charts have data
  const hasDailyData = dailyData.some(data => data.sales > 0);
  const hasMonthlyData = monthlyData.some(data => data.sales > 0);
  const hasStatusData = statusBreakdown.some(data => data.completed > 0 || data.refunded > 0 || data.cancelled > 0);

  return (
    <SalesReportErrorBoundary>
      <div className="space-y-6 fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold">Sales Reports</h1>
          <div className="flex gap-4">
            <select
              className="btn btn-secondary"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7days' | '30days')}
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
            <button className="btn btn-primary flex items-center gap-2" onClick={exportReport}>
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>

        {/* Daily Sales Chart */}
        <div className="card p-6 shadow-md rounded-lg">
          <div className="flex items-center mb-4">
            <BarChart4 size={24} className="text-red-600 mr-2" />
            <h2 className="text-lg font-semibold">Daily Sales (Last {dateRange === '7days' ? '7' : '30'} Days)</h2>
          </div>
          <div className="h-80">
            {hasDailyData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`${CURRENCY_SYMBOL}${value.toFixed(2)}`, 'Sales']}
                    labelStyle={{ color: '#111' }}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }}
                  />
                  <Legend />
                  <Bar dataKey="sales" fill="#FF6B6B" name={`Daily Sales (${CURRENCY_SYMBOL})`} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center">No daily sales data available.</p>
            )}
          </div>
        </div>

        {/* Transaction Status Breakdown */}
        <div className="card p-6 shadow-md rounded-lg">
          <div className="flex items-center mb-4">
            <BarChart4 size={24} className="text-red-600 mr-2" />
            <h2 className="text-lg font-semibold">Transaction Status Breakdown (Last {dateRange === '7days' ? '7' : '30'} Days)</h2>
          </div>
          <div className="h-80">
            {hasStatusData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                    labelStyle={{ color: '#111' }}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }}
                  />
                  <Legend />
                  <Bar dataKey="completed" stackId="a" fill="#4ECDC4" name="Completed" />
                  <Bar dataKey="refunded" stackId="a" fill="#FF6B6B" name="Refunded" />
                  <Bar dataKey="cancelled" stackId="a" fill="#D4A5A5" name="Cancelled" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center">No transaction status data available.</p>
            )}
          </div>
        </div>

        {/* Monthly Sales Chart */}
        <div className="card p-6 shadow-md rounded-lg">
          <div className="flex items-center mb-4">
            <TrendingUp size={24} className="text-red-600 mr-2" />
            <h2 className="text-lg font-semibold">Monthly Sales Trend (Last 12 Months)</h2>
          </div>
          <div className="h-80">
            {hasMonthlyData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`${CURRENCY_SYMBOL}${value.toFixed(2)}`, 'Sales']}
                    labelStyle={{ color: '#111' }}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#FF6B6B"
                    activeDot={{ r: 8 }}
                    name={`Monthly Sales (${CURRENCY_SYMBOL})`}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center">No monthly sales data available.</p>
            )}
          </div>
        </div>

        {/* Top Selling Items & Sales by Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Items */}
          <div className="card p-6 shadow-md rounded-lg">
            <div className="flex items-center mb-4">
              <BarChart4 size={24} className="text-red-600 mr-2" />
              <h2 className="text-lg font-semibold">Top Selling Items</h2>
            </div>
            <div className="table-container mb-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
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
                  {topSellingItems.length > 0 ? (
                    topSellingItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{item.count}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{CURRENCY_SYMBOL}{item.revenue.toFixed(2)}</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                        No top selling items data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sales by Category */}
          <div className="card p-6 shadow-md rounded-lg">
            <div className="flex items-center mb-4">
              <PieChartIcon size={24} className="text-red-600 mr-2" />
              <h2 className="text-lg font-semibold">Sales by Category</h2>
            </div>
            <div className="h-80 flex items-center justify-center">
              {salesBySection.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesBySection}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      dataKey="revenue"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {salesBySection.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${CURRENCY_SYMBOL}${value.toFixed(2)}`, 'Revenue']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">No sales by category data available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </SalesReportErrorBoundary>
  );
};

export default SalesReport;