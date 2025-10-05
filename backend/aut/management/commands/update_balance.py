from django.core.management.base import BaseCommand
from aut.mongodb_client import get_db

class Command(BaseCommand):
    help = 'Update the initial deposit transaction amount for a user'

    def add_arguments(self, parser):
        parser.add_argument('user_id', type=str, help='User ID')
        parser.add_argument('amount', type=float, help='New amount for the initial deposit')

    def handle(self, *args, **options):
        user_id = options['user_id']
        amount = options['amount']
        db = get_db()

        result = db.transactions.update_one(
            {"userId": user_id, "type": "Deposit", "name": "Initial Deposit"},
            {"$set": {"amount": amount}}
        )

        if result.modified_count > 0:
            self.stdout.write(f"Updated initial deposit for user {user_id} to amount {amount}")
        else:
            self.stdout.write(f"No transaction found to update for user {user_id}")
