# Twitter Group Message Archiver

This tool scrapes the message history from a specific Twitter group message and exports it as json.

## Prerequisites
- Install Node 12 via NVM: https://github.com/nvm-sh/nvm

## Installation
- Run `npm install`

## Run
- Set the following Env vars for configuration:
```
export TWITTER_USER=benmarten
export TWITTER_USER=<YOUR_PASSWORD>
export TWITTER_MESSAGE_ID=1315655381037838337
```
The message id, is the id in the url: https://twitter.com/messages/1315655381037838337

Run the script via: `node index.js`

## Convert JSON to CSV
You can simply convert the exported json to csv via json2csv: `npm i -g json2csv`
```
json2csv -i messages.json messages.csv -f timestamp,author,text,url -o messages.csv
```
Now you can simply import the csv to Google Sheets, etc.

## Debugging
You can debug and connect node to an existing browser via:
Start Chrome:
```
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=(mktemp -d -t 'chrome-remote_data_dir')
```
Copy the ws url.

- Set the following Env vars for configuration:
```
export NODE_ENV=DEBUG
export WS=<WS_URL>
```

## Contributing
Feel free to report issues or send PR's ;)