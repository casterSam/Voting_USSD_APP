A simple voting system accessible via USSD (Unstructured Supplementary Service Data) that allows users to vote in different categories and view results.

Features
📱 USSD interface for easy mobile access

🗳️ Voting in multiple categories (Best Dancer, Best Comedian, Best Actor)

📊 View real-time voting results

🔒 Prevents duplicate voting in the same category

☁️ Hosted on AWS Lambda with Africastalking USSD gateway

Technical Stack
Backend: Node.js (AWS Lambda)

Database: MySQL (AWS RDS)

USSD Gateway: Africastalking

Environment: Configurable via .env file

Setup Instructions
Prerequisites
Node.js 14.x or higher

MySQL database via AWS RDS

Africastalking account with USSD service enabled
