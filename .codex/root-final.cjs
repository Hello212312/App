const fs=require('fs');
let s=fs.readFileSync('App.js','utf8');
s=s.replace('captureTouches: true','captureTouches: false');
s=s.replace("    const sub = Notifications.addNotificationResponseReceivedListener", "    if (Platform.OS === 'web') return;\n    const sub = Notifications.addNotificationResponseReceivedListener");
fs.writeFileSync('App.js',s);
s=fs.readFileSync('data.js','utf8').replace("deadline: row.deadline ?? 'Rolling'","deadline: row.deadline ?? ''");fs.writeFileSync('data.js',s);
