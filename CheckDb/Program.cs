using System;
using MongoDB.Driver;
using MongoDB.Bson;

var client = new MongoClient("mongodb://localhost:27017");
var db = client.GetDatabase("BolaoCopa2026Db");

db.DropCollection("teams");
db.DropCollection("matches");

Console.WriteLine("Collections teams and matches dropped successfully!");

