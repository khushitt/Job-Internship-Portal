const mysql = require('mysql2');

// Password from .env has a leading space: " Amrita@2925"
// Try both variations
const passwords = ['Amrita@2925', ' Amrita@2925'];
let tried = 0;

function tryConnect(pwd) {
    const db = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: pwd,
        database: 'job_portal'
    });

    db.connect((err) => {
        if (err) {
            console.error(`Failed with pwd "${pwd}":`, err.message);
            tried++;
            if (tried < passwords.length) tryConnect(passwords[tried]);
            else process.exit(1);
            return;
        }
        console.log(`Connected with password: "${pwd}"`);
        db.query('SHOW TABLES', (e, r) => {
            if (e) { console.error(e.message); db.end(); return; }
            console.log('Tables:', JSON.stringify(r, null, 2));
            
            db.query('DESCRIBE students', (e2, r2) => {
                if (e2) console.error('students err:', e2.message);
                else console.log('students:', JSON.stringify(r2.map(f=>f.Field), null, 2));
                
                db.query('DESCRIBE applications', (e3, r3) => {
                    if (e3) console.error('applications err:', e3.message);
                    else console.log('applications:', JSON.stringify(r3.map(f=>f.Field), null, 2));
                    
                    db.query('DESCRIBE jobs', (e4, r4) => {
                        if (e4) console.error('jobs err:', e4.message);
                        else console.log('jobs:', JSON.stringify(r4.map(f=>f.Field), null, 2));
                        db.end();
                    });
                });
            });
        });
    });
}

tryConnect(passwords[0]);
