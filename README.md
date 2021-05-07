# Freedom Hosts Adder

<div style="display: flex; justify-content: center">
    <img src="https://pbs.twimg.com/profile_images/652170773025697792/JRyx48Nv.png" alt="freedom.to logo" width="200px"/>
    <img src="https://cdn.techozu.com/wp/2021/02/puppeteer.png" alt="freedom.to logo" width="300px"/>
</div>

<br/>
<br/>
<br/>

This is a little programm that will create a new blocklist on `freedom.to` and push lots of hostnames on this list.

It is to help with creating big blocklist with thousands of hostnames. Though
you should note that the process slows down over time and it might take some
while to manage all addresses.

## Usage

### Environment

To use the `freedom-site-adder` you have to have **[nodejs](https://nodejs.org/en/)** installed. Once that's done you will need to download a `release` of this application and run it with the node environment you possibly just installed.

### Command Line Interface

Since this application is a so called `CLI`, which stands for **C**ommand **L**ine **I**nterface, it is necessary to pass some arguments for the programm to execute correctly.

The first one being the `email` of your `freedom.to` account. The second one is the `password` of your `freedom.to` account. The following one is the `destination of your hostnames`, which should be some readable file containing text, seperated by `\n` characters. The last one defines after how many pushed hostnames the programm should make a `screenshot of the website`, this is mostly for debugging reasons and is fully optional.

A complete command would look like this:
`node [applicationPath] [email] [password] [hostsPath] [screenshotThreshold]`
