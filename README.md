# crypto-checker
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
