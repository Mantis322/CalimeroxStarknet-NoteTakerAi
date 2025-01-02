# 🔐 NoteTakerAi: Your All-in-One Private Note & Payment Hub on StarkNet

Turn your payment notes into instant actions with complete privacy!

Why just take notes about payments when you can execute them instantly? NoteTakerAi transforms your payment reminders into immediate actions on StarkNet, all while maintaining complete privacy through Calimero SDK. With near-zero transaction costs, you can focus on your business, not fees.

## ✨ Payment + Privacy Features

### 💡 Smart Payment Notes
- **Convert notes to instant payments**: Effortlessly turn payment reminders into actual transactions.
- **Track payment history privately**: Keep a secure and private record of all your notes.
- **Near-zero transaction costs on StarkNet**: Save money on transaction fees while executing payments quickly.

### 🔒 Complete Privacy with Calimero
- **Encrypted notes and transactions**: Your payment notes and transaction data are fully encrypted, ensuring only you can view them.
- **Only you can see your financial data**: No third-party access to your sensitive information.
- **Sharing with trusted addresses**: Share specific payment data securely with trusted parties when needed.

### 🤖 AI Payment Assistant
- **Payment reminders**: Get automated reminders for upcoming payments. (in development...)
- **Quick transaction execution**: Execute payments with a simple command using your notes.
- **Private financial insights**: Get deep insights into your financial activities—all while maintaining your privacy.

### 💬 Smart Commands
- Use simple and intuitive commands to trigger payments, set reminders, and analyze your payment history.
- Some examples:
  - "Send 50 STRK to 0x05....."
  - "add note"
 
### ⚡ Why Choose NoteTakerAi?

| Feature               | PrivatePrivacy        | Note Apps           | Payment Apps       | Crypto Wallets      | Universal Notes |
|-----------------------|-----------------------|---------------------|--------------------|---------------------|-----------------|
| **Payment Integration** | ✅ Yes                | ❌ No               | ✅ Yes             | ✅ Yes              | ❌ No            |
| **Privacy**            | ✅ Complete           | ⚠️ Limited          | ❌ No              | ❌ Public           | ❌ No            |
| **Transaction Costs**  | ✅ Near Zero          | ❌ N/A              | ❌ High            | ⚠️ Varies          | ❌ No            |
| **Note Categories**    | ✅ Unlimited          | ✅ Yes              | ❌ No              | ❌ No               | ✅ Yes           |
| **Selective Sharing**  | ✅ Yes                | ⚠️ Limited          | ❌ No              | ❌ No               | ❌ No            |

## 🚀 Getting Started

To get started with PrivatePrivacy, follow these steps:
Make sure you have these installed and running on your system before you start
- [CalimeroSDK Starknet Node](https://calimero-network.github.io/getting-started/setup)
- [Merod](https://calimero-network.github.io/developer-tools/CLI/merod)
- [Meroctl](https://calimero-network.github.io/developer-tools/CLI/meroctl)

1. Clone the repository:
   ```git clone https://github.com/Mantis322/CalimeroxStarknet-NoteTakerAi.git```
2. Build Application:
  - ```cd CalimeroxStarknet-NoteTakerAi```
  - ```cd logic```
  - ```chmod +x ./build.sh```
  - ```./build.sh```
  - ```meroctl --node-name <NodeName> app install --path path/res/increment.wasm```
*This command will return an app id*
  - ```meroctl --node-name <NodeName> context create -a <app-id> -p application```
*This command will return an id and member_public_key*
  - ```cd app```
  - ```npm install```
  - ```npm build```
  - ```npm run dev```
   
## 📃 License

This project is licensed under the [MIT License](LICENSE). See the LICENSE file for details.

⭐ If you found this project useful, don't forget to star it!
