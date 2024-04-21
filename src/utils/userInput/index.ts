// @ts-ignore
import inquirer from 'inquirer';

//var inquirer = require('inquirer');

export async function promptUser() {
  const questions = [
    {
      type: 'list', // This creates a dropdown-like list of options in the console
      name: 'userChoice',
      message: 'Please select environment:',
      choices: ['Dev', 'Test', 'Prod'],
    },
  ];

  const answers = await inquirer.prompt(questions);
  console.log(`You selected: ${answers.userChoice}`);
}
