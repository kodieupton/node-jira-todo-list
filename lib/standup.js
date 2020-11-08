var convert = require('convert-seconds');

module.exports = {
    create: (details, issues) => {

        let standup = [];
        let boards = null;
        if(details.prioritiseBoards !== null) {
            boards = details.prioritiseBoards.split(",").map((answer) => answer.trim().toUpperCase());
            standup = standup.concat(module.exports.filterIssues(details, issues, boards));
            if(details.workHours > 0) {
                standup = standup.concat(module.exports.filterIssues(details, issues, null, boards));
            }
        } else {
            standup = standup.concat(module.exports.filterIssues(details, issues));
        }

        return standup;
    },
    filterIssues: (details, issues, prioritiseBoards = null, ignoreBoards = null) => {
        let standup = [];

        issues.forEach((issue) => {
            const boardKey = issue.fields.project.key;

            // Check to make sure time is left in the day.
            if(details.workHours <= 0) {
                return true;
            } else if (prioritiseBoards && !prioritiseBoards.includes(boardKey.toUpperCase())) {
                return;
            } else if (ignoreBoards && ignoreBoards.includes(boardKey.toUpperCase())) {
                return;
            }
    
            const fields = issue.fields;
    
            let remainingEstimateFormatted = 'Requires time estimate.';
            
            // Check if time tracking object is against issue
            if(Object.keys(fields.timetracking).length !== 0 && fields.timetracking.constructor === Object) {
                
                // Get remaining estimate from jira issue
                let remainingEstimateSeconds = fields.timetracking.remainingEstimateSeconds;
    
                // Calculate if remaining time on jira issue is going to go over work hours set. If so set it to remaining time in the day
                if ((details.workHours - remainingEstimateSeconds) < 0) {
                    remainingEstimateSeconds = details.workHours;
                }
    
                // Update time counter, by removing remaining seconds.
                details.workHours = details.workHours - remainingEstimateSeconds;
    
                // Convert seconds to more user friendly time.
                remainingEstimateFormatted = module.exports.convertFromSeconds(remainingEstimateSeconds);
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

        return standup;
    },
    convertFromSeconds: (seconds) => {
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
    },
    groupByProjectName: (standup) => {
        return standup.reduce(function (r, a) {
            r[a.project] = r[a.project] || [];
            r[a.project].push(a);
            return r;
        }, []);
    },
    createLinesByArray: (details, standup) => {
        let lines = [];

        // Loop through standup from grouped array, and create array to output as markdown
        for(let res in standup) {

            lines.push(`\n## ${res}`);

            standup[res].forEach((issue) => {
                
                const requireComponent = !issue.hasComponent ? `@${issue.reporter} jira card requires component.` : '';
                
                lines.push(`- [${issue.key}](${issue.link}) - ${issue.name} (${issue.timetracking}) ${requireComponent}`);
            });
        }

        // If more than 30 minutes left in the day, add line for more work.
        if(details.workHours >= 1800) {
            lines.push(`\n\n@${process.env.MANAGER} I will require more work.`);
        }

        return lines;
    }
}