# Stock market bot
A bot to "play" with the stock market by using fake money.
The data is provided by [financialmodelingprep.com](financialmodelingprep.com) through the library [financialmodelingprep](https://github.com/patelneel55/financialmodelingprep).

## Node.js dependencies
List available [here](https://github.com/cryx3001/Stock-Market-Discord-Bot/network/dependencies).

## Available commands
Prefix by default: `sm!`
### Basics
- `help` Gives you the help you need!
- `init` The command to get started
- `prefix <prefix>` Change my prefix to the choosen one!
*Note: Mention me with `prefix` to know my prefix! (@Stock Market prefix)*
- `ping` To see the latency between you, the bot and the API
- `about` About the bot

### Player account
- `balance` / `balance @User` To admire your / user's wealth
- `list` / `list @User` Your / user's current trades
- `daily` To get your daily reward

### Stock Market
- `search <name/symbol>` To search stock markets (ex: *sm!search Apple or sm!search AAPL*)
- `show <symbol>` To get details about a particular market (ex: *sm!show AAPL*)
- `newtrade <buy/sell> <symbol> <price>` To trade stocks on the market(ex: *sm!newtrade buy AAPL 5000*)
- ==>`buy` if you think the stock will go up,
- ==>`sell` if you think the stock will go down.
- `closetrade <ID>` (ex: *sm!closetrade 0*) Close a trade (the ID can be found with the list command). Give to you the final value of your trade.

### Okay, how do I play?
First, you are going to look for a market. Type `sm!search <name/symbol>`.
Then type `sm!show <symbol>` if you want more details about it.
Now it's time to trade! Follow the instructions above for `newtrade` and `closetrade`!
Happy trading!

## Getting started
### Test it!
You can invite the bot on your Discord server [here](https://discordapp.com/oauth2/authorize?client_id=700690470891814912&permissions=3072&scope=bot). Type `sm!help` to get started!

### Clone it!
If you want to try the bot on your own side, you have to:
- Rename the `db (empty)` folder to `db`.
- Install the latest version of `node.js`
- Install the depedencies
- Replace the token to log-in
