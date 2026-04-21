const API_URL = 'http://localhost:3000/api/v1';

async function testApi() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        console.log("API Status:", data);
    } catch (error) {
        console.error("Error conectando con la API:", error);
    }
}

testApi();
