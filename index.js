require('dotenv').config();

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const CLI = require('clui');
const Spinner = CLI.Spinner;

const files = require('./lib/files');
const inquirer  = require('./lib/inquirer');
const jira  = require('./lib/jira');
const standup  = require('./lib/standup');

clear();

console.log(
    chalk.yellow(
        figlet.textSync('Stand Up', { horizontalLayout: 'full' })
    )
);

const run = async () => {
    const details = await inquirer.askStandUpDetails();

    const boardIssues = await jira.getBoardIssues();

    const filtered = standup.filterIssues(details, boardIssues.issues);
    const grouped = standup.groupByProjectName(filtered);
    const lines = standup.createLinesByArray(details, grouped);

    if(process.env.CREATE_FILE) {
        files.createMarkdownFile(lines);
    } else {
        console.log(lines);
    }
};

run();