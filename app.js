const { useState, useEffect } = React;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, info) {
    console.error("Error caught:", error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-6 text-red-400">
          <h2>Something went wrong</h2>
          <p>{this.state.error ? this.state.error.toString() : ""}</p>        </div>
      );
    }
    return this.props.children;
  }
}

function TransactionForm({ addTransaction }) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'income',
    dateTime: new Date().toISOString().slice(0, 16)
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('https://expense-tracker-with-backend.onrender.com/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          dateTime: new Date(formData.dateTime).toISOString()
        })
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to save transaction');
      }

      addTransaction({
        ...responseData,
        id: responseData._id // Map MongoDB _id to id
      });
      
      setFormData({
        description: '',
        amount: '',
        type: 'income',
        dateTime: new Date().toISOString().slice(0, 16)
      });
      
    } catch (error) {
      console.error('Transaction error:', error);
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glassmorphism max-w-md mx-auto p-6 rounded-2xl shadow-xl">
      <h2 className="text-white text-xl font-semibold mb-6">Add Transaction</h2>
      <div className="space-y-4">
        <div>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description"
            className="w-full px-4 py-3 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 border-none"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Amount"
              step="0.01"
              className="w-full px-4 py-3 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 border-none"
              required
            />
          </div>
          <div>
            <input
              type="datetime-local"
              value={formData.dateTime}
              onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800 text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 border-none"
              required
            />
          </div>
        </div>

        <div className="flex gap-2">
          {['income', 'expense'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({ ...formData, type })}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                formData.type === type 
                  ? type === 'income' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all"
        >
          Add Transaction
        </button>
      </div>
    </form>
  );
}

function TransactionList({ transactions, deleteTransaction }) {
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="max-w-md mx-auto space-y-2">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="group glassmorphism p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-gray-100 font-medium flex items-center gap-2">
              <span className={transaction.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}>
                {transaction.type === 'income' ? '↑' : '↓'}
              </span>
              {transaction.description}
            </div>
            <div className="text-xs text-gray-400">
              {formatDate(transaction.dateTime)}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className={`font-medium ${
              transaction.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
            </span>
            <button
              onClick={() => deleteTransaction(transaction.id)}
              className="text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Delete transaction"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function BalanceStats({ balance, income, expense }) {
  return (
    <div className="glassmorphism max-w-md mx-auto p-6 rounded-2xl shadow-xl">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">
          ${balance.toFixed(2)}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-emerald-600/20 rounded-lg">
            <div className="text-emerald-400 text-sm">Income</div>
            <div className="text-white font-medium">+${income.toFixed(2)}</div>
          </div>
          <div className="p-3 bg-rose-600/20 rounded-lg">
            <div className="text-rose-400 text-sm">Expense</div>
            <div className="text-white font-medium">-${expense.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('https://expense-tracker-with-backend.onrender.com/transactions');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load transactions');
        }

        const data = await response.json();
        
        const formattedTransactions = data.map(t => ({
          id: t._id, // Map MongoDB _id to id
          description: t.description,
          amount: t.amount,
          type: t.type,
          dateTime: t.dateTime // Already in ISO format from backend
        }));

        setTransactions(formattedTransactions);
        
      } catch (err) {
        setError(err.message);
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const deleteTransaction = async (id) => {
    try {
      const response = await fetch(`https://expense-tracker-with-backend.onrender.com/transactions/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete transaction');
      }

      setTransactions(prev => prev.filter(t => t.id !== id));
      
    } catch (err) {
      setError(err.message);
      alert(err.message);
      console.error('Delete error:', err);
    }
  };

  const filteredTransactions = transactions.filter(t => 
    filter === 'all' || t.type === filter
  );

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  if (loading) return <div className="text-center p-8 text-gray-400">Loading transactions...</div>;
  if (error) return <div className="text-center p-8 text-red-400">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">NeoFinance</h1>
        <p className="text-gray-400">Minimal Expense Tracker</p>
      </header>

      <BalanceStats balance={balance} income={totalIncome} expense={totalExpense} />
      <TransactionForm addTransaction={(t) => setTransactions([t, ...transactions])} />
      
      <div className="max-w-md mx-auto">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 text-gray-100 rounded-lg border-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Transactions</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <TransactionList 
        transactions={filteredTransactions} 
        deleteTransaction={deleteTransaction} 
      />
    </div>
  );
}

ReactDOM.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
  document.getElementById('root')
);