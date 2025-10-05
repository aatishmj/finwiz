
import matplotlib.pyplot as plt

# Sample data: Transaction count by stock
stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'NIFTY 50']
transaction_counts = [345, 287, 196, 174, 143, 10]

# Plot setup
plt.figure(figsize=(10, 6))
plt.title('Transaction History - Indian Financial Market', fontsize=12)
plt.xlabel('Date', fontsize=8)
plt.ylabel('Number of Shares', fontsize=8)

# Plot
plt.bar(stocks, transaction_counts)
plt.grid(True, linestyle='-', alpha=0.1)
plt.savefig('media/af2d55801b0d40b49f2c483dbc695956.png')
plt.close()
