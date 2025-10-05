from django.core.management.base import BaseCommand
from aut.mongodb_client import get_db

class Command(BaseCommand):
    help = 'Check transactions for a user'

    def add_arguments(self, parser):
        parser.add_argument('user_id', type=str, help='User ID to check transactions for')

    def handle(self, *args, **options):
        user_id = options['user_id']
        db = get_db()
        transactions = db.transactions.find({"userId": user_id})

        self.stdout.write(f"Transactions for user {user_id}:")
        for tx in transactions:
            self.stdout.write(str(tx))
