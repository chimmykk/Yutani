#!/bin/bash

# Telegram Wallet Bot Startup Script
echo "🚀 Starting Telegram Wallet Bot..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create wallets directory if it doesn't exist
if [ ! -d "wallets" ]; then
    echo "📁 Creating wallets directory..."
    mkdir -p wallets
fi

# Test the bot functionality
echo "🧪 Testing bot functionality..."
node test-telegram-wallet.js

if [ $? -eq 0 ]; then
    echo "✅ All tests passed! Starting bot..."
    echo "🤖 Telegram Wallet Bot is now running..."
    echo "📋 Bot commands:"
    echo "   /start - Welcome message"
    echo "   /create - Create new wallet"
    echo "   /load - Load existing wallet"
    echo "   /list - List saved wallets"
    echo "   /help - Show help"
    echo ""
    echo "🛑 Press Ctrl+C to stop the bot"
    echo ""
    
    # Start the bot
    node telegram-bot.js
else
    echo "❌ Tests failed. Please check the configuration and try again."
    exit 1
fi
