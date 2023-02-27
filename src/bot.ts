// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityHandler, MessageFactory } from "botbuilder";
import axios, {AxiosResponse, AxiosRequestHeaders} from "axios";

export class EchoBot extends ActivityHandler {
  constructor() {
    //Values to conversation
    let chat = `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.
        <conversation history>
        Human: <user input>
        AI:
        `;
    let conversationHistory = "";

    //Service url and Header
    const url =
      "https://azureaiservice.openai.azure.com/openai/deployments/chatBot/completions?api-version=2022-12-01";

    const headers = {
      "Content-Type": "application/json",
      "api-key": process.env.OPENAI_API_KEY,
    };
    
    //Interfaces
    interface OpenAiResponse{
      choices: [
        {
          text:string;
        }
      ],
      usage:{
        total_tokens:number
      }
    }
    interface RequestBody{
      prompt: string;
      max_tokens: number;
      temperature: number;
    }

    async function postDataToEndpoint(url: string, requestBody: RequestBody, headers: AxiosRequestHeaders): Promise<OpenAiResponse>{
      try {
        const response: AxiosResponse = await axios.post(url, requestBody, {headers});
        return response.data;
      } catch (error) {
        throw new Error('Error posting datat to ${url}: ${error}')
      }
    }



    super();
    // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
    this.onMessage(async (context, next) => {
      //Construct the prompt
      let temp_chat = chat.replace("<conversation history>", conversationHistory).replace("<user input>", context.activity.text);
      //Construct the request body
      const requestBody = { 
        prompt: temp_chat,
        max_tokens: 1500,
        temperature: 0.7
      }
      //Send request to azureopenai
      const data = await postDataToEndpoint(url, requestBody, headers);
      //Update conversation history
      conversationHistory = conversationHistory + "Human: "+ context.activity.text + "\nAI: " + data.choices[0].text + "\n";
      //Send response to user
      const replyText = `${data.choices[0].text} [~ ${data.usage.total_tokens} tokens]`;
      //const replyText = `Echo: ${context.activity.text}`;
      await context.sendActivity(MessageFactory.text(replyText));
      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      const welcomeText = "Hello and welcome!";
      //Clear history
      conversationHistory = "";

      for (const member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity(
            MessageFactory.text(welcomeText, welcomeText)
          );
        }
      }
      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });
  }
}
