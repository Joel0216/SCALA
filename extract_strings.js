const fs = require('fs');
const filename = 'C:\\Users\\PC05\\Downloads\\Scala\\Scala tablas\\Cursos.xls';

try {
    const buffer = fs.readFileSync(filename);
    let currentString = '';
    const strings = [];

    for (const byte of buffer) {
        if (byte >= 32 && byte <= 126) { // Printable ASCII
            currentString += String.fromCharCode(byte);
        } else {
            if (currentString.length >= 4) { // Only keep strings of length 4+
                strings.push(currentString);
            }
            currentString = '';
        }
    }

    if (currentString.length >= 4) {
        strings.push(currentString);
    }

    console.log(strings.join('\n'));
} catch (err) {
    console.error('Error reading file:', err);
}
