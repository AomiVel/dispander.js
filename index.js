const regex_discord_message_url =(
    "(?!<)https://(ptb.|canary.)?discord(app)?.com/channels/" +
    "(?<guild>[0-9]{15,20})/(?<channel>[0-9]{15,20})/(?<message>[0-9]{15,20})(?!>)"
)
const regex_extra_url = (
    "\\?dispanded=(?<dispanded>true)(&children=(?<children>[0-9,]+))?"
)

const DELETE_REACTION_EMOJI = "🗑️"


function Dispander(client, delete_reaction=true, delete_reaction_emoji=DELETE_REACTION_EMOJI) {
    client.on('messageCreate', message => {
        dispand(message)
    })

    client.on('raw', (resp) => {
        delete_dispand(client, resp)
    })
}
exports.Dispander = Dispander


function dispand(message, delete_reaction=true, delete_reaction_emoji=DELETE_REACTION_EMOJI) {
    for (const ids of message.content.matchAll(regex_discord_message_url)) {
        if (ids.groups.guild != message.guild.id) {
            continue
        }

        message.guild.channels.cache.get(ids.groups.channel).messages.fetch(ids.groups.message)
            .then((msg) => {
                _send_messages(msg, delete_reaction, delete_reaction_emoji)
            })
            .catch()
    }
}
exports.dispand = dispand


function delete_dispand(client, resp) {
    if (resp.t != 'MESSAGE_REACTION_ADD') {
        return
    }
    if (resp.d.member.user.bot) {
        return
    }
    if (!_is_delete_emoji(resp)) {
        return
    }

    channel = client.channels.cache.get(resp.d.channel_id)
    channel.messages.fetch(resp.d.message_id)
        .then(msg => {
            if (msg.author.id != client.user.id) {
                return
            }
            e = msg.embeds[0]
            author_url = e.author.url
            data = author_url.match(regex_extra_url).groups
            if (data.dispanded != "true"){
                return
            }

            msg.delete()
            if (data.children != undefined) {
                for (id of data.children.split(',')) {
                    channel.messages.fetch(id).then(msg => {
                        msg.delete()
                    })
                }
            }
        })
        .catch()
}
exports.delete_dispand = delete_dispand



function _create_main_base_embed(message) {
    result_obj = {
        author: {
            name: message.member.displayName,
            icon_url: message.author.displayAvatarURL(),
            url: `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}?dispanded=true`
        },
        footer: {
            icon_url: message.guild.iconURL(),
            text: message.channel.name
        },
        color: 0xffffff,
        timestamp: message.createdAt
    }

    return result_obj
}


function _send_messages(message, delete_reaction, delete_reaction_emoji) {
    send_embeds = []

    main_embed = _create_main_base_embed(message);
    send_embeds.push(main_embed)

    if (message.content != '') {
        send_embeds[0]["description"] = message.content
    }

    attachments_length = message.attachments.size

    if (attachments_length == 1) {
        send_embeds[0]["image"] = { url: message.attachments.first().proxyURL }
    }
    else if (attachments_length > 1) {
        message.attachments.forEach(attachment => {
            send_embeds.push( { image: { url: attachment.proxyURL } } )
        })
    }

    embeds_length = message.embeds.length
    if (embeds_length > 0){
        for (embed of message.embeds) {
            send_embeds.push( embed.toJSON() )
        }
    }

    if (send_embeds.length < 11) {
        message.channel.send( { embeds: send_embeds } ).then(msg => {
            if (delete_reaction){
                msg.react(DELETE_REACTION_EMOJI)
            }
        })
    }
    else if (send_embeds.length == 11){
        message.channel.send( { embeds: [send_embeds[0]] } ).then((main_message) => {
            if (delete_reaction){
                main_message.react(DELETE_REACTION_EMOJI)
            }
            main_message.reply( { embeds: send_embeds.slice(1) } ).then(rep_msg => {
                edit_embed = send_embeds[0]
                edit_embed.author.url = edit_embed.author.url + '&children=' + rep_msg.id
                main_message.edit({embeds: [edit_embed]})
            })

        })
    }
    else {
        message.channel.send( { embeds: send_embeds.slice(0, 10) } ).then(async (main_message) => {
            if (delete_reaction){
                await main_message.react(DELETE_REACTION_EMOJI)
            }
            replied_messages = []
            for (var i = 10; i < send_embeds.length; i+=10) {
                rep_msg = await main_message.reply( { embeds: send_embeds.slice(i, i+10) } )
                replied_messages.push(rep_msg.id)
            }

            embeds = main_message.embeds
            embeds[0].author.url += '&children=' + replied_messages.join()

            await main_message.edit({embeds: embeds})
        })
    }
}


function _create_emoji(emoji_data) {
    emoji_name = emoji_data.name
    if (emoji_data.id == null) {
        return emoji_name
    }
    else {
        return `<:${emoji_name}:${emoji_data.id}>`
    }
}


function _is_delete_emoji(resp) {
    emoji = _create_emoji(resp.d.emoji)
        
    if (emoji != DELETE_REACTION_EMOJI) {
        return false
    }
    else {
        return true
    }
}

