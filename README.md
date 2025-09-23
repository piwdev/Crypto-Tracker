# crypto-checker
暗号通貨の価格をチェックできるサイト。ユーザーはお気に入りコインをブックマークできる。
this is service to check cryptocurrency(coins)

サイトURL https://crypto-tracker.parkinwoo.dev/

<img width="3809" height="2158" alt="image" src="https://github.com/user-attachments/assets/c22ae758-6919-4259-8280-6e275572fb4c" />

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
