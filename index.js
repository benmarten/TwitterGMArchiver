const puppeteer = require('puppeteer');
const crypto = require('crypto');
const fs = require('fs');
const EventEmitter = require("events");
const myEventTracker = new EventEmitter();
const messages = [];
const hashes = new Set();
const dateUtils = require('./date.js');

// Receives any new message that was found in the browser.
myEventTracker.on("new_message", function (message) {
    // Calculate real timestamp, based on twitter date parsing.
    message.timestamp = dateUtils.parseTime(message.time)
    delete message['time']

    // Create unique hash vor this message.
    let hash = crypto.createHash('md5')
        .update(message.timestamp + message.author + message.text + message.url)
        .digest('hex');
    // If we have already processed this message, skip.
    if (hashes.has(hash)) return

    hashes.add(hash)
    console.log(message)
    messages.push(message)
});

process.on('SIGINT', function () {
    console.log("Caught interrupt signal, saving data to disk...");
    saveData()
    process.exit();
});

function saveData() {
    // Sorting messages by date
    messages.sort((a, b) => (a.timestamp > b.timestamp) ? 1 : -1)
    fs.writeFileSync('messages.json', JSON.stringify(messages, null, 2));

    console.log('Data saved. Exiting...')
}

// Core logic, that runs in the browser.
(async () => {
    console.log('Launching browser...')

    // Depending on the env NODE_ENV, launch headless browser or connect to
    // existing one.
    let browser
    if (process.env.NODE_ENV == "DEBUG") {
        browser = await puppeteer.connect({
            headless: false,
            browserWSEndpoint: process.env.WS,
            args: ['--no-sandbox']
        });
    } else {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox']
        });
    }

    const page = (await browser.pages())[0];

    // Login to Twitter.
    console.log('Logging in to Twitter...')
    await page.goto('https://twitter.com/login');
    await page.focus('form > div > div:nth-child(6) > label > div > div > div' +
        ' > input');
    await page.keyboard.type(process.env.TWITTER_USER);
    await page.focus('form > div > div:nth-child(7) > label > div > div > div' +
        ' > input');
    await page.keyboard.type(process.env.TWITTER_PASSWORD);
    await page.click('form > div > div:nth-child(8) > div')
    await page.waitForNavigation()

    // Navigate to Messages.
    console.log('Navigating to messages...')
    await page.goto('https://twitter.com/messages/' + process.env.TWITTER_MESSAGE_ID);
    await page.waitForSelector('div.r-1h0z5md:nth-child(2) > div:nth-child(1)' +
        ' > div:nth-child(1)')
    console.log('Messages loaded. Starting extraction...')
    console.log('When end reached; Exit + Save via CTRL + C.')

    // Periodically (1s) scroll up in Twitters message history.
    await page.evaluate(() => {
        setInterval(() => {
            console.log("Scrolling up...")
            document.querySelector('div.css-1dbjc4n.r-1awozwy.r-1d0k16c')
                .scrollIntoView()
        }, 1000)
    });

    // Expose the emit function to the browser, so we have a channel to
    // communicate to Nodejs.
    await page.exposeFunction("emitter", (...data) => {
        myEventTracker.emit(...data)
    });

    // Core logic that runs in the browser and finds the messages. Once found
    // they will be send via event emitter to nodejs.
    await page.evaluate(() => {
        var observer = new MutationObserver((mutations) => {
            for (var mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    let message = mutation.addedNodes[0]
                    let message_result = {}
                    try {
                        let author_time = message.children[0].children[1]
                            .children[1].textContent
                        let author_time_arr = author_time.split(' · ')
                        message_result['author'] = author_time_arr[0]
                        message_result['time'] = author_time_arr[1]
                    } catch (e) {
                        console.log('error parsing new message author/time')
                        continue;
                    }
                    try {
                        let content = message.children[0].children[0]
                            .children[0].children[1].children[0].children
                        // Text
                        message_result['text'] =
                            content[content.length - 1].textContent
                        // Optional URL
                        if (content.length == 2) {
                            message_result['url'] =
                                content[0].querySelector('a').href
                        }
                    } catch (e) {
                        console.log('error parsing new message content/url')
                    }
                    emitter("new_message", message_result);
                }
            }
        });
        const chat = document.querySelector('div.r-1h0z5md:nth-child(2) > ' +
            'div:nth-child(1) > div:nth-child(1)')
        observer.observe(chat,
            { attributes: false, childList: true, subtree: false }
        );
    });
})();
