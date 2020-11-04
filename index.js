require('dotenv').config();

var JiraApi = require('jira-client');
var convert = require('convert-seconds');
var fs = require('fs');
var datefns = require('date-fns');

// Which Jira board want to get tasks from
const jiraBoardId = process.env.JIRA_BOARD_ID;

// Number hours worth of tasks to pull through.
const workHours = process.env.WORK_HOURS;

// Running counter of seconds worth of work
let timeCounter = workHours;

// Jira API client config
var jira = new JiraApi({
    protocol: 'https',
    host: process.env.JIRA_HOST,
    username: process.env.JIRA_USERNAME,
    password: process.env.JIRA_PASSWORD,
    apiVersion: '2',
    strictSSL: true
});

let standup = [];

jira.getIssuesForBoard(jiraBoardId, 0, 50, 'status in ("In Progress", "Selected for Development") ORDER BY priority DESC, due DESC, created DESC').then((boardObject) => {
    boardObject.issues.forEach((issue) => {
        // Check to make sure time is left in the day.
        if(timeCounter <= 0) {
            return true;
        } 

        const fields = issue.fields;

        let remainingEstimateFormatted = 'Requires time estimate.';
        
        // Check if time tracking object is against issue
        if(Object.keys(fields.timetracking).length !== 0 && fields.timetracking.constructor === Object) {
            
            // Get remaining estimate from jira issue
            let remainingEstimateSeconds = fields.timetracking.remainingEstimateSeconds;

            // Calculate if remaining time on jira issue is going to go over work hours set. If so set it to remaining time in the day
            if ((timeCounter - remainingEstimateSeconds) < 0) {
                remainingEstimateSeconds = timeCounter;
            }

            // Update time counter, by removing remaining seconds.
            timeCounter = timeCounter - remainingEstimateSeconds;

            // Convert seconds to more user friendly time.
            remainingEstimateFormatted = convertFromSeconds(remainingEstimateSeconds)
        }

        // Add issue to stand up array
        standup.push({
            'key': issue.key,
            'project': fields.project.name,
            'name': fields.summary,
            'timetracking': remainingEstimateFormatted,
            'link': `${process.env.JIRA_HOST}/browse/${issue.key}`,
            'priority': fields.priority.name,
            'hasComponent': fields.components.length !== 0,
            'reporter': fields.reporter.displayName
        });
    });

    // Group array by project name
    const result = standup.reduce(function (r, a) {
        r[a.project] = r[a.project] || [];
        r[a.project].push(a);
        return r;
    }, []);

    let lines = [];

    // Loop through results from group array, and create array to output as markdown
    for(let res in result) {

        lines.push(`##${res}`);

        result[res].forEach((issue) => {
            
            const requireComponent = !issue.hasComponent ? `@${issue.reporter} jira card requires component.` : '';
            
            lines.push(`- [${issue.key}](${issue.link}) - ${issue.name} (${issue.timetracking}) ${requireComponent}`);
        });
    }

    // If more than 30 minutes left in the day, add line for more work.
    if(timeCounter >= 1800) {
        lines.push(`\n\n@${process.env.MANAGER} I will require more work.`);
    }

    // Trigger creation of file.
    createFile(lines);

}).catch((err) => {
    console.error(err);
})

/**
 * Convert to readable time from seconds.
 * 
 * @param {*} seconds 
 */
function convertFromSeconds(seconds) {
    const readable = convert(seconds);
    let formattedTime = '';

    if(readable.hours > 0) {
        formattedTime += `${readable.hours}h`;
    }

    if(readable.minutes > 0) {
        if(formattedTime !== ''){
            formattedTime += ', ';
        }

        formattedTime += `${readable.minutes}m`;
    }

    return formattedTime;
}

/**
 * Create new markdown file for stand up.
 * Can be turned controlled via env file.
 * 
 * @param {*} lines 
 */
function createFile(lines) {

    if(!process.env.CREATE_FILE) return;

    console.log('Creating file');

    const content = lines.join('\n');
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