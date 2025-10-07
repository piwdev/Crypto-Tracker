# crypto-tracker
暗号通貨の価格をチェックできるサイト。ユーザーはお気に入りコインをブックマークできる。
this is service to check cryptocurrency(coins)

**サイトURL https://crypto-tracker.parkinwoo.dev/**

**ログイン用アカウント(登録めんどくさい人向け)**<br>
id : sample@example.com<br>
pw : password

### Home ('/)
<img width=40% height=40% alt="image" src="https://github.com/user-attachments/assets/efc745b1-579b-4e09-af0b-c787b77ac8dd" />

### List
#### 非ログイン
<img width=40% height=40% alt="image" src="https://github.com/user-attachments/assets/49cd1f7f-05c1-4619-876b-64c81226f1c7" />

#### ログイン
**ログインユーザーはbookmark可能**
<img width=40% height=40% alt="image" src="https://github.com/user-attachments/assets/9cffda4d-ff85-47aa-aa2b-95d7b026a8c5" />

#### マイページ  
<img width=40% height=40% alt="image" src="https://github.com/user-attachments/assets/3f18e2f7-179e-4fd4-ad53-54d9ff33754c" />


# Architecture
- Source : Github (This Repo)
- CI/CD : Github Actions
- Frontend : AWS S3 (React + JavaScript(TypeScript))
- Backend : AWS Elastic Beanstalk (Django + Python)
- CDN : AWS CloudFront
- SSL : AWS Certificate Manager
- DNS : AWS Route53
- DB : AWS Aurora and RDS (PostgreSQL)
- Coin data fetching : AWS Lambda + EventBridge
  - 仮想通貨のデータを提供するCoinGecko様のFree PlanにはCall Limitが存在
  - しかも、APIのCallにはAPI Keyが必要なため、フロントから直接呼び出したらnetworkタブでAPI Keyが丸見え...
  - LambdaでCoinGecko APIを呼び出し、そのresponseをDBに保存するようにすればAPI回数制限とセキュリティー問題両方とも解決!
  - Lambdaは30分間隔で実行されるようにEventBridgeで設定

<img width="2508" height="1682" alt="image" src="https://github.com/user-attachments/assets/5a1b4f9c-3bf6-4725-86b0-960ae4683849" />

**USE PYTHON 3.11 !!!**

# Local Setting Guide
for who wants to run this app in localhost

## Front Setting
Run command in terminal
``` bash
# 1. move directory
cd Crypto-Tracker/crypto-frontend
# 2. install
npm install
# 3. run dev
npm run start
# the app will run in localhost:3000
```
---

## Backend Setting

```bash
cd Crypto-Tracker
python3.11 -m venv .venv
source .venv/bin/activate
# there should be '(.venv)' in front of your pc's name
# ex) (.venv) macair@User-MacBookAir
pip install -r requirements.txt
cd crypto_backend

# Create superuser (optional)
python manage.py createsuperuser

# Run development server
python manage.py runserver
# the backend will run in localhost:8000
```
---

## DB Setting

Require Docker/Docker compose

1. Run Docker Container for PostgreSQL

```bash
cd Crypto-Tracker
docker-compose up -d postgres
```
<br>
2. Run Shell Script for initial migration
Not Neccessary but recommended.
This will create superuser for DB and run django migration.

```bash
# allow script
chmod +x setup-postgres.sh
./setup-postgres.sh
```
<br>
3. Manual Migration (venv)
Make sure you already set Backend before this step.
```bash
cd Crypto-Tracker
source .venv/bin/activate
python3 manage.py makemigrations
python3 manage.py migrate
```
<br>
4. DB information（default）

- Host: localhost
- Port: 5432
- Database: crypto_db
- Username: postgres
- Password: password

---

## Environment Variables

Create a `.env` file in the `crypto_backend` directory with the following variables:

```env
# Database
DB_NAME=crypto_db
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CoinGecko API
COINGECKO_API_KEY=your-coingecko-api-key

# CORS (for frontend connection)
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

---

## Lambda Function Setup (Optional)

The Lambda function fetches cryptocurrency data from CoinGecko API and stores it in the database.

```bash
cd Crypto-Tracker/lambda
pip install -r requirements.txt -t .
# Deploy to AWS Lambda manually or use AWS CLI/SAM
```

**Lambda Environment Variables:**
- `DB_HOST`: Your RDS endpoint
- `DB_NAME`: crypto_db
- `DB_USER`: postgres
- `DB_PASSWORD`: your-db-password
- `COINGECKO_API_KEY`: your-api-key

---

## Testing the Setup

1. **Start PostgreSQL**: `docker-compose up -d postgres`
2. **Start Backend**: `cd crypto_backend && python manage.py runserver`
3. **Start Frontend**: `cd crypto-frontend && npm start`
4. **Access the app**: http://localhost:3000

**API Endpoints:**
- Backend API: http://localhost:8000/api/
- Admin Panel: http://localhost:8000/admin/
