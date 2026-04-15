
async function checkHealth() {
  try {
    const res = await fetch('http://localhost:3000/health');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Health check failed:', err.message);
  }
}

checkHealth();
