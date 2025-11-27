# 💰 Wallet Controller - Complete Explanation & Review

## 📋 Overview

The `walletController.js` manages all wallet-related operations including:
- Creating wallets for users
- Adding money via Cashfree payment gateway
- Deducting entry fees for tournaments
- Transaction history tracking
- Payment webhook handling

---

## 🏗️ Architecture

```
User → Frontend → API Endpoint → walletController → Wallet Schema → MongoDB
                                        ↓
                                  Cashfree API (for payments)
```

---

## 📦 Dependencies

```javascript
const Wallet = require('../schema/Wallet');  // Wallet data model
const User = require('../schema/User');      // ⚠️ UNUSED - can be removed
const crypto = require('crypto');            // For signature generation
```

---

## ⚙️