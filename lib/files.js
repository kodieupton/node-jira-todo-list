const fs = require('fs');
const path = require('path');
var datefns = require('date-fns');

module.exports = {
    getCurrentDirectoryBase: () => {
        return path.basename(process.cwd());
    },

    directoryExists: (filePath) => {
        return fs.existsSync(filePath);
    },

    createMarkdownFile: (array) => {
        console.log('Creating file');

        const content = array.join('\n');
        const currentDate = datefns.format(new Date(), 'yyyy-MM-dd');
        const dir = process.env.CREATE_FILE_DIRECTORY ? process.env.CREATE_FILE_DIRECTORY : './';
        const fileName = `${dir}${currentDate}-standup.md`;

        // Check if file exists, if so remove it
        if(fs.existsSync(fileName)) {
            fs.unlinkSync(fileName);
        }

        // Create new file and append content to it
        fs.appendFile(fileName, `${content}\n`, function (err) {
            if (err) throw err;
        });
    }
};