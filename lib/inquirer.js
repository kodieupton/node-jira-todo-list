const inquirer = require('inquirer');

module.exports = {
    askStandUpDetails: () => {
        const questions = [
            {
                name: 'workHours',
                type: 'input',
                default: 27000,
                message: 'How many hours are you going to work, enter in seconds (27000 = 7h 30m)?',
                validate: function( value ) {
                    if (value.length) {
                        return true;
                    } else {
                        return 'Please enter seconds you are going to work.';
                    }
                }
            },
            {
                name: 'prioritiseBoards',
                type: 'input',
                default: null,
                message: 'Do you want to prioritise any boards? (Enter board key. If multiple comma separate keys.)'
            }
        ];

        return inquirer.prompt(questions);
    },
};