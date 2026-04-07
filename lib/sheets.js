import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const SPREADSHEET_ID = process.env.NODE_ENV === 'development'
    ? process.env.GOOGLE_SHEETS_SPREADSHEET_ID_TEST
    : process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

// --- APC Roster (42 APCs + demo) ---
export const VOLUNTEERS = [
    { name: 'Devansh Gupta', roll: '2023UEC2618' },
    { name: 'VAISHNAVI', roll: '2024UCM2325' },
    { name: 'Parth Gupta', roll: '2024UCM2354' },
    { name: 'Srijan', roll: '2024UCM2361' },
    { name: 'Manmeet Kaur', roll: '2024UCS1501' },
    { name: 'Bhavya', roll: '2024UCS1509' },
    { name: 'Shreyansh Jain', roll: '2024UCS1517' },
    { name: 'AVIKA KUMAR', roll: '2024UCS1526' },
    { name: 'Aiswarya Sunil', roll: '2024UCS1630' },
    { name: 'Guransh Singh', roll: '2024UCS1718' },
    { name: 'Alina Iqutidar', roll: '2024UEC2506' },
    { name: 'Vaibhav Singh', roll: '2024UEE4083' },
    { name: 'Jayant Garg', roll: '2024UEE4121' },
    { name: 'MOHAMMAD SAQIB SIDDIQUI', roll: '2024UEE4167' },
    { name: 'Lakshay Aggarwal', roll: '2024UEV6615' },
    { name: 'Taneesha Bangia', roll: '2024UGI7205' },
    { name: 'Komal Gupta', roll: '2024UIC3522' },
    { name: 'Nandini Singh', roll: '2024UIC3657' },
    { name: 'Aakarsh Thukral', roll: '2024UIC3670' },
    { name: 'Rishabh jain', roll: '2024UIN3356' },
    { name: 'Sabhya Goel', roll: '2024UIT3118' },
    { name: 'Arnav Jain', roll: '2024UBT1019' },
    { name: 'Prakhar Sagar', roll: '2024UBT1042' },
    { name: 'Nandita Sharma', roll: '2024UBT1076' },
    { name: 'Shrija Tewari', roll: '2024UCA1854' },
    { name: 'Saloni Singh', roll: '2024UCA1872' },
    { name: 'Ozair Ali', roll: '2024UCB6024' },
    { name: 'Khyati Consul', roll: '2024UCB6072' },
    { name: 'Aastha Suhani', roll: '2024UCB6631' },
    { name: 'Ridhima Aggarwal', roll: '2024UCI6528' },
    { name: 'Harehar Narayan Seth', roll: '2024UCM2340' },
    { name: 'Himanshi', roll: '2024UCM2331' },
    { name: 'Pranjal Bansal', roll: '2024UEC2559' },
    { name: 'Anjasi Solanki', roll: '2024UEV2837' },
    { name: 'Shayana Madan', roll: '2024UEE4129' },
    { name: 'Bhavya Bajaj', roll: '2024UGI7221' },
    { name: 'Vaibhav Singh', roll: '2024UIC3576' },
    { name: 'Krati Gupta', roll: '2024UIT3041' },
    { name: 'Ojas Jain', roll: '2024UIT3095' },
    { name: 'Ananya Banerjee', roll: '2024UME1068' },
    { name: 'Tejas Yadav', roll: '2024UME4178' },
    { name: 'Ojasvi Arya', roll: '2024UMV7656' },
    // Demo user
    { name: 'Demo User', roll: 'demo' },
];

// --- Google Sheets Auth ---
let sheetsInstance = null;

function getSheets() {
    if (sheetsInstance) return sheetsInstance;
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: SCOPES,
    });
    sheetsInstance = google.sheets({ version: 'v4', auth });
    return sheetsInstance;
}

// --- Caching ---
let logsCache = { data: null, timestamp: 0 };
let eventsCache = { data: null, timestamp: 0 };
let usersCache = { data: null, timestamp: 0 };
const CACHE_TTL = 30 * 1000; // 30 seconds

function isCacheValid(cache) {
    return cache.data && (Date.now() - cache.timestamp < CACHE_TTL);
}

function invalidateAllCaches() {
    logsCache = { data: null, timestamp: 0 };
    eventsCache = { data: null, timestamp: 0 };
    usersCache = { data: null, timestamp: 0 };
}

// --- Date Parsing ---
function parseDate(dateStr) {
    if (!dateStr) return new Date(0);
    // Try ISO format first
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) return isoDate;
    // Try DD/MM/YYYY HH:mm:ss (Indian format)
    const indianMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2}):(\d{2}):(\d{2})?/);
    if (indianMatch) {
        const [, day, month, year, hour, min, sec] = indianMatch;
        return new Date(year, month - 1, day, hour, min, sec || 0);
    }
    // Try "4 Feb 2025" type
    const shortMatch = dateStr.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (shortMatch) {
        return new Date(dateStr);
    }
    return new Date(0);
}

// --- Logs ---
// Sheet columns: A=Blank, B=Name, C=RollNo, D=Event/Company, E=HoursLogged, F=Upvotes, G=Downvotes, H=Status, I=Verification, J=Timestamp
export async function getLogs(bypassCache = false) {
    if (!bypassCache && isCacheValid(logsCache)) return logsCache.data;
    const sheets = getSheets();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Logs!B2:J',
    });
    const rows = res.data.values || [];
    const logs = rows.map((row, index) => {
        const upvotes = parseInt(row[4]) || 0;
        const downvotes = parseInt(row[5]) || 0;
        const net = upvotes - downvotes;
        return {
            id: index + 2, // Row number in sheet (1-indexed header + data)
            name: row[0] || '',
            roll: row[1] || '',
            company: row[2] || '',
            hours: parseFloat(row[3]) || 0,
            upvotes,
            downvotes,
            net,
            disputed: net <= -3,
            status: row[6] || 'pending',
            verification: row[7] || '',
            timestamp: row[8] || '',
            date: parseDate(row[8]),
        };
    }).sort((a, b) => b.date - a.date);

    logsCache = { data: logs, timestamp: Date.now() };
    return logs;
}

export async function addLog(name, roll, company, hours, status = 'pending', verification = '') {
    const sheets = getSheets();
    const timestamp = new Date().toISOString();
    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Logs!B:J',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[name, roll, company, hours, 0, 0, status, verification, timestamp]],
        },
    });
    invalidateAllCaches();
}

export async function updateLogStatus(rowIndex, status, approver) {
    const sheets = getSheets();
    // Update Status (H) and Verification (I) columns
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Logs!H${rowIndex}:I${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[status, approver || '']],
        },
    });
    invalidateAllCaches();
}

export async function updateLogVotes(rowIndex, upvotes, downvotes) {
    const sheets = getSheets();
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Logs!F${rowIndex}:G${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[upvotes, downvotes]],
        },
    });
    invalidateAllCaches();
}

// --- Leaderboard ---
export async function getLeaderboardData() {
    const logs = await getLogs();
    const approvedLogs = logs.filter(l => l.status === 'approved');

    const map = {};
    for (const log of approvedLogs) {
        const key = log.roll;
        if (!map[key]) {
            map[key] = {
                name: log.name,
                roll: log.roll,
                totalHours: 0,
                events: new Set(),
                totalUpvotes: 0,
                totalDownvotes: 0,
                logs: [],
            };
        }
        if (!log.disputed) {
            map[key].totalHours += log.hours;
            map[key].events.add(log.company);
        }
        map[key].totalUpvotes += log.upvotes;
        map[key].totalDownvotes += log.downvotes;
        map[key].logs.push(log);
    }

    const leaderboard = Object.values(map).map(v => ({
        name: v.name,
        roll: v.roll,
        totalHours: v.totalHours,
        eventCount: v.events.size,
        totalUpvotes: v.totalUpvotes,
        totalDownvotes: v.totalDownvotes,
        karma: Math.round(v.totalHours * 10 + v.events.size * 50),
        logs: v.logs,
    }));

    // Pre-populate all APCs with 0 karma so the leaderboard is never empty
    const existingRolls = new Set(leaderboard.map(l => l.roll.toLowerCase()));
    for (const vol of VOLUNTEERS) {
        if (vol.roll === 'demo') continue; // Skip demo user
        if (!existingRolls.has(vol.roll.toLowerCase())) {
            leaderboard.push({
                name: vol.name,
                roll: vol.roll,
                totalHours: 0,
                eventCount: 0,
                totalUpvotes: 0,
                totalDownvotes: 0,
                karma: 0,
                logs: [],
            });
        }
    }

    return leaderboard.sort((a, b) => b.karma - a.karma);
}

// --- Users ---
export async function getUsers() {
    if (isCacheValid(usersCache)) return usersCache.data;
    const sheets = getSheets();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Users!A2:E',
    });
    const rows = res.data.values || [];
    const users = rows.map(row => ({
        roll: row[0] || '',
        name: row[1] || '',
        passwordHash: row[2] || '',
        role: row[3] || 'user',
        createdAt: row[4] || '',
    }));
    usersCache = { data: users, timestamp: Date.now() };
    return users;
}

export async function getUser(roll) {
    const users = await getUsers();
    return users.find(u => u.roll.toLowerCase() === roll.toLowerCase()) || null;
}

export async function createUser(roll, name, passwordHash, role = 'user') {
    const sheets = getSheets();
    const timestamp = new Date().toISOString();
    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Users!A:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[roll, name, passwordHash, role, timestamp]],
        },
    });
    invalidateAllCaches();
}

export async function updateUserPassword(roll, newPasswordHash) {
    const users = await getUsers();
    const sheets = getSheets();
    const userIndex = users.findIndex(u => u.roll.toLowerCase() === roll.toLowerCase());
    if (userIndex === -1) throw new Error('User not found');
    const rowNumber = userIndex + 2; // 1-indexed + header
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Users!C${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[newPasswordHash]],
        },
    });
    invalidateAllCaches();
}

// --- Events ---
export async function getEvents() {
    if (isCacheValid(eventsCache)) return eventsCache.data;
    const sheets = getSheets();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Events!A2:C',
    });
    const rows = res.data.values || [];
    const events = rows.map(row => ({
        name: row[0] || '',
        createdAt: row[1] || '',
        createdBy: row[2] || '',
    }));
    eventsCache = { data: events, timestamp: Date.now() };
    return events;
}

// Check if event is within 3-day logging window
export function isEventOpen(createdAt) {
    if (!createdAt) return false;
    const created = parseDate(createdAt); // Uses the robust date parser for non-ISO spreadsheet data
    if (created.getTime() === 0) return false; // Invalid date
    const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
}


export async function createEvent(name, createdBy) {
    const sheets = getSheets();
    const timestamp = new Date().toISOString();
    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Events!A:C',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[name, timestamp, createdBy]],
        },
    });
    invalidateAllCaches();
}


