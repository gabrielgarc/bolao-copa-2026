fetch("http://localhost:5000/api/matches")
  .then(r => r.json())
  .then(data => console.log(data[0]))
  .catch(e => console.error(e));
