require('dotenv').config();
const cron = require('node-cron');
const { TwitterApi } = require('twitter-api-v2');
const express = require('express');
const { OpenAI } = require('openai');

const app = express();
const port = 3000;
const client = new OpenAI();

const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET
});

const getTodayDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();

    return `${day}/${month}/${year}`;
}

async function generateTweet() {
    try {
        const todayDate = getTodayDate();
        const response = await client.responses.create({
            model: "gpt-3.5-turbo",
            input: `Forneça uma frase famosa de um filósofo, no formato: \"Frase do filósofo\" - nome do filósofo. Escolha um filósofo adequado para o dia de hoje (${todayDate}).`
        });

        const phrase = response.output_text.trim() ?? 'Nãooo, deu erro na hora de gerar a mensagem :(';
        return phrase;
    } catch (error) {
        return `Something went wrong! ${e.message ?? 'Erro sem mensagem'}`;
    }
}

async function postTweet() {
    try {
        const tweetContent = await generateTweet();
        await twitterClient.v2.tweet(tweetContent);
        return 'Tweet posted successfully!';
    } catch (error) {
        console.log(error);
        return 'Error posting tweet.';
    }
}

app.get('/', (req, res) => {
    res.send('Server is running!');
});


cron.schedule('*/5 * * * *', async () => {
    await postTweet();
}, {
    timezone: "America/Sao_Paulo"
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
