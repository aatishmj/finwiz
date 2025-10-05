from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework.permissions import AllowAny
import os
import uuid
import json
import requests
import matplotlib
matplotlib.use('Agg')  # Use a non-interactive backend
import matplotlib.pyplot as plt
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .serializers import WatchlistSerializer, PortfolioSerializer, UserProfileSerializer
from .models import UserProfile, Portfolio, Watchlist



def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(APIView) :
    permission_classes = [AllowAny]
    def post(self, request)  :
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create(username=username, password=make_password(password), email=email)
        user.save()
        # Create UserProfile
        UserProfile.objects.create(user=user)
        # Create default watchlist
        default_stocks = ['RELIANCE', 'TCS', 'HDFC', 'ICICI', 'INFY']
        for symbol in default_stocks:
            Watchlist.objects.create(user=user, stock_symbol=symbol)
        token = get_tokens_for_user(user = user)
        return Response(token, status=status.HTTP_201_CREATED)
    
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        print("Username:", username)
        print("Password:", password)

        user = authenticate(username=username, password=password)

        if user:
            token = get_tokens_for_user(user=user)
            return Response(token, status=status.HTTP_200_OK)
        else:
            # Always return a response for invalid credentials
            return Response(
                {"error": "Invalid username or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        



from rest_framework_simplejwt.tokens import AccessToken

def clean_response(response):
    import re
    # Remove <think> tags and their content
    cleaned = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL)
    return cleaned.strip()

class UserFromTokenView(APIView):
    permission_classes = [AllowAny]  # you can change this if needed

    def post(self, request):
        token = request.data.get('token')

        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            user = User.objects.get(id=user_id)
            
            return Response({
                'username': user.username,
                'email': user.email,
                'id': user.id,
                
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_401_UNAUTHORIZED)



class ModelView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            prompt = request.data.get('prompt', '')
            user = request.user  # ✅ Now works with JWT

            print("---------------------------------------------")
            print("User:", user)
            print("Prompt:", prompt[:200] + "..." if len(prompt) > 200 else prompt)
            print("---------------------------------------------")
            # Parse the prompt to separate system and user messages
            if "The user asks:" in prompt:
                system_content, user_content = prompt.split("The user asks:", 1)
                system_content = system_content.strip()
                user_content = "The user asks:" + user_content.strip()
            else:
                system_content = "You are Trada, an AI financial advisor specializing in Indian stock markets. Provide actionable insights about portfolios and investment strategies tailored to Indian markets. Address the user directly as 'you' and be helpful, professional, and concise."
                user_content = prompt

            payload = {
                "model": "deepseek-r1:1.5b",
                "messages": [
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": user_content}
                ],
                "stream": False
            }

            print("Sending payload to Ollama:", payload)

            # Send request to Ollama
            ollama_response = requests.post("http://localhost:11434/api/chat", json=payload)
            print("Ollama response status:", ollama_response.status_code)
            if ollama_response.status_code != 200:
                print("Ollama error text:", ollama_response.text)
                return JsonResponse({"error": f"Ollama API error: {ollama_response.status_code} - {ollama_response.text}"}, status=500)
            output = ollama_response.json()
            print("Ollama output keys:", list(output.keys()))
            response = output['message']['content']
            print("Raw AI response:", response)
            print("AI response length:", len(response))

            # Remove <think> blocks from DeepSeek R1 responses
            import re
            response = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL).strip()
            print("Response after removing <think>:", response)
            divided_text = response.split('```')
            explanation = ""
            code = ""
            if len(divided_text) > 1 :
                for i in range(0,len(divided_text)):
                    if i % 2 == 1 :
                        image_name = f"{uuid.uuid4().hex}.png"
                        image_path = os.path.join("media", image_name)
                        code = divided_text[i]
                        code = code.replace('python', '')
                        code = code.replace("plt.show()", f"plt.savefig('{image_path}')\nplt.close()")

                    else :
                        explanation = explanation + divided_text[i]
                with open("chart.py" , 'w') as f :
                    f.write(code)
                with open("exp.txt" , 'w') as f:
                    f.write(explanation)

                os.system("python3 chart.py")
                text = ''
                with open('exp.txt' , 'r') as f :
                    text =f.read()

                return JsonResponse({
                    "type": "image",
                    "image_url": f"/media/{image_name}",
                    "message": text
                })
            else :
                return JsonResponse({
                    "type": "text",
                    "message": response
                })

    

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

        return JsonResponse({"error": "Invalid request method"}, status=400)


class PortfolioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            portfolios = Portfolio.objects.filter(user=request.user)
            serializer = PortfolioSerializer(portfolios, many=True)
            holdings = []
            for item in serializer.data:
                holdings.append({
                    "symbol": item['asset_name'],
                    "name": item['asset_name'],
                    "shares": item['quantity'],
                    "avgPrice": item['value'] / item['quantity'] if item['quantity'] > 0 else 0,
                    "totalCost": item['value']
                })
            return Response({"success": True, "portfolio": {"holdings": holdings}}, status=200)
        except Exception as e:
            print("Error fetching portfolio:", str(e))
            return Response({"success": False, "error": str(e)}, status=500)

    def post(self, request):
        try:
            asset_name = request.data.get("asset_name")
            quantity = request.data.get("quantity")
            value = request.data.get("value")

            if not asset_name or quantity is None or value is None:
                return Response(
                    {"success": False, "error": "Missing required fields"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            Portfolio.objects.create(
                user=request.user,
                asset_name=asset_name,
                quantity=float(quantity),
                value=float(value)
            )

            return Response(
                {
                    "success": True,
                    "message": "Asset added successfully",
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            print("Error adding to portfolio:", str(e))
            return Response({"success": False, "error": str(e)}, status=500)

class WatchlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            watchlists = Watchlist.objects.filter(user=request.user)
            serializer = WatchlistSerializer(watchlists, many=True)
            stocks = [{"symbol": item['stock_symbol'], "name": item['stock_symbol']} for item in serializer.data]
            return Response({"success": True, "watchlist": stocks})
        except Exception as e:
            print("Error fetching watchlist:", str(e))
            return Response({"success": False, "error": str(e)}, status=500)

    def post(self, request):
        try:
            stock_symbol = request.data.get("stock_symbol")
            stock_name = request.data.get("stock_name", stock_symbol)

            if not stock_symbol:
                return Response(
                    {"success": False, "error": "Stock symbol is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if Watchlist.objects.filter(user=request.user, stock_symbol=stock_symbol).exists():
                return Response(
                    {"success": False, "error": "Stock already in watchlist"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            Watchlist.objects.create(
                user=request.user,
                stock_symbol=stock_symbol
            )

            return Response({"success": True, "message": "Added to watchlist"})
        except Exception as e:
            print("Error adding to watchlist:", str(e))
            return Response({"success": False, "error": str(e)}, status=500)

    def delete(self, request):
        try:
            stock_symbol = request.data.get("stock_symbol")

            if not stock_symbol:
                return Response(
                    {"success": False, "error": "Stock symbol is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Remove stock from watchlist
            watchlist = Watchlist.objects.filter(user=request.user, stock_symbol=stock_symbol)
            if watchlist.exists():
                watchlist.delete()
                return Response({"success": True, "message": "Removed from watchlist"})
            else:
                return Response(
                    {"success": False, "error": "Stock not in watchlist"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        except Exception as e:
            print("Error removing from watchlist:", str(e))
            return Response({"success": False, "error": str(e)}, status=500)

class BalanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile, created = UserProfile.objects.get_or_create(user=request.user)
            serializer = UserProfileSerializer(profile)
            return Response({"success": True, "balance": serializer.data['balance']})
        except Exception as e:
            print("Error fetching balance:", str(e))
            return Response({"success": False, "error": str(e)}, status=500)

    def put(self, request):
        try:
            balance = request.data.get("balance")
            if balance is None:
                return Response({"success": False, "error": "Balance is required"}, status=400)

            profile, created = UserProfile.objects.get_or_create(user=request.user)
            profile.balance = balance
            profile.save()
            return Response({"success": True, "balance": balance})
        except Exception as e:
            print("Error updating balance:", str(e))
            return Response({"success": False, "error": str(e)}, status=500)

class TradeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            symbol = request.data.get("symbol")
            action = request.data.get("action")
            shares = request.data.get("shares")
            price = request.data.get("price")

            if not symbol or not action or shares is None or price is None:
                return Response({"success": False, "error": "Missing required fields"}, status=400)

            shares = float(shares)
            price = float(price)
            amount = shares * price

            profile, created = UserProfile.objects.get_or_create(user=request.user)

            if action == "buy":
                if profile.balance < amount:
                    return Response({"success": False, "error": "Insufficient balance"}, status=400)
                profile.balance -= amount
            elif action == "sell":
                profile.balance += amount
            else:
                return Response({"success": False, "error": "Invalid action"}, status=400)

            profile.save()

            # Update or create portfolio entry
            portfolio, created = Portfolio.objects.get_or_create(
                user=request.user,
                asset_name=symbol,
                defaults={'quantity': 0, 'value': 0}
            )

            if action == "buy":
                total_quantity = portfolio.quantity + shares
                total_value = portfolio.value + amount
                portfolio.quantity = total_quantity
                portfolio.value = total_value
            elif action == "sell":
                if portfolio.quantity < shares:
                    return Response({"success": False, "error": "Insufficient shares"}, status=400)
                portfolio.quantity -= shares
                portfolio.value -= amount
                if portfolio.quantity <= 0:
                    portfolio.delete()
                    return Response({"success": True, "message": "Trade executed successfully"})

            portfolio.save()

            return Response({"success": True, "message": "Trade executed successfully"})
        except Exception as e:
            print("Error executing trade:", str(e))
            return Response({"success": False, "error": str(e)}, status=500)
