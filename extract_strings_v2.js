const fs = require('fs');
const filename = 'C:\\Users\\PC05\\Downloads\\Scala\\Scala tablas\\Cursos.xls';

try {
    const buffer = fs.readFileSync(filename);

    // Function to extract strings (ASCII or UTF-16LE converted to ASCII)
    function extractStrings(buf) {
        const found = [];

        // Strategy 1: ASCII
        let currentAscii = '';
        for (let i = 0; i < buf.length; i++) {
            const byte = buf[i];
            if (byte >= 32 && byte <= 126) {
                currentAscii += String.fromCharCode(byte);
            } else {
                if (currentAscii.length >= 3) found.push(currentAscii);
                currentAscii = '';
            }
        }

        // Strategy 2: UTF-16LE (Simple: char + null)
        let currentUtf16 = '';
        for (let i = 0; i < buf.length - 1; i += 2) { // Step 2?? No, alignment might not be perfect 2-byte aligned globally
            // Let's just scan byte by byte looking for pattern [char, 0]
            // Actually, XLS BIFF8 strings are length-prefixed, but let's just heuristics.
        }

        // Alternative Strategy 2: Filter out nulls and see what sticks
        let noNulls = '';
        for (const byte of buf) {
            if (byte !== 0) noNulls += String.fromCharCode(byte);
        }

        // Now scan the no-nulls version for printable sequences
        let current = '';
        const rawFound = [];
        for (let i = 0; i < noNulls.length; i++) {
            const code = noNulls.charCodeAt(i);
            if (code >= 32 && code <= 126) {
                current += noNulls[i];
            } else {
                if (current.length >= 3) rawFound.push(current);
                current = '';
            }
        }
        if (current.length >= 3) rawFound.push(current);

        return rawFound;
    }

    const strings = extractStrings(buffer);
    fs.writeFileSync('cursos_dump_utf8.txt', strings.join('\n'), 'utf8');
    // console.log(strings.join('\n'));

} catch (err) {
    console.error('Error:', err);
}
