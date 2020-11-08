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
        let content = '';

        const templateFile = module.exports.getTemplateFile();
        if(templateFile) {
            content = content + templateFile + '\n'
        }

        content = content + array.join('\n');

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
    },

    getTemplateFile: () => {
        const filePath = './template.md';

        if(fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, {
                encoding:'utf8',
                flag:'r'
            });
        }

        return null;
    }
};