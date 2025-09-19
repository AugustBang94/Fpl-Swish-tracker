// FPL Data Fetcher - Hämtar automatiskt data från Fantasy Premier League
const LEAGUE_ID = '1882708';
const API_BASE = 'https://fantasy.premierleague.com/api';

async function fetchFPLData() {
    try {
        // Hämta grundläggande info
        const bootstrapResponse = await fetch(`${API_BASE}/bootstrap-static/`);
        const bootstrap = await bootstrapResponse.json();
        
        // Hämta liga-data
        const leagueResponse = await fetch(`${API_BASE}/leagues-classic/${LEAGUE_ID}/standings/`);
        const league = await leagueResponse.json();
        
        // Aktuell gameweek
        const currentGW = bootstrap.events.find(event => event.is_current).id;
        
        // Hämta spelares data
        const playersData = {};
        for (const manager of league.standings.results) {
            const playerResponse = await fetch(`${API_BASE}/entry/${manager.entry}/history/`);
            const playerHistory = await playerResponse.json();
            
            playersData[manager.player_name] = {
                teamId: manager.entry,
                totalPoints: manager.total,
                history: playerHistory.current
            };
        }
        
        // Skapa JSON-fil med all data
        const data = {
            leagueId: LEAGUE_ID,
            lastUpdated: new Date().toISOString(),
            currentGameweek: currentGW,
            players: playersData,
            swishData: calculateSwishData(playersData)
        };
        
        return JSON.stringify(data, null, 2);
        
    } catch (error) {
        console.error('Error fetching FPL data:', error);
        return null;
    }
}

function calculateSwishData(playersData) {
    const swishResults = {};
    
    // Hitta vem som kom sist varje gameweek
    Object.values(playersData).forEach(player => {
        player.history.forEach((gw, index) => {
            const gameweek = index + 1;
            if (!swishResults[gameweek]) {
                swishResults[gameweek] = {
                    lowestPoints: Infinity,
                    lastPlace: null,
                    allScores: []
                };
            }
            
            swishResults[gameweek].allScores.push({
                name: Object.keys(playersData).find(name => playersData[name] === player),
                points: gw.points
            });
            
            if (gw.points < swishResults[gameweek].lowestPoints) {
                swishResults[gameweek].lowestPoints = gw.points;
                swishResults[gameweek].lastPlace = Object.keys(playersData).find(name => playersData[name] === player);
            }
        });
    });
    
    return swishResults;
}

// Exportera för Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fetchFPLData };
}
