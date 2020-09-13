const Discord = require("discord.js");
const client = new Discord.Client();
const config = require('./config.json');
const { scheduleJob } = require("node-schedule");

client.login(config.discordKey);

client.on("ready", () => {
    console.log(`Bot has started! Invite link: https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot`);
    client.user.setActivity(config.activityString);

    // Schedule the 'delete empty channels' job every minute
    // I'd prefer checking this whenever someone leaves a vc but I can't find how (doesn't seem to be an event)
    scheduleJob.scheduleJob('0 * * * * *', () => {
        deleteEmptyChannels();
    });
})

client.on("message", () => {
    // Handle messages
})

function HandleCommand(message) {
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // exit if message doesn't begin with the prefix
    if(message.content.indexOf(config.prefix) !== 0) return;

    if (command === "vc") CreateChannel(message, args);
}

///////////////////////////////////////////////////////////////////////
// Channel creation/deletion
///////////////////////////////////////////////////////////////////////
let temporaryChannels = [];

function CreateChannel(message, args) {

    // Find number of users in args and check whether it's actually a number :p 
    let users = args[0];
    if (users.isNaN()) return message.reply("You need to let me know how many users you want, man!");

    // Find channel category
    let category = message.guild.channels.resolve(config.channelCategory);

    // Exit if no category
    if (!category) return message.reply("I can't find the category set in config.json :l");

    // Create channel 
    message.guild.channels.create(
        "Temporary channel", 
        {
            type: 'voice',
            parent: category,
            userLimit: users
        })
        .then(channel => {
            message.reply("I created a channel for you (:");
            console.log("Temporary channel created!");

            // Wait n seconds before adding the new channel to the temporaryChannels array
            setTimeout(() => {
                temporaryChannels.push(channel);
            }, config.secondsToJoin*1000);
        })
        .catch(console.error)
}

// Check all temporary channels and delete them if they're emtpy
function deleteEmptyChannels() {
    temporaryChannels.forEach(vc => {
        if (vc.members.array.length <= 0) {
            vc.delete()
                .then(console.log("Temporary channel deleted!"))
                .catch(console.error);
        }
    });
}