
const express = require('express'); 
  
const app = express(); 

app.get('/', (req, res)=>{ 
    res.status(200); 
    res.send("Home"); 
});

const PORT = 5000; 
app.listen(PORT, (error) =>{ 
    if(!error) 
        console.log(`Server is Successfully Running, and App is listening on http://localhost:${PORT}`) 
    else 
        console.log("Error occurred, server can't start", error); 
    } 
); 