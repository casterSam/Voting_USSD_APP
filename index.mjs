import mysql from 'mysql2/promise';
import africastalking from 'africastalking';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const africastalkingInstance = africastalking({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME,
});

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  let body;
  try {
    if (!event.body) {
      throw new Error("Missing body");
    }
    const decodedBody = decodeURIComponent(event.body);
    body = Object.fromEntries(new URLSearchParams(decodedBody));
  } catch (error) {
    console.error('Error parsing event body:', error);
    return {
      statusCode: 400,
      body: 'Invalid input. Please try again.',
    };
  }

  const text = body?.text;
  if (typeof text !== 'string') {
    console.error('Invalid or missing "text" property in event:', body);
    return {
      statusCode: 400,
      body: 'Invalid input. Please try again.',
    };
  }

  const { sessionId, serviceCode, phoneNumber } = body;
  let response = '';
  const inputArray = text.split('*');
  const level = inputArray.length;

  if (text === '') {
    response = 'CON Welcome to the Voting App\n';
    response += '1. Best Dancer\n';
    response += '2. Best Comedian\n';
    response += '3. Best Actor\n';
    response += '4. View Vote Results\n';
    response += '0. Exit\n';
  } else if (level === 1) {
    const input = inputArray[0];
    if (input === '0') {
      response = 'END Thank you for using the Voting App. Goodbye!\n';
    } else if (input === '4') {
      try {
        const connection = await mysql.createConnection({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          port: process.env.DB_PORT,
        });
        const [voteResults] = await connection.execute(
          'SELECT category, COUNT(*) AS total_votes FROM votes GROUP BY category'
        );
        response = 'CON Vote Results:\n';
        voteResults.forEach((result) => {
          response += `${getCategoryName(result.category)}: ${result.total_votes} votes\n`;
        });
        await connection.end();
      } catch (error) {
        console.error('Database error:', error);
        response = 'END An error occurred while fetching vote results. Please try again later.\n';
      }
    } else {
      const category = parseInt(input);
      if (category >= 1 && category <= 3) {
        response = `CON Select an entry for ${getCategoryName(category)}:\n`;
        const entries = getEntriesForCategory(category);
        entries.forEach((entry, index) => {
          response += `${index + 1}. ${entry}\n`;
        });
        response += '0. Back\n';
      } else {
        response = 'END Invalid category selected. Please try again.\n';
      }
    }
  } else if (level === 2) {
    const category = parseInt(inputArray[0]);
    const entry = parseInt(inputArray[1]);

    if (entry === 0) {
      response = 'CON Welcome to the Voting App\n';
      response += '1. Best Dancer\n';
      response += '2. Best Comedian\n';
      response += '3. Best Actor\n';
      response += '4. View Vote Results\n';
      response += '0. Exit\n';
    } else {
      const entries = getEntriesForCategory(category);
      if (entry >= 1 && entry <= entries.length) {
        try {
          const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
          });

          const [existingVotes] = await connection.execute(
            'SELECT * FROM votes WHERE phone_number = ? AND category = ?',
            [phoneNumber, category]
          );

          if (existingVotes.length > 0) {
            await connection.end();
            response = 'END You have already voted in this category. Please vote in a different category.\n';
          } else {
            await connection.execute(
              'INSERT INTO votes (session_id, phone_number, category, entry) VALUES (?, ?, ?, ?)',
              [sessionId, phoneNumber, category, entry]
            );
            
            await connection.end();
            response = `END Thank you for voting for ${entries[entry - 1]} in ${getCategoryName(category)}.\n`;
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
          response = 'END An error occurred while processing your vote. Please try again later.\n';
        }
      } else {
        response = 'END Invalid entry selected. Please try again.\n';
      }
    }
  } else {
    response = 'END Invalid input. Please try again.\n';
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: response
  };
};

function getCategoryName(category) {
  switch (category) {
    case 1: return 'Best Dancer';
    case 2: return 'Best Comedian';
    case 3: return 'Best Actor';
    default: return 'Unknown Category';
  }
}

function getEntriesForCategory(category) {
  switch (category) {
    case 1: return ['Dancer 1', 'Dancer 2', 'Dancer 3', 'Dancer 4', 'Dancer 5'];
    case 2: return ['Comedian 1', 'Comedian 2', 'Comedian 3', 'Comedian 4', 'Comedian 5'];
    case 3: return ['Actor 1', 'Actor 2', 'Actor 3', 'Actor 4', 'Actor 5'];
    default: return [];
  }
}