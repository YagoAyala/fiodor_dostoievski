require('dotenv').config();
const cron = require('node-cron');
const { TwitterApi } = require('twitter-api-v2');
const express = require('express');
const { OpenAI } = require('openai');
const { Message } = require('./models');
const { where, fn, col, Op } = require('sequelize');

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

const generateTweet = async (personalizedInput) => {
    try {
        const todayDate = getTodayDate();
        const response = await client.responses.create({
            model: "gpt-4o-mini",
            input: `Forneça uma frase famosa de um filósofo, no formato: \"Frase do filósofo\" - nome do filósofo. Ela deve combinar com o espírito de hoje (${todayDate}) e com ${personalizedInput}, despertando emoção e reflexão.`
        });

        const phrase = response.output_text.trim() ?? 'Nãooo, deu erro na hora de gerar a mensagem :(';
        return phrase;
    } catch (error) {
        return `Something went wrong! ${e.message ?? 'Erro sem mensagem'}`;
    }
}

const registerOnDatabase = async (tweetContent) => {
    return Message.create({
        message: tweetContent.toLowerCase(),
        type: 'twitter',
        created_at: new Date(),
        updated_at: new Date(),
    });
}

const checkIfContentWasAlreadyTweeted = async (tweetContent) => {
    const normalised = tweetContent.toLowerCase();

    const row = await Message.findOne({
        where: {
            type: 'twitter',
            [Op.and]: where(fn('lower', col('message')), normalised),
        },
    });

    return row;
}

const handleCoreLogic = async (personalizedInput = '', maxAttemps = 10) => {
    if(maxAttemps < 0) {
        throw new Error('A lógica não está eficiente!');
    }

    const tweetContent = await generateTweet(personalizedInput);
    const tweetIsAlreadyTweeted = await checkIfContentWasAlreadyTweeted(tweetContent);

    if (tweetIsAlreadyTweeted) {
        const subtractedAttemp = maxAttemps - 1;
        const newRule = personalizedInput ? `${personalizedInput}, ${tweetContent}` : `Não usar a (s) frase (s) ${tweetContent}`;

        return handleCoreLogic(newRule, subtractedAttemp)
    }

    await twitterClient.v2.tweet(tweetContent);
    await registerOnDatabase(tweetContent);
}

const postTweet = async () => {
    try {
        await handleCoreLogic();

        return 'Tweet posted successfully!';
    } catch (error) {
        return 'Error posting tweet.';
    }
}

app.get('/', (req, res) => {
    res.send('Server is running!');
});

cron.schedule('0 6 * * *', async () => {
    await postTweet();
}, {
    timezone: "America/Sao_Paulo"
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
