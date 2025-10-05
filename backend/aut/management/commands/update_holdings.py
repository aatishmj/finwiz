from django.core.management.base import BaseCommand
from pymongo import MongoClient
import os

class Command(BaseCommand):
    help = 'Update user holdings based on transaction history'

    def add_arguments(self, parser):
        parser.add_argument('user_id', type=str, help='User ID to update holdings for')

    def handle(self, *args, **options):
        user_id = options['user_id']

        # Connect to MongoDB
        client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
        db = client['god']

        # Collections
        transactions_collection = db['transactions']
        portfolio_collection = db['portfolio']

        # Get all transactions for user
        transactions = list(transactions_collection.find({'userId': user_id}).sort('date', 1))

        holdings = {}

        for tx in transactions:
            symbol = tx['symbol']
            action = tx['type'].lower()
            shares = tx['shares']
            price = tx['price']

            if action == 'buy':
                if symbol not in holdings:
                    holdings[symbol] = {'shares': 0, 'totalCost': 0}
                holdings[symbol]['shares'] += shares
                holdings[symbol]['totalCost'] += shares * price
            elif action == 'sell':
                if symbol in holdings:
                    holdings[symbol]['shares'] -= shares
                    holdings[symbol]['totalCost'] -= shares * price
                    if holdings[symbol]['shares'] <= 0:
                        del holdings[symbol]

        # Convert to list
        holdings_list = []
        for symbol, data in holdings.items():
            if data['shares'] > 0:
                holdings_list.append({
                    'symbol': symbol,
                    'name': symbol,  # You can update with proper names later
                    'shares': data['shares'],
                    'avgPrice': data['totalCost'] / data['shares'],
                    'totalCost': data['totalCost']
                })

        # Update portfolio
        portfolio_collection.replace_one(
            {'userId': user_id},
            {
                'userId': user_id,
                'holdings': holdings_list,
                'lastUpdated': {'$date': 'new Date()'},
                'createdAt': {'$date': 'new Date()'}
            },
            upsert=True
        )

        self.stdout.write(self.style.SUCCESS(f'Successfully updated holdings for user {user_id}'))
