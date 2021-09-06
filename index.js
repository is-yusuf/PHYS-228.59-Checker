const fetch = require('node-fetch')
const cheerio = require('cheerio');
const credentials = require('./credentials.json')
const EventEmitter = require('events')
const emitter = new EventEmitter();

let breaker = false;
emitter.on('success', function () {
    breaker = true;
})
var refreshIntervalId = setInterval(() => {
    checkAvailability()
    if (breaker) {
        console.log('breaking');
        clearInterval(refreshIntervalId);
    }
}, 60000);

/**
 * Checks the availability of PHYS 228.59.
 */
function checkAvailability() {
    fetch('https://apps.carleton.edu/campus/registrar/schedule/enroll/?term=21FA&subject=PHYS&credits=6').then(res => {
        return res.text();
    }).then(resfinal => {
        const $ = cheerio.load(resfinal);
        let status = $('.courses')
            .children()
            .first()
            .next('.course')
            .next('.course')
            .next('.course')
            .children('.data')
            .children('.status')
            .children('.statusName')
            .text();
        status = status.slice(0, status.length - 1).toLocaleLowerCase()

        if (status === 'closed') {
            console.log('closed');
        }
        else {
            sendMail('ismaily@carleton.edu', 'Section 59 is opened', 'Yusu Ismail')
            console.log('open');
            emitter.emit('success')
        }
    })
}
/**
 * 
 * @param {String} email The email to be sent to 
 * @param {String} content The content of the email 
 * @param {String} name The name of reciepent optional and defaults to MakerSpace User 
 * @param {number} milliseconds The number of milliseconds from now to send the email. Optinoal defaults to 0. 
 */
function sendMail(email, content, name = "MakerSpace User", milliseconds = 0) {
    fetch("https://api.sendgrid.com/v3/mail/send", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${credentials.sendGrid}`,
        },

        body: JSON.stringify({
            from: {
                "email": "YusufIsmail@admin.make-it.cc",
                "name": "Yusuf-Ismail"
            },
            "personalizations":
                [{
                    "to": [{
                        "email": email,
                        "name": name
                    }],
                    "subject": "PHYS 259!"
                }],

            "content": [{
                "type": "text/plain",
                "value": content
            }],
            reply_to: {
                "email": "ismaily@carleton.edu",
                "name": "Yusuf Ismail"
            },
            send_at: milliseconds
        })

    }).then(res => {
        console.log({ status: res.status })
    })
}