const bcrypt = require('bcryptjs');

async function generatePasswords() {
    const passwords = {
        admin: 'admin123',
        manager: 'manager123',
        vendedor: 'vendedor123'
    };

    for (const [role, password] of Object.entries(passwords)) {
        const hash = await bcrypt.hash(password, 10);
        console.log(`${role}: ${hash}`);
    }
}

generatePasswords();
