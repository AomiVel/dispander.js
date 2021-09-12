# Dispander.js

[dispander](https://github.com/DiscordBotPortalJP/dispander/)をJavaScriptで書いた版


# 使い方

**Gitのインストールがされている必要があります**

## インストール

```shell
$ npm install AomiVel/dispander.js
```

## クライアントを使用

```js
const Discord = require("discord.js")
const { Dispander } = require("dispander.js")


var client = Discord.Client()

Dispander(client)


client.login("TOKEN")
```

## 関数として使用

```js
const Discord = require("discord.js")
const { dispand, delete_dispand } = require("dispander.js")


var client = Discord.Client()


client.on("messageCreate", message => {
    dispand(message)
})

client.on("raw", response => {
    delete_dispand(client, response)
})


client.login("TOKEN")
```
