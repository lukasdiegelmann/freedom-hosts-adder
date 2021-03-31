// Importing necessary dependencies.
const fs = require("fs");
const puppeteer = require("puppeteer");
const chalk = require("chalk");
const path = require("path");
const spinner = require("cli-spinners").arc;

// A function that will display a spinner next to a message that is passed to it
// as an argument.
const spinnerWithMessage = (message) => {
    let currentTimeout;

    // Timeout-loop construct, that functions like a setInterval function but
    // with passed arguments.
    //
    // This is to display the rotating spinner.
    const timeout = (frame) =>
        (currentTimeout = setTimeout(() => {
            // Getting the current spinner frame. These frames are provided by
            // the 'cli-spinners' node module.
            const spinnerFrame = spinner.frames[frame];

            // Cleaning the terminal for the next update on the current status.
            process.stdout.clearLine();
            process.stdout.cursorTo(0);

            // Writing the result to the console.
            process.stdout.write(`${spinnerFrame} • ${message}...`);

            // Continuing the loop, with the next frame, that is keep in bounds
            // by the modulus operator.
            timeout((frame + 1) % spinner.frames.length);
        }, spinner.interval));

    // Initializing the spinner movement.
    timeout(0);

    // Returning a cleanup function that will stop the loop immediately after
    // execution.
    return () => {
        // Clearing the timeout, thus stopping the loop.
        clearTimeout(currentTimeout);

        // Cleaning the terminal for the next update on the current status.
        process.stdout.clearLine();
        process.stdout.cursorTo(0);

        // Writing the 'finished' message to the console.
        process.stdout.write(`${chalk.bold.green("✓")} • ${message}.\n`);
    };
};

// A asynchronous function that will execute all things puppeteer.
(async () => {
    // Initiating the login indicator, leaving a cleanup function.
    const clearLoggingInMessage = spinnerWithMessage("Logging in");

    // Initializing puppeteer, creating a browser with a page.
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Login information passed to the programm as arguments
    const email = process.argv[2];
    const password = process.argv[3];

    // The name of the blocklist that will be created. This information is also
    // passed as a cli argument.
    const blocklistName = process.argv[4];

    // The destination of the hostnames that should be added to the blocklist.
    // This information was, again, passed as a cli argument.
    const hostsDestination = process.argv[5];

    // Going to the page that will be manipulated.
    await page.goto("https://freedom.to/log-in");

    // Loggin into the freedom.to page, to make going to the dashboard possible.
    await page.$eval("#email", (el, email) => (el.value = email), email);
    await page.$eval("#session_password", (el, password) => (el.value = password), password);
    await page.$eval("#signin-button", (el) => el.click());

    // Executing the cleanup function, to indicate the completion of the login
    // task.
    clearLoggingInMessage();

    // Creating a new log message, that will indicate the creation of a new
    // blocklist.
    const clearNewBlocklistMessage = spinnerWithMessage("Creating new blocklist");

    // Pressing the 'Add Blocklist' button
    await page.waitForSelector(".add-button");
    await page.$$eval(".add-button", (buttons) =>
        buttons.forEach((button) => {
            if ((button.innerHTML = "Add Blocklist")) button.click();
        })
    );

    // Setting the name of the blocklist.
    await page.$eval(
        "#blocklist-name",
        (el, blocklistName) => (el.value = blocklistName),
        blocklistName
    );

    // Completing the log, thus indicating that the task has been finished.
    clearNewBlocklistMessage();

    // Creating a new log, which will indicate the fetching of the hosts from
    // the hosts file.
    const clearFetchingHostsMessage = spinnerWithMessage("Fetching hosts from hosts file");

    // Getting hosts from the ./hosts file and converting them into a usable
    // array.
    const hosts = fs.readFileSync(hostsDestination).toString("utf-8").split("\n");

    // Accessing the 'screenshotThreshold' parameter, passed to the cli.
    const screenshotThreshold = process.argv[6] ? process.argv[6] : 1000;

    // The destination path for the screenshots that might be shot.
    const distPath = path.resolve(__dirname, "./dist");

    // Creating the destination folder for the screenshots, if necessary.
    if (hosts.length >= screenshotThreshold) {
        try {
            await fs.promises.access(distPath);
        } catch (error) {
            await fs.promises.mkdir(distPath);
        }
    }

    // A counter to keep track of how many hostnames have already been processed.
    let hostsFinished = 0;

    // Finishing the log to indicate the completion of started task.
    clearFetchingHostsMessage();

    // Adding hosts to the blocklist
    for await (const host of hosts) {
        // Setting a timestamp for the start of the operation of adding a
        // hostname to the blocklist.
        const timestampStart = new Date().getTime();

        // Inputting the hostname into the input field.
        await page.focus("#custom-domain");
        await page.keyboard.type(host);

        // Waiting for the 'Add Site' button to load, for safety reasons.
        await page.waitForSelector(".add-custom-filter-button");

        // Submitting the hostname, to finally put it on the blocklist.
        await page.$$eval(".add-custom-filter-button", (buttons) => {
            buttons.forEach((button) => {
                if ((button.innerHTML = "Add site")) button.click();
            });
        });

        // Making a screenshot if the screenshotThreshold has been met.
        if (hostsFinished % screenshotThreshold === 0 && hostsFinished) {
            await page.screenshot({ path: `${distPath}/${hostsFinished}.png`, fullPage: true });
        }

        // Setting a timestamp for the end of the operation.
        const timestampEnd = new Date().getTime();

        // Adding a processed hostname.
        hostsFinished++;

        // Cleaning the terminal for the next update on the current status.
        process.stdout.clearLine();
        process.stdout.cursorTo(0);

        // Setting up the strings for the output stream.
        const percentage = ((hostsFinished / hosts.length) * 100).toString().slice(0, 5);
        const percentageDisplay = `${chalk.bold.cyan(percentage)}${chalk.bold.yellow("%")}`;
        const positionDisplay = `${chalk.bold.yellow(hostsFinished)} of ${chalk.bold.gray(
            hosts.length
        )}`;
        const estimatedTimeDisplay = `${(
            ((timestampEnd - timestampStart) * (hosts.length - hostsFinished)) /
            3600000
        )
            .toString()
            .slice(0, 5)}hrs left`;
        const spinnerFrame = spinner.frames[hostsFinished % spinner.frames.length];

        // Writing the process display onto the terminal.
        process.stdout.write(
            `${spinnerFrame} • Adding hosts to blocklist... • ${percentageDisplay} • ${positionDisplay} • ${estimatedTimeDisplay}`
        );
    }

    // Creating a new log to indicate the saving of the blocklist.
    const clearSavingMessage = spinnerWithMessage("Saving blocklist");

    // Submitting the adult blocklist, saving it in doing so.
    await page.$eval("#save-block-list", (el) => el.click());

    // Completing the log, thus indicating that the blocklist has been saved.
    clearSavingMessage();

    // A new log is created here, to indicate the closing process of the
    // puppeteer browser.
    const clearClosingBrowserMessage = spinnerWithMessage("Closing browser");

    // Closing the browser to finish the programm.
    await browser.close();

    // Finishing the task, thus finishing the programm and indicating a
    // successful execution of the browser.
    clearClosingBrowserMessage();
})();
