const Fs = require('fs');

export default async (eg, filePath, indexName, delimiter = ';') => {
    await es.dsl.execute([
        'iterate over user-workshop where (workshopCode: ${workshopCode} as userWorkshop. Get 200 at a time. Flush at end.', [
            (ctx) => {
                const userWorkshop = ctx.get('user-workshop')
            }
        ]
    ]);    
    var logger = Fs.createWriteStream(filePath, {
      flags: 'a' // 'a' means appending (old data will be preserved)
    });

};