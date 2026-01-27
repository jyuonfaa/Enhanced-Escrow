# User Manual

## 1. Getting Started
- Navigate to the homepage.
- Click **Register** to create an account.
- Select your role: **Buyer**, **Seller**, **Agent** (Access to Admin is usually restricted, pre-seeded, or selectable for this prototype).

## 2. Seller Workflow
- Log in as **Seller**.
- Go to `Dashboard`.
- Click `Add New Product`.
- Enter Name, Description, Price, and Image URL.
- Your product is now visible in the Marketplace.

## 3. Buyer Workflow
- Log in as **Buyer**.
- Browse the `Marketplace` (Product List).
- Click `View Details` on an item.
- Click `Buy with Escrow Protection`.
- Confirm the transaction. Payment is simulated.
- Go to `Dashboard` to view your **Purchased Items** and status.
- **Raise Dispute**: If there is an issue, click `Raise Dispute` on the Order card.

## 4. Delivery Agent Workflow
- Log in as **Delivery Agent**.
- Go to `Dashboard`.
- View assigned jobs.
- When delivering, ask Buyer for the **OTP**.
- Enter **OTP** and partial **Photo URL** (mock upload).
- Click `Verify`. Funds are released if correct.

## 5. Admin Workflow
- Log in as **Admin**.
- **Assign Agent**: Enter Transaction ID and Agent User ID to assign a delivery.
- **Disputes**: Click `Show Disputes` to view open cases.
  - Review details.
  - Click `Refund Buyer` or `Release to Seller` to resolve.
